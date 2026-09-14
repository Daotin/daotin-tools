import { useState } from 'react'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
import { differenceInCalendarDays } from 'date-fns'
import { Droplet } from 'lucide-react'
import { Sheet } from '@/components/Sheet'
import { toast } from '@/components/Toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import type { Period } from '@/lib/database.types'
import { PeriodCalendar } from './PeriodCalendar'
import { PeriodEditor, validate } from './PeriodEditor'
import type { PeriodInput } from './data'
import { createPeriod, deletePeriod, updatePeriod, usePeriods } from './data'
import { cn } from '@/lib/cn'
import type { Cycle, Prediction, Upcoming } from './predict'
import {
  backtestText,
  formatMonthDay,
  OVULATION_CAPTION,
  parseDate,
  periodEnd,
  predict,
  startOfDay,
  statusText,
  toDateString,
} from './predict'

/** "9 月 3 日 – 9 月 7 日"；没填结束日是"未结束"，超期太久算忘了填。 */
function rangeText(period: Period, forgot = false) {
  const start = formatMonthDay(parseDate(period.start_date))
  if (period.end_date) return `${start} – ${formatMonthDay(parseDate(period.end_date))}`
  return `${start} – ${forgot ? '未填结束日' : '未结束'}`
}

/** 事件小圆点的颜色，和日历图例一致。 */
const DOT: Record<Upcoming['kind'], string> = {
  period: 'bg-destructive/60',
  ovulation: 'bg-tool',
}

/** 首次使用：没有任何记录时代替 Hero Card。 */
function Guide({ onSave }: { onSave: (date: string) => Promise<void> }) {
  const [date, setDate] = useState(() => toDateString(new Date()))
  const [busy, setBusy] = useState(false)
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Droplet />
        </EmptyMedia>
        <EmptyTitle>先填一次上次经期开始日</EmptyTitle>
        <EmptyDescription>填完就能算出下次大概什么时候来</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Input
          type="date"
          max={toDateString(new Date())}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button
          className="h-11 w-full"
          disabled={!date}
          loading={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onSave(date)
            } finally {
              setBusy(false)
            }
          }}
        >
          保存
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function Hero({
  periods,
  prediction,
  onFix,
}: {
  periods: Period[]
  prediction: Prediction
  /** 点"还没填结束日"那行时打开该条的编辑抽屉 */
  onFix: (period: Period) => void
}) {
  const status = statusText(periods, prediction)
  if (!status) return null
  const forgot = prediction.cycles.find((c) => c.forgot)?.period
  return (
    <Card className="fade-in gap-4">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Droplet className="size-4 text-tool" />
          {status.caption}
        </CardDescription>
        <CardTitle className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold tracking-tight tabular-nums">
            {status.value === 0 ? '今天' : status.value}
          </span>
          {status.value !== 0 && (
            <span className="text-sm font-normal text-muted-foreground">{status.unit}</span>
          )}
        </CardTitle>
        <CardDescription className="text-base text-foreground">{status.title}</CardDescription>
      </CardHeader>

      <CardContent>
        {status.rest.length > 0 && (
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {status.rest.map((event) => (
              <div key={event.title} className="flex items-center gap-1.5">
                <i className={cn('size-2 shrink-0 rounded-full', DOT[event.kind])} />
                <span>{event.title}</span>
                <span>{formatMonthDay(event.date)}</span>
                <span>· {event.days === 0 ? '今天' : `${event.days} 天后`}</span>
              </div>
            ))}
          </div>
        )}

        {forgot && (
          <Button
            variant="link"
            className="h-auto justify-start p-0 text-xs underline"
            onClick={() => onFix(forgot)}
          >
            {formatMonthDay(parseDate(forgot.start_date))}那次还没填结束日
          </Button>
        )}

        <div className="mt-3 text-xs text-muted-foreground">{backtestText(prediction)}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{OVULATION_CAPTION}</div>
      </CardContent>
    </Card>
  )
}

function History({ cycles, onPick }: { cycles: Cycle[]; onPick: (period: Period) => void }) {
  return (
    <>
      <h2 className="mb-3 text-lg font-semibold">历史</h2>
      <ItemGroup className="gap-2">
        {cycles.map((cycle) => {
          const { period, length, counted, forgot } = cycle
          const days = period.end_date
            ? differenceInCalendarDays(parseDate(period.end_date), parseDate(period.start_date)) + 1
            : null
          // 忘填的那条不写"进行中"，只剩周期信息
          const parts = [
            days ? `${days} 天` : forgot ? null : '进行中',
            length !== null ? `周期 ${length} 天` : null,
          ].filter(Boolean)
          return (
            <Item
              key={period.id}
              asChild
              variant="outline"
              size="sm"
              className="hover:bg-accent/50"
            >
              <button type="button" className="text-left" onClick={() => onPick(period)}>
                <ItemMedia>
                  <Droplet className="size-4 text-muted-foreground" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{rangeText(period, forgot)}</ItemTitle>
                  <ItemDescription>{parts.join(' · ')}</ItemDescription>
                </ItemContent>
                {/* 整行本来就是打开编辑抽屉的按钮，这里只做视觉提示，不再嵌一个按钮 */}
                <ItemActions>
                  {length !== null && !counted && <Badge variant="outline">未参与估算</Badge>}
                  {forgot && <Badge variant="secondary">补填</Badge>}
                </ItemActions>
              </button>
            </Item>
          )
        })}
      </ItemGroup>
    </>
  )
}

