export { Skeleton } from './ui/skeleton'
import { Skeleton } from './ui/skeleton'

/** 页面首次加载的骨架：形状对应 Hero Card 和它下面的一张白卡。Suspense fallback 和数据加载共用。 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-62 rounded-md" />
      <Skeleton className="h-32 rounded-md" />
    </div>
  )
}
