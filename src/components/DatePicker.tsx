import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Solar } from 'lunar-typescript'
import { cn } from '@/lib/cn'
import { parseDate, toDateString } from '@/lib/date'
import { Button } from '@/components/ui/button'

// 农历标签函数和组件放一起（挪出去会多一个文件），关掉 fast-refresh 的导出检查
/* eslint-disable react-refresh/only-export-components */

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const lunarOf = (date: Date) =>
  Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar()

/** 完整农历，如"八月十五"、"闰六月初三"（getMonthInChinese 自带"闰"）。 */
function lunarFullText(date: Date): string {
  const lunar = lunarOf(date)
  return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
}

/**
 * 格子里的农历小字，优先级：传统节日 > 每月初一显示月名 > 日名。
 * 节日名去掉尾字"节"（"中秋节"→"中秋"），两个字的（"春节"）原样保留。
 */
export function lunarCellLabel(date: Date): string {
  const lunar = lunarOf(date)
  const festival = lunar.getFestivals()[0]
  if (festival) return festival.length > 2 ? festival.replace(/节$/, '') : festival
  if (lunar.getDay() === 1) return `${lunar.getMonthInChinese()}月`
  return lunar.getDayInChinese()
}

/** 当月 1 号所在周的周一起排到月末，补位格子留空。 */
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

function Day({
  date,
  selected,
  today,
  showLunar,
  disabled,
  onSelect,
}: {
  date: Date
  selected: boolean
  today: boolean
  showLunar: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="flex h-12 items-center justify-center disabled:opacity-35"
    >
      <span
        className={cn(
          'flex size-11 flex-col items-center justify-center rounded-pill',
          selected ? 'bg-tool-solid text-white' : today && 'ring-2 ring-tool-solid',
        )}
      >
        <span className="font-rounded text-body leading-none font-semibold tabular-nums">
          {date.getDate()}
        </span>
        {showLunar && (
          <span
            className={cn(
              'mt-0.5 text-caption leading-none',
              !selected && 'text-foreground-secondary',
            )}
          >
            {lunarCellLabel(date)}
          </span>
        )}
      </span>
    </button>
  )
}

/**
 * 日期选择器：按钮样式的输入框 + 弹层月历。
 * showLunar 时输入框和每个格子都带农历（用原生 <dialog>，Esc 关闭、遮罩点击关闭）。
 */
export function DatePicker({
  value,
  onChange,
  showLunar = false,
  min,
  max,
  className,
}: {
  /** 公历 'YYYY-MM-DD' */
  value: string
  onChange: (value: string) => void
  showLunar?: boolean
  min?: string
  max?: string
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [anchor, setAnchor] = useState(() => parseDate(value))

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const selected = parseDate(draft)
  const todayString = toDateString(new Date())

  function start() {
    setDraft(value)
    setAnchor(parseDate(value))
    setOpen(true)
  }

  function pick(date: Date) {
    setDraft(toDateString(date))
  }

  function jumpToday() {
    setDraft(todayString)
    setAnchor(new Date())
  }

  function confirm() {
    onChange(draft)
    setOpen(false)
  }

  const shift = (step: number) =>
    setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + step, 1))

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={cn(
          'flex h-12 w-full items-center rounded-sm bg-background px-4 font-rounded text-body',
          className,
        )}
      >
        {value}
        {showLunar && value && (
          <span className="ml-2 text-body-sm text-foreground-secondary">
            · 农历{lunarFullText(parseDate(value))}
          </span>
        )}
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false)
        }}
        className={cn(
          'sheet mt-auto mb-0 w-full max-w-full rounded-t-lg bg-surface-raised p-5 text-foreground shadow-raised outline-none backdrop:bg-black/25',
          'lg:m-auto lg:w-90 lg:rounded-lg',
        )}
      >
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

        {showLunar && (
          <div className="mt-1 text-center text-caption text-foreground-secondary">
            按农历重复，每年按农历 {lunarFullText(selected)} 计算
          </div>
        )}

        <div className="mt-2 grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-center text-caption text-foreground-tertiary">
              {w}
            </div>
          ))}
          {monthCells(anchor).map((date, i) =>
            date ? (
              <Day
                key={i}
                date={date}
                selected={toDateString(date) === draft}
                today={toDateString(date) === todayString}
                showLunar={showLunar}
                disabled={
                  (min !== undefined && toDateString(date) < min) ||
                  (max !== undefined && toDateString(date) > max)
                }
                onSelect={() => pick(date)}
              />
            ) : (
              <i key={i} />
            ),
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Button variant="ghost" onClick={jumpToday}>
            今天
          </Button>
          <Button className="bg-tool-solid px-8 text-white" onClick={confirm}>
            确定
          </Button>
        </div>
      </dialog>
    </>
  )
}
