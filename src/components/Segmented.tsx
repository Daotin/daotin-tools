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
  return (
    <div
      className={cn(
        'flex rounded-pill p-1',
        size === 'mini' ? 'h-8 bg-background' : 'h-11 bg-surface',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-pill px-3 font-rounded font-semibold transition-colors duration-200',
            size === 'mini' ? 'text-caption' : 'text-body-sm',
            option.value === value
              ? 'bg-tool-soft text-tool-solid'
              : 'text-foreground-secondary',
            option.disabled && 'text-foreground-tertiary',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
