import { Pencil } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { InlineError } from '@/components/InlineError'
import { PageSkeleton } from '@/components/Skeleton'
import type { CountdownEvent } from '@/lib/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useEvents } from './data'
import { REPEAT_LABEL, formatFullDate, lunarText, nextOccurrence } from './rules'

export function CountdownDetail() {
  const { id } = useParams()
  const { search } = useLocation()
  const { events, error, reload } = useEvents()
  const event = events?.find((e) => e.id === id)

  return (
    <>
      <h1 className="mt-1 mb-4 text-2xl font-semibold tracking-tight">倒数日</h1>
      <InlineError message={error} onRetry={() => void reload()} />
      {!events ? (
        <PageSkeleton />
      ) : !event ? (
        <p className="text-sm text-muted-foreground">这条记录不存在</p>
      ) : (
        <Detail event={event} search={search} />
      )}
    </>
  )
}

/** 详情里的一行"字段名 / 值"。 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function Detail({ event, search }: { event: CountdownEvent; search: string }) {
  const { date, days } = nextOccurrence(event)
  const unit = days === 0 ? '' : days > 0 ? '天后' : '天前'

  return (
    <Card className="fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{event.title}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{event.category}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-5xl font-bold tracking-tight tabular-nums ${days === 0 ? 'text-primary' : ''}`}
          >
            {days === 0 ? '今天' : Math.abs(days)}
          </span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        <Separator className="my-4" />
        <DetailRow label="目标日期" value={formatFullDate(date)} />
        {event.is_lunar && <DetailRow label="农历" value={lunarText(event.date)} />}
        <DetailRow label="重复" value={REPEAT_LABEL[event.repeat]} />
        {event.note && (
          <>
            <Separator className="my-4" />
            <div className="text-xs text-muted-foreground">备注</div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{event.note}</p>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to={{ pathname: `/countdown/${event.id}/edit`, search }} viewTransition>
            <Pencil />
            编辑
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
