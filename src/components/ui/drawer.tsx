import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '@/lib/cn'

/**
 * 底部抽屉（手机）。只留 bottom 一个方向和实际用到的三个子组件，
 * 其余方向、Trigger / Header / Footer / Description 都删了。
 * 进出场由 vaul 自己驱动，时长曲线在 index.css 里拉回本项目的 token。
 * 不套 Portal：portal 到 body 会跑出 ToolColorProvider 的子树，
 * --tool-solid / --tool-soft 继承不到，抽屉里的主按钮就从工具色掉回蓝色。
 * 内容本来就是 position: fixed，留在原地照样铺满视口。
 */
function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <>
      <DrawerPrimitive.Overlay
        data-slot="drawer-overlay"
        className="fixed inset-0 z-50 bg-black/25"
      />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-y-auto rounded-t-lg bg-surface-raised px-6 pb-6 text-foreground shadow-raised outline-none',
          className,
        )}
        {...props}
      >
        {/* 拖动条 */}
        <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-pill bg-border" />
        {children}
      </DrawerPrimitive.Content>
    </>
  )
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-heading', className)}
      {...props}
    />
  )
}

export { Drawer, DrawerContent, DrawerTitle }
