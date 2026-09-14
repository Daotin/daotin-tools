import { cn } from '@/lib/cn'

/** 多行输入：卡内样式——--background 底、无边框、--radius-sm、内边距 16px、body 字号。 */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full rounded-sm bg-background px-4 py-3.5 text-body outline-none',
        'placeholder:text-foreground-secondary',
        'focus-visible:ring-2 focus-visible:ring-ring/60',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
