import { useCallback } from 'react'
import { useLocation } from 'react-router'
import { useCachedQuery } from '@/lib/cache'
import { isMock, mockHistory, mockLatest } from './mock'

/** public/data/oil/latest.json，由 GitHub Actions 每天写入。 */
export type OilLatest = {
  fetched_at: string
  source_date: string
  next_adjustment_text: string | null
  province: string
  grade: string
  p92: number
}

/** public/data/oil/history.json 的一条：首次观测到该价格的日期。按日期升序。 */
export type OilPoint = {
  observed_date: string
  p92: number
}

async function getJson<T>(path: string): Promise<T> {
  // 站内静态文件，每天变一次，不吃 HTTP 缓存
  const res = await fetch(path, { cache: 'no-cache' })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

/**
 * 油价数据全部来自站内静态 JSON，不走 Supabase。
 * latest 读失败时 error 有值、latest 为 null（页面照样能手动输入算）；history 读失败按空处理。
 * 有上次成功的缓存时先显示缓存，再后台刷新。
 */
const LATEST_FAILED = '油价数据加载失败，可手动输入'

export function useOil() {
  const { search } = useLocation()
  const mock = isMock(search)

  const fetcher = useCallback(async () => {
    if (import.meta.env.DEV && mock) {
      const latest = mockLatest(search)
      if (!latest) throw new Error(LATEST_FAILED)
      return { latest, history: mockHistory(search) }
    }
    const latest = await getJson<OilLatest>('/data/oil/latest.json').catch(() => {
      throw new Error(LATEST_FAILED)
    })
    return { latest, history: await getJson<OilPoint[]>('/data/oil/history.json').catch(() => []) }
  }, [mock, search])

  const { data, error, reload } = useCachedQuery(mock ? null : 'oil', fetcher)
  return { latest: data?.latest ?? null, history: data?.history ?? null, error, reload }
}
