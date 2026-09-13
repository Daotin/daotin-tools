import type { QuitItem, QuitRelapse } from '@/lib/database.types'

/**
 * 仅开发环境：`/quit?mock=1` 用一份假数据渲染，用来截图对照版式。
 * 生产构建里 import.meta.env.DEV 为 false，这段会被 tree-shake 掉。
 */
export function isMock(search: string) {
  return import.meta.env.DEV && new URLSearchParams(search).get('mock') === '1'
}

const DAY = 86_400_000
/** 当前连续 12 天 06:41:22（ui-spec 4.1 的示例数字） */
const CURRENT = 12 * DAY + 6 * 3600_000 + 41 * 60_000 + 22_000
/** 倒着排的历史各轮天数：最长 31 天、共 7 次破戒、累计 214 天 */
const ROUNDS = [27, 27, 28, 29, 30, 30, 31]
const NOTES = ['加班，同事递了一根', '', '应酬', '', '心情不好', '', '']

export function mockData(now: number = Date.now()): {
  item: QuitItem
  relapses: QuitRelapse[]
} {
  const base = { user_id: 'mock', created_at: new Date(now).toISOString() }
  let t = now - CURRENT
  const relapses: QuitRelapse[] = []
  ROUNDS.forEach((days, i) => {
    relapses.push({
      ...base,
      id: `mock-${i}`,
      item_id: 'mock-item',
      relapsed_at: new Date(t).toISOString(),
      note: NOTES[i] || null,
      legacy_id: null,
    })
    t -= days * DAY
  })
  return {
    item: { ...base, id: 'mock-item', name: '戒烟', start_at: new Date(t).toISOString() },
    relapses: relapses.reverse(),
  }
}
