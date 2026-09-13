import { describe, expect, it } from 'vitest'
import type { CountdownEvent } from '@/lib/database.types'
import { lunarCellLabel } from '@/components/DatePicker'
import { lunarText, nextOccurrence, parseDate, sortEvents, toDateString } from './rules'

type Input = {
  date: string
  is_lunar?: boolean
  repeat?: CountdownEvent['repeat']
}

/** 只填规则用得到的字段。 */
function ev({ date, is_lunar = false, repeat = 'none' }: Input) {
  return { date, is_lunar, repeat }
}

/** 用 'YYYY-MM-DD' 当"今天"。 */
function at(event: Input, today: string) {
  const { date, days } = nextOccurrence(ev(event), new Date(`${today}T12:00:00`))
  return { date: toDateString(date), days }
}

describe('不重复（验收 10）', () => {
  it('未来日期是正数，过去日期是负数，今天是 0', () => {
    expect(at({ date: '2026-10-01' }, '2026-09-13').days).toBe(18)
    expect(at({ date: '2026-08-20' }, '2026-09-13').days).toBe(-24)
    expect(at({ date: '2026-09-13' }, '2026-09-13').days).toBe(0)
  })

  it('不重复事件的下一次发生日就是目标日本身', () => {
    expect(at({ date: '2026-08-20' }, '2026-09-13').date).toBe('2026-08-20')
  })
})

describe('公历重复（验收 11、12a）', () => {
  it('每年：过了当年日期就跳到明年', () => {
    expect(at({ date: '2020-09-12', repeat: 'yearly' }, '2026-09-13')).toEqual({
      date: '2027-09-12',
      days: 364,
    })
  })

  it('每年：当天算还有 0 天', () => {
    expect(at({ date: '2000-09-13', repeat: 'yearly' }, '2026-09-13').days).toBe(0)
  })

  it('每年：2 月 29 日在非闰年取 2 月 28 日', () => {
    expect(at({ date: '2024-02-29', repeat: 'yearly' }, '2026-01-01').date).toBe('2026-02-28')
    expect(at({ date: '2024-02-29', repeat: 'yearly' }, '2028-01-01').date).toBe('2028-02-29')
  })

  it('每月：目标日大于当月天数时取当月最后一天', () => {
    expect(at({ date: '2026-01-31', repeat: 'monthly' }, '2026-04-05').date).toBe('2026-04-30')
    expect(at({ date: '2026-01-31', repeat: 'monthly' }, '2026-02-05').date).toBe('2026-02-28')
    expect(at({ date: '2026-01-31', repeat: 'monthly' }, '2026-05-05').date).toBe('2026-05-31')
  })

  it('每月：10 日在 9 月 13 日算到 10 月 10 日（ui-spec 示例）', () => {
    expect(at({ date: '2026-10-10', repeat: 'monthly' }, '2026-09-13')).toEqual({
      date: '2026-10-10',
      days: 27,
    })
  })

  it('每周：按星期几', () => {
    // 2026-09-13 是周日，目标是周三
    expect(at({ date: '2026-09-09', repeat: 'weekly' }, '2026-09-13')).toEqual({
      date: '2026-09-16',
      days: 3,
    })
    expect(at({ date: '2026-09-06', repeat: 'weekly' }, '2026-09-13').days).toBe(0)
  })
})

describe('农历每年（验收 12、12a）', () => {
  it('八月十五：2026 年是 9 月 25 日，2025 年是 10 月 6 日', () => {
    const mid = { date: '2026-09-25', is_lunar: true, repeat: 'yearly' as const }
    expect(at(mid, '2026-09-13')).toEqual({ date: '2026-09-25', days: 12 })
    expect(at(mid, '2025-01-01').date).toBe('2025-10-06')
    expect(at(mid, '2026-09-26').date).toBe('2027-09-15')
  })

  it('农历文字按源日期显示', () => {
    expect(lunarText('2026-09-25')).toBe('八月十五')
    expect(lunarText('2025-07-27')).toBe('闰六月初三')
  })

  it('闰月：2025 年有闰六月，2026 年没有则落到正常六月', () => {
    const leap = { date: '2025-07-27', is_lunar: true, repeat: 'yearly' as const }
    expect(at(leap, '2025-07-01').date).toBe('2025-07-27')
    expect(at(leap, '2026-01-01').date).toBe('2026-07-16')
  })

  it('农历三十遇小月取二十九', () => {
    // 2025-11-19 是农历九月三十；2027 年九月只有二十九天
    const last = { date: '2025-11-19', is_lunar: true, repeat: 'yearly' as const }
    expect(at(last, '2026-01-01').date).toBe('2026-11-08') // 2026 年九月三十
    expect(at(last, '2027-01-01').date).toBe('2027-10-28') // 2027 年九月廿九
  })
})

describe('排序（验收 13）', () => {
  const base = { id: '', user_id: '', created_at: '', category: '生活', note: null }
  const make = (title: string, date: string, pinned = false): CountdownEvent => ({
    ...base,
    id: title,
    title,
    date,
    is_lunar: false,
    repeat: 'none',
    pinned,
  })

  it('置顶排最前，其余按天后升序、天前最后', () => {
    const today = new Date('2026-09-13T12:00:00')
    const order = sortEvents(
      [
        make('过去远', '2026-01-01'),
        make('未来远', '2026-12-01'),
        make('过去近', '2026-09-10'),
        make('未来近', '2026-09-15'),
        make('置顶', '2026-11-01', true),
      ],
      today,
    ).map((e) => e.event.title)
    expect(order).toEqual(['置顶', '未来近', '未来远', '过去近', '过去远'])
  })

  it('两条置顶都排在最前，组内按剩余天数升序', () => {
    const today = new Date('2026-09-13T12:00:00')
    const order = sortEvents(
      [
        make('未来近', '2026-09-15'),
        make('置顶远', '2026-11-01', true),
        make('置顶近', '2026-09-20', true),
      ],
      today,
    ).map((e) => e.event.title)
    expect(order).toEqual(['置顶近', '置顶远', '未来近'])
  })

  it('没有置顶时第一条就是最近的未来事件', () => {
    const today = new Date('2026-09-13T12:00:00')
    const order = sortEvents([make('过去', '2026-09-10'), make('未来', '2026-09-15')], today)
    expect(order[0].event.title).toBe('未来')
  })
})

// DatePicker 是通用组件，但只有倒数日用到农历标签，用例先放这里。
describe('日历格子的农历标签', () => {
  it('节日优先于月名和日名', () => {
    expect(lunarCellLabel(parseDate('2026-09-25'))).toBe('中秋')
    expect(lunarCellLabel(parseDate('2026-02-17'))).toBe('春节')
  })

  it('每月初一显示月名，闰月带"闰"', () => {
    expect(lunarCellLabel(parseDate('2026-08-13'))).toBe('七月')
    expect(lunarCellLabel(parseDate('2025-07-25'))).toBe('闰六月')
  })

  it('普通日显示日名', () => {
    expect(lunarCellLabel(parseDate('2026-06-25'))).toBe('十一')
  })
})
