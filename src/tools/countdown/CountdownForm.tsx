import { useEffect, useState } from 'react'
import { Check, LoaderCircle, X } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { cn } from '@/lib/cn'
import { SiteAction, roundButton } from '@/components/AppShell'
import { DatePicker } from '@/components/DatePicker'
import { Segmented } from '@/components/Segmented'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
  /** 哪个按钮在转圈：保存和删除各转各的 */
  const [busy, setBusy] = useState<'' | 'save' | 'delete'>('')
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
    setBusy('save')
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
      setBusy('')
    }
  }

  async function onDelete() {
    setBusy('delete')
    try {
      if (!mock && id) await deleteEvent(id)
      toast('已删除')
      back()
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败，请重试')
    } finally {
      setBusy('')
    }
  }

  /* 站点栏的圆形 ✓ 不是 Button 组件，保存时把图标换成同尺寸的转圈，尺寸不变 */
  const saveButton = (
    <button
      type="button"
      aria-label="保存"
      disabled={!valid || !!busy}
      aria-busy={busy === 'save' || undefined}
      onClick={onSave}
      className={cn(
        roundButton,
        valid ? 'bg-tool-solid text-white' : 'bg-surface text-foreground-tertiary',
      )}
    >
      {busy === 'save' ? <LoaderCircle className="animate-spin" /> : <Check />}
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
          <Label htmlFor="countdown-title">标题</Label>
          <Input
            id="countdown-title"
            className={field}
            placeholder="写点什么"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
          />

          {/* DatePicker / Segmented / 分类是一组控件而不是单个输入框，没有可指的 id，
              用 asChild 渲染成 span，避免留下指不到控件的空 label */}
          <Label asChild className="mt-4">
            <span>日期</span>
          </Label>
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

          <Label asChild className="mt-2">
            <span>重复</span>
          </Label>
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

          <Label asChild className="mt-4">
            <span>分类</span>
          </Label>
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
                className="h-9 w-28 shrink-0 rounded-pill bg-tool-soft px-4 font-rounded text-body-sm font-semibold text-tool-solid outline-none placeholder:text-foreground-secondary"
              />
            )}
          </div>

          <SwitchRow text="置顶" checked={form.pinned} onChange={(pinned) => patch({ pinned })} />

          <Label htmlFor="countdown-note" className="mt-2">
            备注
          </Label>
          <Textarea
            id="countdown-note"
            rows={3}
            className="mt-1"
            placeholder="写点什么"
            value={form.note ?? ''}
            onChange={(e) => patch({ note: e.target.value })}
          />
        </div>

        {/* 电脑端面板底部的保存按钮；手机上用站点栏的 ✓ */}
        <Button
          className="mt-5 hidden w-full bg-tool-solid text-white lg:flex"
          disabled={!valid || !!busy}
          loading={busy === 'save'}
          onClick={onSave}
        >
          保存
        </Button>

        {/* 行内二次确认：第一次点变成"确定删除？"，再点一次才真删 */}
        {id && (
          <Button
            variant="destructive"
            className="mt-3 w-full"
            disabled={!!busy}
            loading={busy === 'delete'}
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
