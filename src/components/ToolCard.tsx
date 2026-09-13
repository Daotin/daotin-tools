import { Suspense } from 'react'
import { Link } from 'react-router'
import { IconBadge } from './IconBadge'
import { Skeleton } from './Skeleton'
import type { Tool } from '@/tools'

/** 没有摘要数字时数字位置显示的"打开"。 */
export function ToolCardOpen() {
  return (
    <div className="mt-1 font-rounded text-stat font-bold text-foreground-tertiary">打开</div>
  )
}

/**
 * 有 Summary 的工具在摘要就绪前占住数字行和说明行。
 * 形状对应 Summary：32px 的数字块 + 13px 的说明行；不显示"打开"，免得数字落地时跳一下。
 */
export function ToolCardSkeleton() {
  return (
    <>
      <Skeleton className="mt-1 h-8 w-20" />
      <Skeleton className="mt-auto h-[13px] w-16" />
    </>
  )
}

/** 首页工具卡：44px 图标底 → 工具名 → 核心数字（无摘要时显示"打开"）→ 一行说明。 */
export function ToolCard({ tool }: { tool: Tool }) {
  const { Summary } = tool
  return (
    <Link
      to={tool.path}
      viewTransition
      style={
        {
          // 卡片内的迷你图等按各自工具色取色
          '--tool-solid': `var(--${tool.color}-solid)`,
          '--tool-soft': `var(--${tool.color}-soft)`,
        } as React.CSSProperties
      }
      className="relative flex h-full flex-col rounded-md bg-surface p-5 transition-transform active:scale-[0.98]"
    >
      <IconBadge icon={tool.icon} size={44} color={tool.color} />
      <div className="mt-2 font-rounded text-body-sm font-semibold text-foreground-secondary">
        {tool.name}
      </div>
      {Summary ? (
        /* 摘要组件是按需加载的 chunk（农历、图表都在里面），加载期间占住数字那一行 */
        <Suspense fallback={<ToolCardSkeleton />}>
          <Summary />
        </Suspense>
      ) : (
        <ToolCardOpen />
      )}
    </Link>
  )
}
