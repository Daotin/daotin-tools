import { ToolCardOpen, ToolCardSkeleton } from '@/components/ToolCard'
import { useOil } from './data'

/** 首页卡片摘要：92 号价格 + 最近 6 条历史的迷你折线。数据没有或加载失败时显示"打开"。
 * 说明行右边留给迷你折线，390px 宽下只剩 69px，写成 "92# · 8/31" 才不折行（省份在工具页里写全）。 */
export function OilSummary() {
  const { latest, history, error } = useOil()
  // 没有 latest 又没报错 = 还在请求，先占位；请求失败才是空态（"打开"）
  if (!latest) return error ? <ToolCardOpen /> : <ToolCardSkeleton />

  const points = (history ?? []).slice(-6)
  const prices = points.map((p) => p.p92)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const [, month, day] = latest.source_date.split('-')

  return (
    <>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{latest.p92.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground">元/升</span>
      </div>
      {/* 右侧留出迷你折线的位置 */}
      <div className="mt-auto pt-0.5 pr-16 text-xs text-muted-foreground">
        92# · {Number(month)}/{Number(day)}
      </div>
      {points.length > 1 && (
        <svg width="60" height="28" viewBox="0 0 60 28" aria-hidden className="absolute right-5 bottom-5">
          {/* 首页不在工具路由下，--chart-tool 是 ToolCard 行内给的；
              var(--color-tool) 在 :root 就地展开取不到它，必须用工具类 */}
          <polyline
            fill="none"
            className="stroke-tool"
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
