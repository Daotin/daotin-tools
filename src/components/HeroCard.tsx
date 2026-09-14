import { cn } from '@/lib/cn'

/** 工具页首屏卡：--tool-soft 底，内边距 24px。全站唯一有颜色底的卡。 */
export function HeroCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    /* fade-in：骨架屏换成真内容时淡入一次，不硬切 */
    <div className={cn('fade-in rounded-md bg-tool-soft p-6', className)}>{children}</div>
  )
}
