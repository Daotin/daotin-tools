import { createElement, lazy } from 'react'
import { Fuel } from 'lucide-react'
import type { Tool } from '@/tools'

// 动态 import：历史折线用的 recharts 只进这个工具的 chunk，不进主包。
const OilPage = lazy(() => import('./OilPage').then((m) => ({ default: m.OilPage })))
const OilSummary = lazy(() => import('./OilSummary').then((m) => ({ default: m.OilSummary })))

export const oil: Tool = {
  id: 'oil',
  name: '油费',
  path: '/oil',
  icon: Fuel,
  color: 'blue',
  hasSettings: false,
  Summary: OilSummary,
  preload: () => import('./OilPage'),
  routes: [{ index: true, element: createElement(OilPage) }],
}
