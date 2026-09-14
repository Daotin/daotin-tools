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
import { Segmented } from '@/components/Segmented'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemDescription,
} from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
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
  // 语汇跟 ui/calendar 一致：选中 bg-primary、今天 bg-accent。
  // 破戒日另起一行标记（一次一个点，多次写次数），不靠底色，跟选中/今天叠加也看得见。
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        size === 'week' ? 'h-14' : 'h-11',
      )}
    >
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-md text-sm font-medium tabular-nums',
          future && 'text-muted-foreground/70',
          count > 0 && !today && !selected && 'text-destructive',
          today && !selected && 'bg-accent text-accent-foreground',
          selected && 'bg-primary text-primary-foreground',
        )}
      >
        {date.getDate()}
      </span>
      <span className="flex h-2.5 items-center justify-center">
        {count === 1 && <span className="size-1.5 rounded-full bg-destructive" />}
        {count > 1 && (
          <span className="text-[10px] leading-none font-medium text-destructive tabular-nums">
            {count}×
          </span>
        )}
      </span>
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
  /** 正在请求删除的那条（转圈）；删完才轮到 removingId 播退场动画 */
  const [deletingId, setDeletingId] = useState('')
  const [removingId, setRemovingId] = useState('')

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
    setDeletingId(id)
    try {
      if (!mock) await deleteRelapse(id)
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败，请重试')
      return
    } finally {
      setDeletingId('')
    }
    setConfirmId('')
    // 先让这一行播完退场动画再刷新列表，否则刷新一回来节点直接没了，看不到动画
    setRemovingId(id)
    await new Promise((r) => setTimeout(r, 200))
    await reload()
    setRemovingId('')
  }

  return (
    <>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="上一个"
              className="size-8 shrink-0"
              onClick={() => shift(-1)}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <span className="min-w-0 truncate">{title}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="下一个"
              className="size-8 shrink-0"
              onClick={() => shift(1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          </CardTitle>
          <CardDescription>
            {periodLabel}破戒 {inRange.length} 次
          </CardDescription>
          <CardAction>
            <Segmented
              size="mini"
              className="w-30 shrink-0"
              value={view}
              options={[
                { value: 'week', label: '周' },
                { value: 'month', label: '月' },
                { value: 'year', label: '年' },
              ]}
              onChange={setView}
            />
          </CardAction>
        </CardHeader>

        <CardContent>
          {view === 'year' ? (
            /* 格子写死 8px、间距 2px：跟着列宽走的话 390px 上一个迷你月就有 98px 宽，12 个月撑出滚动条 */
            <div className="grid grid-cols-3 justify-items-center gap-3">
              {Array.from({ length: 12 }, (_, m) => (
                <div key={m}>
                  <div className="text-xs text-muted-foreground">{m + 1} 月</div>
                  <div className="mt-1 grid grid-cols-7 gap-0.5">
                    {monthCells(new Date(anchor.getFullYear(), m, 1)).map((d, i) => (
                      <i
                        key={i}
                        className={cn(
                          'size-2 rounded-[2px]',
                          d && (countOf(d) > 0 ? 'bg-destructive' : 'bg-muted'),
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((w) => (
                <div key={w} className="pb-1 text-center text-xs text-muted-foreground">
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
        </CardContent>
      </Card>

      {view !== 'year' && selected && (
        <Card className="mt-4 py-2">
          <CardContent className="px-2">
            {dayRecords.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground">这天没有记录</div>
            ) : (
              <ItemGroup>
                {dayRecords.map((r) => (
                  <Item
                    key={r.id}
                    size="sm"
                    className={cn('item-in', removingId === r.id && 'item-out')}
                  >
                    <ItemMedia>
                      <CigaretteOff className="size-4 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="tabular-nums">{hhmm(new Date(r.relapsed_at))}</ItemTitle>
                      {r.note && <ItemDescription>{r.note}</ItemDescription>}
                    </ItemContent>
                    <ItemActions>
                      {confirmId === r.id ? (
                        <>
                          <span className="text-sm text-muted-foreground">删除？</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!!deletingId}
                            onClick={() => setConfirmId('')}
                          >
                            取消
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={!!deletingId}
                            aria-busy={deletingId === r.id || undefined}
                            onClick={() => onDelete(r.id)}
                          >
                            {deletingId === r.id ? <Spinner /> : '删除'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="删除"
                          className="text-muted-foreground"
                          onClick={() => setConfirmId(r.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
