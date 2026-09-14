import { lazy, Suspense, useEffect, useState } from 'react'
import { CigaretteOff } from 'lucide-react'
import { DatePicker } from '@/components/DatePicker'
import { Sheet } from '@/components/Sheet'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toDateString } from '@/lib/date'
import { useMediaQuery } from '@/lib/media'
import { CalendarPanel } from './QuitCalendar'
import { useQuit } from './QuitLayout'
import { addRelapse, createItem } from './data'
import { computeStats, formatClock } from './stats'

// 电脑端把统计直接排在计时下面，不再走 tab；recharts 只在这时候才下载
const QuitStats = lazy(() => import('./QuitStats').then((m) => ({ default: m.QuitStats })))

/** Date → 'HH:mm'，给 `<input type="time">` 和文案共用。 */
const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

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
  return `自 ${d.getMonth() + 1} 月 ${d.getDate()} 日 ${hhmm(d)} 起`
}

export function QuitTimer() {
  const { item, relapses, mock, reload } = useQuit()
  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  /** 破戒时刻拆成日期和时分两个控件（shadcn 的日期时间范式） */
  const [atDate, setAtDate] = useState('')
  const [atTime, setAtTime] = useState('')
  const [note, setNote] = useState('')
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

  async function onConfirm() {
    if (!item) return
    const when = new Date(`${atDate}T${atTime}`)
    if (Number.isNaN(when.getTime())) {
      toast('请选择破戒时间')
      return
    }
    // 日期选择器只挡到"今天"，今天里的时分仍可能超，这里再拦一次
    if (when.getTime() > Date.now()) {
      toast('破戒时间不能晚于现在')
      return
    }
    setBusy(true)
    try {
      if (!mock) await addRelapse(item, when.toISOString(), note)
      await reload()
      setOpen(false)
      setNote('')
      toast('已记录')
    } catch (e) {
      // 失败时抽屉和已填内容都留着，用户可以改完再试
      toast(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setBusy(false)
    }
  }

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
            onClick={() => {
              const d = new Date()
              setAtDate(toDateString(d))
              setAtTime(hhmm(d))
              setOpen(true)
            }}
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

      <Sheet open={open} onClose={() => setOpen(false)} title="记录破戒">
        <FieldGroup>
          {/* DatePicker 是一组控件而不是单个输入框，没有可指的 id，label 渲染成 span */}
          <Field>
            <FieldLabel asChild>
              <span>日期</span>
            </FieldLabel>
            <DatePicker value={atDate} max={toDateString(new Date(now))} onChange={setAtDate} />
          </Field>
          <Field>
            <FieldLabel htmlFor="quit-time">时间</FieldLabel>
            <Input
              id="quit-time"
              type="time"
              className="tabular-nums"
              value={atTime}
              onChange={(e) => setAtTime(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="quit-note">备注（可选）</FieldLabel>
            <Input
              id="quit-note"
              placeholder="写点什么"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            loading={busy}
            onClick={onConfirm}
          >
            确认破戒
          </Button>
        </div>
      </Sheet>
    </>
  )
}
