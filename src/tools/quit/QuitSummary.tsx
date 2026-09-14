import { ToolCardOpen, ToolCardSkeleton } from '@/components/ToolCard'
import { useQuitData } from './data'
import { computeStats, weeklyCounts } from './stats'

/** 首页卡片摘要：已坚持 N 天 + 最近 7 周破戒次数迷你柱。 */
export function QuitSummary() {
  const { data } = useQuitData()

  // data 为 null 是还没取回来（骨架），取回来但没有戒断项才是空态（"打开"）
  if (!data) return <ToolCardSkeleton />
  if (!data.item) return <ToolCardOpen />

  const days = computeStats(data.item.start_at, data.relapses).currentDays
  const weeks = weeklyCounts(data.relapses, 7)
  const max = Math.max(1, ...weeks.map((w) => w.count))

  return (
    <>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{days}</span>
        <span className="text-xs text-muted-foreground">天</span>
      </div>
      <div className="mt-auto pt-0.5 text-xs text-muted-foreground">已坚持</div>
      <svg
        width="60"
        height="28"
        viewBox="0 0 60 28"
        aria-hidden
        className="absolute right-5 bottom-5"
      >
        {/* 首页不在工具路由下，--chart-tool 是 ToolCard 行内给的：
            只有工具类（fill-tool 把 var(--chart-tool) 内联）取得到，写 var(--color-tool) 会退回 :root 的值 */}
        {weeks.map((w, i) => {
          const h = Math.max(2, Math.round((w.count / max) * 28))
          return (
            <rect
              key={i}
              x={i * 9}
              y={28 - h}
              width="6"
              height={h}
              rx="2"
              className={w.count > 0 ? 'fill-tool' : 'fill-muted'}
            />
          )
        })}
      </svg>
    </>
  )
}
