import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { cn } from '@/lib/cn'
import { SiteAction, roundButton } from '@/components/AppShell'
import { DatePicker } from '@/components/DatePicker'
import { Segmented } from '@/components/Segmented'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { CountdownEvent } from '@/lib/database.types'
import { CountdownList } from './CountdownList'
import type { EventInput } from './data'
import { categoriesOf, createEvent, deleteEvent, updateEvent, useEvents } from './data'
import { REPEAT_LABEL, toDateString } from './rules'

const REPEATS = (['none', 'yearly', 'monthly', 'weekly'] as const).map((value) => ({
  value,
  label: REPEAT_LABEL[value],
}))

const NEW_CATEGORY = '__new__'

const label = 'text-caption text-foreground-secondary'
/** 卡内输入框：--background 底、无边框。 */
const field = 'mt-1 border-0 bg-background'

function emptyForm(): EventInput {
  return {
    title: '',
    date: toDateString(new Date()),
    is_lunar: false,
    repeat: 'none',
    category: '生活',
    pinned: false,
    note: null,
  }
}

function SwitchRow({
  text,
  checked,
  onChange,
}: {
  text: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="mt-2 flex h-12 items-center justify-between">
      <span className="text-body">{text}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="h-6 w-11 data-[state=checked]:bg-tool-solid [&>*]:size-5"
      />
    </label>
  )
}

