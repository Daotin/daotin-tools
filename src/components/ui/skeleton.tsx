import { cn } from "@/lib/cn"

/** shadcn 的 Skeleton，去掉 animate-pulse：骨架屏静态不动。底色 --surface-muted，圆角 --radius-sm。 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("rounded-sm bg-surface-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
