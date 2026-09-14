import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
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

/** 卡片里的列表行：左图标 + 文字，右侧可选内容或 chevron。 */
export function ListRow({ icon: Icon, label, trailing, to, onClick }: Props) {
  const interactive = !!(to || onClick)
  const inner = (
    <>
      <ItemMedia>
        <Icon className="size-4 text-muted-foreground" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
      {(trailing || interactive) && (
        <ItemActions>
          {trailing}
          {interactive && <ChevronRight className="size-4 text-muted-foreground" />}
        </ItemActions>
      )}
    </>
  )

  if (to) {
    return (
      <Item asChild variant="outline" size="sm" className="hover:bg-accent/50">
        <Link to={to} viewTransition>
          {inner}
        </Link>
      </Item>
    )
  }
  if (onClick) {
    return (
      <Item asChild variant="outline" size="sm" className="hover:bg-accent/50">
        <button type="button" onClick={onClick}>
          {inner}
        </button>
      </Item>
    )
  }
  return (
    <Item variant="outline" size="sm">
      {inner}
    </Item>
  )
}
