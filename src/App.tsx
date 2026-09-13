import { createBrowserRouter, Outlet, RouterProvider } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { ToolColorProvider } from '@/components/ToolColorProvider'
import { Toaster } from '@/components/Toast'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { RequireAuth, SessionProvider } from '@/lib/auth'
import { Account, AccountPassword, AccountRestore } from '@/pages/Account'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { tools } from '@/tools'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
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
  return (
    <SessionProvider>
      <RouterProvider router={router} />
      <UpdatePrompt />
      <Toaster />
    </SessionProvider>
  )
}
