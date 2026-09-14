import { differenceInCalendarDays } from 'date-fns'
import { formatMonthDay, parseDate, toDateString } from '@/lib/date'
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

/** 偶数个取中间两数的平均，四舍五入。 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  return Math.round(value)
}

/** 线性加权平均：传入的数组按旧→新排列，最旧权重 1，最新权重 n，四舍五入。 */
function weightedAverage(values: number[]): number {
  const sum = values.reduce((acc, v, i) => acc + v * (i + 1), 0)
  const weight = (values.length * (values.length + 1)) / 2
  return Math.round(sum / weight)
}

/** 周期落在 15–90 天才参与估算，之外的保留记录但不算。 */
const inRange = (length: number) => length >= 15 && length <= 90

/** 历史列表里的一条：`length` 是与上一条开始日之差，首条为 null。 */
export type Cycle = {
  period: Period
  /** 天数，如 28；首条没有上一条，为 null */
  length: number | null
  /** 这个周期是否在 15–90 内、参与了估算（length 为 null 时恒为 false） */
  counted: boolean
  /** 没填结束日，且开始日距今超过「预测经期长度 + 3 天」：当成忘了填，不是还在经期 */
  forgot: boolean
}

export type Backtest = {
  /** 有效回测次数 */
  count: number
  /** 平均绝对误差，天（未取整，展示时保留一位小数） */
  mae: number
  /** 绝对误差的 90% 分位数，向上取整，天 */
  p90: number
  /** 每次的带符号误差（预测 − 实际），按时间先后 */
  errors: number[]
}

export type Prediction = {
  cycleLength: number
  periodLength: number
  nextStart: Date
  ovulation: Date
  fertileStart: Date
  fertileEnd: Date
  irregular: boolean
  /** 周期长度是怎么算出来的：加权平均 / 中位数 / 没有可用周期时的默认 28 天 */
  cycleMethod: 'weighted' | 'median' | 'default'
  /** 一次回测结果都没有时为 null；count < 3 时页面不展示误差和范围 */
  backtest: Backtest | null
  /** 按开始日倒序，和历史列表顺序一致 */
  cycles: Cycle[]
}

