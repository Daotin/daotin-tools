import type { CountdownEvent } from '@/lib/database.types'

/**
 * 仅开发环境：`/countdown?mock=1` 用 ui-spec 第 5 节的示例数据渲染，用来截图对照版式。
 * 生产构建里 import.meta.env.DEV 为 false，这段会被 tree-shake 掉。
 */
export function isMock(search: string) {
  return import.meta.env.DEV && new URLSearchParams(search).get('mock') === '1'
}

const base = { user_id: 'mock', created_at: '2026-09-01T00:00:00Z' }

/** 示例数字按 2026-09-13 当天算：27 天后 / 12 天后 / 今天 / 24 天前。 */
export function mockEvents(): CountdownEvent[] {
  return [
    {
      ...base,
      id: 'mock-pay',
      title: '发工资',
      date: '2026-10-10',
      is_lunar: false,
      repeat: 'monthly',
      category: '生活',
      pinned: true,
      note: null,
      icon: 'wallet',
    },
    {
      ...base,
      id: 'mock-midautumn',
      title: '中秋节',
      date: '2026-09-25',
      is_lunar: true,
      repeat: 'yearly',
      category: '纪念日',
      pinned: false,
      note: '提前订月饼，回家吃饭。',
      icon: '',
    },
    {
      ...base,
      id: 'mock-birthday',
      title: '妈妈生日',
      date: '2026-09-13',
      is_lunar: false,
      repeat: 'yearly',
      category: '纪念日',
      pinned: false,
      note: null,
      icon: 'cake',
    },
    {
      ...base,
      id: 'mock-launch',
      title: '项目上线',
      date: '2026-08-20',
      is_lunar: false,
      repeat: 'none',
      category: '工作',
      pinned: false,
      note: null,
      icon: 'flag',
    },
  ]
}
