import { Suspense, lazy } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { ToolColorProvider } from '@/components/ToolColorProvider'
import { Toaster } from '@/components/Toast'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { RequireAuth, SessionProvider } from '@/lib/auth'
import { configError } from '@/lib/supabase'
import { Home } from '@/pages/Home'
import { tools } from '@/tools'

// 登录页和账号页（含备份导出/恢复）按需加载，不占主包
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Account = lazy(() => import('@/pages/Account').then((m) => ({ default: m.Account })))
const AccountPassword = lazy(() =>
  import('@/pages/Account').then((m) => ({ default: m.AccountPassword })),
)
const AccountRestore = lazy(() =>
  import('@/pages/Account').then((m) => ({ default: m.AccountRestore })),
)

const router = createBrowserRouter([
  { path: '/login', element: <Suspense fallback={null}><Login /></Suspense> },
  {
    // 除登录页外，全部路由要求已登录；未登录跳 /login?redirect=<原路径>
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'account', element: <Account /> },
      { path: 'account/password', element: <AccountPassword /> },
      { path: 'account/restore', element: <AccountRestore /> },
      // 每个工具的子路由挂在自己的 path 下，外面套一层颜色槽
      ...tools.map((tool) => ({
        path: tool.path,
        element: (
          <ToolColorProvider color={tool.color}>
            <Outlet />
          </ToolColorProvider>
        ),
        children: tool.routes,
      })),
    ],
  },
])

export function App() {
  if (configError) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>缺少 Supabase 配置</CardTitle>
            <CardDescription>{configError}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <SessionProvider>
      <RouterProvider router={router} />
      <UpdatePrompt />
      <Toaster />
    </SessionProvider>
  )
}
