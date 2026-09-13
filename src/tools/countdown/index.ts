import { createElement } from 'react'
import { CalendarDays } from 'lucide-react'
import type { Tool } from '@/tools'
import { CountdownDetail } from './CountdownDetail'
import { CountdownForm } from './CountdownForm'
import { CountdownList } from './CountdownList'
import { CountdownSummary } from './CountdownSummary'

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
