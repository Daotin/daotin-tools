import { useEffect, useRef, type ComponentProps } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, getDefaultClassNames, type DayButton } from 'react-day-picker'
import { cn } from '@/lib/cn'

/**
 * shadcn 的 calendar，按 DESIGN.md 重配：颜色全换成项目 token（工具色槽、二级灰），
 * 圆角走 rounded-pill / rounded-sm，不留 dark: 变体（深色由 prefers-color-scheme
 * 和 [data-theme] 换 token 实现，dark: 会误命中）。
 * --cell-size 只管上一月/下一月按钮和标题行的高度，日期格另有固定高度。
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  captionLayout = 'label',
  components,
  ...props
}: ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()
  const navButton =
    'flex size-(--cell-size) shrink-0 items-center justify-center rounded-pill text-foreground-secondary aria-disabled:opacity-35'

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('[--cell-size:--spacing(8)]', className)}
      classNames={{
        root: cn('w-full', defaultClassNames.root),
        months: cn('relative flex flex-col', defaultClassNames.months),
        month: cn('flex w-full flex-col', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between',
          defaultClassNames.nav,
        ),
        button_previous: cn(navButton, defaultClassNames.button_previous),
        button_next: cn(navButton, defaultClassNames.button_next),
        month_caption: cn(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        // 年、月两个下拉：透明的原生 select 盖在标题文字上，点标题就展开
        dropdowns: cn(
          'flex h-(--cell-size) items-center justify-center gap-2',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn('relative', defaultClassNames.dropdown_root),
        dropdown: cn('absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'flex items-center gap-1 font-rounded text-body font-semibold whitespace-nowrap tabular-nums select-none',
          defaultClassNames.caption_label,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        // 星期表头用二级灰，不用三级灰（DESIGN.md：三级灰只给禁用态）
        weekday: cn(
          'flex-1 pb-1 text-caption font-normal text-foreground-secondary select-none',
          defaultClassNames.weekday,
        ),
        week: cn('flex w-full', defaultClassNames.week),
        day: cn('h-12 flex-1 p-0 text-center select-none', defaultClassNames.day),
        outside: cn('text-foreground-secondary', defaultClassNames.outside),
        disabled: cn('opacity-35', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation }) => {
          const Icon =
            orientation === 'left' ? ChevronLeft : orientation === 'right' ? ChevronRight : ChevronDown
          return (
            <Icon
              className={cn(
                orientation === 'down' ? 'size-4' : 'size-5',
                'text-foreground-secondary',
                className,
              )}
            />
          )
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

/**
 * 日期格：44px 圆内可放多行（公历日 + 农历小字）。
 * 选中是 --tool-solid 实心圆白字，今天是 2px --tool-solid 圆环。
 */
function CalendarDayButton({
  className,
  day,
  modifiers,
  children,
  ...props
}: ComponentProps<typeof DayButton>) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      data-day={day.date.toDateString()}
      className={cn('flex h-12 w-full items-center justify-center outline-none', className)}
      {...props}
    >
      <span
        className={cn(
          'flex size-11 flex-col items-center justify-center rounded-pill font-rounded text-body leading-none font-semibold tabular-nums transition-colors',
          modifiers.selected
            ? 'bg-tool-solid text-white'
            : modifiers.today && 'ring-2 ring-tool-solid',
        )}
      >
        {children}
      </span>
    </button>
  )
}

export { Calendar, CalendarDayButton }
