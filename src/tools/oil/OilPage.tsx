import { useState } from 'react'
import { format } from 'date-fns'
import { Fuel } from 'lucide-react'
import { Line, LineChart, XAxis, YAxis } from 'recharts'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/cn'
import type { OilLatest, OilPoint } from './data'
import { useOil } from './data'

/** 线的颜色走 ChartContainer 生成的 --color-p92，工具色由 ToolColorProvider 给。 */
const CHART_CONFIG = {
  p92: { label: '92#', color: 'var(--color-tool)' },
} satisfies ChartConfig

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
    <Card className="fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Fuel className="size-4 text-tool" />
          湖北 · 92 号汽油
        </CardTitle>
        {latest && (
          <CardDescription>
            来源页面日期 {monthDay(latest.source_date)} · 抓取于{' '}
            {format(new Date(latest.fetched_at), 'M 月 d 日 HH:mm')}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight tabular-nums">
            {latest ? latest.p92.toFixed(2) : '—'}
          </span>
          <span className="text-xs text-muted-foreground">元/升</span>
        </div>
        {latest?.next_adjustment_text && (
          <p className="mt-2 text-xs text-muted-foreground">
            来源网站预告：{latest.next_adjustment_text}
          </p>
        )}
        <InlineError message={error ?? ''} onRetry={onRetry} />
      </CardContent>
    </Card>
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

  const fields = [
    { id: 'oil-price', label: '油价（元/升）', value: price, onChange: setPrice },
    { id: 'oil-distance', label: '行驶距离（km）', value: distance, onChange: setDistance },
    { id: 'oil-consumption', label: '百公里油耗（L）', value: consumption, onChange: setConsumption },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>算一趟油费</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-5">
          {fields.map((f) => (
            <Field key={f.id}>
              <FieldLabel htmlFor={f.id}>{f.label}</FieldLabel>
              <Input
                id={f.id}
                className="tabular-nums"
                inputMode="decimal"
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
              />
            </Field>
          ))}
        </FieldGroup>
        <Separator className="my-5" />
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">预计油费</span>
          <span className="text-4xl font-bold tracking-tight tabular-nums">
            {cost === null ? '—' : `¥${cost.toFixed(2)}`}
          </span>
        </div>
      </CardContent>
    </Card>
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
    <ChartContainer config={CHART_CONFIG} className="mt-2 h-45 w-full">
      <LineChart data={history} margin={{ top: 20, right: 12, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="observed_date"
          ticks={ticks}
          tickFormatter={shortDate}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[low, high]}
          ticks={[low, (low + high) / 2, high].map((v) => Number(v.toFixed(2)))}
          tickFormatter={(v: number) => v.toFixed(2)}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(value) => monthDay(String(value))} />}
        />
        <Line
          dataKey="p92"
          stroke="var(--color-p92)"
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
                <circle cx={cx} cy={cy} r={last ? 6 : 3} fill="var(--color-p92)" />
                {last && (
                  <text
                    x={cx}
                    y={cy - 14}
                    textAnchor="end"
                    fill="var(--color-p92)"
                    className="text-xs font-semibold tabular-nums"
                  >
                    {history[index].p92.toFixed(2)}
                  </text>
                )}
              </g>
            )
          }}
        />
      </LineChart>
    </ChartContainer>
  )
}

function History({ history }: { history: OilPoint[] }) {
  const [all, setAll] = useState(false)
  const rows = history
    .map((point, i) => ({ ...point, change: i === 0 ? null : point.p92 - history[i - 1].p92 }))
    .filter((row) => row.change !== null)
    .reverse()
  const shown = all ? rows : rows.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>价格变化</CardTitle>
        {/* 只有一条时没有"变化"可言，图表只会画一个孤点，整块都不渲染 */}
        {history.length >= 2 && <CardDescription>横轴为首次观测到该价格的日期</CardDescription>}
      </CardHeader>
      <CardContent>
        {history.length < 2 ? (
          <p className="text-sm text-muted-foreground">还没有价格变化记录</p>
        ) : (
          <>
            <Chart history={history} />
            <Table className="mt-3">
              <TableBody>
                {shown.map((row) => {
                  const up = (row.change ?? 0) >= 0
                  return (
                    <TableRow key={row.observed_date}>
                      <TableCell className="text-muted-foreground">
                        {monthDay(row.observed_date)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row.p92.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium tabular-nums',
                          up ? 'text-destructive' : 'text-primary',
                        )}
                      >
                        {/* 跌用 U+2212 减号，和数字同宽 */}
                        {up ? '+' : '−'}
                        {Math.abs(row.change ?? 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {rows.length > 10 && !all && (
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setAll(true)}>
                查看全部
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function OilPage() {
  const { latest, history, error, reload } = useOil()

  return (
    <>
      <h1 className="mt-1 mb-4 text-2xl font-semibold tracking-tight">油费</h1>
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
