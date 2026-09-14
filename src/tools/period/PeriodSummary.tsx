import { ToolCardOpen, ToolCardSkeleton } from '@/components/ToolCard'
import { usePeriods } from './data'
import { predict, statusText } from './predict'

/** 首页卡片摘要：和工具页 Hero Card 用同一份 statusText。没有记录时显示"打开"。 */
export function PeriodSummary() {
  const { periods } = usePeriods()

  // periods 为 null 是还没取回来（骨架），取回来但算不出状态才是空态（"打开"）
  if (!periods) return <ToolCardSkeleton />
  const status = statusText(periods, predict(periods))
  if (!status) return <ToolCardOpen />

  return (
    <>
      <div className="mt-1 flex items-baseline gap-1">
        {status.value === 0 ? (
          <span className="font-rounded text-stat font-bold">今天</span>
        ) : (
          <>
            <span className="font-rounded text-stat font-bold">{status.value}</span>
            {/* 首页只放"天"，方向交给下面那行说明（"预计经期开始" / "已推迟"） */}
            <span className="text-caption text-foreground-secondary">天</span>
          </>
        )}
      </div>
      <div className="mt-auto pt-0.5 text-caption text-foreground-secondary">{status.summary}</div>
    </>
  )
}
