import { createElement } from 'react'
import { Droplet } from 'lucide-react'
import type { Tool } from '@/tools'
import { PeriodPage } from './PeriodPage'
import { PeriodSummary } from './PeriodSummary'

export const period: Tool = {
  id: 'period',
  name: '经期',
  path: '/period',
  icon: Droplet,
  color: 'pink',
  hasSettings: false,
  Summary: PeriodSummary,
  routes: [{ index: true, element: createElement(PeriodPage) }],
}
