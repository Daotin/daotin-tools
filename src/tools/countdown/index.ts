import { createElement, lazy } from 'react'
import { CalendarDays } from 'lucide-react'
import type { Tool } from '@/tools'

// 全部动态 import：农历用的 lunar-typescript 只进这个工具的 chunk，不进主包。
const CountdownList = lazy(() => import('./CountdownList').then((m) => ({ default: m.CountdownList })))
const CountdownForm = lazy(() => import('./CountdownForm').then((m) => ({ default: m.CountdownForm })))
const CountdownDetail = lazy(() => import('./CountdownDetail').then((m) => ({ default: m.CountdownDetail })))
const CountdownSummary = lazy(() =>
  import('./CountdownSummary').then((m) => ({ default: m.CountdownSummary })),
)

export const countdown: Tool = {
  id: 'countdown',
  name: '倒数日',
  path: '/countdown',
  icon: CalendarDays,
  color: 'orange',
  hasSettings: false,
  Summary: CountdownSummary,
  routes: [
    { index: true, element: createElement(CountdownList) },
    // 新建/编辑：手机是全屏二级页，电脑是列表右侧的滑出面板（组件内部按宽度切换）
    { path: 'new', element: createElement(CountdownForm) },
    { path: ':id', element: createElement(CountdownDetail) },
    { path: ':id/edit', element: createElement(CountdownForm) },
  ],
}
