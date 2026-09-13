import { createElement } from 'react'
import { Fuel } from 'lucide-react'
import { ToolPlaceholder } from '@/components/ToolPlaceholder'
import type { Tool } from '@/tools'

export const oil: Tool = {
  id: 'oil',
  name: '油费',
  path: '/oil',
  icon: Fuel,
  color: 'blue',
  routes: [
    { index: true, element: createElement(ToolPlaceholder, { name: '油费', icon: Fuel }) },
  ],
}