export function PeriodPage() {
  const { periods, mock, error, reload } = usePeriods()
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [selected, setSelected] = useState<Date | null>(null)
  const [editing, setEditing] = useState<Period | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  /** 哪个按钮在转圈：抽屉里几个按钮各转各的 */
  const [busy, setBusy] = useState('')

  const list = periods ?? []
  const prediction = predict(list)
  // 未来的日子只能看，不能标记（记录写进去会算错周期）
  const future = !!selected && selected > startOfDay(new Date())

  /**
   * 假数据模式下不写数据库，只走一遍 UI。
   * 失败时 toast 并返回 false，调用方据此不关抽屉、不清状态。
   */
  async function write(key: string, action: () => Promise<void>): Promise<boolean> {
    setBusy(key)
    try {
      if (!mock) await action()
      await reload()
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败，请重试')
      return false
    } finally {
      setBusy('')
    }
  }

  // 点中的那天落在哪条记录的区间里（含结束日未填时按预测长度画出来的那段）
  const owner = selected
    ? (list.find((p) =>
        selected >= parseDate(p.start_date) &&
        selected <= periodEnd(p, prediction?.periodLength ?? 5),
      ) ?? null)
    : null
  // "标记为经期结束"只在有一条结束日为空且开始日 ≤ 该天的记录时可用
  const openRecord =
    selected && !owner
      ? (list.find((p) => !p.end_date && parseDate(p.start_date) <= selected) ?? null)
      : null

  async function markStart(date: Date) {
    const input: PeriodInput = { start_date: toDateString(date), end_date: null }
    const message = validate(input, list)
    if (message) {
      toast(message)
      return
    }
    if (!(await write('start', () => createPeriod(input)))) return
    setSelected(null)
    toast('已记录')
  }

  return (
    <>
      <h1 className="mt-1 mb-4 text-2xl font-semibold tracking-tight">经期</h1>
      <InlineError message={error} onRetry={() => void reload()} />

      {!periods ? (
        /* 骨架屏：形状对应 Hero Card */
        <PageSkeleton />
      ) : (
        <div className="flex flex-col xl:flex-row xl:items-start xl:gap-6">
          <div className="flex flex-col gap-3 xl:min-w-0 xl:flex-1">
            {prediction ? (
              <Hero periods={list} prediction={prediction} onFix={setEditing} />
            ) : (
              <Guide
                onSave={async (date) => {
                  if (await write('start', () => createPeriod({ start_date: date, end_date: null }))) {
                    toast('已记录')
                  }
                }}
              />
            )}
            <PeriodCalendar
              anchor={anchor}
              onAnchor={setAnchor}
              periods={list}
              prediction={prediction}
              onSelect={(date) => {
                setConfirmDelete(false)
                setSelected(date)
              }}
            />
          </div>
          {list.length > 0 && prediction && (
            <div className="mt-6 xl:mt-0 xl:w-80 xl:shrink-0">
              <History cycles={prediction.cycles} onPick={setEditing} />
            </div>
          )}
        </div>
      )}

      {/* 点某天的抽屉 */}
      {selected && (
        <Sheet
          open
          onClose={() => setSelected(null)}
          title={formatMonthDay(selected)}
        >
          <div className="flex flex-col gap-3">
            {future && <p className="text-sm text-muted-foreground">不能标记未来日期</p>}
            {owner ? (
              <>
                <p className="text-sm text-muted-foreground">这天属于记录：{rangeText(owner)}</p>
                {/* 结束日未填的记录：按预测长度画出的区间里点某天，最常见的意图就是"今天结束了" */}
                {!owner.end_date && selected > parseDate(owner.start_date) && (
                  <Button
                    className="h-11 w-full"
                    disabled={!!busy || future}
                    loading={busy === 'end'}
                    onClick={async () => {
                      const ok = await write('end', () =>
                        updatePeriod(owner.id, {
                          start_date: owner.start_date,
                          end_date: toDateString(selected),
                        }),
                      )
                      if (!ok) return
                      setSelected(null)
                      toast('已记录')
                    }}
                  >
                    标记为经期结束
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => {
                    setSelected(null)
                    setEditing(owner)
                  }}
                >
                  编辑这条记录
                </Button>
                <Button
                  variant="destructive"
                  className="h-11 w-full"
                  disabled={!!busy}
                  loading={busy === 'delete'}
                  onClick={async () => {
                    if (!confirmDelete) {
                      setConfirmDelete(true)
                      return
                    }
                    if (!(await write('delete', () => deletePeriod(owner.id)))) return
                    setSelected(null)
                    toast('已删除')
                  }}
                >
                  {confirmDelete ? '确定删除？' : '删除这条记录'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="h-11 w-full"
                  disabled={!!busy || future}
                  loading={busy === 'start'}
                  onClick={() => markStart(selected)}
                >
                  标记为经期开始
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  disabled={!!busy || future || !openRecord}
                  loading={busy === 'end'}
                  onClick={async () => {
                    if (!openRecord) return
                    const ok = await write('end', () =>
                      updatePeriod(openRecord.id, {
                        start_date: openRecord.start_date,
                        end_date: toDateString(selected),
                      }),
                    )
                    if (!ok) return
                    setSelected(null)
                    toast('已记录')
                  }}
                >
                  标记为经期结束
                </Button>
                {!openRecord && !future && (
                  <p className="text-xs text-muted-foreground">
                    没有还没结束的经期记录，先标记一次开始
                  </p>
                )}
              </>
            )}
          </div>
        </Sheet>
      )}

      {/* 编辑记录抽屉 */}
      {editing && (
        <PeriodEditor
          period={editing}
          others={list.filter((p) => p.id !== editing.id)}
          onClose={() => setEditing(null)}
          /* 编辑抽屉的两个按钮由 PeriodEditor 自己管转圈，这里的 key 不对应页面上的按钮 */
          onSave={(input) => write('editor', () => updatePeriod(editing.id, input))}
          onDelete={() => write('editor', () => deletePeriod(editing.id))}
        />
      )}
    </>
  )
}
