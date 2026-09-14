import { useState } from 'react'
import { DatePicker } from '@/components/DatePicker'
import { Sheet } from '@/components/Sheet'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { QuitRelapse } from '@/lib/database.types'
import { toDateString } from '@/lib/date'
import { useQuit } from './QuitLayout'
import { addRelapse, deleteRelapse, updateRelapse } from './data'

/** Date → 'HH:mm'。 */
const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** 'new' 表示新建，否则是在改这一条。 */
export type RelapseTarget = 'new' | QuitRelapse

/**
 * 记录 / 编辑一条破戒。计时页的「破戒」按钮和日历里的记录行共用这一个抽屉，
 * 靠 target 区分：新建时底部是取消 + 确认破戒，编辑时是保存 + 删除。
 */
export function QuitRelapseSheet({
  target,
  onClose,
}: {
  target: RelapseTarget
  onClose: () => void
}) {
  const { item, mock, reload } = useQuit()
  const creating = target === 'new'
  const initial = creating ? new Date() : new Date(target.relapsed_at)

  const [date, setDate] = useState(() => toDateString(initial))
  const [time, setTime] = useState(() => hhmm(initial))
  const [note, setNote] = useState(creating ? '' : (target.note ?? ''))
  /** 哪个按钮在转圈：保存和删除各转各的 */
  const [busy, setBusy] = useState<'' | 'save' | 'delete'>('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function save() {
    if (!item) return
    const when = new Date(`${date}T${time}`)
    if (Number.isNaN(when.getTime())) {
      toast('请选择破戒时间')
      return
    }
    // 日期选择器只挡到"今天"，今天里的时分仍可能超，这里再拦一次
    if (when.getTime() > Date.now()) {
      toast('破戒时间不能晚于现在')
      return
    }
    setBusy('save')
    try {
      if (!mock) {
        if (creating) await addRelapse(item, when.toISOString(), note)
        else await updateRelapse(item, target.id, when.toISOString(), note)
      }
      await reload()
      toast(creating ? '已记录' : '已保存')
      onClose()
    } catch (e) {
      // 失败时抽屉和已填内容都留着，用户可以改完再试
      toast(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setBusy('')
    }
  }

  async function remove() {
    if (creating) return
    setBusy('delete')
    try {
      if (!mock) await deleteRelapse(target.id)
      await reload()
      toast('已删除')
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : '删除失败，请重试')
    } finally {
      setBusy('')
    }
  }

  return (
    <Sheet open onClose={onClose} title={creating ? '记录破戒' : '编辑破戒'}>
      <FieldGroup>
        {/* DatePicker 是一组控件而不是单个输入框，没有可指的 id，label 渲染成 span */}
        <Field>
          <FieldLabel asChild>
            <span>日期</span>
          </FieldLabel>
          <DatePicker value={date} max={toDateString(new Date())} onChange={setDate} />
        </Field>
        <Field>
          <FieldLabel htmlFor="quit-time">时间</FieldLabel>
          <Input
            id="quit-time"
            type="time"
            className="tabular-nums"
            value={time}
            onChange={(e) => setTime(e.target.value)}
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

      {creating ? (
        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            loading={busy === 'save'}
            onClick={save}
          >
            确认破戒
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" className="w-full" disabled={!!busy} loading={busy === 'save'} onClick={save}>
            保存
          </Button>
          {/* 行内二次确认：第一次点变成"确定删除？"，再点一次才真删 */}
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            disabled={!!busy}
            loading={busy === 'delete'}
            onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
          >
            {confirmDelete ? '确定删除？' : '删除'}
          </Button>
        </div>
      )}
    </Sheet>
  )
}
