import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { cn } from '@/lib/cn'
import { SiteAction } from '@/components/AppShell'
import { DatePicker } from '@/components/DatePicker'
import { Segmented } from '@/components/Segmented'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
  id,
  text,
  checked,
  onChange,
}: {
  id: string
  text: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <FieldLabel htmlFor={id} className="font-normal">
        {text}
      </FieldLabel>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Field>
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

  const saveButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label="保存"
      disabled={!valid || !!busy}
      loading={busy === 'save'}
      onClick={onSave}
    >
      <Check />
    </Button>
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
          'lg:rounded-l-xl lg:border-l lg:bg-popover lg:p-6 lg:shadow-lg',
        )}
      >
        <div className="mt-1 mb-4 flex items-center justify-between lg:mt-0">
          <h1 className="text-2xl font-semibold tracking-tight">{id ? '编辑' : '新建'}</h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="关闭"
            onClick={back}
            className="hidden lg:flex"
          >
            <X />
          </Button>
        </div>

        <Card className="lg:rounded-none lg:border-0 lg:bg-transparent lg:py-0 lg:shadow-none">
          <CardContent className="lg:px-0">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="countdown-title">标题</FieldLabel>
                <Input
                  id="countdown-title"
                  placeholder="写点什么"
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </Field>

              {/* DatePicker / Segmented / 分类是一组控件而不是单个输入框，没有可指的 id，
                  用 asChild 渲染成 span，避免留下指不到控件的空 label */}
              <Field>
                <FieldLabel asChild>
                  <span>日期</span>
                </FieldLabel>
                <DatePicker
                  value={form.date}
                  showLunar={form.is_lunar}
                  onChange={(date) => patch({ date })}
                />
              </Field>

              <SwitchRow
                id="countdown-lunar"
                text="按农历"
                checked={form.is_lunar}
                onChange={(is_lunar) => patch({ is_lunar })}
              />

              <Field>
                <FieldLabel asChild>
                  <span>重复</span>
                </FieldLabel>
                <Segmented
                  size="mini"
                  className="h-9"
                  value={form.repeat}
                  options={REPEATS.map((r) => ({
                    ...r,
                    // 农历只允许不重复或每年
                    disabled: form.is_lunar && (r.value === 'monthly' || r.value === 'weekly'),
                  }))}
                  onChange={(repeat) => patch({ repeat })}
                />
              </Field>

              <Field>
                <FieldLabel asChild>
                  <span>分类</span>
                </FieldLabel>
                <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      size="sm"
                      variant={
                        category === form.category && newCategory === null ? 'default' : 'outline'
                      }
                      className="shrink-0 rounded-full"
                      onClick={() => {
                        setNewCategory(null)
                        patch({ category })
                      }}
                    >
                      {category}
                    </Button>
                  ))}
                  {newCategory === null ? (
                    <Button
                      key={NEW_CATEGORY}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={() => setNewCategory('')}
                    >
                      + 新分类
                    </Button>
                  ) : (
                    <Input
                      autoFocus
                      placeholder="新分类"
                      value={newCategory}
                      onChange={(e) => {
                        setNewCategory(e.target.value)
                        patch({ category: e.target.value })
                      }}
                      className="h-8 w-28 shrink-0 rounded-full"
                    />
                  )}
                </div>
              </Field>

              <SwitchRow
                id="countdown-pinned"
                text="置顶"
                checked={form.pinned}
                onChange={(pinned) => patch({ pinned })}
              />

              <Field>
                <FieldLabel htmlFor="countdown-note">备注</FieldLabel>
                <Textarea
                  id="countdown-note"
                  rows={3}
                  placeholder="写点什么"
                  value={form.note ?? ''}
                  onChange={(e) => patch({ note: e.target.value })}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* 电脑端面板底部的保存按钮；手机上用站点栏的 ✓ */}
        <Button
          className="mt-5 hidden w-full lg:flex"
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
            className="mt-3 h-11 w-full lg:h-9"
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