/** 按开始日升序、且开始日不晚于今天的记录；结束日晚于今天的记录只丢掉结束日。 */
function validPeriods(periods: Period[], todayStr: string): Period[] {
  return [...periods]
    .filter((p) => p.start_date <= todayStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
}

/** 预测主体，不含回测（回测会反过来调它，放一起会无限递归）。 */
function core(periods: Period[], today: Date): Omit<Prediction, 'backtest'> | null {
  const todayStr = toDateString(startOfDay(today))
  const valid = validPeriods(periods, todayStr)
  if (valid.length === 0) return null

  const starts = valid.map((p) => parseDate(p.start_date))
  // allCycles[i] 是 valid[i + 1] 与前一条开始日之差
  const allCycles = starts
    .slice(1)
    .map((date, i) => differenceInCalendarDays(date, starts[i]))

  // 先过滤 15–90，再取最近最多 6 个
  const recent = allCycles.filter(inRange).slice(-6)
  const spread = recent.length > 0 ? Math.max(...recent) - Math.min(...recent) : 0
  const regular = recent.length >= 3 && spread <= 7
  const irregular = recent.length >= 3 && spread > 7

  const cycleMethod = recent.length === 0 ? 'default' : regular ? 'weighted' : 'median'
  const cycleLength =
    cycleMethod === 'default' ? 28 : cycleMethod === 'weighted' ? weightedAverage(recent) : median(recent)

  // 经期长度：已填结束日（且结束日不晚于今天）的最近 6 条，天数 = end − start + 1
  const lengths = valid
    .filter((p) => p.end_date && p.end_date <= todayStr)
    .slice(-6)
    .map((p) => differenceInCalendarDays(parseDate(p.end_date!), parseDate(p.start_date)) + 1)
  const periodLength = lengths.length > 0 ? clamp(weightedAverage(lengths), 2, 10) : 5

  const nextStart = addDays(starts[starts.length - 1], cycleLength)
  // 排卵期固定：排卵日前 5 天到后 1 天，不随样本多少放宽
  const ovulation = addDays(nextStart, -14)

  const day = startOfDay(today)
  const counted: Cycle[] = valid.map((period, i) => ({
    period,
    length: i === 0 ? null : allCycles[i - 1],
    counted: i > 0 && inRange(allCycles[i - 1]),
    forgot:
      !period.end_date &&
      differenceInCalendarDays(day, parseDate(period.start_date)) > periodLength + 3,
  }))
  // 开始日在未来的记录不参与任何计算，但仍要出现在历史里，否则用户没法删掉它
  const futures: Cycle[] = [...periods]
    .filter((p) => p.start_date > todayStr)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((period) => ({ period, length: null, counted: false, forgot: false }))

  return {
    cycleLength,
    periodLength,
    nextStart,
    ovulation,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: addDays(ovulation, 1),
    irregular,
    cycleMethod,
    cycles: [...futures, ...counted.reverse()],
  }
}

/**
 * 回测：对每一条有前序周期的记录（从第 3 条起），只用它之前的记录、
 * 以它的开始日当"今天"，调用与正式预测同一个函数，误差 = 预测 − 实际（天）。
 * 不因为误差大或周期长而事后剔除任何一次结果。一次都算不出时返回 null。
 */
export function backtest(
  periods: Period[],
  predictFn: (list: Period[], today: Date) => { nextStart: Date } | null = core,
): Backtest | null {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const errors: number[] = []
  for (let k = 2; k < sorted.length; k++) {
    const actual = parseDate(sorted[k].start_date)
    const result = predictFn(sorted.slice(0, k), actual)
    if (result) errors.push(differenceInCalendarDays(result.nextStart, actual))
  }
  if (errors.length === 0) return null

  const abs = errors.map(Math.abs)
  const sortedAbs = [...abs].sort((a, b) => a - b)
  return {
    count: errors.length,
    mae: abs.reduce((a, b) => a + b, 0) / abs.length,
    // 90% 分位数：排序后位置 ceil(0.9 × N)（1 起），再向上取整
    p90: Math.ceil(sortedAbs[Math.ceil(0.9 * sortedAbs.length) - 1]),
    errors,
  }
}

/**
 * 没有任何记录时返回 null（页面显示首次引导）。
 * `today` 只影响"哪些记录有效"，回测时会被换成历史上的某一天。
 */
export function predict(periods: Period[], today: Date = new Date()): Prediction | null {
  const base = core(periods, today)
  if (!base) return null
  const todayStr = toDateString(startOfDay(today))
  return { ...base, backtest: backtest(validPeriods(periods, todayStr)) }
}

/** Hero 里数字下面那行：回测不足 3 次只说记录还少，够了才给平均误差和参考范围。 */
export function backtestText(prediction: Prediction): string {
  const bt = prediction.backtest
  if (!bt || bt.count < 3) return '记录还少，暂无误差参考'
  const few = bt.count < 6 ? '（样本较少）' : ''
  const from = formatMonthDay(addDays(prediction.nextStart, -bt.p90))
  const to = formatMonthDay(addDays(prediction.nextStart, bt.p90))
  return `按当前算法回测，过去 ${bt.count} 次平均相差 ${bt.mae.toFixed(1)} 天${few} · 历史误差参考范围 ${from} – ${to}`
}

/** 排卵相关文案旁的固定提示。 */
export const OVULATION_CAPTION = '按日历估算，不能作为避孕依据'

/** 一条记录在日历上覆盖的最后一天：填了结束日就用它，没填按预测经期长度算。 */
export function periodEnd(period: Period, periodLength: number): Date {
  return period.end_date
    ? parseDate(period.end_date)
    : addDays(parseDate(period.start_date), periodLength - 1)
}

/** Hero 里要列出的一个未来事件。`kind` 只决定小圆点颜色。 */
export type Upcoming = {
  kind: 'period' | 'ovulation'
  title: string
  date: Date
  /** 距今天数，0 表示就是今天 */
  days: number
}

/** 三个预测事件里还没过去的，按日期升序。排卵期开始就是排卵日前 5 天。 */
export function upcoming(prediction: Prediction, today: Date = new Date()): Upcoming[] {
  const day = startOfDay(today)
  const all: Omit<Upcoming, 'days'>[] = [
    { kind: 'period', title: '经期开始', date: prediction.nextStart },
    { kind: 'ovulation', title: '排卵期开始', date: prediction.fertileStart },
    { kind: 'ovulation', title: '排卵日', date: prediction.ovulation },
  ]
  return all
    .map((e) => ({ ...e, days: differenceInCalendarDays(e.date, day) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days)
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
  /** 大数字之外还要列出的未来事件（大数字取自事件时，这里是其余的） */
  rest: Upcoming[]
}

/**
 * 大数字取最近的一个未来事件（经期开始 / 排卵期开始 / 排卵日），
 * 只有"今天在经期内""已推迟"两种情况例外；两种例外下 `rest` 仍是全部未来事件。
 */
export function statusText(
  periods: Period[],
  prediction: Prediction | null,
  today: Date = new Date(),
): Status | null {
  if (!prediction) return null
  const day = startOfDay(today)
  const events = upcoming(prediction, day)

  // 1. 今天在已记录经期内（未填结束日的记录只按预测经期长度算到头，不会一直命中）
  for (const period of periods) {
    const start = parseDate(period.start_date)
    if (day < start) continue
    if (day > periodEnd(period, prediction.periodLength)) continue
    const n = differenceInCalendarDays(day, start) + 1
    return {
      caption: '经期',
      value: n,
      unit: '天',
      title: `经期第 ${n} 天`,
      summary: '经期中',
      rest: events,
    }
  }

  // 2. 今天已过预测开始日且没记新经期（记了新的开始日，nextStart 就往后推了）
  const late = differenceInCalendarDays(day, prediction.nextStart)
  if (late > 0) {
    return {
      caption: '推迟',
      value: late,
      unit: '天',
      title: `已推迟 ${late} 天`,
      summary: '已推迟',
      rest: events,
    }
  }

  // 3. 最近的那个未来事件
  const next = events[0]
  return {
    caption: '预测',
    value: next.days,
    unit: '天后',
    title: next.title,
    summary: `预计${next.title}`,
    rest: events.slice(1),
  }
}
