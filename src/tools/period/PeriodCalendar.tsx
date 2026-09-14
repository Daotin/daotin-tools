import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  /** 已记录经期日 */
  recorded: boolean
  /** 预测经期日 / 结束日未填的推算日 */
  soft: boolean
  /** 结束日未填的记录：虚线边 */
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

/** 格子里数字底下的小字。颜色之外的第二重区分，图例里一并写出来。 */
function markLabel(mark: Mark): string {
  if (mark.recorded) return '经'
  if (mark.soft) return '预'
  if (mark.ovulation) return '排卵'
  if (mark.fertile) return '排'
  return ''
}

function Day({
  date,
  mark,
  todayMs,
  onSelect,
}: {
  date: Date
  mark: Mark
  /** 今天的本地零点时间戳，用来标出今天和把未来日期变灰 */
  todayMs: number
  onSelect: () => void
}) {
  const today = date.getTime() === todayMs
  const plain = !mark.recorded && !mark.soft && !mark.fertile
  return (
    <button type="button" onClick={onSelect} className="flex h-11 items-center justify-center">
      <span
        className={cn(
          'flex size-9 flex-col items-center justify-center gap-px rounded-md text-sm leading-none tabular-nums',
          plain && date.getTime() > todayMs && 'text-muted-foreground',
          mark.recorded && 'bg-destructive/15 font-medium text-destructive',
          mark.soft && 'bg-destructive/5 text-destructive/70',
          mark.dashed && 'border border-dashed border-destructive/50',
          mark.fertile && 'bg-tool/10 text-tool',
          mark.ovulation && 'ring-1 ring-tool',
          // 今天压在事件配色之上；那天是什么事件由格子里的小字继续说明
          today && 'bg-accent font-semibold text-accent-foreground ring-1 ring-ring',
        )}
      >
        {date.getDate()}
        <span className="h-3 text-[10px] leading-3 opacity-80">{markLabel(mark)}</span>
      </span>
    </button>
  )
}

function Legend({ swatch, text }: { swatch: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className={cn('size-3 shrink-0 rounded-sm', swatch)} />
      {text}
    </span>
  )
}

/** 月历卡：上下月切换 + 7 列格子 + 图例。 */
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
    <Card>
      <CardContent>
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" aria-label="上个月" onClick={() => shift(-1)}>
            <ChevronLeft />
          </Button>
          <span className="shrink-0 text-sm font-medium whitespace-nowrap">
            {anchor.getFullYear()} 年 {anchor.getMonth() + 1} 月
          </span>
          <Button variant="ghost" size="icon" aria-label="下个月" onClick={() => shift(1)}>
            <ChevronRight />
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-center text-xs text-muted-foreground">
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

        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Legend swatch="bg-destructive/15" text="经期（经）" />
          <Legend
            swatch="border border-dashed border-destructive/50 bg-destructive/5"
            text="预测经期（预）"
          />
          <Legend swatch="bg-tool/10" text="排卵期（排）" />
          <Legend swatch="bg-tool/10 ring-1 ring-tool" text="排卵日（排卵）" />
          <Legend swatch="bg-accent ring-1 ring-ring" text="今天" />
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground">{OVULATION_CAPTION}</div>
      </CardContent>
    </Card>
  )
}
