import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'

/**
 * 分段切换：整体白底胶囊，选中块 --tool-soft 底 --tool-solid 字。最多 4 段。
 * 底层是 Radix Tabs，方向键导航和 aria 由它负责。
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
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className={cn(
        'rounded-pill',
        size === 'mini' ? 'h-8 bg-background' : 'h-11 bg-surface',
        className,
      )}
    >
      <TabsList className="relative h-full w-full rounded-pill p-1">
        {/* 选中块是一块绝对定位的滑块，在选项之间平移；不是各按钮自己切底色，切换才连得起来 */}
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-1 rounded-pill bg-tool-soft transition-transform duration-base ease-quint"
          style={{
            width: `calc((100% - 0.5rem) / ${options.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'relative h-full flex-1 rounded-pill px-3 font-rounded font-semibold transition-colors duration-base ease-quint',
              size === 'mini' ? 'text-caption' : 'text-body-sm',
              'text-foreground-secondary data-[state=active]:text-tool-solid',
              option.disabled && 'text-foreground-tertiary',
            )}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
