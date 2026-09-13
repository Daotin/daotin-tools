#!/usr/bin/env node
/**
 * 抓汽油价格网湖北页，写 public/data/oil/latest.json，价格变化时追加 history.json。
 * 每天由 .github/workflows/oil-price.yml 跑一次。
 *
 *   node scripts/fetch-oil-price.mjs              # 抓网并写文件
 *   node scripts/fetch-oil-price.mjs --dry-run    # 只打印解析结果
 *   node scripts/fetch-oil-price.mjs --html a.html # 从本地文件读，不抓网（测试用）
 *
 * 校验不通过就以 1 退出，GitHub 会发邮件。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import iconv from 'iconv-lite'
import { appendHistory, beijingDate, parseOilPage, validate } from './oil-parse.mjs'

// 桌面页会 302 到移动页；部分网络下 www 解析到打不通的 IP，所以 www 失败就直接试 m.
// 先抓移动版：结构是 <dt>湖北92号汽油</dt><dd>8.31(元)</dd>，UTF-8，解析稳定；
// 桌面版在 GitHub Actions 上能连通但返回的页面解析不出价格（2026-09-13 运行 #1 失败），只作兜底。
const URLS = ['http://m.qiyoujiage.com/hubei.shtml', 'http://www.qiyoujiage.com/hubei.shtml']
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'oil')

function fail(reason) {
  console.error(`抓取失败：${reason}`)
  process.exit(1)
}

/** 桌面页是 GBK、移动页是 UTF-8，按 meta charset 决定怎么解码。 */
function decode(buffer) {
  const head = buffer.subarray(0, 2048).toString('latin1')
  const charset = head.match(/charset=["']?\s*([\w-]+)/i)?.[1] ?? 'utf-8'
  return iconv.decode(buffer, /^gb/i.test(charset) ? 'gbk' : 'utf-8')
}

async function fetchHtml() {
  const reasons = []
  for (const url of URLS) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      console.log(`来源：${url}`)
      return decode(Buffer.from(await res.arrayBuffer()))
    } catch (e) {
      reasons.push(`${url} ${e.message}`)
    }
  }
  fail(reasons.join('；'))
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf-8'))
  } catch {
    return fallback
  }
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const htmlFile = args[args.indexOf('--html') + 1]

const html = args.includes('--html')
  ? await readFile(htmlFile, 'utf-8')
  : await fetchHtml()

const parsed = parseOilPage(html)
const errors = validate(parsed)
console.log(JSON.stringify(parsed, null, 2))
if (errors.length) fail(errors.join('；'))

const latest = {
  fetched_at: new Date().toISOString(),
  source_date: parsed.source_date,
  next_adjustment_text: parsed.next_adjustment_text,
  province: '湖北',
  grade: '92',
  p92: parsed.p92,
}

const historyPath = join(outDir, 'history.json')
const history = await readJson(historyPath, [])
const nextHistory = appendHistory(history, parsed.p92, beijingDate())
const changed = nextHistory !== history

if (dryRun) {
  console.log('--dry-run，不写文件。history 会' + (changed ? '追加一条' : '保持不变'))
  process.exit(0)
}

await mkdir(outDir, { recursive: true })
await writeFile(join(outDir, 'latest.json'), JSON.stringify(latest, null, 2) + '\n')
console.log('已写 latest.json')
if (changed) {
  await writeFile(historyPath, JSON.stringify(nextHistory, null, 2) + '\n')
  console.log(`history.json 追加一条：${nextHistory.at(-1).observed_date} ${parsed.p92}`)
} else {
  console.log('价格未变，history.json 不动')
}
