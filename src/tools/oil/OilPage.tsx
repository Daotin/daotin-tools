import { useState } from 'react'
import { format } from 'date-fns'
import { Fuel } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
import { HeroCard } from '@/components/HeroCard'
import { IconBadge } from '@/components/IconBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { OilLatest, OilPoint } from './data'
import { useOil } from './data'

/** 'YYYY-MM-DD' → "9 月 12 日"。按本地时区解析，不用 new Date(string) 的 UTC 语义。 */
function monthDay(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)} 月 ${Number(day)} 日`
}

/** 图表横轴刻度用短形式 "9/12"。 */
function shortDate(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

function Hero({
  latest,
  error,
  onRetry,
}: {
  latest: OilLatest | null
  error: string | null
  onRetry: () => void
}) {
  return (
    <HeroCard>
      <IconBadge icon={Fuel} size={56} />
      <div className="mt-4 text-caption text-foreground-secondary">湖北 · 92 号汽油</div>
      <div className="flex items-baseline gap-1">
        <span className="font-rounded text-display">{latest ? latest.p92.toFixed(2) : '—'}</span>
        <span className="text-caption text-foreground-secondary">元/升</span>
      </div>
      {latest && (
        <div className="mt-1 text-caption text-foreground-secondary">
          来源页面日期 {monthDay(latest.source_date)} · 抓取于{' '}
          {format(new Date(latest.fetched_at), 'M 月 d 日 HH:mm')}
        </div>
      )}
      {latest?.next_adjustment_text && (
        <div className="text-caption text-foreground-secondary">
          来源网站预告：{latest.next_adjustment_text}
        </div>
      )}
      <InlineError message={error ?? ''} onRetry={onRetry} />
    </HeroCard>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="mt-3">
      <label className="text-caption text-foreground-secondary">{label}</label>
      <Input
        className="mt-1 border-0 bg-background font-rounded font-semibold"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** 油价 × 距离 × 百公里油耗 ÷ 100，和原静态页公式一致。任一项为空或非法显示 "—"。 */
function Calculator({ defaultPrice }: { defaultPrice: number | null }) {
  const [price, setPrice] = useState(defaultPrice === null ? '' : String(defaultPrice))
  const [distance, setDistance] = useState('')
  const [consumption, setConsumption] = useState('')

  const numbers = [price, distance, consumption].map(Number)
  const valid =
    [price, distance, consumption].every((v) => v.trim() !== '') &&
    numbers.every((n) => Number.isFinite(n) && n >= 0)
  const cost = valid ? (numbers[0] * numbers[1] * numbers[2]) / 100 : null

  return (
    <div className="rounded-md bg-surface p-5">
      <div className="text-heading">算一趟油费</div>
      <Field label="油价（元/升）" value={price} onChange={setPrice} />
      <Field label="行驶距离（km）" value={distance} onChange={setDistance} />
      <Field label="百公里油耗（L）" value={consumption} onChange={setConsumption} />
      <div className="mt-4">
        <div className="text-caption text-foreground-secondary">预计油费</div>
        <div className="font-rounded text-display-sm text-tool-solid">
          {cost === null ? '—' : `¥${cost.toFixed(2)}`}
        </div>
      </div>
    </div>
  )
}

/** 折线图：单线，最后一个点放大并标价格；横轴最多 5 个刻度，纵轴 3 个，无网格线。 */
function Chart({ history }: { history: OilPoint[] }) {
  const prices = history.map((p) => p.p92)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const pad = Math.max(0.05, (max - min) * 0.2)
  const low = min - pad
  const high = max + pad

  // 从两端向中间均匀取最多 5 个日期当刻度
  const step = Math.max(1, Math.ceil((history.length - 1) / 4))
  const ticks = history
    .filter((_, i) => i % step === 0 || i === history.length - 1)
    .map((p) => p.observed_date)

  return (
    <div className="mt-2 h-45">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 20, right: 12, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="observed_date"
            ticks={ticks}
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--foreground-secondary)', fontSize: 11 }}
          />
          <YAxis
            domain={[low, high]}
            ticks={[low, (low + high) / 2, high].map((v) => Number(v.toFixed(2)))}
            tickFormatter={(v: number) => v.toFixed(2)}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: 'var(--foreground-secondary)', fontSize: 11 }}
          />
          <Line
            dataKey="p92"
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
              const last = index === history.length - 1
              return (
                <g key={key}>
                  <circle cx={cx} cy={cy} r={last ? 6 : 3} fill="var(--tool-solid)" />
                  {last && (
                    <text
                      x={cx}
                      y={cy - 14}
                      textAnchor="end"
                      fill="var(--tool-solid)"
                      className="font-rounded text-caption font-semibold"
                    >
                      {history[index].p92.toFixed(2)}
                    </text>
                  )}
                </g>
              )
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** 价格变化表：最新在上，涨跌对比上一条。首条没有对比对象，不单独列一行。 */
function History({ history }: { history: OilPoint[] }) {
  const [all, setAll] = useState(false)
  const rows = history
    .map((point, i) => ({ ...point, change: i === 0 ? null : point.p92 - history[i - 1].p92 }))
    .filter((row) => row.change !== null)
    .reverse()
  const shown = all ? rows : rows.slice(0, 10)

  return (
    <div className="rounded-md bg-surface p-5">
      <div className="text-heading">价格变化</div>
      {/* 只有一条时没有"变化"可言，图表只会画一个孤点，整块都不渲染 */}
      {history.length < 2 ? (
        <div className="mt-3 text-body-sm text-foreground-secondary">还没有价格变化记录</div>
      ) : (
        <>
          <Chart history={history} />
          <div className="text-caption text-foreground-secondary">
            横轴为首次观测到该价格的日期
          </div>
          <table className="mt-3 w-full">
            <tbody>
              {shown.map((row) => {
                const up = (row.change ?? 0) >= 0
                return (
                  <tr key={row.observed_date}>
                    <td className="py-2 text-body-sm">{monthDay(row.observed_date)}</td>
                    <td className="py-2 text-right font-rounded text-body font-semibold">
                      {row.p92.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 text-right font-rounded text-body-sm font-semibold ${
                        up ? 'text-red-solid' : 'text-green-solid'
                      }`}
                    >
                      {/* 跌用 U+2212 减号，和数字同宽 */}
                      {up ? '+' : '−'}
                      {Math.abs(row.change ?? 0).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length > 10 && !all && (
            <Button variant="ghost" className="mt-1 w-full" onClick={() => setAll(true)}>
              查看全部
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export function OilPage() {
  const { latest, history, error, reload } = useOil()

  return (
    <>
      <h1 className="mt-1 mb-4 font-rounded text-title">油费</h1>
      {!latest && !error ? (
        /* 骨架屏：形状对应 Hero Card */
        <PageSkeleton />
      ) : (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:gap-6">
          <div className="flex flex-col gap-3 xl:min-w-0 xl:flex-1">
            <Hero latest={latest} error={error} onRetry={reload} />
            <Calculator defaultPrice={latest?.p92 ?? null} />
          </div>
          <div className="xl:w-80 xl:shrink-0">
            <History history={history ?? []} />
          </div>
        </div>
      )}
    </>
  )
}
