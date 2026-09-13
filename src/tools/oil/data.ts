import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
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
 */
export function useOil() {
  const { search } = useLocation()
  const [latest, setLatest] = useState<OilLatest | null>(null)
  const [history, setHistory] = useState<OilPoint[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV && isMock(search)) {
      const mock = mockLatest(search)
      setLatest(mock)
      setHistory(mockHistory(search))
      if (!mock) setError('油价数据加载失败，可手动输入')
      return
    }
    getJson<OilLatest>('/data/oil/latest.json')
      .then(setLatest)
      .catch(() => setError('油价数据加载失败，可手动输入'))
    getJson<OilPoint[]>('/data/oil/history.json')
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [search])

  return { latest, history, error }
}
