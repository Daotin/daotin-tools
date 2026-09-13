import type { LucideIcon } from 'lucide-react'
import type { RouteObject } from 'react-router'
import { countdown } from './countdown'
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

export type Tool = {
  /** 'quit' */
  id: string
  /** '戒烟' */
  name: string
  /** '/quit' */
  path: string
  icon: LucideIcon
  color: ToolColor
  /** 有设置页时，工具页站点栏右侧显示齿轮，进 `${path}/settings` */
  hasSettings?: boolean
  /** 可选：首页卡片上的核心数字与说明 */
  Summary?: React.FC
  /** 工具自己的子路由，挂在 path 下 */
  routes: RouteObject[]
}

export const tools: Tool[] = [quit, countdown, period, oil]
