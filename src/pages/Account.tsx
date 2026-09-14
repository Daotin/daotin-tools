import { useState } from 'react'
import { Download, KeyRound, LoaderCircle, Mail, Upload } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ListRow } from '@/components/ListRow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ItemGroup } from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useSession } from '@/lib/auth'
import {
  TABLE_LABELS,
  TABLES,
  downloadBackup,
  exportBackup,
  parseBackup,
  restoreBackup,
  type TableProgress,
} from '@/lib/backup'
import { supabase } from '@/lib/supabase'

export function Account() {
  const { session } = useSession()
  const [exporting, setExporting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

  async function onExport() {
    setError('')
    setExporting(true)
    try {
      downloadBackup(await exportBackup())
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">账号</h1>
      <ItemGroup className="gap-2">
        <ListRow icon={Mail} label={session?.user.email ?? ''} />
        <ListRow icon={KeyRound} label="修改密码" to="/account/password" />
      </ItemGroup>

      <Separator className="my-6" />

      <ItemGroup className="gap-2">
        <ListRow
          icon={Download}
          label="导出全部数据"
          onClick={exporting ? undefined : onExport}
          trailing={
            exporting ? (
              <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
            ) : undefined
          }
        />
        <ListRow icon={Upload} label="从备份恢复" to="/account/restore" />
      </ItemGroup>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button
        variant="outline"
        className="mt-8 w-full text-destructive hover:text-destructive"
        loading={signingOut}
        onClick={async () => {
          setSigningOut(true)
          // 成功时会跳回登录页，这个组件跟着卸载，不用再收 signingOut
          try {
            await supabase.auth.signOut()
          } catch {
            setSigningOut(false)
          }
        }}
      >
        退出登录
      </Button>
    </>
  )
}

export function AccountPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('两次输入的密码不一样')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/account')
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">修改密码</h1>
      <Card>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">新密码</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FieldDescription>至少 6 位</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">确认新密码</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </Field>
              {error && <FieldError errors={[{ message: error }]} />}
              <Field>
                <Button type="submit" loading={saving}>
                  保存
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

function progressText(p: TableProgress) {
  if (p.status === 'failed') return `失败：${p.error}`
  if (p.status === 'done') return `已写入 ${p.written} 行`
  return p.written ? `已写入 ${p.written} 行` : '待处理'
}

export function AccountRestore() {
  const [file, setFile] = useState<File | null>(null)
  const [crossAccount, setCrossAccount] = useState(false)
  const [progress, setProgress] = useState<TableProgress[] | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  async function onStart() {
    if (!file) return
    setError('')
    setDone(false)
    setRunning(true)
    try {
      const backup = parseBackup(await file.text())
      await restoreBackup(backup, crossAccount, setProgress)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '恢复失败')
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">从备份恢复</h1>
      <Card>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="backup-file">备份文件</FieldLabel>
              <Input
                id="backup-file"
                type="file"
                accept="application/json,.json"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Field>
            <Field orientation="horizontal">
              <Switch id="cross-account" checked={crossAccount} onCheckedChange={setCrossAccount} />
              <FieldLabel htmlFor="cross-account" className="font-normal">
                这是其他账号的备份
                <FieldDescription>
                  勾选后会重新生成所有记录的 ID，只能在四张表都为空的账号上执行。
                </FieldDescription>
              </FieldLabel>
            </Field>
            {error && (
              <FieldError>
                {error}
                {progress && (
                  <>
                    <br />
                    已完成：
                    {progress
                      .filter((p) => p.status === 'done')
                      .map((p) => TABLE_LABELS[p.table])
                      .join('、') || '无'}
                    ；未完成：
                    {progress
                      .filter((p) => p.status !== 'done')
                      .map((p) => TABLE_LABELS[p.table])
                      .join('、') || '无'}
                  </>
                )}
              </FieldError>
            )}
            <Field>
              <Button type="button" disabled={!file} loading={running} onClick={onStart}>
                开始恢复
              </Button>
            </Field>
          </FieldGroup>

          {progress && (
            <ul className="mt-6 flex flex-col gap-2 text-sm">
              {progress.map((p) => (
                <li key={p.table} className="flex justify-between gap-3">
                  <span>{TABLE_LABELS[p.table]}</span>
                  <span
                    className={p.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}
                  >
                    {progressText(p)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {done && (
            <p className="mt-6 text-sm text-muted-foreground">
              恢复完成，共 {TABLES.length} 张表。
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
