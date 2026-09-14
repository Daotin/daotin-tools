import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Sheet } from '@/components/Sheet'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { Period } from '@/lib/database.types'
import { toDateString } from '@/lib/date'
import type { PeriodInput } from './data'

const label = 'text-caption text-foreground-secondary'
/** 卡内输入框：--background 底、无边框。 */
const field = 'mt-1 border-0 bg-background font-rounded'

/** 今天的 'YYYY-MM-DD'，给 <input type="date"> 的 max 和校验共用。 */
const todayString = () => toDateString(new Date())

/**
 * 校验：开始日、结束日都不能晚于今天，结束日不能早于开始日，且不能与其他记录重叠。
 * 其他记录没填结束日时只占开始日那一天（它的推算区间不是用户确认过的事实）。
 */
export function validate(input: PeriodInput, others: Period[]): string {
  if (!input.start_date) return '请选择开始日'
  const today = todayString()
  if (input.start_date > today) return '开始日不能晚于今天'
  if (input.end_date && input.end_date > today) return '结束日不能晚于今天'
  if (input.end_date && input.end_date < input.start_date) return '结束日不能早于开始日'
  const end = input.end_date ?? input.start_date
  for (const other of others) {
    const otherEnd = other.end_date ?? other.start_date
    if (input.start_date <= otherEnd && other.start_date <= end) {
      return '这段时间和另一条记录重叠了'
    }
  }
  return ''
}

/** 编辑一条经期记录的抽屉（电脑端是居中对话框）。 */
export function PeriodEditor({
  period,
  others,
  onClose,
  onSave,
  onDelete,
}: {
  period: Period
  /** 除这条以外的全部记录，用来查重叠 */
  others: Period[]
  onClose: () => void
  /** 返回 false 表示写失败（页面已 toast），抽屉留着不关 */
  onSave: (input: PeriodInput) => Promise<boolean>
  onDelete: () => Promise<boolean>
}) {
  const [start, setStart] = useState(period.start_date)
  const [end, setEnd] = useState(period.end_date ?? '')
  const [open, setOpen] = useState(period.end_date === null)
  /** 哪个按钮在转圈：保存和删除各转各的 */
  const [busy, setBusy] = useState<'' | 'save' | 'delete'>('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const input: PeriodInput = { start_date: start, end_date: open ? null : end || null }
  const error = validate(input, others)

  async function save() {
    if (error) return
    setBusy('save')
    try {
      if (!(await onSave(input))) return
      toast('已保存')
      onClose()
    } finally {
      setBusy('')
    }
  }

  async function remove() {
    setBusy('delete')
    try {
      if (!(await onDelete())) return
      toast('已删除')
      onClose()
    } finally {
      setBusy('')
    }
  }

  return (
    <Sheet open onClose={onClose} title="编辑记录">
      <div className={cn(label, 'mt-4')}>开始日</div>
      <Input
        type="date"
        className={field}
        max={todayString()}
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />

      <div className={cn(label, 'mt-4')}>结束日</div>
      <Input
        type="date"
        className={field}
        max={todayString()}
        disabled={open}
        value={open ? '' : end}
        onChange={(e) => setEnd(e.target.value)}
      />

      <label className="mt-2 flex h-12 items-center justify-between">
        <span className="text-body">未结束</span>
        <Switch
          checked={open}
          onCheckedChange={(next) => {
            setOpen(next)
            if (next) setEnd('')
          }}
          className="h-6 w-11 data-[state=checked]:bg-tool-solid [&>*]:size-5"
        />
      </label>

      {error && <p className="mt-1 text-caption text-red-solid">{error}</p>}

      <Button
        className="mt-4 w-full bg-tool-solid text-white"
        disabled={!!error || !!busy}
        loading={busy === 'save'}
        onClick={save}
      >
        保存
      </Button>
      {/* 行内二次确认：第一次点变成"确定删除？"，再点一次才真删 */}
      <Button
        variant="destructive"
        className="mt-3 w-full"
        disabled={!!busy}
        loading={busy === 'delete'}
        onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
      >
        {confirmDelete ? '确定删除？' : '删除'}
      </Button>
    </Sheet>
  )
}
