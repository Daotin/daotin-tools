#!/usr/bin/env node
/**
 * AntiX 备份 → 网页版导入用的 JSON。跑一次即可。
 *
 *   node scripts/antix-to-json.mjs <antix-backup.zip | antix.db> [-o out.json]
 *
 * 依赖系统自带的 unzip 和 sqlite3，不装任何 npm 包。
 * start_at 的推导见 design.md「AntiX 数据迁移」：
 *   最早一条 relapsed_at 减去它的 streak_days 整天（保留时分秒）；没有记录时取 settings.start_time。
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const outIndex = args.indexOf('-o')
const outPath = outIndex >= 0 ? args[outIndex + 1] : null
const input = args.filter((a, i) => a !== '-o' && i !== outIndex + 1)[0]

if (!input) {
  console.error('用法：node scripts/antix-to-json.mjs <antix-backup.zip | antix.db> [-o out.json]')
  process.exit(1)
}

/** zip 解到临时目录，返回里面的 antix.db 路径；直接给 .db 就原样返回。 */
function resolveDb(path) {
  if (!path.endsWith('.zip')) return path
  const dir = mkdtempSync(join(tmpdir(), 'antix-'))
  execFileSync('unzip', ['-o', '-q', path, '-d', dir])
  const db = readdirSync(dir).find((f) => f.endsWith('.db'))
  if (!db) throw new Error(`zip 里没有 .db 文件：${path}`)
  return join(dir, db)
}

const db = resolveDb(input)
const query = (sql) => JSON.parse(execFileSync('sqlite3', ['-json', db, sql], { encoding: 'utf8' }) || '[]')

const relapses = query('select id, note, relapsed_at, streak_days from relapses order by relapsed_at')
const settings = Object.fromEntries(query('select key, value from settings').map((r) => [r.key, r.value]))

let startAt
if (relapses.length > 0) {
  const first = relapses[0]
  const t = new Date(first.relapsed_at)
  t.setUTCDate(t.getUTCDate() - first.streak_days)
  startAt = t.toISOString()
} else if (settings.start_time) {
  startAt = new Date(settings.start_time).toISOString()
} else {
  throw new Error('这份备份里既没有破戒记录，也没有 settings.start_time，推不出开始时间')
}

const out = {
  item: { name: '戒断', start_at: startAt },
  relapses: relapses.map((r) => ({
    legacy_id: r.id,
    relapsed_at: new Date(r.relapsed_at).toISOString(),
    note: r.note ?? null,
  })),
}

const json = JSON.stringify(out, null, 2)
if (outPath) {
  writeFileSync(outPath, json + '\n')
  console.error(`已写入 ${outPath}：开始时间 ${startAt}，破戒记录 ${out.relapses.length} 条`)
} else {
  console.log(json)
}
