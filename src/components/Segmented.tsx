import { cn } from '@/lib/cn'

/** 分段切换：整体白底胶囊，选中块 --tool-soft 底 --tool-solid 字。最多 4 段。 */
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
    <div
      className={cn(
        'relative flex rounded-pill p-1',
        size === 'mini' ? 'h-8 bg-background' : 'h-11 bg-surface',
        className,
      )}
    >
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
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative flex-1 rounded-pill px-3 font-rounded font-semibold transition-colors duration-base ease-quint',
            size === 'mini' ? 'text-caption' : 'text-body-sm',
            option.value === value ? 'text-tool-solid' : 'text-foreground-secondary',
            option.disabled && 'text-foreground-tertiary',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
