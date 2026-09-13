import { differenceInCalendarDays } from 'date-fns'
import { formatMonthDay, parseDate } from '@/lib/date'
import type { Period } from '@/lib/database.types'

export { formatMonthDay, parseDate, toDateString } from '@/lib/date'

/** 某天往后 n 天（本地零点）。 */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
}

/** 把带时分秒的"现在"截成本地零点，日期比较全部以天为单位。 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** 线性加权平均：传入的数组按旧→新排列，最旧权重 1，最新权重 n，四舍五入。 */
function weightedAverage(values: number[]): number {
  const sum = values.reduce((acc, v, i) => acc + v * (i + 1), 0)
  const weight = (values.length * (values.length + 1)) / 2
  return Math.round(sum / weight)
}

/** 历史列表里的一条：`length` 是与上一条开始日之差，首条为 null。 */
export type Cycle = {
  period: Period
  /** 天数，如 28；首条没有上一条，为 null */
  length: number | null
  /** 这个周期是否参与了预测（首条 length 为 null 时无意义） */
  counted: boolean
}

export type Prediction = {
  cycleLength: number
  periodLength: number
  nextStart: Date
  ovulation: Date
  fertileStart: Date
  fertileEnd: Date
  irregular: boolean
  confidence: 'high' | 'medium' | 'low' | 'default'
  /** 按开始日倒序，和历史列表顺序一致 */
  cycles: Cycle[]
}

/**
 * 按 design.md"经期 · 预测"一节实现。没有任何记录时返回 null（页面显示首次引导）。
 * 取样 → 剔除 → 加权平均 → 排卵期 → 不规律判定 → 可信度。
 * 结果只由历史记录决定，与"今天"无关；今天只在 statusText 里用来选文案。
 */
export function predict(periods: Period[]): Prediction | null {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date))
  if (sorted.length === 0) return null

  const starts = sorted.map((p) => parseDate(p.start_date))
  // allCycles[i] 是 sorted[i + 1] 与前一条开始日之差
  const allCycles = starts
    .slice(1)
    .map((date, i) => differenceInCalendarDays(date, starts[i]))

  // 取样：最近最多 6 个
  const offset = Math.max(0, allCycles.length - 6)
  const recent = allCycles.slice(offset)

  // 剔除：先丢 15–90 之外的（录错日期的量级），剩余 ≥3 再丢与中位数相差 >10 的
  let keptIndexes = recent
    .map((_, i) => i)
    .filter((i) => recent[i] >= 15 && recent[i] <= 90)
  if (keptIndexes.length >= 3) {
    const mid = median(keptIndexes.map((i) => recent[i]))
    keptIndexes = keptIndexes.filter((i) => Math.abs(recent[i] - mid) <= 10)
  }
  const kept = keptIndexes.map((i) => recent[i])

  const cycleLength = kept.length > 0 ? clamp(weightedAverage(kept), 15, 90) : 28

  // 经期长度：已填结束日的最近 6 条，天数 = end − start + 1
  const lengths = sorted
    .filter((p) => p.end_date)
    .slice(-6)
    .map((p) => differenceInCalendarDays(parseDate(p.end_date!), parseDate(p.start_date)) + 1)
  const periodLength = lengths.length > 0 ? clamp(weightedAverage(lengths), 2, 10) : 5

  // 不规律判定用剔除前的 recent：至少 3 个且极差超过 7 天
  const irregular =
    recent.length >= 3 && Math.max(...recent) - Math.min(...recent) > 7

  const confidence: Prediction['confidence'] =
    kept.length >= 3 ? (irregular ? 'medium' : 'high') : kept.length >= 1 ? 'low' : 'default'
  // 非高可信度时排卵期两端各多放 3 天
  const widen = confidence === 'high' ? 0 : 3

  const nextStart = addDays(starts[starts.length - 1], cycleLength)
  const ovulation = addDays(nextStart, -14)

  const keptSet = new Set(keptIndexes.map((i) => i + offset))
  const cycles: Cycle[] = sorted
    .map((period, i) => ({
      period,
      length: i === 0 ? null : allCycles[i - 1],
      counted: i > 0 && keptSet.has(i - 1),
    }))
    .reverse()

  return {
    cycleLength,
    periodLength,
    nextStart,
    ovulation,
    fertileStart: addDays(ovulation, -5 - widen),
    fertileEnd: addDays(ovulation, 1 + widen),
    irregular,
    confidence,
    cycles,
  }
}

/** 一条记录在日历上覆盖的最后一天：填了结束日就用它，没填按预测经期长度算。 */
export function periodEnd(period: Period, periodLength: number): Date {
  return period.end_date
    ? parseDate(period.end_date)
    : addDays(parseDate(period.start_date), periodLength - 1)
}

export type Status = {
  /** Hero Card 数字上方的小字 */
  caption: string
  value: number
  unit: string
  /** Hero Card 的 heading 文案 */
  title: string
  /** 首页卡片的一行说明 */
  summary: string
}

/**
 * design.md 的四种文案，按优先级取第一条命中的。
 * 大数字统一是"距离下次经期开始的天数"，前两种状态例外（经期第几天 / 推迟几天）。
 */
export function statusText(
  periods: Period[],
  prediction: Prediction | null,
  today: Date = new Date(),
): Status | null {
  if (!prediction) return null
  const day = startOfDay(today)

  // 1. 今天在已记录经期内
  for (const period of periods) {
    const start = parseDate(period.start_date)
    if (day < start) continue
    if (day > periodEnd(period, prediction.periodLength)) continue
    const n = differenceInCalendarDays(day, start) + 1
    return { caption: '经期', value: n, unit: '天', title: `经期第 ${n} 天`, summary: '经期中' }
  }

  // 2. 今天已过预测开始日且没记新经期（记了新的开始日，nextStart 就往后推了）
  const toNext = differenceInCalendarDays(prediction.nextStart, day)
  if (toNext < 0) {
    const n = -toNext
    return { caption: '推迟', value: n, unit: '天', title: `已推迟 ${n} 天`, summary: '已推迟' }
  }

  // 3. 今天在排卵期内
  if (day >= prediction.fertileStart && day <= prediction.fertileEnd) {
    return {
      caption: '预测',
      value: toNext,
      unit: '天后',
      title: `排卵期中，预计排卵日 ${formatMonthDay(prediction.ovulation)}`,
      summary: '排卵期中',
    }
  }

  // 4. 其他
  return {
    caption: '预测',
    value: toNext,
    unit: '天后',
    title: '经期开始',
    summary: '预计经期开始',
  }
}
