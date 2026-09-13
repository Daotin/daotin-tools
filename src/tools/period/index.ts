import { createElement } from 'react'
import { Droplet } from 'lucide-react'
import { ToolPlaceholder } from '@/components/ToolPlaceholder'
import type { Tool } from '@/tools'

export const period: Tool = {
  id: 'period',
  name: '经期',
  path: '/period',
  icon: Droplet,
  color: 'pink',
  routes: [
    { index: true, element: createElement(ToolPlaceholder, { name: '经期', icon: Droplet }) },
  ],
}
