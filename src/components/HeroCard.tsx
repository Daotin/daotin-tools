import { cn } from 'cn'

/** 工具页首屏卡：--tool-soft 底，内边距 24px。全站唯一有颜色底的卡。 */
export function HeroCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-md bg-tool-soft p-6', className)}>{children}</div>
  )
}
