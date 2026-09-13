import { useCallback } from 'react'
import { useLocation } from 'react-router'
import { useCachedQuery } from '@/lib/cache'
import { supabase } from '@/lib/supabase'
import type { CountdownEvent } from '@/lib/database.types'
import { isMock, mockEvents } from './mock'

/** 新建/编辑表单提交的字段。 */
export type EventInput = {
  title: string
  date: string
  is_lunar: boolean
  repeat: CountdownEvent['repeat']
  category: string
  pinned: boolean
  note: string | null
}

/** 分类列表的三个默认值，和已有事件的分类合并去重。 */
export const DEFAULT_CATEGORIES = ['纪念日', '工作', '生活']

export function categoriesOf(events: CountdownEvent[]): string[] {
  return [...new Set([...DEFAULT_CATEGORIES, ...events.map((e) => e.category)])]
}

export async function fetchEvents(): Promise<CountdownEvent[]> {
  const { data, error } = await supabase
    .from('countdown_events')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data
}

export async function createEvent(input: EventInput) {
  const { error } = await supabase.from('countdown_events').insert(input)
  if (error) throw error
}

export async function updateEvent(id: string, input: EventInput) {
  const { error } = await supabase.from('countdown_events').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('countdown_events').delete().eq('id', id)
  if (error) throw error
}

/** 列表、表单、详情、首页摘要共用的读取：?mock=1 时走假数据不碰数据库、也不写缓存。 */
export function useEvents() {
  const { search } = useLocation()
  const mock = isMock(search)

  const fetcher = useCallback(async () => {
    // 字面量 import.meta.env.DEV 在生产构建里是死代码，mockEvents 会被 tree-shake 掉
    if (import.meta.env.DEV && mock) return mockEvents()
    return fetchEvents()
  }, [mock])

  const { data, error, reload } = useCachedQuery(mock ? null : 'countdown', fetcher)
  return { events: data, mock, error, reload }
}
