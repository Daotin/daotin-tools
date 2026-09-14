import { useEffect, useRef, useState } from 'react'
import { Solar } from 'lunar-typescript'
import { zhCN } from 'react-day-picker/locale'
import { cn } from '@/lib/cn'
import { parseDate, toDateString } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'

// 农历标签函数和组件放一起（挪出去会多一个文件），关掉 fast-refresh 的导出检查
/* eslint-disable react-refresh/only-export-components */

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/** 年月下拉的范围：1900 年初到今年 + 30 年末，min / max 会再往里收。 */
const FIRST_MONTH = new Date(1900, 0, 1)
const LAST_MONTH = new Date(new Date().getFullYear() + 30, 11, 1)

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

/**
 * 日期选择器：按钮样式的输入框 + 弹层月历（react-day-picker）。
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
  /** 当前翻到的月份，「今天」和年月下拉都改它 */
  const [month, setMonth] = useState(() => parseDate(value))

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const selected = parseDate(draft)

  function start() {
    setDraft(value)
    setMonth(parseDate(value))
    setOpen(true)
  }

  function jumpToday() {
    const today = new Date()
    setDraft(toDateString(today))
    setMonth(today)
  }

  function confirm() {
    onChange(draft)
    setOpen(false)
  }

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
          // 同 Sheet：按坐标判断是否点在方框外，不能用 e.target === dialog（禁用元素的点击会冒到 dialog）
          if (e.detail === 0) return
          const box = ref.current?.getBoundingClientRect()
          if (!box) return
          const outside =
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          if (outside) setOpen(false)
        }}
        className={cn(
          // 手机贴底、电脑（≥1024px）居中 360px；进出场 200ms。
          // 原来复用 index.css 的 .sheet，Sheet 组件改走 Radix 后那个类没了，这里用工具类自带一份。
          'mt-auto w-full max-w-full rounded-t-lg bg-surface-raised p-5 text-foreground shadow-raised outline-none backdrop:bg-black/25',
          'lg:fixed lg:inset-0 lg:m-auto lg:h-fit lg:w-90 lg:rounded-lg',
          'translate-y-4 opacity-0 transition-[opacity,translate,scale,display,overlay] transition-discrete duration-base ease-quint',
          'open:translate-y-0 open:opacity-100 starting:open:translate-y-4 starting:open:opacity-0',
          'lg:translate-y-0 lg:scale-96 lg:open:scale-100 lg:starting:open:scale-96',
        )}
      >
        <Calendar
          mode="single"
          required
          locale={zhCN}
          weekStartsOn={1}
          selected={selected}
          onSelect={(date) => setDraft(toDateString(date))}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={min ? parseDate(min) : FIRST_MONTH}
          endMonth={max ? parseDate(max) : LAST_MONTH}
          disabled={[
            ...(min ? [{ before: parseDate(min) }] : []),
            ...(max ? [{ after: parseDate(max) }] : []),
          ]}
          classNames={{ month_caption: 'flex w-full flex-col px-(--cell-size) pb-1' }}
          formatters={{
            formatYearDropdown: (date) => `${date.getFullYear()} 年`,
            formatMonthDropdown: (date) => `${date.getMonth() + 1} 月`,
            formatWeekdayName: (date) => WEEKDAYS[(date.getDay() + 6) % 7],
          }}
          components={{
            // 标题下常驻农历月份，避免"9 月" + "初五"被读成九月初五
            MonthCaption: ({ calendarMonth, children, className }) => (
              <div className={className}>
                {children}
                <div className="text-center text-caption text-foreground-secondary">
                  {lunarMonthSpan(calendarMonth.date)}
                </div>
                {showLunar && (
                  <div className="mt-0.5 text-center text-caption text-tool-solid">
                    已选农历 {lunarFullText(selected)}，每年按此重复
                  </div>
                )}
              </div>
            ),
            DayButton: ({ children, ...props }) => (
              <CalendarDayButton {...props}>
                {children}
                {showLunar && (
                  <span
                    className={cn(
                      'mt-0.5 text-caption font-normal',
                      !props.modifiers.selected && 'text-foreground-secondary',
                    )}
                  >
                    {lunarCellLabel(props.day.date)}
                  </span>
                )}
              </CalendarDayButton>
            ),
          }}
        />

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
