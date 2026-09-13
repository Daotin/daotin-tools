import { createElement, lazy } from 'react'
import { Droplet } from 'lucide-react'
import type { Tool } from '@/tools'

const PeriodPage = lazy(() => import('./PeriodPage').then((m) => ({ default: m.PeriodPage })))
const PeriodSummary = lazy(() => import('./PeriodSummary').then((m) => ({ default: m.PeriodSummary })))

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
