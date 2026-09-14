import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Solar } from 'lunar-typescript'
import { zhCN } from 'react-day-picker/locale'
import { cn } from '@/lib/cn'
import { parseDate, toDateString } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
 * 日期选择器：shadcn 官方范式，Popover + Calendar。
 * showLunar 时按钮上和每个格子里都带农历。
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
  const [open, setOpen] = useState(false)
  /** 当前翻到的月份，「今天」和年月下拉都改它 */
  const [month, setMonth] = useState(() => parseDate(value))
  const selected = parseDate(value)

  function pick(date: Date) {
    onChange(toDateString(date))
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // 每次打开都回到当前值所在的月份
        if (next) setMonth(parseDate(value))
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start font-normal', className)}>
          <CalendarIcon className="text-muted-foreground" />
          {value}
          {showLunar && value && (
            <span className="text-muted-foreground">· 农历{lunarFullText(selected)}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          required
          locale={zhCN}
          weekStartsOn={1}
          selected={selected}
          onSelect={pick}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={min ? parseDate(min) : FIRST_MONTH}
          endMonth={max ? parseDate(max) : LAST_MONTH}
          disabled={[
            ...(min ? [{ before: parseDate(min) }] : []),
            ...(max ? [{ after: parseDate(max) }] : []),
          ]}
          classNames={{ month_caption: 'flex w-full flex-col px-(--cell-size)' }}
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
                <div className="text-center text-xs text-muted-foreground">
                  {lunarMonthSpan(calendarMonth.date)}
                </div>
                {showLunar && (
                  <div className="mt-0.5 text-center text-xs text-tool">
                    已选农历 {lunarFullText(selected)}，每年按此重复
                  </div>
                )}
              </div>
            ),
            DayButton: ({ children, ...props }) => (
              <CalendarDayButton {...props}>
                {children}
                {showLunar && <span>{lunarCellLabel(props.day.date)}</span>}
              </CalendarDayButton>
            ),
          }}
        />
        <div className="flex justify-end border-t p-2">
          <Button variant="ghost" size="sm" onClick={() => pick(new Date())}>
            今天
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
