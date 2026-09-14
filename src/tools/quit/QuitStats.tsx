import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { useQuit } from './QuitLayout'
import { computeStats, weeklyCounts } from './stats'

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/** embedded：电脑端嵌在计时页下面时，"当前坚持天数"上面的计时卡已经写了，这里不再重复。 */
export function QuitStats({ embedded = false }: { embedded?: boolean }) {
  const { item, relapses } = useQuit()
  if (!item) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">还没有开始计时</CardContent>
      </Card>
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
      {!embedded && (
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">当前</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight tabular-nums">
                {stats.currentDays}
              </span>
              <span className="text-sm text-muted-foreground">天</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 嵌在计时页里时，这三个数字已经在计时卡下面那排了 */}
      {!embedded && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Stat label="最长记录" value={stats.longestDays} unit="天" />
          <Stat label="累计天数" value={stats.totalDays} unit="天" />
          <Stat label="总破戒" value={stats.relapseCount} unit="次" />
        </div>
      )}

      <Card className={cn(!embedded && 'mt-4')}>
        <CardHeader>
          <CardTitle>每周破戒</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              {/* 0 次的周点落在底线上，所以纵轴从 0 起，不画网格线 */}
              <LineChart data={weeks} margin={{ top: 18, right: 16, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="label"
                  ticks={ticks}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
                <YAxis
                  domain={[0, max]}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
                <Line
                  dataKey="count"
                  stroke="var(--color-tool)"
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
                        <circle cx={cx} cy={cy} r={last ? 5 : 2.5} fill="var(--color-tool)" />
                        {last && (
                          <text
                            x={cx}
                            y={cy - 12}
                            textAnchor="end"
                            fill="var(--color-tool)"
                            className="text-xs font-medium tabular-nums"
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
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">
        从 {start.getFullYear()} 年 {start.getMonth() + 1} 月 {start.getDate()} 日开始记录
      </p>
    </>
  )
}
