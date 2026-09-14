import { useEffect, useState } from 'react'
import { CigaretteOff } from 'lucide-react'
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
import { CalendarPanel } from './QuitCalendar'
import { useQuit } from './QuitLayout'
import { addRelapse, createItem } from './data'
import { computeStats, formatClock } from './stats'

/** Date → `<input type="datetime-local">` 的值（本地时区，精确到分钟）。 */
function toLocalInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
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
  const [at, setAt] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

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
    // 原生 max 只挡选择器，手输仍可能超，这里再拦一次
    if (new Date(at).getTime() > Date.now()) {
      toast('破戒时间不能晚于现在')
      return
    }
    setBusy(true)
    try {
      if (!mock) await addRelapse(item, new Date(at).toISOString(), note)
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
    <div className="flex flex-1 flex-col xl:flex-row xl:items-start xl:gap-6">
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

        <Card className="mt-4">
          <CardContent className="flex items-stretch">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">最长记录</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  {stats.longestDays}
                </span>
                <span className="text-sm text-muted-foreground">天</span>
              </div>
            </div>
            <Separator orientation="vertical" className="mx-4" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">总破戒</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  {stats.relapseCount}
                </span>
                <span className="text-sm text-muted-foreground">次</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          size="lg"
          className="mt-auto w-full xl:mt-6 xl:w-50"
          onClick={() => {
            setAt(toLocalInput(new Date()))
            setOpen(true)
          }}
        >
          破戒
        </Button>
      </div>

      {/* 电脑端 ≥1280px 并排：右列月历 */}
      <div className="hidden w-full xl:block xl:flex-1 xl:min-w-0">
        <CalendarPanel />
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="记录破戒">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="quit-at">时间</FieldLabel>
            <Input
              id="quit-at"
              type="datetime-local"
              max={toLocalInput(new Date(now))}
              className="tabular-nums"
              value={at}
              onChange={(e) => setAt(e.target.value)}
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
    </div>
  )
}
