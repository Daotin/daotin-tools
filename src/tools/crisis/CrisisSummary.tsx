import { ToolCardOpen, ToolCardSkeleton } from '@/components/ToolCard'
import { useCachedQuery } from '@/lib/cache'

/** public/crisis/data/summary.json，由预警页面的数据脚本写入。 */
type CrisisSummaryData = {
  level: '正常' | '留意' | '警惕' | '危险' | '数据不足'
  decided_by: string[]
  insufficient_nodes: string[]
  /** '2026-11-16' */
  as_of: string
  data_fetched_at: string | null
}

const LEVELS = ['正常', '留意', '警惕', '危险', '数据不足']

async function fetchSummary(): Promise<CrisisSummaryData> {
  // 站内静态文件，每天变一次，不吃 HTTP 缓存
  const res = await fetch('/crisis/data/summary.json', { cache: 'no-cache' })
  if (!res.ok) throw new Error(String(res.status))
  const data: CrisisSummaryData = await res.json()
  if (!LEVELS.includes(data?.level)) throw new Error('预警数据格式不对')
  return data
}

/** 首页卡片摘要：当前预警等级 + 计算日期。文件取不到或格式不对时显示"打开"。 */
export function CrisisSummary() {
  const { data, error } = useCachedQuery('crisis', fetchSummary)
  // 没有 data 又没报错 = 还在请求，先占位；请求失败才是空态（"打开"）
  if (!data) return error ? <ToolCardOpen /> : <ToolCardSkeleton />

  const [, month, day] = /^\d{4}-(\d{2})-(\d{2})/.exec(data.as_of) ?? []

  return (
    <>
      <div className="text-2xl font-semibold tracking-tight">{data.level}</div>
      {month && (
        <div className="mt-auto pt-0.5 text-xs text-muted-foreground">
          计算日期 {Number(month)}/{Number(day)}
        </div>
      )}
    </>
  )
}
