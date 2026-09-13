import { createElement } from 'react'
import { CalendarDays } from 'lucide-react'
import { ToolPlaceholder } from '@/components/ToolPlaceholder'
import type { Tool } from '@/tools'

export const countdown: Tool = {
  id: 'countdown',
  name: '倒数日',
  path: '/countdown',
  icon: CalendarDays,
  color: 'orange',
  routes: [
    { index: true, element: createElement(ToolPlaceholder, { name: '倒数日', icon: CalendarDays }) },
  ],
}
