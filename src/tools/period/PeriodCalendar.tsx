import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Period } from '@/lib/database.types'
import type { Prediction } from './predict'
import { addDays, OVULATION_CAPTION, parseDate, periodEnd, startOfDay } from './predict'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/** 月视图的格子：从当月 1 号所在周的周一排到月末（和戒烟日历同一套排法）。 */
function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const blanks = (first.getDay() + 6) % 7
  const days = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from(
      { length: days },
      (_, i) => new Date(anchor.getFullYear(), anchor.getMonth(), i + 1),
    ),
  ]
}

const between = (date: Date, from: Date, to: Date) => date >= from && date <= to

type Mark = {
  /** 已记录经期日：red solid 实心圆白字 */
  recorded: boolean
  /** 预测经期日 / 结束日未填的推算日：red soft */
  soft: boolean
  /** 结束日未填的记录：1px 虚线 red solid 边 */
  dashed: boolean
  fertile: boolean
  ovulation: boolean
}

/** 优先级：已记录 > 结束日未填的推算 > 预测经期 > 排卵期。 */
function markOf(date: Date, periods: Period[], prediction: Prediction | null): Mark {
  const mark: Mark = {
    recorded: false,
    soft: false,
    dashed: false,
    fertile: false,
    ovulation: false,
  }
  const length = prediction?.periodLength ?? 5

  for (const period of periods) {
    const start = parseDate(period.start_date)
    if (!between(date, start, periodEnd(period, length))) continue
    if (period.end_date || date.getTime() === start.getTime()) {
      mark.recorded = true
    } else {
      mark.soft = true
      mark.dashed = true
    }
    return mark
  }

  if (prediction) {
    const { nextStart, fertileStart, fertileEnd, ovulation } = prediction
    if (between(date, nextStart, addDays(nextStart, length - 1))) {
      mark.soft = true
      return mark
    }
    if (between(date, fertileStart, fertileEnd)) {
      mark.fertile = true
      mark.ovulation = date.getTime() === ovulation.getTime()
    }
  }
  return mark
}

function Day({
  date,
  mark,
  todayMs,
  onSelect,
}: {
  date: Date
  mark: Mark
  /** 今天的本地零点时间戳，用来画圆环和把未来日期变灰 */
  todayMs: number
  onSelect: () => void
}) {
  const today = date.getTime() === todayMs
  const plain = !mark.recorded && !mark.soft && !mark.fertile
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-11 items-center justify-center"
    >
      <span
        className={cn(
          'flex size-[34px] items-center justify-center rounded-pill font-rounded text-body-sm font-semibold tabular-nums',
          plain && date.getTime() > todayMs && 'text-foreground-secondary',
          mark.recorded && 'bg-red-solid text-white',
          mark.soft && 'bg-red-soft text-red-solid',
          mark.dashed && 'border border-dashed border-red-solid',
          mark.fertile && 'bg-teal-soft text-teal-solid',
          // 排卵日圆环；今天的圆环叠在最外，两者只显示一个
          mark.ovulation && !today && 'ring-2 ring-teal-solid',
          today && 'ring-2 ring-tool-solid',
        )}
      >
        {date.getDate()}
      </span>
    </button>
  )
}

function Legend({ color, ring, text }: { color: string; ring?: string; text: string }) {
  return (
    <span className="flex items-center gap-1">
      <i
        className="size-2.5"
        style={{ background: color, boxShadow: ring && `inset 0 0 0 2px ${ring}` }}
      />
      {text}
    </span>
  )
}

/** 月历白卡：上下月切换 + 7 列格子 + 图例。 */
export function PeriodCalendar({
  anchor,
  onAnchor,
  periods,
  prediction,
  onSelect,
}: {
  anchor: Date
  onAnchor: (date: Date) => void
  periods: Period[]
  prediction: Prediction | null
  onSelect: (date: Date) => void
}) {
  const today = startOfDay(new Date()).getTime()
  const shift = (step: number) =>
    onAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + step, 1))

  return (
    <div className="rounded-md bg-surface p-5">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="上个月"
          onClick={() => shift(-1)}
          className="flex size-8 shrink-0 items-center justify-center rounded-pill text-foreground-secondary"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="shrink-0 font-rounded text-body font-semibold whitespace-nowrap">
          {anchor.getFullYear()} 年 {anchor.getMonth() + 1} 月
        </span>
        <button
          type="button"
          aria-label="下个月"
          onClick={() => shift(1)}
          className="flex size-8 shrink-0 items-center justify-center rounded-pill text-foreground-secondary"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-caption text-foreground-secondary">
            {w}
          </div>
        ))}
        {monthCells(anchor).map((date, i) =>
          date ? (
            <Day
              key={i}
              date={date}
              mark={markOf(date, periods, prediction)}
              todayMs={today}
              onSelect={() => onSelect(date)}
            />
          ) : (
            <i key={i} />
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-caption text-foreground-secondary">
        <Legend color="var(--red-solid)" text="经期" />
        <Legend color="var(--red-soft)" text="预测经期" />
        <Legend color="var(--teal-soft)" text="排卵期" />
        <Legend color="var(--tool-soft)" ring="var(--tool-solid)" text="今天" />
      </div>
      <div className="mt-1 text-caption text-foreground-secondary">{OVULATION_CAPTION}</div>
    </div>
  )
}
