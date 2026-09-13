import { ToolCardOpen } from '@/components/ToolCard'
import { useOil } from './data'

/** 首页卡片摘要：92 号价格 + 最近 6 条历史的迷你折线。数据没有或加载失败时显示"打开"。 */
export function OilSummary() {
  const { latest, history } = useOil()
  if (!latest) return <ToolCardOpen />

  const points = (history ?? []).slice(-6)
  const prices = points.map((p) => p.p92)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const [, month, day] = latest.source_date.split('-')

  return (
    <>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-rounded text-stat font-bold">{latest.p92.toFixed(2)}</span>
        <span className="text-caption text-foreground-secondary">元/升</span>
      </div>
      {/* 右侧留出迷你折线的位置 */}
      <div className="mt-0.5 pr-16 text-caption text-foreground-secondary">
        湖北 92# · {Number(month)} 月 {Number(day)} 日
      </div>
      {points.length > 1 && (
        <svg width="60" height="28" viewBox="0 0 60 28" aria-hidden className="absolute right-5 bottom-5">
          <polyline
            fill="none"
            stroke="var(--tool-solid)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points
              .map((p, i) => {
                const x = (i / (points.length - 1)) * 58 + 1
                // 价格全相同时画一条水平线
                const y = max === min ? 14 : 26 - ((p.p92 - min) / (max - min)) * 24
                return `${x.toFixed(1)},${y.toFixed(1)}`
              })
              .join(' ')}
          />
        </svg>
      )}
    </>
  )
}
