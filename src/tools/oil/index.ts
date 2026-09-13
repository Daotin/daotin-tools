import { createElement } from 'react'
import { Fuel } from 'lucide-react'
import type { Tool } from '@/tools'
import { OilPage } from './OilPage'
import { OilSummary } from './OilSummary'

export const oil: Tool = {
  id: 'oil',
  name: '油费',
  path: '/oil',
  icon: Fuel,
  color: 'blue',
  hasSettings: false,
  Summary: OilSummary,
  routes: [{ index: true, element: createElement(OilPage) }],
}
