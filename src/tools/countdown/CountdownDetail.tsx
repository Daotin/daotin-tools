import { Pencil } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
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
      <h1 className="mt-1 mb-4 font-rounded text-title">倒数日</h1>
      <InlineError message={error} onRetry={() => void reload()} />
      {!events ? (
        <PageSkeleton />
      ) : !event ? (
        <p className="text-body-sm text-foreground-secondary">这条记录不存在</p>
      ) : (
        <Detail event={event} search={search} />
      )}
    </>
  )
}

function Detail({ event, search }: { event: CountdownEvent; search: string }) {
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
        {/* 卡底本身就是 --tool-soft，secondary 胶囊在上面看不见，底改成白卡色、字仍是 --tool-solid */}
        <Link
          to={{ pathname: `/countdown/${event.id}/edit`, search }}
          viewTransition
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-pill bg-surface px-5 font-rounded text-body-sm font-semibold text-tool-solid transition-transform active:scale-[0.97]"
        >
          <Pencil className="size-4" />
          编辑
        </Link>
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
