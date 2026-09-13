import { useState } from 'react'
import {
  Download,
  KeyRound,
  LoaderCircle,
  Mail,
  Upload,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { ListRow } from '@/components/ListRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const cardInput = 'border-0 bg-background'
const card = 'rounded-md bg-surface px-5 py-1'

export function Account() {
  const { session } = useSession()
  const [exporting, setExporting] = useState(false)
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
      <h1 className="mt-1 mb-4 font-rounded text-title">账号</h1>
      <div className={card}>
        <ListRow icon={Mail} color="blue" label={session?.user.email ?? ''} />
        <ListRow icon={KeyRound} color="blue" label="修改密码" to="/account/password" />
      </div>

      <div className={`${card} mt-3`}>
        <ListRow
          icon={Download}
          color="blue"
          label="导出全部数据"
          onClick={exporting ? undefined : onExport}
          trailing={
            exporting ? (
              <LoaderCircle className="size-[18px] animate-spin text-foreground-tertiary" />
            ) : undefined
          }
        />
        <ListRow icon={Upload} color="blue" label="从备份恢复" to="/account/restore" />
      </div>
      {error && <p className="mt-3 text-caption text-red-solid">{error}</p>}

      <Button
        variant="destructive"
        className="mt-8 w-full"
        onClick={() => supabase.auth.signOut()}
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
      <h1 className="mt-1 mb-4 font-rounded text-title">修改密码</h1>
      <form onSubmit={onSubmit} className="rounded-md bg-surface p-5">
        <label className="block text-caption text-foreground-secondary" htmlFor="new-password">
          新密码
        </label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1 ${cardInput}`}
        />
        <label className="mt-4 block text-caption text-foreground-secondary" htmlFor="confirm-password">
          确认新密码
        </label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`mt-1 ${cardInput}`}
        />
        {error && <p className="mt-4 text-caption text-red-solid">{error}</p>}
        <Button type="submit" disabled={saving} className="mt-5 w-full">
          {saving ? <LoaderCircle className="size-[18px] animate-spin" /> : '保存'}
        </Button>
      </form>
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
      <h1 className="mt-1 mb-4 font-rounded text-title">从备份恢复</h1>
      <div className="rounded-md bg-surface p-5">
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-body-sm"
        />
        <label className="mt-4 flex items-center gap-3 text-body">
          <input
            type="checkbox"
            checked={crossAccount}
            onChange={(e) => setCrossAccount(e.target.checked)}
            className="size-5 accent-[var(--primary)]"
          />
          这是其他账号的备份
        </label>
        <p className="mt-1 text-caption text-foreground-secondary">
          勾选后会重新生成所有记录的 ID，只能在四张表都为空的账号上执行。
        </p>
        <Button
          type="button"
          disabled={!file || running}
          onClick={onStart}
          className="mt-5 w-full"
        >
          {running ? <LoaderCircle className="size-[18px] animate-spin" /> : '开始恢复'}
        </Button>

        {progress && (
          <ul className="mt-5 flex flex-col gap-2">
            {progress.map((p) => (
              <li key={p.table} className="flex justify-between gap-3 text-body-sm">
                <span>{TABLE_LABELS[p.table]}</span>
                <span
                  className={
                    p.status === 'failed' ? 'text-red-solid' : 'text-foreground-secondary'
                  }
                >
                  {progressText(p)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p className="mt-4 text-caption text-red-solid">
            {error}
            {progress && (
              <>
                <br />
                已完成：
                {progress.filter((p) => p.status === 'done').map((p) => TABLE_LABELS[p.table]).join('、') || '无'}
                ；未完成：
                {progress
                  .filter((p) => p.status !== 'done')
                  .map((p) => TABLE_LABELS[p.table])
                  .join('、') || '无'}
              </>
            )}
          </p>
        )}
        {done && (
          <p className="mt-4 text-caption text-green-solid">
            恢复完成，共 {TABLES.length} 张表。
          </p>
        )}
      </div>
    </>
  )
}
