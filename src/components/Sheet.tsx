import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * 弹层：手机是底部抽屉（顶部圆角 + 拖动条），电脑（≥1024px）是居中对话框宽 400px。
 * 用原生 <dialog>，Esc 关闭、焦点锁定、遮罩都由浏览器负责。
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'sheet mt-auto mb-0 w-full max-w-full rounded-t-lg bg-surface-raised p-6 text-foreground shadow-raised outline-none backdrop:bg-black/25',
        'lg:my-auto lg:w-100 lg:rounded-lg',
      )}
    >
      <div className="mx-auto h-1 w-9 rounded-pill bg-border lg:hidden" />
      <div className="mt-4 text-heading lg:mt-0">{title}</div>
      {children}
    </dialog>
  )
}
