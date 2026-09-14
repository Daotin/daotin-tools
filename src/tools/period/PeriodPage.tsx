import { useState } from 'react'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
import { differenceInCalendarDays } from 'date-fns'
import { Droplet } from 'lucide-react'
import { HeroCard } from '@/components/HeroCard'
import { IconBadge } from '@/components/IconBadge'
import { Sheet } from '@/components/Sheet'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
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
  period: 'bg-red-solid',
  ovulation: 'bg-teal-solid',
}

/** 首次使用：没有任何记录时代替 Hero Card。 */
function Guide({ onSave }: { onSave: (date: string) => Promise<void> }) {
  const [date, setDate] = useState(() => toDateString(new Date()))
  const [busy, setBusy] = useState(false)
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <IconBadge icon={Droplet} size={56} />
        </EmptyMedia>
        <EmptyTitle>先填一次上次经期开始日</EmptyTitle>
        <EmptyDescription>填完就能算出下次大概什么时候来</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Input
          type="date"
          className="border-0 bg-surface font-rounded"
          max={toDateString(new Date())}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button
          className="w-full bg-tool-solid text-white"
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
    <HeroCard>
      <IconBadge icon={Droplet} size={56} />
      <div className="mt-4 text-caption text-foreground-secondary">{status.caption}</div>
      {status.value === 0 ? (
        <div className="font-rounded text-display">今天</div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="font-rounded text-display">{status.value}</span>
          <span className="text-caption text-foreground-secondary">{status.unit}</span>
        </div>
      )}
      <div className="mt-0.5 text-heading">{status.title}</div>

      {status.rest.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 text-caption text-foreground-secondary">
          {status.rest.map((event) => (
            <div key={event.title} className="flex items-center gap-1.5">
              <i className={cn('size-2 shrink-0 rounded-pill', DOT[event.kind])} />
              <span>{event.title}</span>
              <span>{formatMonthDay(event.date)}</span>
              <span>· {event.days === 0 ? '今天' : `${event.days} 天后`}</span>
            </div>
          ))}
        </div>
      )}

      {forgot && (
        <button
          type="button"
          className="mt-2 text-left text-caption text-tool-solid"
          onClick={() => onFix(forgot)}
        >
          {formatMonthDay(parseDate(forgot.start_date))}那次还没填结束日
        </button>
      )}

      <div className="mt-3 text-caption text-foreground-secondary">{backtestText(prediction)}</div>
      <div className="mt-0.5 text-caption text-foreground-secondary">{OVULATION_CAPTION}</div>
    </HeroCard>
  )
}

function History({ cycles, onPick }: { cycles: Cycle[]; onPick: (period: Period) => void }) {
  return (
    <div className="rounded-md bg-surface px-5 py-4">
      <div className="text-heading">历史</div>
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
          <button
            key={period.id}
            type="button"
            onClick={() => onPick(period)}
            className="flex min-h-16 w-full items-center gap-3 py-2 text-left"
          >
            <IconBadge icon={Droplet} size={32} variant="soft" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-body">{rangeText(period, forgot)}</div>
              <div className="truncate text-caption text-foreground-secondary">
                {parts.join(' · ')}
                {length !== null && !counted && (
                  <span className="text-foreground-secondary"> 未参与估算</span>
                )}
              </div>
            </div>
            {/* 整行本来就是打开编辑抽屉的按钮，这里只做视觉提示，不再嵌一个按钮 */}
            {forgot && (
              <span className="shrink-0 rounded-pill bg-tool-soft px-2.5 py-1 text-caption text-tool-solid">
                补填
              </span>
            )}
          </button>
        )
      })}
    </div>
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
      <h1 className="mt-1 mb-4 font-rounded text-title">经期</h1>
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
            <div className="mt-3 xl:mt-0 xl:w-80 xl:shrink-0">
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
          {future && (
            <div className="mt-1 text-caption text-foreground-secondary">不能标记未来日期</div>
          )}
          {owner ? (
            <>
              <div className="mt-1 text-body-sm text-foreground-secondary">
                这天属于记录：{rangeText(owner)}
              </div>
              {/* 结束日未填的记录：按预测长度画出的区间里点某天，最常见的意图就是"今天结束了" */}
              {!owner.end_date && selected > parseDate(owner.start_date) && (
                <Button
                  className="mt-5 w-full bg-tool-solid text-white"
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
              {/* 不用 variant="secondary"：--secondary 在 :root 上就把 --tool-soft 代入成默认色了 */}
              <Button
                className="mt-5 w-full bg-tool-soft text-tool-solid"
                onClick={() => {
                  setSelected(null)
                  setEditing(owner)
                }}
              >
                编辑这条记录
              </Button>
              <Button
                variant="destructive"
                className="mt-3 w-full"
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
                className="mt-5 w-full bg-tool-solid text-white"
                disabled={!!busy || future}
                loading={busy === 'start'}
                onClick={() => markStart(selected)}
              >
                标记为经期开始
              </Button>
              <Button
                className="mt-3 w-full bg-tool-soft text-tool-solid"
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
                <div className="mt-2 text-caption text-foreground-secondary">
                  没有还没结束的经期记录，先标记一次开始
                </div>
              )}
            </>
          )}
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
