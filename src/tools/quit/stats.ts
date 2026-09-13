import { startOfWeek, subWeeks } from 'date-fns'

/** 统计只需要破戒时刻，其余字段随调用方。 */
export type RelapseLike = { relapsed_at: string }

export type QuitStats = {
  /** 当前连续时长（毫秒）= now − max(start_at, 最近一条记录) */
  currentMs: number
  /** 当前连续天数，向下取整 */
  currentDays: number
  /** 历史各轮天数（相邻记录之间），向下取整 */
  roundDays: number[]
  /** 最长记录 = max(各轮天数, 当前连续天数) */
  longestDays: number
  /** 累计天数 = 各轮天数之和 + 当前连续天数 */
  totalDays: number
  /** 总破戒次数 = 记录条数 */
  relapseCount: number
  /** 当前这一轮的起点（毫秒时间戳） */
  streakStart: number
}

const DAY = 86_400_000

/**
 * 按 design.md「计算规则」现场算，不依赖任何天数快照。
 * 一"轮" = 相邻两条记录之间；第一轮从 start_at 起。
 */
export function computeStats(
  startAt: string | number | Date,
  relapses: RelapseLike[],
  now: number = Date.now(),
): QuitStats {
  const start = new Date(startAt).getTime()
  const times = relapses
    .map((r) => new Date(r.relapsed_at).getTime())
    .sort((a, b) => a - b)

  const roundDays: number[] = []
  let prev = start
  for (const t of times) {
    roundDays.push(Math.floor(Math.max(0, t - prev) / DAY))
    prev = t
  }

  const streakStart = Math.max(start, times.at(-1) ?? start)
  const currentMs = Math.max(0, now - streakStart)
  const currentDays = Math.floor(currentMs / DAY)

  return {
    currentMs,
    currentDays,
    roundDays,
    longestDays: Math.max(currentDays, ...roundDays),
    totalDays: roundDays.reduce((a, b) => a + b, 0) + currentDays,
    relapseCount: times.length,
    streakStart,
  }
}

/** 把毫秒切成 HH:MM:SS（小时不进位到天，天数单独显示）。 */
export function formatClock(ms: number): string {
  const s = Math.floor(ms / 1000) % 60
  const m = Math.floor(ms / 60_000) % 60
  const h = Math.floor((ms % DAY) / 3_600_000)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export type WeekBucket = { weekStart: Date; count: number }

/** 最近 N 周（周一为起始，含本周）每周破戒次数，给统计柱状图和首页迷你图共用。 */
export function weeklyCounts(
  relapses: RelapseLike[],
  weeks: number,
  now: number = Date.now(),
): WeekBucket[] {
  const thisWeek = startOfWeek(now, { weekStartsOn: 1 })
  const buckets: WeekBucket[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ weekStart: subWeeks(thisWeek, i), count: 0 })
  }
  const first = buckets[0].weekStart.getTime()
  for (const r of relapses) {
    const t = new Date(r.relapsed_at).getTime()
    if (t < first) continue
    const index = buckets.findLastIndex((b) => b.weekStart.getTime() <= t)
    if (index >= 0) buckets[index].count++
  }
  return buckets
}
