import { describe, expect, it } from 'vitest'
import type { Period } from '@/lib/database.types'
import {
  addDays,
  backtest,
  backtestText,
  parseDate,
  predict,
  statusText,
  upcoming,
  toDateString,
} from './predict'

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

const status = (periods: Period[], today: string) =>
  statusText(periods, predict(periods, at(today)), at(today))!

describe('周期长度（验收 1）', () => {
  it('28、28、28、50、50、50 → 不规律，取中位数 39', () => {
    const p = predict(build('2026-01-01', [28, 28, 28, 50, 50, 50]), at('2026-12-31'))!
    expect(p.cycleLength).toBe(39)
    expect(p.irregular).toBe(true)
    expect(p.cycleMethod).toBe('median')
  })

  it('28、28、50、50、50、50 → 中位数 50', () => {
    const p = predict(build('2026-01-01', [28, 28, 50, 50, 50, 50]), at('2026-12-31'))!
    expect(p.cycleLength).toBe(50)
    expect(p.cycleMethod).toBe('median')
  })

  it('规律（极差 ≤ 7）时用线性加权平均', () => {
    const p = predict(build('2026-01-01', [28, 30, 27, 29, 28]), at('2026-12-31'))!
    // (28×1+30×2+27×3+29×4+28×5)/15 = 28.33 → 28
    expect(p.cycleLength).toBe(28)
    expect(p.irregular).toBe(false)
    expect(p.cycleMethod).toBe('weighted')
  })

  it('15–90 之外的周期保留记录但不参与估算', () => {
    // v1 会在剩余 ≥3 个时再丢掉"与中位数相差 >10"的，v2 取消了这一步：
    // 60 天在 15–90 内，照样参与估算，只是把整体判成不规律、改用中位数。
    const p = predict(build('2026-01-01', [28, 28, 60, 28]), at('2026-12-31'))!
    expect(p.cycleLength).toBe(28) // 中位数 [28,28,28,60] → 28
    expect(p.cycleMethod).toBe('median')
    expect(p.cycles.map((c) => [c.length, c.counted])).toEqual([
      [28, true],
      [60, true],
      [28, true],
      [28, true],
      [null, false],
    ])
    // 排卵期固定为排卵日前 5 天到后 1 天，不再因为样本少而放宽（v1 会放宽 3 天）
    expect(toDateString(p.nextStart)).toBe('2026-06-22')
    expect(toDateString(p.ovulation)).toBe('2026-06-08')
    expect(toDateString(p.fertileStart)).toBe('2026-06-03')
    expect(toDateString(p.fertileEnd)).toBe('2026-06-09')

    const tooLong = predict(build('2026-01-01', [28, 28, 120]), at('2026-12-31'))!
    expect(tooLong.cycles[0].counted).toBe(false)
    expect(tooLong.cycleLength).toBe(28)
  })

  it('最近 6 个之外的更早异常周期不影响结果', () => {
    const normal = [30, 30, 30, 30, 30, 30]
    const withEarly = predict(build('2025-01-01', [200, ...normal]), at('2026-12-31'))!
    const withoutEarly = predict(build('2025-07-20', normal), at('2026-12-31'))!
    expect(withEarly.cycleLength).toBe(withoutEarly.cycleLength)
    expect(withEarly.irregular).toBe(withoutEarly.irregular)
  })

  it('没有记录返回 null；只有一条时用默认周期 28 天', () => {
    expect(predict([])).toBeNull()
    const p = predict(build('2026-09-03', []), at('2026-09-13'))!
    expect(p.cycleLength).toBe(28)
    expect(p.periodLength).toBe(5)
    expect(p.cycleMethod).toBe('default')
    expect(p.backtest).toBeNull()
  })

  it('经期长度按已填结束日的记录加权，无数据用 5 天', () => {
    expect(predict(build('2026-01-01', [28, 28], 6), at('2026-12-31'))!.periodLength).toBe(6)
    const open = build('2026-01-01', [28, 28]).map((p) => ({ ...p, end_date: null }))
    expect(predict(open, at('2026-12-31'))!.periodLength).toBe(5)
  })
})

