import type { ReactElement } from 'react'
import type { RouteObject } from 'react-router'
import { expect, test } from 'vitest'
import { RequireAuth } from '@/lib/auth'
import { tools } from '@/tools'
import { toolRoutes } from './routes'

/** 工具路由的 element 是 ToolColorProvider，它的子节点是 RequireAuth 就表示要登录。 */
function guarded(route: RouteObject) {
  const provider = route.element as ReactElement<{ children: ReactElement }>
  return provider.props.children.type === RequireAuth
}

test('外部页面工具不生成 React 路由', () => {
  const paths = toolRoutes(tools).map((r) => r.path)
  expect(paths).toEqual(['/quit', '/countdown', '/period', '/oil'])
  expect(paths).not.toContain('/crisis/index.html')
})

test('按工具判断是否需要登录：读个人数据的三个工具要登录，油费不用', () => {
  const byPath = Object.fromEntries(toolRoutes(tools).map((r) => [r.path, guarded(r)]))
  expect(byPath).toEqual({ '/quit': true, '/countdown': true, '/period': true, '/oil': false })
})
