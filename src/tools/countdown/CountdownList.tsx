import { CalendarDays, Plus, Repeat } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { cn } from 'cn'
import { SiteAction, roundButton } from '@/components/AppShell'
import { HeroCard } from '@/components/HeroCard'
import { IconBadge } from '@/components/IconBadge'
import { Button } from '@/components/ui/button'
import type { CountdownEvent } from '@/lib/database.types'
import { useEvents } from './data'
import type { Entry } from './rules'
import { REPEAT_LABEL, formatMonthDay, lunarText, parseDate, sortEvents } from './rules'

/** 重复事件用循环图标，一次性用日历图标。 */
const eventIcon = (event: CountdownEvent) =>
  event.repeat === 'none' ? CalendarDays : Repeat

/** 目标日期文字：农历事件显示农历，公历显示月日。 */
function dateText(event: CountdownEvent) {
  return event.is_lunar ? lunarText(event.date) : formatMonthDay(parseDate(event.date))
}

/** 天数 + 单位；今天不显示数字，显示 orange solid 的"今天"。 */
function Days({ days, size }: { days: number; size: 'hero' | 'row' }) {
  if (days === 0) {
    // 不走 cn：tailwind-merge 会把自定义字号 text-stat 和 text-tool-solid 当成同一组，吞掉颜色
    return (
      <div className={`font-rounded font-bold text-tool-solid ${size === 'hero' ? 'text-display' : 'text-stat'}`}>
        今天
      </div>
    )
  }
  const unit = days > 0 ? '天后' : '天前'
  if (size === 'hero') {
    return (
      <div className="flex items-baseline gap-1">
        <span className="font-rounded text-display">{Math.abs(days)}</span>
        <span className="text-caption text-foreground-secondary">{unit}</span>
      </div>
    )
  }
  return (
    <div className="text-right">
      <div className="font-rounded text-stat font-bold">{Math.abs(days)}</div>
      <div className="text-caption text-foreground-secondary">{unit}</div>
    </div>
  )
}

function Row({ entry, search }: { entry: Entry; search: string }) {
  const { event, occurrence } = entry
  const meta = [dateText(event), ...(event.is_lunar ? ['农历'] : []), REPEAT_LABEL[event.repeat]]
  return (
    <Link
      to={{ pathname: `/countdown/${event.id}`, search }}
      viewTransition
      className="flex min-h-16 items-center gap-3 py-2"
    >
      <IconBadge icon={eventIcon(event)} size={32} variant="soft" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-body">{event.title}</div>
        <div className="truncate text-caption text-foreground-secondary">{meta.join(' · ')}</div>
      </div>
      <Days days={occurrence.days} size="row" />
    </Link>
  )
}

function Empty({ search }: { search: string }) {
  return (
    <HeroCard className="flex flex-col items-center text-center">
      <IconBadge icon={CalendarDays} size={56} />
      <div className="mt-2 text-heading">还没有日子</div>
      <div className="text-body-sm text-foreground-secondary">添加第一个倒数日</div>
      <Button asChild className="mt-3 bg-tool-solid px-8 text-white">
        <Link to={{ pathname: '/countdown/new', search }} viewTransition>
          添加
        </Link>
      </Button>
    </HeroCard>
  )
}

/** embedded：电脑端新建/编辑面板下方的那份列表，不抢站点栏的操作位。 */
export function CountdownList({ embedded = false }: { embedded?: boolean }) {
  const { search } = useLocation()
  const { events, error } = useEvents()

  const addButton = (
    <Link
      to={{ pathname: '/countdown/new', search }}
      viewTransition
      aria-label="新建"
      className={cn(roundButton, 'bg-tool-solid text-white')}
    >
      <Plus />
    </Link>
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
        <h1 className="font-rounded text-title">倒数日</h1>
        {/* 电脑端站点栏没有返回按钮，"+" 跟在标题右边 */}
        <div className="hidden lg:block">{addButton}</div>
      </div>
      {error && <p className="text-caption text-red-solid">{error}</p>}
      {!events ? (
        /* 骨架屏：形状对应 Hero Card */
        <div className="h-52 animate-pulse rounded-md bg-tool-soft" />
      ) : entries.length === 0 ? (
        <Empty search={search} />
      ) : (
        <>
          <Link
            to={{ pathname: `/countdown/${hero.event.id}`, search }}
            viewTransition
            className="block"
          >
            <HeroCard>
              <IconBadge icon={eventIcon(hero.event)} size={56} />
              <div className="mt-4 text-caption text-foreground-secondary">
                {[hero.event.category, dateText(hero.event), REPEAT_LABEL[hero.event.repeat]].join(
                  ' · ',
                )}
              </div>
              <div className="mt-0.5 text-heading">{hero.event.title}</div>
              <div className="mt-1">
                <Days days={hero.occurrence.days} size="hero" />
              </div>
            </HeroCard>
          </Link>
          {rest.length > 0 && (
            <div className="mt-3 rounded-md bg-surface px-5 py-1">
              {rest.map((entry) => (
                <Row key={entry.event.id} entry={entry} search={search} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
