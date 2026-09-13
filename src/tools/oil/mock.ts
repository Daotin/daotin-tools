import type { OilLatest, OilPoint } from './data'

/**
 * 仅开发环境：`/oil?mock=1` 用 ui-spec 第 7 节的示例数据渲染，用来截图对照版式。
 * `?mock=1&empty=1` 是没有历史记录的变体，`?mock=1&fail=1` 是 latest.json 加载失败的变体。
 * 生产构建里 import.meta.env.DEV 为 false，这段会被 tree-shake 掉。
 */
export function isMock(search: string) {
  return import.meta.env.DEV && new URLSearchParams(search).get('mock') === '1'
}

export function mockLatest(search: string): OilLatest | null {
  if (new URLSearchParams(search).get('fail') === '1') return null
  return {
    fetched_at: '2026-09-13T00:00:00.000Z',
    source_date: '2026-09-12',
    next_adjustment_text: '下次油价9月25日24时调整',
    province: '湖北',
    grade: '92',
    p92: 8.31,
  }
}

export function mockHistory(search: string): OilPoint[] {
  if (new URLSearchParams(search).get('empty') === '1') return []
  return [
    { observed_date: '2026-07-03', p92: 8.05 },
    { observed_date: '2026-07-17', p92: 8.2 },
    { observed_date: '2026-07-31', p92: 8.11 },
    { observed_date: '2026-08-14', p92: 8.26 },
    { observed_date: '2026-08-28', p92: 8.46 },
    { observed_date: '2026-09-12', p92: 8.31 },
  ]
}
