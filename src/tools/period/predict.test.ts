import { describe, expect, it } from 'vitest'
import type { Period } from '@/lib/database.types'
import { addDays, parseDate, predict, statusText, toDateString } from './predict'

/** 从一个起始日和一串周期长度构造记录；`end` 是每条的经期天数。 */
function build(first: string, cycles: number[], end = 5): Period[] {
  const starts = [parseDate(first)]
  for (const length of cycles) starts.push(addDays(starts[starts.length - 1], length))
  return starts.map((start, i) => ({
    id: `p${i}`,
    user_id: 'test',
    created_at: '2026-01-01T00:00:00Z',
    start_date: toDateString(start),
    end_date: toDateString(addDays(start, end - 1)),
  }))
}

const at = (value: string) => parseDate(value)

describe('预测（验收 15）', () => {
  it('28、28、60、28：60 被剔除，预测 28 天，但判为不规律、排卵期放宽', () => {
    const p = predict(build('2026-01-01', [28, 28, 60, 28]))!
    expect(p.cycleLength).toBe(28)
    expect(p.irregular).toBe(true)
    expect(p.confidence).toBe('medium')
    // 最后一条开始日 2026-05-25，下次 6-22，排卵日 6-8；非高可信度两端各多放 3 天
    expect(toDateString(p.nextStart)).toBe('2026-06-22')
    expect(toDateString(p.ovulation)).toBe('2026-06-08')
    expect(toDateString(p.fertileStart)).toBe('2026-05-31')
    expect(toDateString(p.fertileEnd)).toBe('2026-06-12')
    // 被剔除的那个周期在历史里标为不参与预测（cycles 是倒序）
    expect(p.cycles.map((c) => [c.length, c.counted])).toEqual([
      [28, true],
      [60, false],
      [28, true],
      [28, true],
      [null, false],
    ])
  })

  it('40、40、40：不做 21–35 硬剔除，预测 40 天且判为规律', () => {
    const p = predict(build('2026-01-01', [40, 40, 40]))!
    expect(p.cycleLength).toBe(40)
    expect(p.irregular).toBe(false)
    expect(p.confidence).toBe('high')
    // 最后一条开始日 2026-05-01，下次 6-10，排卵日 5-27；高可信度不放宽：前 5 天到后 1 天
    expect(toDateString(p.nextStart)).toBe('2026-06-10')
    expect(toDateString(p.ovulation)).toBe('2026-05-27')
    expect(toDateString(p.fertileStart)).toBe('2026-05-22')
    expect(toDateString(p.fertileEnd)).toBe('2026-05-28')
  })

  it('最近 6 个之外的更早异常周期不影响结果', () => {
    const normal = [30, 30, 30, 30, 30, 30]
    const withEarly = predict(build('2025-01-01', [200, ...normal]))!
    const withoutEarly = predict(build('2025-07-20', normal))!
    expect(withEarly.cycleLength).toBe(withoutEarly.cycleLength)
    expect(withEarly.irregular).toBe(withoutEarly.irregular)
    expect(withEarly.confidence).toBe('high')
  })

  it('没有记录返回 null；只有一条时用默认周期 28 天', () => {
    expect(predict([])).toBeNull()
    const p = predict(build('2026-09-03', []))!
    expect(p.cycleLength).toBe(28)
    expect(p.periodLength).toBe(5)
    expect(p.confidence).toBe('default')
  })

  it('经期长度按已填结束日的记录加权，无数据用 5 天', () => {
    expect(predict(build('2026-01-01', [28, 28], 6))!.periodLength).toBe(6)
    const open = build('2026-01-01', [28, 28]).map((p) => ({ ...p, end_date: null }))
    expect(predict(open)!.periodLength).toBe(5)
  })
})

describe('文案状态机（验收 16）', () => {
  const status = (periods: Period[], today: string) =>
    statusText(periods, predict(periods), at(today))!

  it('今天在已记录经期内 → 经期第 N 天', () => {
    const periods = build('2026-01-01', [28, 28, 28])
    // 最后一条 2026-03-26 – 2026-03-30
    const s = status(periods, '2026-03-28')
    expect(s.title).toBe('经期第 3 天')
    expect(s.value).toBe(3)
    expect(s.summary).toBe('经期中')
  })

  it('过了预测开始日还没记新经期 → 已推迟 N 天', () => {
    const periods = build('2026-01-01', [28, 28, 28])
    // 最后一条 2026-03-26，下次预测 2026-04-23
    expect(status(periods, '2026-04-28').title).toBe('已推迟 5 天')
  })

  it('今天在排卵期内 → 排卵期中，带排卵日日期', () => {
    const periods = build('2026-01-01', [28, 28, 28])
    // 下次 2026-04-23，排卵日 2026-04-09，高可信度时排卵期 4-4 到 4-10
    const s = status(periods, '2026-04-09')
    expect(s.title).toBe('排卵期中，预计排卵日 4 月 9 日')
    expect(s.value).toBe(14)
    expect(s.unit).toBe('天后')
  })

  it('其他 → 预计 N 天后经期开始', () => {
    const periods = build('2026-01-01', [28, 28, 28])
    const s = status(periods, '2026-04-14')
    expect(s.title).toBe('经期开始')
    expect(s.value).toBe(9)
    expect(s.summary).toBe('预计经期开始')
  })
})
