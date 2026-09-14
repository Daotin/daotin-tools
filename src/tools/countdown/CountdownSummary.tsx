import { ToolCardOpen, ToolCardSkeleton } from '@/components/ToolCard'
import { useEvents } from './data'
import { sortEvents } from './rules'

/** 首页卡片摘要：最近一条的天数（排序后的第一条）。没有事件时按 ui-spec 第 2 节显示"打开"。 */
export function CountdownSummary() {
  const { events } = useEvents()
  // events 为 null 是还没取回来（骨架），取回来是空数组才是空态（"打开"）
  if (!events) return <ToolCardSkeleton />
  const first = events.length > 0 ? sortEvents(events)[0] : null
  if (!first) return <ToolCardOpen />

  const { days } = first.occurrence
  return (
    <>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {days === 0 ? '今天' : Math.abs(days)}
        </span>
        {days !== 0 && <span className="text-xs text-muted-foreground">天</span>}
      </div>
      <div className="mt-auto pt-0.5 text-xs text-muted-foreground">
        {first.event.title}
        {days === 0 ? '' : days > 0 ? ' · 还有' : ' · 已经'}
      </div>
    </>
  )
}
