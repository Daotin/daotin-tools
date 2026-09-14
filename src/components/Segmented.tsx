import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'

/**
 * 分段切换：就是 shadcn Tabs 的原生外观（muted 底 + 选中块提到 background），
 * 只是铺满一行、并保留一档更矮的 mini。最多 4 段。
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'default',
  className,
}: {
  value: T
  options: { value: T; label: string; disabled?: boolean }[]
  onChange: (value: T) => void
  size?: 'default' | 'mini'
  className?: string
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)} className={className}>
      <TabsList className={cn('w-full', size === 'mini' && 'h-8')}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
