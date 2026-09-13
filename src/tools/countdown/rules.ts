import { differenceInCalendarDays } from 'date-fns'
import { Lunar, LunarMonth, LunarYear, Solar } from 'lunar-typescript'
import type { CountdownEvent } from '@/lib/database.types'

/** 算下一次发生日只需要这三个字段。 */
export type EventLike = Pick<CountdownEvent, 'date' | 'is_lunar' | 'repeat'>

export type Occurrence = {
  /** 下一次发生日（不重复事件就是目标日本身） */
  date: Date
  /** 剩余天数，负数表示已过去，0 表示今天 */
  days: number
}

export const REPEAT_LABEL: Record<CountdownEvent['repeat'], string> = {
  none: '不重复',
  yearly: '每年',
  monthly: '每月',
  weekly: '每周',
}

/** 'YYYY-MM-DD' → 本地零点的 Date（new Date(str) 会按 UTC 解析，差一天）。 */
export function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date → 'YYYY-MM-DD'，给 <input type="date"> 和数据库用。 */
export function toDateString(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

export function formatFullDate(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

/** 某年某月（月份 0 起）的天数。 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

const toLunar = (date: Date) =>
  Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar()

/** 事件的农历文字，如"八月十五"、"闰六月初三"（getMonthInChinese 自带"闰"）。 */
export function lunarText(date: string): string {
  const lunar = toLunar(parseDate(date))
  return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
}

/** 公历每年：2 月 29 日在非闰年取 2 月 28 日（同理其余月份取当月最后一天）。 */
function nextSolarYearly(base: Date, from: Date): Date {
  for (let year = from.getFullYear(); ; year++) {
    const month = base.getMonth()
    const day = Math.min(base.getDate(), daysInMonth(year, month))
    const candidate = new Date(year, month, day)
    if (candidate >= from) return candidate
  }
}

/** 公历每月：目标日大于当月天数时取当月最后一天。 */
function nextMonthly(base: Date, from: Date): Date {
  for (let i = 0; ; i++) {
    const year = from.getFullYear()
    const month = from.getMonth() + i
    const candidate = new Date(year, month, Math.min(base.getDate(), daysInMonth(year, month)))
    if (candidate >= from) return candidate
  }
}

/** 公历每周：按星期几，无特例。 */
function nextWeekly(base: Date, from: Date): Date {
  const delta = (base.getDay() - from.getDay() + 7) % 7
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + delta)
}

/**
 * 农历某年某月某日 → 公历。
 * 目标年份没有这个闰月就用同名的正常月；目标日超出该月天数（三十遇小月）取最后一天。
 */
function lunarToDate(year: number, month: number, leap: boolean, day: number): Date | null {
  const m = leap && LunarYear.fromYear(year).getLeapMonth() === month ? -month : month
  const dayCount = LunarMonth.fromYm(year, m)?.getDayCount()
  if (!dayCount) return null
  const solar = Lunar.fromYmd(year, m, Math.min(day, dayCount)).getSolar()
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay())
}

/** 农历每年：从用户选的公历日期换算出农历月日，再逐年往后找第一个还没过的。 */
function nextLunarYearly(base: Date, from: Date): Date {
  const lunar = toLunar(base)
  const month = Math.abs(lunar.getMonth())
  const leap = lunar.getMonth() < 0
  const day = lunar.getDay()

  const startYear = toLunar(from).getYear()
  let last: Date | null = null
  for (let year = startYear; year <= startYear + 2; year++) {
    const candidate = lunarToDate(year, month, leap, day)
    if (!candidate) continue
    last = candidate
    if (candidate >= from) return candidate
  }
  return last ?? base
}

/**
 * 下一次发生日 = 今天及以后最近的一次；不重复事件直接返回目标日（可能已过去）。
 * 农历只有"不重复"和"每年"两种，数据里若出现每月/每周一律按每年处理。
 */
export function nextOccurrence(event: EventLike, today: Date = new Date()): Occurrence {
  const base = parseDate(event.date)
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  let date: Date
  if (event.repeat === 'none') date = base
  else if (event.is_lunar) date = nextLunarYearly(base, from)
  else if (event.repeat === 'yearly') date = nextSolarYearly(base, from)
  else if (event.repeat === 'monthly') date = nextMonthly(base, from)
  else date = nextWeekly(base, from)

  return { date, days: differenceInCalendarDays(date, from) }
}

export type Entry = { event: CountdownEvent; occurrence: Occurrence }

/**
 * 列表顺序：置顶的一条升为 Hero，其余按"天后"升序，"天前"排最后（离今天近的在前）。
 */
export function sortEvents(events: CountdownEvent[], today: Date = new Date()): Entry[] {
  const entries = events.map((event) => ({ event, occurrence: nextOccurrence(event, today) }))
  entries.sort((a, b) => {
    const past = Number(a.occurrence.days < 0) - Number(b.occurrence.days < 0)
    if (past !== 0) return past
    return a.occurrence.days < 0
      ? b.occurrence.days - a.occurrence.days
      : a.occurrence.days - b.occurrence.days
  })
  const heroIndex = Math.max(
    0,
    entries.findIndex((e) => e.event.pinned),
  )
  return entries.length > 0
    ? [entries[heroIndex], ...entries.filter((_, i) => i !== heroIndex)]
    : entries
}
