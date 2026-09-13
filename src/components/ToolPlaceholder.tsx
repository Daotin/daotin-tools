import type { LucideIcon } from 'lucide-react'
import { HeroCard } from './HeroCard'
import { IconBadge } from './IconBadge'

/** 阶段 1 的工具占位页：只显示工具名和"开发中"。 */
export function ToolPlaceholder({ name, icon }: { name: string; icon: LucideIcon }) {
  return (
    <HeroCard>
      <IconBadge icon={icon} size={56} />
      <div className="mt-4 font-rounded text-title">{name}</div>
      <div className="mt-1 text-body-sm text-foreground-secondary">开发中</div>
    </HeroCard>
  )
}