describe('未来日期（验收 2）', () => {
  const periods = build('2026-01-01', [28, 28])

  it('开始日晚于今天的记录整条忽略，但仍留在历史里', () => {
    const future: Period = { ...periods[0], id: 'future', start_date: '2027-01-01', end_date: null }
    const p = predict([...periods, future], at('2026-03-01'))!
    // 最后一条有效记录 2026-02-26，下次 2026-03-26；未来那条没有把 nextStart 推走
    expect(toDateString(p.nextStart)).toBe('2026-03-26')
    expect(p.cycles[0].period.id).toBe('future')
    expect(p.cycles[0].counted).toBe(false)
    expect(p.cycles[0].length).toBeNull()
  })

  it('只有结束日晚于今天时，忽略结束日、保留开始日', () => {
    const list = periods.map((p, i) =>
      i === periods.length - 1 ? { ...p, end_date: '2027-01-01' } : p,
    )
    const p = predict(list, at('2026-03-01'))!
    expect(toDateString(p.nextStart)).toBe('2026-03-26')
    // 那条的结束日不参与经期长度计算，只剩前两条的 5 天
    expect(p.periodLength).toBe(5)
  })
})

describe('回测（验收 3、4）', () => {
  it('绝对误差 0、0、0、0、8 → 平均 1.6、范围 ±8', () => {
    const periods = build('2026-01-01', [28, 28, 28, 28, 28, 28])
    const errors = [0, 0, 0, 0, 8]
    let i = 0
    const bt = backtest(periods, (_list, today) => ({ nextStart: addDays(today, errors[i++]) }))!
    expect(bt.count).toBe(5)
    expect(bt.mae).toBeCloseTo(1.6)
    expect(bt.p90).toBe(8) // ceil(0.9 × 5) = 5 → 排序后第 5 个 = 8
  })

  it('每步只用它之前的记录：6 条记录逐次核对', () => {
    // 开始日 4-14、5-12、6-11、7-08、8-06、9-03，周期 28、30、27、29、28
    const periods = build('2026-04-14', [28, 30, 27, 29, 28])
    const bt = backtest(periods)!
    // k=2: [28] 中位数 28 → 5-12+28 = 6-09，实际 6-11，差 −2
    // k=3: [28,30] 中位数 29 → 6-11+29 = 7-10，实际 7-08，差 +2
    // k=4: [28,30,27] 规律加权 28 → 7-08+28 = 8-05，实际 8-06，差 −1
    // k=5: [28,30,27,29] 规律加权 29 → 8-06+29 = 9-04，实际 9-03，差 +1
    expect(bt.errors).toEqual([-2, 2, -1, 1])
    expect(bt.count).toBe(4)
    expect(bt.mae).toBeCloseTo(1.5)
    expect(bt.p90).toBe(2)
    expect(predict(periods, at('2026-09-13'))!.backtest).toEqual(bt)
  })

  it('误差大的结果不剔除', () => {
    const bt = backtest(build('2026-01-01', [28, 28, 80, 28]))!
    expect(bt.count).toBe(3)
    expect(Math.max(...bt.errors.map(Math.abs))).toBeGreaterThan(10)
  })
})

describe('Hero 误差文案（验收 5）', () => {
  const text = (cycles: number[], today: string) =>
    backtestText(predict(build('2026-01-01', cycles), at(today))!)

  it('回测 < 3 次：暂无误差参考', () => {
    // 4 条记录只有 2 次回测
    expect(text([28, 28, 28], '2026-12-31')).toBe('记录还少，暂无误差参考')
  })

  it('3–5 次：带"样本较少"和参考范围', () => {
    // 6 条记录 → 4 次回测，全部预测准，范围 ±0
    const s = text([28, 28, 28, 28, 28], '2026-12-31')
    expect(s).toContain('按当前算法回测，过去 4 次平均相差')
    expect(s).toContain('（样本较少）')
    expect(s).toContain('历史误差参考范围')
  })

  it('≥ 6 次：去掉"样本较少"', () => {
    const s = text([28, 28, 28, 28, 28, 28, 28], '2026-12-31')
    expect(s).toContain('过去 6 次')
    expect(s).not.toContain('样本较少')
  })

  it('文案里不出现"概率""越用越准"', () => {
    const s = text([28, 30, 27, 29, 28, 31, 28], '2026-12-31')
    expect(s).not.toMatch(/概率|越用越准/)
  })
})

