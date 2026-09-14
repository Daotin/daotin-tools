import { useLayoutEffect } from 'react'
import type { ToolColor } from '@/tools'

/** 8 个历史颜色名 → shadcn 的 chart-1..5。四个在用的工具各占一个，剩下的复用。 */
export const CHART_SLOT: Record<ToolColor, string> = {
  green: 'var(--chart-1)',
  blue: 'var(--chart-2)',
  orange: 'var(--chart-3)',
  pink: 'var(--chart-5)',
  purple: 'var(--chart-5)',
  teal: 'var(--chart-2)',
  yellow: 'var(--chart-3)',
  red: 'var(--chart-4)',
}

/**
 * 把当前工具的颜色写到 <html> 的 --chart-tool 上，子树内 text-tool / bg-tool 都跟着变。
 * 写在 <html> 而不是包一层 div：弹层、抽屉、站点栏按钮都是 portal 出去的，
 * 挂在子树上它们继承不到。
 */
export function ToolColorProvider({
  color,
  children,
}: {
  color: ToolColor
  children: React.ReactNode
}) {
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--chart-tool', CHART_SLOT[color])
    return () => {
      document.documentElement.style.removeProperty('--chart-tool')
    }
  }, [color])

  return children
}
