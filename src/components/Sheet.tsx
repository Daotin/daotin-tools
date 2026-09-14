import { useSyncExternalStore } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

/** ≥1024px 算电脑。MediaQueryList 放模块级，全站弹层共用一个，不用每次挂一个监听。 */
const desktop = window.matchMedia('(min-width: 64rem)')
const subscribe = (onChange: () => void) => {
  desktop.addEventListener('change', onChange)
  return () => desktop.removeEventListener('change', onChange)
}

/**
 * 弹层：手机是 vaul 底部抽屉（自带下拉关闭手势 + 拖动条），电脑（≥1024px）是居中对话框。
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
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{title}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
