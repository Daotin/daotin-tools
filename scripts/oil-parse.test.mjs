import { describe, expect, it } from 'vitest'
import { appendHistory, parseOilPage, validate } from './oil-parse.mjs'

/** 2026-09-13 实抓 qiyoujiage.com 湖北页的结构（标签和数值分在不同元素里）。 */
const sample = `
<div class="listtitle"><h1>湖北油价</h1><span>2026-09-12</span></div>
<dl><dt>湖北92号汽油</dt><dd>8.31(元)</dd></dl>
<dl><dt>湖北95号汽油</dt><dd>8.89(元)</dd></dl>
<dl><dt>湖北0号柴油</dt><dd>7.96(元)</dd></dl>
<div id="youjiaCont">下次油价9月11日24时调整,目前预计上调油价260元/吨(0.20元/升-0.24元/升)。</div>
`

/** 同结构但页面日期是 30 天前，且带全角括号和多余空格。 */
const stale = `
<h1>湖北油价</h1><span>2026-08-14</span>
<dt>湖北 92 号汽油</dt><dd> 8.26 （元） </dd>
`

/** 同 sample，但预告的日期还没到。 */
const future = sample.replace('9月11日', '9月26日')

describe('parseOilPage', () => {
  it('解析价格、页面日期；预告日期早于页面日期时丢掉（网站留着旧预告）', () => {
    expect(parseOilPage(sample)).toEqual({
      p92: 8.31,
      source_date: '2026-09-12',
      next_adjustment_text: null,
    })
  })

  it('预告日期还没到就保留原文', () => {
    expect(parseOilPage(future).next_adjustment_text).toBe('下次油价9月26日24时调整')
  })

  it('跨年：页面是 12 月、预告是 1 月，算成下一年，不算过期', () => {
    const crossYear = sample.replace('2026-09-12', '2026-12-30').replace('9月11日', '1月5日')
    expect(parseOilPage(crossYear).next_adjustment_text).toBe('下次油价1月5日24时调整')
  })

  it('容忍空格和全角括号，没有预告时为 null', () => {
    expect(parseOilPage(stale)).toEqual({
      p92: 8.26,
      source_date: '2026-08-14',
      next_adjustment_text: null,
    })
  })

  it('页面改版解析不到时各项为 null', () => {
    expect(parseOilPage('<p>网站维护中</p>')).toEqual({
      p92: null,
      source_date: null,
      next_adjustment_text: null,
    })
  })
})

describe('validate', () => {
  it('正常样本通过', () => {
    expect(validate(parseOilPage(sample), '2026-09-13')).toEqual([])
  })

  it('页面日期早于 20 天不通过', () => {
    expect(validate(parseOilPage(stale), '2026-09-13')).toHaveLength(1)
  })

  it('价格不在 5–15 之间不通过', () => {
    expect(validate({ p92: 83.1, source_date: '2026-09-13' }, '2026-09-13')).toHaveLength(1)
  })

  it('解析不到时报两条', () => {
    expect(validate({ p92: null, source_date: null }, '2026-09-13')).toHaveLength(2)
  })
})

describe('appendHistory', () => {
  it('价格变了追加一条', () => {
    const history = [{ observed_date: '2026-08-28', p92: 8.46 }]
    expect(appendHistory(history, 8.31, '2026-09-13')).toEqual([
      ...history,
      { observed_date: '2026-09-13', p92: 8.31 },
    ])
  })

  it('价格没变原样返回', () => {
    const history = [{ observed_date: '2026-08-28', p92: 8.31 }]
    expect(appendHistory(history, 8.31, '2026-09-13')).toBe(history)
  })

  it('空数组也追加', () => {
    expect(appendHistory([], 8.31, '2026-09-13')).toHaveLength(1)
  })
})