export function CountdownForm() {
  const { id } = useParams()
  const { search } = useLocation()
  const navigate = useNavigate()
  const { events, mock } = useEvents()

  const [form, setForm] = useState<EventInput>(emptyForm)
  const [loaded, setLoaded] = useState(!id)
  const [newCategory, setNewCategory] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 编辑态：列表读回来后把这条填进表单（只填一次，之后以用户输入为准）
  useEffect(() => {
    if (loaded || !id || !events) return
    const event = events.find((e) => e.id === id)
    if (event) setForm(toInput(event))
    setLoaded(true)
  }, [events, id, loaded])

  const categories = categoriesOf(events ?? [])
  const valid = form.title.trim() !== '' && form.date !== ''

  function patch(next: Partial<EventInput>) {
    setForm((prev) => {
      const merged = { ...prev, ...next }
      // 农历只允许不重复或每年；已经选了每月/每周再开农历，自动改回每年
      if (merged.is_lunar && (merged.repeat === 'monthly' || merged.repeat === 'weekly')) {
        merged.repeat = 'yearly'
      }
      return merged
    })
  }

  const back = () => navigate({ pathname: '/countdown', search })

  async function onSave() {
    if (!valid) return
    setBusy(true)
    try {
      const input = { ...form, title: form.title.trim(), note: form.note?.trim() || null }
      if (!mock) {
        if (id) await updateEvent(id, input)
        else await createEvent(input)
      }
      toast('已保存')
      back()
    } catch (e) {
      // 失败时留在表单页，用户填的内容还在
      toast(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    setBusy(true)
    try {
      if (!mock && id) await deleteEvent(id)
      toast('已删除')
      back()
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  const saveButton = (
    <button
      type="button"
      aria-label="保存"
      disabled={!valid || busy}
      onClick={onSave}
      className={cn(
        roundButton,
        valid ? 'bg-tool-solid text-white' : 'bg-surface text-foreground-tertiary',
      )}
    >
      <Check />
    </button>
  )

  return (
    <>
      {/* 电脑端列表仍可见，表单从右侧滑出盖在上面 */}
      <div className="hidden lg:block">
        <CountdownList embedded />
      </div>

      <SiteAction>
        <span className="lg:hidden">{saveButton}</span>
      </SiteAction>

      <div
        className={cn(
          'lg:fixed lg:inset-y-0 lg:right-0 lg:z-40 lg:w-100 lg:overflow-y-auto',
          'lg:rounded-l-lg lg:bg-surface-raised lg:p-6 lg:shadow-raised',
        )}
      >
        <div className="mt-1 mb-4 flex items-center justify-between lg:mt-0">
          <h1 className="font-rounded text-title">{id ? '编辑' : '新建'}</h1>
          <button
            type="button"
            aria-label="关闭"
            onClick={back}
            className={cn(roundButton, 'hidden size-8 lg:flex')}
          >
            <X />
          </button>
        </div>

        <div className="rounded-md bg-surface p-5 lg:rounded-none lg:bg-transparent lg:p-0">
          <div className={label}>标题</div>
          <Input
            className={field}
            placeholder="写点什么"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
          />

          <div className={cn(label, 'mt-4')}>日期</div>
          <DatePicker
            className="mt-1"
            value={form.date}
            showLunar={form.is_lunar}
            onChange={(date) => patch({ date })}
          />

          <SwitchRow
            text="按农历"
            checked={form.is_lunar}
            onChange={(is_lunar) => patch({ is_lunar })}
          />

          <div className={cn(label, 'mt-2')}>重复</div>
          <Segmented
            size="mini"
            className="mt-1 h-9"
            value={form.repeat}
            options={REPEATS.map((r) => ({
              ...r,
              // 农历只允许不重复或每年
              disabled: form.is_lunar && (r.value === 'monthly' || r.value === 'weekly'),
            }))}
            onChange={(repeat) => patch({ repeat })}
          />

          <div className={cn(label, 'mt-4')}>分类</div>
          <div className="-mx-5 mt-1 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setNewCategory(null)
                  patch({ category })
                }}
                className={cn(
                  'h-9 shrink-0 rounded-pill px-4 font-rounded text-body-sm font-semibold',
                  category === form.category && newCategory === null
                    ? 'bg-tool-soft text-tool-solid'
                    : 'bg-background text-foreground-secondary',
                )}
              >
                {category}
              </button>
            ))}
            {newCategory === null ? (
              <button
                key={NEW_CATEGORY}
                type="button"
                onClick={() => setNewCategory('')}
                className="h-9 shrink-0 rounded-pill bg-background px-4 font-rounded text-body-sm font-semibold text-foreground-secondary"
              >
                + 新分类
              </button>
            ) : (
              <input
                autoFocus
                placeholder="新分类"
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value)
                  patch({ category: e.target.value })
                }}
                className="h-9 w-28 shrink-0 rounded-pill bg-tool-soft px-4 font-rounded text-body-sm font-semibold text-tool-solid outline-none placeholder:text-foreground-tertiary"
              />
            )}
          </div>

          <SwitchRow text="置顶" checked={form.pinned} onChange={(pinned) => patch({ pinned })} />

          <div className={cn(label, 'mt-2')}>备注</div>
          <textarea
            rows={3}
            placeholder="写点什么"
            value={form.note ?? ''}
            onChange={(e) => patch({ note: e.target.value })}
            className="mt-1 w-full rounded-sm bg-background px-4 py-3.5 text-body outline-none placeholder:text-foreground-tertiary"
          />
        </div>

        {/* 电脑端面板底部的保存按钮；手机上用站点栏的 ✓ */}
        <Button
          className="mt-5 hidden w-full bg-tool-solid text-white lg:flex"
          disabled={!valid || busy}
          onClick={onSave}
        >
          保存
        </Button>

        {/* 行内二次确认：第一次点变成"确定删除？"，再点一次才真删 */}
        {id && (
          <Button
            variant="destructive"
            className="mt-3 w-full"
            disabled={busy}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          >
            {confirmDelete ? '确定删除？' : '删除'}
          </Button>
        )}
      </div>
    </>
  )
}

function toInput(event: CountdownEvent): EventInput {
  return {
    title: event.title,
    date: event.date,
    is_lunar: event.is_lunar,
    repeat: event.repeat,
    category: event.category,
    pinned: event.pinned,
    note: event.note,
  }
}
