import { supabase } from './supabase'

/** 导出与恢复的表顺序：父表 quit_items 必须排在子表 quit_relapses 前面。 */
export const TABLES = ['quit_items', 'quit_relapses', 'countdown_events', 'periods'] as const
export type TableName = (typeof TABLES)[number]

export const TABLE_LABELS: Record<TableName, string> = {
  quit_items: '戒断项',
  quit_relapses: '破戒记录',
  countdown_events: '倒数日',
  periods: '经期',
}

type Row = Record<string, unknown>

export type Backup = {
  exported_at: string
  tables: Record<TableName, Row[]>
}

const PAGE = 1000

/** 按 id 排序分页读完一张表。任一页失败就抛错，不返回残缺数据。 */
async function readAll(table: TableName): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`读取 ${TABLE_LABELS[table]} 失败：${error.message}`)
    rows.push(...(data as Row[]))
    if (!data || data.length < PAGE) return rows
  }
}

export async function exportBackup(): Promise<Backup> {
  const tables = {} as Record<TableName, Row[]>
  for (const table of TABLES) tables[table] = await readAll(table)
  return { exported_at: new Date().toISOString(), tables }
}

export function downloadBackup(backup: Backup) {
  const date = backup.exported_at.slice(0, 10)
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `daotin-tools-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text) as Backup
  if (!data || typeof data !== 'object' || !data.tables) {
    throw new Error('文件格式不对，不是本站导出的备份')
  }
  for (const table of TABLES) {
    if (data.tables[table] && !Array.isArray(data.tables[table])) {
      throw new Error(`备份里的 ${TABLE_LABELS[table]} 不是列表`)
    }
  }
  return data
}

export type TableProgress = {
  table: TableName
  status: 'pending' | 'done' | 'failed'
  written: number
  error?: string
}

/** 四张表是否都为空。跨账号迁入只允许在空账号上执行。 */
async function isEmptyAccount(): Promise<boolean> {
  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
    if (error) throw new Error(`检查 ${TABLE_LABELS[table]} 失败：${error.message}`)
    if (count) return false
  }
  return true
}

/**
 * 跨账号迁入：全部重新生成 id，quit_relapses.item_id 按新旧对照表替换。
 * 同账号恢复：保留原 id，按 id upsert，重复恢复结果不变。
 * 两种模式都忽略行里的 user_id，交给数据库的 default auth.uid()。
 */
function prepare(backup: Backup, crossAccount: boolean): Record<TableName, Row[]> {
  const idMap = new Map<string, string>()
  const out = {} as Record<TableName, Row[]>
  for (const table of TABLES) {
    out[table] = (backup.tables[table] ?? []).map((row) => {
      const { user_id: _ignored, ...rest } = row
      if (!crossAccount) return rest
      const newId = crypto.randomUUID()
      if (typeof rest.id === 'string') idMap.set(rest.id, newId)
      return { ...rest, id: newId }
    })
  }
  if (crossAccount) {
    for (const row of out.quit_relapses) {
      if (typeof row.item_id === 'string') {
        row.item_id = idMap.get(row.item_id) ?? row.item_id
      }
    }
  }
  return out
}

const CHUNK = 500

/**
 * 逐表恢复，每张表完成后回调一次进度。中途失败立刻停止，
 * 剩余的表保持 pending，调用方据此列出已完成和未完成的表。
 */
export async function restoreBackup(
  backup: Backup,
  crossAccount: boolean,
  onProgress: (progress: TableProgress[]) => void,
) {
  const progress: TableProgress[] = TABLES.map((table) => ({
    table,
    status: 'pending',
    written: 0,
  }))
  const report = () => onProgress(progress.map((p) => ({ ...p })))
  report()

  if (crossAccount && !(await isEmptyAccount())) {
    throw new Error('当前账号已有数据，跨账号迁入只能在空账号上执行，请先清空')
  }

  const rows = prepare(backup, crossAccount)
  for (const entry of progress) {
    const list = rows[entry.table]
    try {
      for (let i = 0; i < list.length; i += CHUNK) {
        // as never：entry.table 是四张表的联合类型，upsert 的行类型跟着变成四种行的交集，
        // 任何一张表的行都不满足。这里表和行一定是配对的（rows 按表名取的），断言绕开它。
        const { error } = await supabase
          .from(entry.table)
          .upsert(list.slice(i, i + CHUNK) as never)
        if (error) throw new Error(error.message)
        entry.written = Math.min(i + CHUNK, list.length)
        report()
      }
      entry.status = 'done'
      report()
    } catch (e) {
      entry.status = 'failed'
      entry.error = e instanceof Error ? e.message : String(e)
      report()
      throw e
    }
  }
}
