import { useEffect, useState } from 'react'
import { CigaretteOff } from 'lucide-react'
import { HeroCard } from '@/components/HeroCard'
import { IconBadge } from '@/components/IconBadge'
import { Sheet } from '@/components/Sheet'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <HeroCard className="flex flex-col items-center text-center">
        <IconBadge icon={CigaretteOff} size={56} />
        <div className="mt-2 text-heading">准备好了吗</div>
        <div className="text-body-sm text-foreground-secondary">点击开始，从现在计时</div>
        <Button
          className="mt-3 px-8 bg-tool-solid text-white"
          disabled={busy}
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
      </HeroCard>
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
        <HeroCard>
          <IconBadge icon={CigaretteOff} size={56} />
          <div className="mt-4 text-caption text-foreground-secondary">已坚持</div>
          <div className="flex items-baseline gap-1">
            <span className="font-rounded text-display">{stats.currentDays}</span>
            <span className="text-caption text-foreground-secondary">天</span>
          </div>
          <div className="mt-1 font-rounded text-display-sm">{formatClock(stats.currentMs)}</div>
          <div className="mt-1 text-body-sm text-foreground-secondary">
            {formatStart(stats.streakStart)}
          </div>
        </HeroCard>

        <div className="mt-3 grid grid-cols-2 gap-4 rounded-md bg-surface p-5">
          <div>
            <div className="text-caption text-foreground-secondary">最长记录</div>
            <div className="flex items-baseline gap-1">
              <span className="font-rounded text-stat">{stats.longestDays}</span>
              <span className="text-caption text-foreground-secondary">天</span>
            </div>
          </div>
          <div>
            <div className="text-caption text-foreground-secondary">总破戒</div>
            <div className="flex items-baseline gap-1">
              <span className="font-rounded text-stat">{stats.relapseCount}</span>
              <span className="text-caption text-foreground-secondary">次</span>
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
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
        <div className="mt-4">
          <label htmlFor="quit-at" className="text-caption text-foreground-secondary">
            时间
          </label>
          <Input
            id="quit-at"
            type="datetime-local"
            max={toLocalInput(new Date(now))}
            className="mt-1 border-0 bg-background font-rounded"
            value={at}
            onChange={(e) => setAt(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <label htmlFor="quit-note" className="text-caption text-foreground-secondary">
            备注（可选）
          </label>
          <Input
            id="quit-note"
            className="mt-1 border-0 bg-background"
            placeholder="写点什么"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button variant="destructive" className="flex-1" disabled={busy} onClick={onConfirm}>
            确认破戒
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
