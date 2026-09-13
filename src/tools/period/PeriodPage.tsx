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
import { Input } from '@/components/ui/input'
import type { Period } from '@/lib/database.types'
import { PeriodCalendar } from './PeriodCalendar'
import { PeriodEditor, validate } from './PeriodEditor'
import type { PeriodInput } from './data'
import { createPeriod, deletePeriod, updatePeriod, usePeriods } from './data'
import type { Cycle, Prediction } from './predict'
import {
  formatMonthDay,
  parseDate,
  periodEnd,
  predict,
  startOfDay,
  statusText,
  toDateString,
} from './predict'

/** "9 月 3 日 – 9 月 7 日"，没填结束日是"9 月 3 日 – 未结束"。 */
function rangeText(period: Period) {
  const start = formatMonthDay(parseDate(period.start_date))
  return `${start} – ${period.end_date ? formatMonthDay(parseDate(period.end_date)) : '未结束'}`
}

/** 首次使用：没有任何记录时代替 Hero Card。 */
function Guide({ onSave }: { onSave: (date: string) => Promise<void> }) {
  const [date, setDate] = useState(() => toDateString(new Date()))
  const [busy, setBusy] = useState(false)
  return (
    <HeroCard className="flex flex-col items-center text-center">
      <IconBadge icon={Droplet} size={56} />
      <div className="mt-2 text-heading">先填一次上次经期开始日</div>
      <div className="text-body-sm text-foreground-secondary">
        填完就能算出下次大概什么时候来
      </div>
      <Input
        type="date"
        className="mt-3 border-0 bg-surface font-rounded"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Button
        className="mt-3 w-full bg-tool-solid text-white"
        disabled={!date || busy}
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
    </HeroCard>
  )
}

function Hero({ periods, prediction }: { periods: Period[]; prediction: Prediction }) {
  const status = statusText(periods, prediction)
  if (!status) return null
  return (
    <HeroCard>
      <IconBadge icon={Droplet} size={56} />
      <div className="mt-4 text-caption text-foreground-secondary">{status.caption}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-rounded text-display">{status.value}</span>
        <span className="text-caption text-foreground-secondary">{status.unit}</span>
      </div>
      <div className="mt-0.5 text-heading">{status.title}</div>
      {prediction.confidence !== 'high' && (
        <div className="mt-1 text-caption text-foreground-secondary">数据较少，仅供参考</div>
      )}
    </HeroCard>
  )
}

function History({ cycles, onPick }: { cycles: Cycle[]; onPick: (period: Period) => void }) {
  return (
    <div className="rounded-md bg-surface px-5 py-4">
      <div className="text-heading">历史</div>
      {cycles.map((cycle) => {
        const { period, length, counted } = cycle
        const days = period.end_date
          ? differenceInCalendarDays(parseDate(period.end_date), parseDate(period.start_date)) + 1
          : null
        return (
          <button
            key={period.id}
            type="button"
            onClick={() => onPick(period)}
            className="flex min-h-16 w-full items-center gap-3 py-2 text-left"
          >
            <IconBadge icon={Droplet} size={32} variant="soft" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-body">{rangeText(period)}</div>
              <div className="truncate text-caption text-foreground-secondary">
                {days ? `${days} 天` : '进行中'}
                {length !== null && ` · 周期 ${length} 天`}
                {length !== null && !counted && (
                  <span className="text-foreground-tertiary"> 不参与预测</span>
                )}
              </div>
            </div>
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
  const [busy, setBusy] = useState(false)

  const list = periods ?? []
  const prediction = predict(list)

  /**
   * 假数据模式下不写数据库，只走一遍 UI。
   * 失败时 toast 并返回 false，调用方据此不关抽屉、不清状态。
   */
  async function write(action: () => Promise<void>): Promise<boolean> {
    setBusy(true)
    try {
      if (!mock) await action()
      await reload()
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败，请重试')
      return false
    } finally {
      setBusy(false)
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
    if (!(await write(() => createPeriod(input)))) return
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
              <Hero periods={list} prediction={prediction} />
            ) : (
              <Guide
                onSave={async (date) => {
                  if (await write(() => createPeriod({ start_date: date, end_date: null }))) {
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
          {owner ? (
            <>
              <div className="mt-1 text-body-sm text-foreground-secondary">
                这天属于记录：{rangeText(owner)}
              </div>
              {/* 结束日未填的记录：按预测长度画出的区间里点某天，最常见的意图就是"今天结束了" */}
              {!owner.end_date && selected > parseDate(owner.start_date) && (
                <Button
                  className="mt-5 w-full bg-tool-solid text-white"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await write(() =>
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
                disabled={busy}
                onClick={async () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true)
                    return
                  }
                  if (!(await write(() => deletePeriod(owner.id)))) return
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
                disabled={busy}
                onClick={() => markStart(selected)}
              >
                标记为经期开始
              </Button>
              <Button
                className="mt-3 w-full bg-tool-soft text-tool-solid"
                disabled={busy || !openRecord}
                onClick={async () => {
                  if (!openRecord) return
                  const ok = await write(() =>
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
              {!openRecord && (
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
          onSave={(input) => write(() => updatePeriod(editing.id, input))}
          onDelete={() => write(() => deletePeriod(editing.id))}
        />
      )}
    </>
  )
}
