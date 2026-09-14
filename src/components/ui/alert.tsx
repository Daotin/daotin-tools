import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/** 只留 destructive 一个变体：本项目的 alert 只用在内联错误上。 */
const alertVariants = cva('flex w-full items-center gap-2 rounded-md px-4 py-3', {
  variants: {
    variant: {
      destructive: 'bg-red-soft text-red-solid',
    },
  },
  defaultVariants: {
    variant: 'destructive',
  },
})

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="alert-description"
      className={cn('min-w-0 flex-1 text-caption', className)}
      {...props}
    />
  )
}

export { Alert, AlertDescription }
