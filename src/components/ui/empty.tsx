import { cn } from '@/lib/cn'

/** 空状态卡：--tool-soft 底、--radius-md、内边距 24px，文字居中（全站唯一允许居中的文字）。 */
function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      /* fade-in：骨架屏换成真内容时淡入一次，和 HeroCard 一致 */
      className={cn(
        'fade-in flex flex-col items-center gap-3 rounded-md bg-tool-soft p-6 text-center',
        className,
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex flex-col items-center', className)}
      {...props}
    />
  )
}

/** 只负责居中和下方留白，圆形底交给里面的 IconBadge。 */
function EmptyMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-media"
      className={cn('mb-2 flex shrink-0 items-center justify-center', className)}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="empty-title" className={cn('text-heading', className)} {...props} />
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn('text-body-sm text-foreground-secondary', className)}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn('flex w-full flex-col items-center gap-3', className)}
      {...props}
    />
  )
}

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent }
