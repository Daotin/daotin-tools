import { Label as LabelPrimitive } from 'radix-ui'
import { cn } from '@/lib/cn'

/** 表单标签：caption 档、二级灰，放在输入框上方。 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('block text-caption text-foreground-secondary select-none', className)}
      {...props}
    />
  )
}

export { Label }
