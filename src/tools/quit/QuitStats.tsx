import { Bar, BarChart, Cell, ResponsiveContainer, YAxis } from 'recharts'
import { useQuit } from './QuitLayout'
import { computeStats, weeklyCounts } from './stats'

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <div className="text-caption text-foreground-secondary">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-rounded text-stat">{value}</span>
        <span className="text-caption text-foreground-secondary">{unit}</span>
      </div>
    </div>
  )
}

export function QuitStats() {
  const { item, relapses } = useQuit()
  if (!item) {
    return (
      <div className="rounded-md bg-surface p-5 text-body-sm text-foreground-secondary">
        还没有开始计时
      </div>
    )
  }

  const stats = computeStats(item.start_at, relapses)
  const weeks = weeklyCounts(relapses, 12)
  const max = Math.max(1, ...weeks.map((w) => w.count))
  const start = new Date(item.start_at)

  return (
    <>
      <div className="rounded-md bg-surface p-5">
        <div className="text-caption text-foreground-secondary">当前</div>
        <div className="flex items-baseline gap-1">
          <span className="font-rounded text-display-sm text-tool-solid">
            {stats.currentDays}
          </span>
          <span className="text-caption text-foreground-secondary">天</span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="最长记录" value={stats.longestDays} unit="天" />
          <Stat label="累计天数" value={stats.totalDays} unit="天" />
          <Stat label="总破戒" value={stats.relapseCount} unit="次" />
        </div>
      </div>

      <div className="mt-3 rounded-md bg-surface p-5">
        <div className="text-heading">每周破戒</div>
        <div className="mt-4 h-30">
          <ResponsiveContainer width="100%" height="100%">
            {/* 无柱的周画一根 --background 短柱，所以把 0 顶成一个最小值 */}
            <BarChart
              data={weeks.map((w) => ({ ...w, bar: w.count || max * 0.08 }))}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <YAxis hide domain={[0, max]} />
              <Bar dataKey="bar" radius={6} isAnimationActive={false}>
                {weeks.map((w, i) => (
                  <Cell
                    key={i}
                    fill={w.count > 0 ? 'var(--tool-solid)' : 'var(--background)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 text-body-sm text-foreground-secondary">
        从 {start.getFullYear()} 年 {start.getMonth() + 1} 月 {start.getDate()} 日开始记录
      </div>
    </>
  )
}
