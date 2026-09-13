import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router'
import { InlineError } from '@/components/InlineError'
import { Segmented } from '@/components/Segmented'
import { PageSkeleton } from '@/components/Skeleton'
import type { QuitItem, QuitRelapse } from '@/lib/database.types'
import { fetchQuit } from './data'
import { isMock, mockData } from './mock'

export type QuitContext = {
  item: QuitItem | null
  relapses: QuitRelapse[]
  /** 假数据模式下不写数据库 */
  mock: boolean
  reload: () => Promise<void>
}

export function useQuit() {
  return useOutletContext<QuitContext>()
}

const SEGMENTS = [
  { value: '/quit', label: '计时' },
  { value: '/quit/calendar', label: '日历' },
  { value: '/quit/stats', label: '统计' },
]

export function QuitLayout() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const mock = isMock(search)
  const [data, setData] = useState<{ item: QuitItem | null; relapses: QuitRelapse[] } | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    // 写成 import.meta.env.DEV 字面量，生产构建里整段是死代码，mockData 会被 tree-shake 掉
    if (import.meta.env.DEV && mock) {
      setData(mockData())
      return
    }
    setError('')
    try {
      setData(await fetchQuit())
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取失败')
    }
  }, [mock])

  useEffect(() => {
    void reload()
  }, [reload])

  return (
    <>
      <div className="mt-1 mb-3 flex flex-col lg:mb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h1 className="mb-4 font-rounded text-title lg:mb-0">戒烟</h1>
        <Segmented
          value={SEGMENTS.find((s) => s.value === pathname)?.value ?? '/quit'}
          options={SEGMENTS}
          onChange={(value) => navigate({ pathname: value, search })}
          className="lg:w-70"
        />
      </div>
      <InlineError message={error} onRetry={() => void reload()} />
      {data ? (
        <Outlet context={{ ...data, mock, reload } satisfies QuitContext} />
      ) : (
        <PageSkeleton />
      )}
    </>
  )
}
