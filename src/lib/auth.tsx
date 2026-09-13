import { createContext, use, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, useLocation } from 'react-router'
import { supabase } from './supabase'

type SessionState = { session: Session | null; loading: boolean }

const SessionContext = createContext<SessionState>({ session: null, loading: true })

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, loading: true })

  useEffect(() => {
    // getSession 读本地存储（刷新不掉登录），onAuthStateChange 负责后续变化：
    // 登录、登出、token 刷新失败（401 / session 失效）都会推一次 session=null。
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, loading: false })
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <SessionContext value={state}>{children}</SessionContext>
}

export function useSession() {
  return use(SessionContext)
}

/** 未登录跳 /login?redirect=<原路径>，登录成功回原地址。 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) return null
  if (!session) {
    const from = location.pathname + location.search
    return <Navigate to={`/login?redirect=${encodeURIComponent(from)}`} replace />
  }
  return <>{children}</>
}
