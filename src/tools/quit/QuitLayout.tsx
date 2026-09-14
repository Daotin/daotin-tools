import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router'
import { InlineError } from '@/components/InlineError'
import { Segmented } from '@/components/Segmented'
import { PageSkeleton } from '@/components/Skeleton'
import type { QuitItem, QuitRelapse } from '@/lib/database.types'
import { useMediaQuery } from '@/lib/media'
import { useQuitData } from './data'

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
  const { data, mock, error, reload } = useQuitData()
  // 电脑端计时页已经把日历和统计都排出来了，没有 tab；从窄屏拉宽时把子路由收回计时页
  const desktop = useMediaQuery('(min-width: 80rem)')

  useEffect(() => {
    if (desktop && pathname !== '/quit') navigate({ pathname: '/quit', search }, { replace: true })
  }, [desktop, pathname, search, navigate])

  return (
    <>
      <div className="mt-1 mb-3 flex flex-col lg:mb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight lg:mb-0">戒烟</h1>
        {!desktop && (
          <Segmented
            value={SEGMENTS.find((s) => s.value === pathname)?.value ?? '/quit'}
            options={SEGMENTS}
            onChange={(value) => navigate({ pathname: value, search })}
            className="lg:w-70"
          />
        )}
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
