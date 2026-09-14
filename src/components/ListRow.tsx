import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { IconBadge } from './IconBadge'
import type { ToolColor } from '@/tools'

type Props = {
  icon: LucideIcon
  color?: ToolColor
  label: string
  /** 右侧内容：值文字、loading 等 */
  trailing?: React.ReactNode
  to?: string
  onClick?: () => void
}

/** 白卡里的列表行：左 32px 圆形图标底 + 文字，右侧可选内容或 chevron。 */
export function ListRow({ icon, color, label, trailing, to, onClick }: Props) {
  const inner = (
    <>
      <IconBadge icon={icon} size={32} color={color} />
      <span className="flex-1 text-body">{label}</span>
      {trailing}
      {(to || onClick) && <ChevronRight className="size-5 text-foreground-secondary" />}
    </>
  )
  const className = 'flex h-15 w-full items-center gap-3 text-left'
  if (to) {
    return (
      <Link to={to} viewTransition className={className}>
        {inner}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    )
  }
  return <div className={className}>{inner}</div>
}
