import { useSyncExternalStore } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'

/** ≥1024px 算电脑。MediaQueryList 放模块级，全站弹层共用一个，不用每次挂一个监听。 */
const desktop = window.matchMedia('(min-width: 64rem)')
const subscribe = (onChange: () => void) => {
  desktop.addEventListener('change', onChange)
  return () => desktop.removeEventListener('change', onChange)
}

/**
 * 弹层：手机是 vaul 底部抽屉（自带下拉关闭手势 + 拖动条），
 * 电脑（≥1024px）是 Radix 居中对话框宽 400px。
 * Esc 关闭、点遮罩关闭、焦点锁定都由 vaul / Radix 负责。
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
  const isDesktop = useSyncExternalStore(subscribe, () => desktop.matches)
  const onOpenChange = (next: boolean) => {
    if (!next) onClose()
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle className="mt-4">{title}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  )
}
