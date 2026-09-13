import { Pencil } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
import { SiteAction, roundButton } from '@/components/AppShell'
import type { CountdownEvent } from '@/lib/database.types'
import { HeroCard } from '@/components/HeroCard'
import { useEvents } from './data'
import { REPEAT_LABEL, formatFullDate, lunarText, nextOccurrence } from './rules'

export function CountdownDetail() {
  const { id } = useParams()
  const { search } = useLocation()
  const { events, error, reload } = useEvents()
  const event = events?.find((e) => e.id === id)

  return (
    <>
      {event && (
        <SiteAction>
          <Link
            to={{ pathname: `/countdown/${event.id}/edit`, search }}
            viewTransition
            aria-label="编辑"
            className={roundButton}
          >
            <Pencil />
          </Link>
        </SiteAction>
      )}
      <h1 className="mt-1 mb-4 font-rounded text-title">倒数日</h1>
      <InlineError message={error} onRetry={() => void reload()} />
      {!events ? (
        <PageSkeleton />
      ) : !event ? (
        <p className="text-body-sm text-foreground-secondary">这条记录不存在</p>
      ) : (
        <Detail event={event} />
      )}
    </>
  )
}

function Detail({ event }: { event: CountdownEvent }) {
  const { date, days } = nextOccurrence(event)
  const unit = days === 0 ? '' : days > 0 ? '天后' : '天前'

  return (
    <>
      <HeroCard>
        <div className="flex items-baseline gap-1">
          {/* 不走 cn：tailwind-merge 会把自定义字号 text-display 和 text-tool-solid 当成同一组 */}
          <span className={`font-rounded text-display ${days === 0 ? 'text-tool-solid' : ''}`}>
            {days === 0 ? '今天' : Math.abs(days)}
          </span>
          {unit && <span className="text-caption text-foreground-secondary">{unit}</span>}
        </div>
        <div className="mt-2 text-heading">{event.title}</div>
        <div className="mt-2 text-body-sm text-foreground-secondary">
          目标日期：{formatFullDate(date)}
        </div>
        {event.is_lunar && (
          <div className="text-body-sm text-foreground-secondary">
            农历：{lunarText(event.date)}
          </div>
        )}
        <div className="text-body-sm text-foreground-secondary">
          重复：{REPEAT_LABEL[event.repeat]}
        </div>
        <div className="text-body-sm text-foreground-secondary">分类：{event.category}</div>
      </HeroCard>
      {event.note && (
        <div className="mt-3 rounded-md bg-surface p-5">
          <div className="text-caption text-foreground-secondary">备注</div>
          <div className="mt-1 text-body">{event.note}</div>
        </div>
      )}
    </>
  )
}
