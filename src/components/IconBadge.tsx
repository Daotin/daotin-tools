import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ToolColor } from '@/tools'

const sizes = {
  32: 'size-8 [&_svg]:size-4',
  44: 'size-11 [&_svg]:size-[22px]',
  56: 'size-14 [&_svg]:size-7',
} as const

/** 圆形图标底：实色底白图标（solid），或浅色底彩色图标（soft）。全站最主要的色彩来源。 */
export function IconBadge({
  icon: Icon,
  size = 44,
  color,
  variant = 'solid',
  className,
}: {
  icon: LucideIcon
  size?: keyof typeof sizes
  /** 省略时用当前工具色（--tool-solid / --tool-soft） */
  color?: ToolColor
  variant?: 'solid' | 'soft'
  className?: string
}) {
  const solid = color ? `var(--${color}-solid)` : 'var(--tool-solid)'
  const soft = color ? `var(--${color}-soft)` : 'var(--tool-soft)'
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-pill',
        sizes[size],
        className,
      )}
      style={
        variant === 'solid'
          ? { background: solid, color: 'var(--primary-foreground)' }
          : { background: soft, color: solid }
      }
    >
      <Icon strokeWidth={2} />
    </span>
  )
}
