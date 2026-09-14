import { lazy, Suspense, useEffect, useState } from 'react'
import { CigaretteOff } from 'lucide-react'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { useMediaQuery } from '@/lib/media'
import { CalendarPanel } from './QuitCalendar'
import { useQuit } from './QuitLayout'
import { QuitRelapseSheet } from './QuitRelapseSheet'
import { createItem } from './data'
import { computeStats, formatClock } from './stats'

// 电脑端把统计直接排在计时下面，不再走 tab；recharts 只在这时候才下载
const QuitStats = lazy(() => import('./QuitStats').then((m) => ({ default: m.QuitStats })))

/** 计时卡下面那排数字，一格一个。 */
function Num({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

function formatStart(ms: number) {
  const d = new Date(ms)
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `自 ${d.getMonth() + 1} 月 ${d.getDate()} 日 ${time} 起`
}

export function QuitTimer() {
  const { item, relapses, mock, reload } = useQuit()
  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const desktop = useMediaQuery('(min-width: 80rem)')

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!item) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CigaretteOff className="text-tool" />
          </EmptyMedia>
          <EmptyTitle>准备好了吗</EmptyTitle>
          <EmptyDescription>点击开始，从现在计时</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            size="lg"
            className="px-8"
            loading={busy}
            onClick={async () => {
              setBusy(true)
              try {
                if (!mock) await createItem(new Date().toISOString())
                await reload()
              } catch (e) {
                toast(e instanceof Error ? e.message : '保存失败，请重试')
              } finally {
                setBusy(false)
              }
            }}
          >
            开始计时
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const stats = computeStats(item.start_at, relapses, now)

  return (
    <>
      <div className="flex flex-col max-xl:flex-1 xl:flex-row xl:items-start xl:gap-6">
        <div className="flex flex-1 flex-col xl:min-w-0">
          <Card className="fade-in">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CigaretteOff className="size-4 text-tool" />
                已坚持
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight tabular-nums">
                  {stats.currentDays}
                </span>
                <span className="text-sm text-muted-foreground">天</span>
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {formatClock(stats.currentMs)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {formatStart(stats.streakStart)}
              </div>
            </CardContent>
          </Card>

          {/* 电脑端统计就排在下面，这排数字顺带把"累计天数"也接过来，统计里就不重复了 */}
          <Card className="mt-4">
            <CardContent className="flex items-stretch">
              <Num label="最长记录" value={stats.longestDays} unit="天" />
              {desktop && (
                <>
                  <Separator orientation="vertical" className="mx-4" />
                  <Num label="累计天数" value={stats.totalDays} unit="天" />
                </>
              )}
              <Separator orientation="vertical" className="mx-4" />
              <Num label="总破戒" value={stats.relapseCount} unit="次" />
            </CardContent>
          </Card>

          <Button
            variant="destructive"
            size="lg"
            className="mt-auto w-full xl:mt-6 xl:w-50"
            onClick={() => setOpen(true)}
          >
            破戒
          </Button>
        </div>

        {/* 电脑端 ≥1280px 并排：右列月历，所以电脑端没有"日历"这个 tab */}
        {desktop && (
          <div className="w-full xl:flex-1 xl:min-w-0">
            <CalendarPanel />
          </div>
        )}
      </div>

      {/* 统计同理，电脑端直接铺在下面，不再单独占一个 tab */}
      {desktop && (
        <div className="mt-6">
          <Suspense fallback={null}>
            <QuitStats embedded />
          </Suspense>
        </div>
      )}

      {open && <QuitRelapseSheet target="new" onClose={() => setOpen(false)} />}
    </>
  )
}
