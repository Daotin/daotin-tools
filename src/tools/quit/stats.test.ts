import { describe, expect, it } from 'vitest'
import { computeStats, formatClock, weeklyCounts } from './stats'

const at = (iso: string) => ({ relapsed_at: iso })

describe('computeStats', () => {
  // design.md 验收 7
  it('补录一条更早的记录，当前计时仍从最近一条起算', () => {
    const start = '2026-01-01T00:00:00+08:00'
    const now = new Date('2026-09-13T12:00:00+08:00').getTime()
    const today10 = at('2026-09-13T10:00:00+08:00')
    const before = computeStats(start, [today10], now)
    expect(before.currentMs).toBe(2 * 3600_000)
    expect(before.relapseCount).toBe(1)

    // 再补一条昨天 20:00 的
    const after = computeStats(start, [today10, at('2026-09-12T20:00:00+08:00')], now)
    expect(after.currentMs).toBe(2 * 3600_000) // 计时不受影响
    expect(after.relapseCount).toBe(2)
    // 原来的一轮（1/1 → 9/13 10:00，255 天）被拆成 254 天 + 0 天
    expect(before.roundDays).toEqual([255])
    expect(after.roundDays).toEqual([254, 0])
    expect(after.longestDays).toBe(254)
  })

  // design.md 验收 9a
  describe('导入后补录、删除（1 月 1 日开始，今天 26 日）', () => {
    const start = '2026-01-01T00:00:00+08:00'
    const now = new Date('2026-01-26T00:00:00+08:00').getTime()
    const jan11 = at('2026-01-11T00:00:00+08:00')
    const jan16 = at('2026-01-16T00:00:00+08:00')
    const jan21 = at('2026-01-21T00:00:00+08:00')

    it('11 日、21 日各一条：累计 25 天、最长 10 天', () => {
      const s = computeStats(start, [jan11, jan21], now)
      expect(s.totalDays).toBe(25)
      expect(s.longestDays).toBe(10)
      expect(s.relapseCount).toBe(2)
      expect(s.currentDays).toBe(5)
    })

    it('补录 16 日：累计仍 25 天、破戒 3 次、最长 10 天', () => {
      const s = computeStats(start, [jan11, jan16, jan21], now)
      expect(s.totalDays).toBe(25)
      expect(s.relapseCount).toBe(3)
      expect(s.longestDays).toBe(10)
    })

    it('再删 11 日那条：累计仍 25 天、最长 15 天', () => {
      const s = computeStats(start, [jan16, jan21], now)
      expect(s.totalDays).toBe(25)
      expect(s.longestDays).toBe(15)
      expect(s.relapseCount).toBe(2)
    })
  })

  it('没有任何记录时，当前就是唯一一轮', () => {
    const start = '2026-01-01T00:00:00+08:00'
    const now = new Date('2026-01-11T12:00:00+08:00').getTime()
    const s = computeStats(start, [], now)
    expect(s.roundDays).toEqual([])
    expect(s.currentDays).toBe(10)
    expect(s.totalDays).toBe(10)
    expect(s.longestDays).toBe(10)
  })
})

describe('formatClock', () => {
  it('只显示一天内的时分秒', () => {
    expect(formatClock(0)).toBe('00:00:00')
    expect(formatClock(((24 + 6) * 3600 + 41 * 60 + 22) * 1000)).toBe('06:41:22')
  })
})

describe('weeklyCounts', () => {
  it('按周一切周，落在窗口外的记录不计', () => {
    // 2026-09-13 是周日，所在周从 09-07（周一）开始
    const now = new Date('2026-09-13T12:00:00+08:00').getTime()
    const buckets = weeklyCounts(
      [
        at('2026-09-13T01:00:00+08:00'), // 本周
        at('2026-09-07T00:00:00+08:00'), // 本周第一天
        at('2026-09-06T23:00:00+08:00'), // 上一周
        at('2026-08-01T00:00:00+08:00'), // 窗口外
      ],
      3,
      now,
    )
    expect(buckets.map((b) => b.count)).toEqual([0, 1, 2])
  })
})
