import { createElement, lazy } from 'react'
import { CigaretteOff } from 'lucide-react'
import type { Tool } from '@/tools'

// 全部动态 import：戒烟统计用的 recharts 只进这个工具的 chunk，不进主包。
// 注册表本身（图标、颜色、路径）留在主包里，首页和侧边导航要用。
const QuitLayout = lazy(() => import('./QuitLayout').then((m) => ({ default: m.QuitLayout })))
const QuitTimer = lazy(() => import('./QuitTimer').then((m) => ({ default: m.QuitTimer })))
const CalendarPanel = lazy(() => import('./QuitCalendar').then((m) => ({ default: m.CalendarPanel })))
const QuitStats = lazy(() => import('./QuitStats').then((m) => ({ default: m.QuitStats })))
const QuitSettings = lazy(() => import('./QuitSettings').then((m) => ({ default: m.QuitSettings })))
const QuitSummary = lazy(() => import('./QuitSummary').then((m) => ({ default: m.QuitSummary })))

export const quit: Tool = {
  id: 'quit',
  name: '戒烟',
  path: '/quit',
  icon: CigaretteOff,
  color: 'green',
  hasSettings: true,
  Summary: QuitSummary,
  preload: () => import('./QuitLayout'),
  routes: [
    {
      element: createElement(QuitLayout),
      children: [
        { index: true, element: createElement(QuitTimer) },
        { path: 'calendar', element: createElement(CalendarPanel) },
        { path: 'stats', element: createElement(QuitStats) },
      ],
    },
    { path: 'settings', element: createElement(QuitSettings) },
  ],
}
