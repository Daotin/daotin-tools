import { useCallback } from 'react'
import { useLocation } from 'react-router'
import { useCachedQuery } from '@/lib/cache'
import { supabase } from '@/lib/supabase'
import type { QuitItem, QuitRelapse } from '@/lib/database.types'
import { isMock, mockData } from './mock'

export type QuitData = { item: QuitItem | null; relapses: QuitRelapse[] }

/** 工具页和首页摘要共用的读取：?mock=1 时走假数据不碰数据库、也不写缓存。 */
export function useQuitData() {
  const { search } = useLocation()
  const mock = isMock(search)

  const fetcher = useCallback(async () => {
    // 字面量 import.meta.env.DEV 在生产构建里是死代码，mockData 会被 tree-shake 掉
    if (import.meta.env.DEV && mock) return mockData()
    return fetchQuit()
  }, [mock])

  const { data, error, reload } = useCachedQuery<QuitData>(mock ? null : 'quit', fetcher)
  return { data, mock, error, reload }
}

/** 界面上只有一个戒断项，取最早建的那条。 */
export async function fetchQuit(): Promise<QuitData> {
  const { data: items, error } = await supabase
    .from('quit_items')
    .select('*')
    .order('created_at')
    .limit(1)
  if (error) throw error
  const item = items[0] ?? null
  if (!item) return { item: null, relapses: [] }

  const { data: relapses, error: e2 } = await supabase
    .from('quit_relapses')
    .select('*')
    .eq('item_id', item.id)
    .order('relapsed_at')
  if (e2) throw e2
  return { item, relapses }
}

export async function createItem(startAt: string, name = '戒烟'): Promise<QuitItem> {
  const { data, error } = await supabase
    .from('quit_items')
    .insert({ name, start_at: startAt })
    .select()
    .single()
  if (error) throw error
  return data
}

/** 破戒时间早于 start_at 时，把 start_at 前移到该时间（design.md 计算规则）。 */
export async function addRelapse(item: QuitItem, relapsedAt: string, note: string) {
  // 先前移 start_at 再插记录：哪一步失败都不会留下"记录早于 start_at"的状态
  if (new Date(relapsedAt) < new Date(item.start_at)) {
    const { error } = await supabase
      .from('quit_items')
      .update({ start_at: relapsedAt })
      .eq('id', item.id)
    if (error) throw error
  }
  const { error } = await supabase
    .from('quit_relapses')
    .insert({ item_id: item.id, relapsed_at: relapsedAt, note: note.trim() || null })
  if (error) throw error
}

export async function deleteRelapse(id: string) {
  const { error } = await supabase.from('quit_relapses').delete().eq('id', id)
  if (error) throw error
}

export type AntixImport = {
  item: { name: string; start_at: string }
  relapses: { legacy_id: string; relapsed_at: string; note: string | null }[]
}

export function parseAntixImport(text: string): AntixImport {
  const json = JSON.parse(text)
  if (!json?.item?.start_at || !Array.isArray(json?.relapses)) {
    throw new Error('文件格式不对，需要 antix-to-json.mjs 生成的 JSON')
  }
  return json
}

/**
 * 导入：没有戒断项就新建；已有就挂到现有项下，start_at 取两者较早的。
 * 按 legacy_id 去重（先查已存在的再插新的），同一份文件导两遍结果不变。
 */
export async function importAntix(data: AntixImport): Promise<{ added: number; skipped: number }> {
  const { item: existing } = await fetchQuit()
  let item = existing
  if (!item) {
    item = await createItem(data.item.start_at, data.item.name)
  } else if (new Date(data.item.start_at) < new Date(item.start_at)) {
    const { error } = await supabase
      .from('quit_items')
      .update({ start_at: data.item.start_at })
      .eq('id', item.id)
    if (error) throw error
  }

  // 每 100 个 legacy_id 查一批：几千条记录一次性塞进 .in() 会把 URL 撑爆
  const legacyIds = data.relapses.map((r) => r.legacy_id)
  const seen = new Set<string | null>()
  for (let i = 0; i < legacyIds.length; i += 100) {
    const { data: known, error } = await supabase
      .from('quit_relapses')
      .select('legacy_id')
      .in('legacy_id', legacyIds.slice(i, i + 100))
    if (error) throw error
    for (const row of known) seen.add(row.legacy_id)
  }

  const rows = data.relapses
    .filter((r) => !seen.has(r.legacy_id))
    .map((r) => ({
      item_id: item.id,
      relapsed_at: r.relapsed_at,
      note: r.note,
      legacy_id: r.legacy_id,
    }))
  if (rows.length > 0) {
    const { error: e2 } = await supabase.from('quit_relapses').insert(rows)
    if (e2) throw e2
  }
  return { added: rows.length, skipped: data.relapses.length - rows.length }
}
