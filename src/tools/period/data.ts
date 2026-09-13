import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { supabase } from '@/lib/supabase'
import type { Period } from '@/lib/database.types'
import { isMock, mockPeriods } from './mock'

/** 新建/编辑一条经期记录需要的字段。 */
export type PeriodInput = {
  start_date: string
  end_date: string | null
}

export async function fetchPeriods(): Promise<Period[]> {
  const { data, error } = await supabase
    .from('periods')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createPeriod(input: PeriodInput) {
  const { error } = await supabase.from('periods').insert(input)
  if (error) throw error
}

export async function updatePeriod(id: string, input: PeriodInput) {
  const { error } = await supabase.from('periods').update(input).eq('id', id)
  if (error) throw error
}

export async function deletePeriod(id: string) {
  const { error } = await supabase.from('periods').delete().eq('id', id)
  if (error) throw error
}

/** 日历页和首页摘要共用的读取：?mock=1 时走假数据不碰数据库。 */
export function usePeriods() {
  const { search } = useLocation()
  const mock = isMock(search)
  const [periods, setPeriods] = useState<Period[] | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    // 字面量 import.meta.env.DEV 在生产构建里是死代码，mockPeriods 会被 tree-shake 掉
    if (import.meta.env.DEV && mock) {
      setPeriods(mockPeriods(search))
      return
    }
    try {
      setPeriods(await fetchPeriods())
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取失败')
    }
  }, [mock, search])

  useEffect(() => {
    void reload()
  }, [reload])

  return { periods, mock, error, reload }
}
