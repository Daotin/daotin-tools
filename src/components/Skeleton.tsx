import { cn } from '@/lib/cn'

/**
 * 骨架块：--surface 底的圆角块，很轻的呼吸（opacity 0.6↔1）。
 * prefers-reduced-motion 由 index.css 里的全局规则把动画时长归零，这里不用再判一次。
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-breathe rounded-md bg-surface', className)} />
}

/** 页面首次加载的骨架：形状对应 Hero Card 和它下面的一张白卡。Suspense fallback 和数据加载共用。 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-62" />
      <Skeleton className="h-32" />
    </div>
  )
}
