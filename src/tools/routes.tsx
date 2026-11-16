import { Outlet, type RouteObject } from 'react-router'
import { ToolColorProvider } from '@/components/ToolColorProvider'
import { RequireAuth } from '@/lib/auth'
import type { Tool } from '@/tools'

/**
 * 每个站内工具的子路由挂在自己的 path 下，外面套一层颜色槽；要登录的工具再套 RequireAuth。
 * 外部页面工具是整页跳转，不生成 React 路由。
 */
export function toolRoutes(list: Tool[]): RouteObject[] {
  return list.flatMap((tool) =>
    tool.external
      ? []
      : [
          {
            path: tool.path,
            element: (
              <ToolColorProvider color={tool.color}>
                {tool.requiresAuth ? (
                  <RequireAuth>
                    <Outlet />
                  </RequireAuth>
                ) : (
                  <Outlet />
                )}
              </ToolColorProvider>
            ),
            children: tool.routes,
          },
        ],
  )
}
