import type { Period } from '@/lib/database.types'

/**
 * 仅开发环境：`/period?mock=1` 用示例数据渲染，用来截图对照版式。
 * `?mock=1&empty=1` 是无记录的首次引导变体。
 * 生产构建里 import.meta.env.DEV 为 false，这段会被 tree-shake 掉。
 */
export function isMock(search: string) {
  return import.meta.env.DEV && new URLSearchParams(search).get('mock') === '1'
}

const base = { user_id: 'mock', created_at: '2026-09-01T00:00:00Z' }

/**
 * 按 2026-09-13 当天算：周期 28、30、27、29、28，规律，加权平均 28 天 →
 * 下次 10 月 1 日，排卵日 9 月 17 日（今天在排卵期内）；
 * 回测 4 次，误差 −2、+2、−1、+1 → 平均 1.5 天、范围 ±2 天。
 */
export function mockPeriods(search: string): Period[] {
  if (new URLSearchParams(search).get('empty') === '1') return []
  return [
    { ...base, id: 'mock-6', start_date: '2026-09-03', end_date: '2026-09-07' },
    { ...base, id: 'mock-5', start_date: '2026-08-06', end_date: '2026-08-10' },
    { ...base, id: 'mock-4', start_date: '2026-07-08', end_date: '2026-07-12' },
    { ...base, id: 'mock-3', start_date: '2026-06-11', end_date: '2026-06-15' },
    { ...base, id: 'mock-2', start_date: '2026-05-12', end_date: '2026-05-16' },
    { ...base, id: 'mock-1', start_date: '2026-04-14', end_date: '2026-04-18' },
  ]
}
