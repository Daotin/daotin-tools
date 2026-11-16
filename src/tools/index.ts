import type { LucideIcon } from 'lucide-react'
import type { RouteObject } from 'react-router'
import { countdown } from './countdown'
import { crisis } from './crisis'
import { oil } from './oil'
import { period } from './period'
import { quit } from './quit'

/** DESIGN.md 第 2 节的 8 个颜色槽，工具只能从中挑一个。 */
export type ToolColor =
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'teal'
  | 'yellow'
  | 'red'

type ToolBase = {
  /** 'quit' */
  id: string
  /** '戒烟' */
  name: string
  /** 站内工具是路由前缀 '/quit'；外部页面工具是整页地址 '/crisis/index.html' */
  path: string
  icon: LucideIcon
  color: ToolColor
  /** 读写个人数据的工具要登录才能进；未登录时首页卡片不取数据，显示"登录后查看" */
  requiresAuth: boolean
  /** 可选：首页卡片上的核心数字与说明 */
  Summary?: React.FC
}

/** 站内工具：有自己的 React 子路由。 */
type RouteTool = ToolBase & {
  external?: false
  /** 有设置页时，工具页站点栏右侧显示齿轮，进 `${path}/settings` */
  hasSettings?: boolean
  /** 首页空闲时预取这个工具的懒加载 chunk，进工具时就不用再等下载 */
  preload: () => Promise<unknown>
  /** 工具自己的子路由，挂在 path 下 */
  routes: RouteObject[]
}

/** 外部页面工具：独立的静态页面，点进去整页跳转到 path，不生成 React 路由。 */
type PageTool = ToolBase & {
  external: true
}

export type Tool = RouteTool | PageTool

export const tools: Tool[] = [quit, countdown, period, oil, crisis]
