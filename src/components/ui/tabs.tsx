import { Tabs as TabsPrimitive } from 'radix-ui'
import { cn } from '@/lib/cn'

/**
 * 只留 Root / List / Trigger 三件，样式全部交给调用方（Segmented）。
 * 这里不塞 shadcn 那套默认外观，本项目的分段切换长得完全不一样。
 */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={className} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('flex items-center justify-center', className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn('outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger }
