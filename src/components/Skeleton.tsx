export { Skeleton } from './ui/skeleton'
import { Skeleton } from './ui/skeleton'

/** 页面首次加载的骨架：形状对应首屏卡和它下面的一张卡。Suspense fallback 和数据加载共用。 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-60 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}
