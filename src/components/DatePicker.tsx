import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Solar } from 'lunar-typescript'
import { cn } from '@/lib/cn'
import { parseDate, toDateString } from '@/lib/date'
import { Button } from '@/components/ui/button'

// 农历标签函数和组件放一起（挪出去会多一个文件），关掉 fast-refresh 的导出检查
/* eslint-disable react-refresh/only-export-components */

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/** 年月快选的年份范围：1900 到今年 + 30，一百多项直接渲染，不做虚拟滚动。 */
const YEARS = Array.from(
  { length: new Date().getFullYear() + 31 - 1900 },
  (_, i) => 1900 + i,
)
const MONTHS = Array.from({ length: 12 }, (_, i) => i)

const lunarOf = (date: Date) =>
  Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar()

/** 完整农历，如"八月十五"、"闰六月初三"（getMonthInChinese 自带"闰"）。 */
function lunarFullText(date: Date): string {
  const lunar = lunarOf(date)
  return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
}

/**
 * 标题下的农历月份，如"农历八月"或跨月时"农历八月 – 九月"。
 * 标题写的是公历月份，格子里只有日名（初五），不标出农历月就会被读成"九月初五"。
 */
export function lunarMonthSpan(anchor: Date): string {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const first = `${lunarOf(new Date(y, m, 1)).getMonthInChinese()}月`
  const last = `${lunarOf(new Date(y, m + 1, 0)).getMonthInChinese()}月`
  return first === last ? `农历${first}` : `农历${first} – ${last}`
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

/** 年月快选列表里的一项。data-active 给"打开时滚到选中项"用。 */
function YmItem({
  label,
  active,
  disabled,
  onSelect,
}: {
  label: string
  active: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-active={active || undefined}
      onClick={onSelect}
      className={cn(
        'flex h-10 w-full items-center justify-center rounded-sm font-rounded text-body tabular-nums disabled:opacity-35',
        active && 'bg-tool-soft font-semibold text-tool-solid',
      )}
    >
      {label}
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
  const ymRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  /** true 时弹层里显示年月快选，false 显示月历 */
  const [picking, setPicking] = useState(false)
  const [draft, setDraft] = useState(value)
  const [anchor, setAnchor] = useState(() => parseDate(value))

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // 切到年月视图时把选中的年、月滚到列表中间（只动列表自己的 scrollTop）
  useEffect(() => {
    if (!picking) return
    ymRef.current?.querySelectorAll<HTMLElement>('[data-active]').forEach((el) => {
      const box = el.parentElement
      if (box) box.scrollTop = el.offsetTop - (box.clientHeight - el.offsetHeight) / 2
    })
  }, [picking])

  const selected = parseDate(draft)
  const todayString = toDateString(new Date())

  /** 整段 [from, to] 都落在 min/max 之外就禁用 */
  const blocked = (from: Date, to: Date) =>
    (min !== undefined && toDateString(to) < min) || (max !== undefined && toDateString(from) > max)

  function start() {
    setDraft(value)
    setAnchor(parseDate(value))
    setPicking(false)
    setOpen(true)
  }

  function pick(date: Date) {
    setDraft(toDateString(date))
  }

  function jumpToday() {
    setDraft(todayString)
    setAnchor(new Date())
    setPicking(false)
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
        onCancel={(e) => {
          // 年月视图下 Esc 先退回月历，再按才关弹层
          if (picking) {
            e.preventDefault()
            setPicking(false)
          }
        }}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false)
        }}
        className={cn(
          'sheet w-full max-w-full rounded-t-lg bg-surface-raised p-5 text-foreground shadow-raised outline-none backdrop:bg-black/25',
          'lg:w-90 lg:rounded-lg',
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="上个月"
            onClick={() => shift(-1)}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-pill text-foreground-secondary',
              picking && 'invisible',
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-expanded={picking}
            onClick={() => setPicking(!picking)}
            className="flex shrink-0 items-center gap-1 font-rounded text-body font-semibold whitespace-nowrap"
          >
            {anchor.getFullYear()} 年 {anchor.getMonth() + 1} 月
            <ChevronDown
              className={cn(
                'size-4 text-foreground-secondary transition-transform duration-200 ease-out',
                picking && 'rotate-180',
              )}
            />
          </button>
          <button
            type="button"
            aria-label="下个月"
            onClick={() => shift(1)}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-pill text-foreground-secondary',
              picking && 'invisible',
            )}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* 标题是公历月份，这里标出对应的农历月，避免"9 月"+"初五"被读成九月初五 */}
        {!picking && (
          <div className="mt-1 text-center text-caption text-foreground-secondary">
            {lunarMonthSpan(anchor)}
          </div>
        )}

        {showLunar && (
          <div className="mt-0.5 text-center text-caption text-tool-solid">
            已选农历 {lunarFullText(selected)}，每年按此重复
          </div>
        )}

        {/* 月历和年月快选叠在同一格，互相淡入淡出；隐藏的那层 inert，键盘聚焦不到 */}
        <div className="mt-2 grid *:col-start-1 *:row-start-1">
          <div
            inert={picking}
            className={cn(
              'grid grid-cols-7 transition-opacity duration-200 ease-out',
              picking && 'opacity-0',
            )}
          >
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
                  selected={toDateString(date) === draft}
                  today={toDateString(date) === todayString}
                  showLunar={showLunar}
                  disabled={blocked(date, date)}
                  onSelect={() => pick(date)}
                />
              ) : (
                <i key={i} />
              ),
            )}
          </div>

          <div
            ref={ymRef}
            inert={!picking}
            className={cn(
              'grid grid-cols-2 gap-3 transition-opacity duration-200 ease-out',
              !picking && 'opacity-0',
            )}
          >
            <div className="relative h-72 overflow-y-auto">
              {YEARS.map((y) => (
                <YmItem
                  key={y}
                  label={`${y}`}
                  active={y === anchor.getFullYear()}
                  disabled={blocked(new Date(y, 0, 1), new Date(y, 11, 31))}
                  onSelect={() => setAnchor(new Date(y, anchor.getMonth(), 1))}
                />
              ))}
            </div>
            <div className="relative h-72 overflow-y-auto">
              {MONTHS.map((m) => (
                <YmItem
                  key={m}
                  label={`${m + 1} 月`}
                  active={m === anchor.getMonth()}
                  disabled={blocked(
                    new Date(anchor.getFullYear(), m, 1),
                    new Date(anchor.getFullYear(), m + 1, 0),
                  )}
                  onSelect={() => {
                    setAnchor(new Date(anchor.getFullYear(), m, 1))
                    setPicking(false)
                  }}
                />
              ))}
            </div>
          </div>
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
