import { Link } from 'react-router'
import { IconBadge } from './IconBadge'
import type { Tool } from '@/tools'

/** 没有摘要数字时数字位置显示的"打开"。 */
export function ToolCardOpen() {
  return (
    <div className="mt-1 font-rounded text-stat font-bold text-foreground-tertiary">打开</div>
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
      className="relative block rounded-md bg-surface p-5 transition-transform active:scale-[0.98]"
    >
      <IconBadge icon={tool.icon} size={44} color={tool.color} />
      <div className="mt-2 font-rounded text-body-sm font-semibold text-foreground-secondary">
        {tool.name}
      </div>
      {Summary ? <Summary /> : <ToolCardOpen />}
    </Link>
  )
}
