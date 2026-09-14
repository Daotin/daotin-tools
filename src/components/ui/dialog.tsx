import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/cn'

/**
 * 居中对话框（电脑）。只留实际用到的三个子组件，
 * Trigger / Close / Header / Footer / Description 都删了。
 * 居中不用 translate(-50%)：inset-0 + margin auto 更准，缩放动画也不会带偏位置。
 * 不套 Portal：portal 到 body 会跑出 ToolColorProvider 的子树，
 * --tool-solid / --tool-soft 继承不到，弹层里的主按钮就从工具色掉回蓝色。
 */
function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="sheet-overlay fixed inset-0 z-50 bg-black/25"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        aria-describedby={undefined}
        className={cn(
          'sheet-dialog fixed inset-0 z-50 m-auto h-fit w-100 max-w-[calc(100%-2rem)] rounded-lg bg-surface-raised p-6 text-foreground shadow-raised outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-heading', className)}
      {...props}
    />
  )
}

export { Dialog, DialogContent, DialogTitle }
