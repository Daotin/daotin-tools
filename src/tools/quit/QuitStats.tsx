import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
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
  const weeks = weeklyCounts(relapses, 12).map((w) => ({
    label: `${w.weekStart.getMonth() + 1}/${w.weekStart.getDate()}`,
    count: w.count,
  }))
  const max = Math.max(1, ...weeks.map((w) => w.count))
  // 横轴只留首、中、末三个刻度，12 周全标在手机上挤成一团
  const ticks = [weeks[0], weeks[(weeks.length - 1) >> 1], weeks[weeks.length - 1]].map(
    (w) => w.label,
  )
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
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            {/* 0 次的周点落在底线上，所以纵轴从 0 起，不画网格线 */}
            <LineChart data={weeks} margin={{ top: 18, right: 16, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                ticks={ticks}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--foreground-secondary)', fontSize: 11 }}
              />
              <YAxis
                domain={[0, max]}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={24}
                tick={{ fill: 'var(--foreground-secondary)', fontSize: 11 }}
              />
              <Line
                dataKey="count"
                stroke="var(--tool-solid)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                isAnimationActive={false}
                dot={(props) => {
                  const { cx, cy, index, key } = props as {
                    cx: number
                    cy: number
                    index: number
                    key: string
                  }
                  const last = index === weeks.length - 1
                  return (
                    <g key={key}>
                      <circle cx={cx} cy={cy} r={last ? 5 : 2.5} fill="var(--tool-solid)" />
                      {last && (
                        <text
                          x={cx}
                          y={cy - 12}
                          textAnchor="end"
                          fill="var(--tool-solid)"
                          className="font-rounded text-caption font-semibold"
                        >
                          {weeks[index].count}
                        </text>
                      )}
                    </g>
                  )
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 text-body-sm text-foreground-secondary">
        从 {start.getFullYear()} 年 {start.getMonth() + 1} 月 {start.getDate()} 日开始记录
      </div>
    </>
  )
}
