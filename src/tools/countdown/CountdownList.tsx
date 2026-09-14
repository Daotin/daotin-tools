import { CalendarDays, Plus, Repeat } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
import { cn } from '@/lib/cn'
import { SiteAction } from '@/components/AppShell'
import { Badge } from '@/components/ui/badge'
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import type { CountdownEvent } from '@/lib/database.types'
import { EVENT_ICONS } from './icons'
import { useEvents } from './data'
import type { Entry } from './rules'
import { REPEAT_LABEL, formatMonthDay, lunarText, parseDate, sortEvents } from './rules'

/** 选了图标就用选的；没选时重复事件用循环图标，一次性用日历图标。 */
function EventIcon({ event, className }: { event: CountdownEvent; className?: string }) {
  const Icon = EVENT_ICONS[event.icon] ?? (event.repeat === 'none' ? CalendarDays : Repeat)
  return <Icon className={className} />
}

/** 目标日期文字：农历事件显示农历，公历显示月日。 */
function dateText(event: CountdownEvent) {
  return event.is_lunar ? lunarText(event.date) : formatMonthDay(parseDate(event.date))
}

/** 列表行第二行：日期取下一次发生日，农历再把农历写法放在前面。 */
function rowMeta({ event, occurrence }: Entry) {
  const date = formatMonthDay(occurrence.date)
  return [
    event.is_lunar ? `${lunarText(event.date)}（${date}）` : date,
    ...(event.is_lunar ? ['农历'] : []),
    REPEAT_LABEL[event.repeat],
  ].join(' · ')
}

/** 天数 + 单位；今天不显示数字，显示强调色的"今天"。 */
function Days({ days, size }: { days: number; size: 'hero' | 'row' }) {
  const hero = size === 'hero'
  if (days === 0) {
    return (
      <div
        className={cn(
          'font-bold tracking-tight text-primary',
          hero ? 'text-5xl' : 'text-2xl',
        )}
      >
        今天
      </div>
    )
  }
  const unit = days > 0 ? '天后' : '天前'
  if (hero) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold tracking-tight tabular-nums">{Math.abs(days)}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    )
  }
  return (
    <div className="text-right">
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{Math.abs(days)}</div>
      <div className="text-xs text-muted-foreground">{unit}</div>
    </div>
  )
}

function Row({ entry, search }: { entry: Entry; search: string }) {
  const { event, occurrence } = entry
  return (
    <Item asChild variant="outline" size="sm" className="item-in hover:bg-accent/50">
      <Link to={{ pathname: `/countdown/${event.id}`, search }} viewTransition>
        <ItemMedia>
          <EventIcon event={event} className="size-4 text-muted-foreground" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="max-w-full truncate">{event.title}</ItemTitle>
          <ItemDescription className="truncate text-xs">{rowMeta(entry)}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Days days={occurrence.days} size="row" />
        </ItemActions>
      </Link>
    </Item>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarDays />
        </EmptyMedia>
        <EmptyTitle>还没有日子</EmptyTitle>
        <EmptyDescription>添加第一个倒数日</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild size="lg">
          <Link to={{ pathname: '/countdown/new', search }} viewTransition>
            添加
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}

/** embedded：电脑端新建/编辑面板下方的那份列表，不抢站点栏的操作位。 */
export function CountdownList({ embedded = false }: { embedded?: boolean }) {
  const { search } = useLocation()
  const { events, error, reload } = useEvents()

  const addButton = (
    <Button asChild variant="ghost" size="icon" aria-label="新建">
      <Link to={{ pathname: '/countdown/new', search }} viewTransition>
        <Plus />
      </Link>
    </Button>
  )

  const entries = events ? sortEvents(events) : []
  const [hero, ...rest] = entries

  return (
    <>
      {/* 手机放站点栏，电脑放标题右边（电脑站点栏没有返回按钮，孤零零一个按钮不好看） */}
      {!embedded && (
        <SiteAction>
          <span className="lg:hidden">{addButton}</span>
        </SiteAction>
      )}
      <div className="mt-1 mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">倒数日</h1>
        {/* 电脑端站点栏没有返回按钮，"+" 跟在标题右边 */}
        <div className="hidden lg:block">{addButton}</div>
      </div>
      <InlineError message={error} onRetry={() => void reload()} />
      {!events ? (
        /* 骨架屏：形状对应 Hero Card */
        <PageSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <>
          <Link
            to={{ pathname: `/countdown/${hero.event.id}`, search }}
            viewTransition
            className="block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Card className="fade-in transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <EventIcon event={hero.event} className="size-4 text-tool" />
                  <span className="truncate">{hero.event.title}</span>
                </CardTitle>
                <CardDescription>
                  {[dateText(hero.event), REPEAT_LABEL[hero.event.repeat]].join(' · ')}
                </CardDescription>
                <CardAction>
                  <Badge variant="secondary">{hero.event.category}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Days days={hero.occurrence.days} size="hero" />
              </CardContent>
            </Card>
          </Link>
          {rest.length > 0 && (
            <ItemGroup className="mt-3 gap-2">
              {rest.map((entry) => (
                <Row key={entry.event.id} entry={entry} search={search} />
              ))}
            </ItemGroup>
          )}
        </>
      )}
    </>
  )
}
