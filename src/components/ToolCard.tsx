import { Suspense } from 'react'
import { Link } from 'react-router'
import { CHART_SLOT } from './ToolColorProvider'
import { Skeleton } from './ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Tool } from '@/tools'

/** 没有摘要数字时数字位置显示的"打开"。 */
export function ToolCardOpen() {
  return <div className="text-2xl font-semibold tracking-tight text-muted-foreground">打开</div>
}

/**
 * 有 Summary 的工具在摘要就绪前占住数字行和说明行。
 * 形状对应 Summary：一个数字块 + 一行说明；不显示"打开"，免得数字落地时跳一下。
 */
export function ToolCardSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="mt-auto h-3.5 w-16" />
    </>
  )
}

/** 首页工具卡：图标 + 工具名 → 核心数字（无摘要时显示"打开"）→ 一行说明。 */
export function ToolCard({ tool }: { tool: Tool }) {
  const { Summary } = tool
  return (
    <Link
      to={tool.path}
      viewTransition
      // 卡片内的迷你图等按各自工具色取色（text-tool / bg-tool）
      style={{ '--chart-tool': CHART_SLOT[tool.color] } as React.CSSProperties}
      className="group relative h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-3 py-5 transition-shadow group-hover:shadow-md">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <tool.icon className="size-4 text-tool" />
            {tool.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col px-5">
          {Summary ? (
            /* 摘要组件是按需加载的 chunk（农历、图表都在里面），加载期间占住数字那一行 */
            <Suspense fallback={<ToolCardSkeleton />}>
              <Summary />
            </Suspense>
          ) : (
            <ToolCardOpen />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
