import { useState } from 'react'
import { Eye, EyeOff, LayoutGrid } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { IconBadge } from '@/components/IconBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/** 卡内输入框：--background 底、无边框 */
const cardInput = 'border-0 bg-background'

export function Login() {
  const { session, loading } = useSession()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const redirect = params.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to={redirect} replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // 网络不通时 supabase-js 抛的是 AuthRetryableFetchError（status 为空）
        setError(
          error.status ? '账号或密码不对' : '连不上服务器，检查网络后重试',
        )
        return
      }
      navigate(redirect, { replace: true })
    } catch {
      setError('连不上服务器，检查网络后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[360px] rounded-md bg-surface p-6"
      >
        <IconBadge icon={LayoutGrid} size={56} color="blue" />
        <h1 className="mt-4 font-rounded text-title">Daotin 的工具箱</h1>
        <p className="mt-1 text-body-sm text-foreground-secondary">输入账号密码登录</p>

        <label className="mt-5 block text-caption text-foreground-secondary" htmlFor="email">
          邮箱
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1 ${cardInput}`}
        />

        <label className="mt-4 block text-caption text-foreground-secondary" htmlFor="password">
          密码
        </label>
        <div className="relative mt-1">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${cardInput} pr-12`}
          />
          <button
            type="button"
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-foreground-secondary"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <p className="mt-4 text-caption text-red-solid">{error}</p>}

        <Button type="submit" loading={submitting} className="mt-5 w-full">
          登录
        </Button>
      </form>
    </div>
  )
}
