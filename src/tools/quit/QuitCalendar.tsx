import { useState } from 'react'
import {
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  isSameDay,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CigaretteOff, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatMonthDay } from '@/lib/date'
import { IconBadge } from '@/components/IconBadge'
import { Segmented } from '@/components/Segmented'
import { toast } from '@/components/Toast'
import type { QuitRelapse } from '@/lib/database.types'
import { useQuit } from './QuitLayout'
import { deleteRelapse } from './data'

type View = 'week' | 'month' | 'year'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** 按本地日期把破戒记录分桶。 */
function groupByDay(relapses: QuitRelapse[]) {
  const map = new Map<string, QuitRelapse[]>()
  for (const r of relapses) {
    const key = dayKey(new Date(r.relapsed_at))
    map.set(key, [...(map.get(key) ?? []), r])
  }
  return map
}

/** 月视图的格子：从当月 1 号所在周的周一排到月末。 */
function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const blanks = (first.getDay() + 6) % 7
  const days = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from(
      { length: days },
      (_, i) => new Date(anchor.getFullYear(), anchor.getMonth(), i + 1),
    ),
  ]
}

function Day({
  date,
  count,
  size,
  selected,
  onSelect,
}: {
  date: Date
  count: number
  size: 'week' | 'month'
  selected: boolean
  onSelect: () => void
}) {
  const today = isSameDay(date, new Date())
  const future = date.getTime() > Date.now()
  // 今天是实心圆白字，优先于破戒的 soft 底；选中是 2px 圆环，不占底色，两者可以叠
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex items-center justify-center',
        size === 'week' ? 'h-14' : 'h-11',
      )}
    >
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-pill font-rounded text-body-sm font-semibold',
          future && 'text-foreground-tertiary',
          today
            ? 'bg-tool-solid text-white'
            : count > 0 && 'bg-red-soft text-red-solid',
          selected && 'ring-2 ring-tool-solid',
        )}
      >
        {date.getDate()}
      </span>
      {/* 多次破戒写次数；今天是实心圆盖掉了 soft 底，破戒一次也要靠角标才看得出来 */}
      {(count > 1 || (today && count > 0)) && (
        <span className="absolute top-0.5 right-1 flex size-3.5 items-center justify-center rounded-[5px] bg-red-solid font-rounded text-caption leading-none font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  )
}

/** 日历卡 + 选中日的记录列表。计时段在电脑端并排时复用同一个组件。 */
export function CalendarPanel() {
  const { relapses, mock, reload } = useQuit()
  const [view, setView] = useState<View>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const [selected, setSelected] = useState<Date | null>(() => new Date())
  const [confirmId, setConfirmId] = useState('')

  const byDay = groupByDay(relapses)
  const countOf = (d: Date) => byDay.get(dayKey(d))?.length ?? 0

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const shift = (step: number) =>
    setAnchor((a) =>
      view === 'week' ? addWeeks(a, step) : view === 'month' ? addMonths(a, step) : addYears(a, step),
    )

  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 })
  // 手机上这行右边还有周/月/年分段，写成 "9/7 – 9/13" 才不把分段顶出屏幕
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const title =
    view === 'week'
      ? `${weekStart.getFullYear() === weekEnd.getFullYear() ? '' : `${weekStart.getFullYear()}/`}${md(weekStart)} – ${md(weekEnd)}`
      : view === 'month'
        ? `${anchor.getFullYear()} 年 ${anchor.getMonth() + 1} 月`
        : `${anchor.getFullYear()} 年`

  /** 某个时刻是否落在当前视图的区间里。 */
  const inView = (d: Date) => {
    if (view === 'year') return d.getFullYear() === anchor.getFullYear()
    if (view === 'month')
      return d.getFullYear() === anchor.getFullYear() && d.getMonth() === anchor.getMonth()
    const start = weekStart.getTime()
    return d.getTime() >= start && d.getTime() < start + 7 * 86_400_000
  }

  const inRange = relapses.filter((r) => inView(new Date(r.relapsed_at)))
  // 翻到别的周/月/年时不能再说"本周"，改说那一段的名字
  const periodLabel = inView(new Date())
    ? view === 'week'
      ? '本周'
      : view === 'month'
        ? '本月'
        : '本年'
    : view === 'week'
      ? `${formatMonthDay(weekStart)} – ${
          weekEnd.getMonth() === weekStart.getMonth()
            ? `${weekEnd.getDate()} 日`
            : formatMonthDay(weekEnd)
        }`
      : view === 'month'
        ? `${anchor.getMonth() + 1} 月`
        : `${anchor.getFullYear()} 年`

  const dayRecords = selected ? (byDay.get(dayKey(selected)) ?? []) : []

  async function onDelete(id: string) {
    try {
      if (!mock) await deleteRelapse(id)
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败，请重试')
      return
    }
    setConfirmId('')
    await reload()
  }

  return (
    <>
      <div className="rounded-md bg-surface p-5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="上一个"
            onClick={() => shift(-1)}
            className="flex size-8 shrink-0 items-center justify-center rounded-pill text-foreground-secondary"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-0 truncate font-rounded text-body font-semibold">{title}</span>
          <button
            type="button"
            aria-label="下一个"
            onClick={() => shift(1)}
            className="flex size-8 shrink-0 items-center justify-center rounded-pill text-foreground-secondary"
          >
            <ChevronRight className="size-5" />
          </button>
          <Segmented
            size="mini"
            className="ml-auto w-30 shrink-0"
            value={view}
            options={[
              { value: 'week', label: '周' },
              { value: 'month', label: '月' },
              { value: 'year', label: '年' },
            ]}
            onChange={setView}
          />
        </div>
        <div className="mt-1 text-body-sm text-foreground-secondary">
          {periodLabel}破戒 {inRange.length} 次
        </div>

        {view === 'year' ? (
          /* 格子写死 8px、间距 2px：跟着列宽走的话 390px 上一个迷你月就有 98px 宽，12 个月撑出滚动条 */
          <div className="mt-2 grid grid-cols-3 justify-items-center gap-3">
            {Array.from({ length: 12 }, (_, m) => (
              <div key={m}>
                <div className="text-caption text-foreground-secondary">{m + 1} 月</div>
                <div className="mt-1 grid grid-cols-7 gap-0.5">
                  {monthCells(new Date(anchor.getFullYear(), m, 1)).map((d, i) => (
                    <i
                      key={i}
                      className={cn(
                        'size-2 rounded-[2px]',
                        d && (countOf(d) > 0 ? 'bg-red-soft' : 'bg-surface-muted'),
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-7">
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-1 text-center text-caption text-foreground-tertiary">
                {w}
              </div>
            ))}
            {(view === 'week'
              ? Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86_400_000))
              : monthCells(anchor)
            ).map((d, i) =>
              d ? (
                <Day
                  key={i}
                  date={d}
                  size={view}
                  count={countOf(d)}
                  selected={!!selected && isSameDay(d, selected)}
                  onSelect={() => setSelected(d)}
                />
              ) : (
                <i key={i} />
              ),
            )}
          </div>
        )}
      </div>

      {view !== 'year' && selected && (
        <div className="mt-3 rounded-md bg-surface px-5 py-1">
          {dayRecords.length === 0 ? (
            <div className="py-4 text-body-sm text-foreground-secondary">这天没有记录</div>
          ) : (
            dayRecords.map((r) => (
              <div key={r.id} className="flex h-15 items-center gap-3">
                <IconBadge icon={CigaretteOff} size={32} color="red" />
                <div className="min-w-0 flex-1">
                  <div className="font-rounded text-body font-semibold">
                    {hhmm(new Date(r.relapsed_at))}
                  </div>
                  {r.note && (
                    <div className="truncate text-body-sm text-foreground-secondary">{r.note}</div>
                  )}
                </div>
                {confirmId === r.id ? (
                  <div className="flex shrink-0 items-center gap-3 text-body-sm">
                    <span className="text-foreground-secondary">删除？</span>
                    <button type="button" onClick={() => setConfirmId('')}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="text-red-solid"
                      onClick={() => onDelete(r.id)}
                    >
                      删除
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label="删除"
                    onClick={() => setConfirmId(r.id)}
                    className="flex size-8 shrink-0 items-center justify-center text-foreground-tertiary"
                  >
                    <Trash2 className="size-5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
