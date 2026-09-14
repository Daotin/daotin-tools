import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { IconBadge } from './IconBadge'
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item'
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
  const interactive = !!(to || onClick)
  const inner = (
    <>
      <ItemMedia>
        <IconBadge icon={icon} size={32} color={color} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
      {(trailing || interactive) && (
        <ItemActions>
          {trailing}
          {interactive && <ChevronRight className="size-5 text-foreground-secondary" />}
        </ItemActions>
      )}
    </>
  )

  if (to) {
    return (
      <Item asChild>
        <Link to={to} viewTransition>
          {inner}
        </Link>
      </Item>
    )
  }
  if (onClick) {
    return (
      <Item asChild>
        <button type="button" onClick={onClick}>
          {inner}
        </button>
      </Item>
    )
  }
  return <Item>{inner}</Item>
}