describe('文案状态机（验收 7：沿用 v1 规则）', () => {
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

  // 改写原因：Hero 改成"最近的未来事件优先"后不再有"排卵期中"这一档，
  // 排卵日当天最近的事件就是排卵日本身（0 天 = 今天），排卵期开始已经过去。
  it('排卵日当天 → 主事件是排卵日，0 天', () => {
    const periods = build('2026-01-01', [28, 28, 28])
    // 下次 2026-04-23，排卵日 2026-04-09，排卵期 4-4 到 4-10
    const s = status(periods, '2026-04-09')
    expect(s.title).toBe('排卵日')
    expect(s.value).toBe(0)
    expect(s.unit).toBe('天后')
    expect(s.rest.map((e) => e.title)).toEqual(['经期开始'])
  })

  it('其他 → 预计 N 天后经期开始', () => {
    const periods = build('2026-01-01', [28, 28, 28])
    const s = status(periods, '2026-04-14')
    expect(s.title).toBe('经期开始')
    expect(s.value).toBe(9)
    expect(s.summary).toBe('预计经期开始')
  })
})

describe('三个预测事件', () => {
  const periods = build('2026-01-01', [28, 28, 28])
  // 最后一条开始日 2026-03-26，下次 4-23，排卵日 4-09，排卵期开始 4-04

  it('按日期升序排，过去的不出现', () => {
    const list = upcoming(predict(periods, at('2026-04-01'))!, at('2026-04-01'))
    expect(list.map((e) => [e.title, e.days])).toEqual([
      ['排卵期开始', 3],
      ['排卵日', 8],
      ['经期开始', 22],
    ])
    expect(list.map((e) => e.kind)).toEqual(['ovulation', 'ovulation', 'period'])

    // 排卵期开始、排卵日都过去以后只剩经期开始
    const late = predict(periods, at('2026-04-14'))!
    expect(upcoming(late, at('2026-04-14')).map((e) => e.title)).toEqual(['经期开始'])
  })

  it('例外一：经期中仍列出全部未来事件', () => {
    // 最后一条 2026-03-26 – 2026-03-30
    const s = status(periods, '2026-03-28')
    expect(s.title).toBe('经期第 3 天')
    expect(s.rest.map((e) => [e.title, e.days])).toEqual([
      ['排卵期开始', 7],
      ['排卵日', 12],
      ['经期开始', 26],
    ])
  })

  it('例外二：已推迟时主数字仍是推迟天数', () => {
    const s = status(periods, '2026-04-28')
    expect(s.title).toBe('已推迟 5 天')
    // 三个事件都由 nextStart 推出来，nextStart 已经过去，所以这时必然一个都不剩
    expect(s.rest).toEqual([])
  })
})

describe('未填结束日', () => {
  /** 前三条正常（经期长度 5 天），最后一条只有开始日。 */
  const open = (start: string): Period[] => [
    ...build('2026-01-01', [28, 28]),
    { id: 'open', user_id: 'test', created_at: '2026-01-01T00:00:00Z', start_date: start, end_date: null },
  ]

  it('超过「预测经期长度 + 3 天」才算忘填', () => {
    const periods = open('2026-03-26')
    expect(predict(periods, at('2026-03-26'))!.periodLength).toBe(5)
    // 3-26 起第 9 天是 4-03，差 8 天，还没超过 5 + 3
    expect(predict(periods, at('2026-04-03'))!.cycles[0].forgot).toBe(false)
    // 4-04 差 9 天，超了
    expect(predict(periods, at('2026-04-04'))!.cycles[0].forgot).toBe(true)
    // 填了结束日就永远不算忘填
    const closed = periods.map((p) => ({ ...p, end_date: p.end_date ?? '2026-03-30' }))
    expect(predict(closed, at('2026-12-31'))!.cycles[0].forgot).toBe(false)
  })

  it('忘填的开始日照样参与周期计算，但不参与经期长度平均', () => {
    const periods = open('2026-03-26')
    const p = predict(periods, at('2026-06-01'))!
    // 周期 [28, 28] → 最后一条 3-26 + 28 = 4-23
    expect(toDateString(p.nextStart)).toBe('2026-04-23')
    expect(p.cycles[0].length).toBe(28)
    expect(p.periodLength).toBe(5) // 只统计前两条已填结束日的记录
  })

  it('超期以后 Hero 不再显示"经期第 N 天"', () => {
    const periods = open('2026-03-26')
    // 区间只画到 3-26 + 5 − 1 = 3-30
    expect(statusText(periods, predict(periods, at('2026-03-30')), at('2026-03-30'))!.title)
      .toBe('经期第 5 天')
    const after = statusText(periods, predict(periods, at('2026-04-04')), at('2026-04-04'))!
    expect(after.title).not.toContain('经期第')
    expect(after.title).toBe('排卵期开始')
  })
})
