import { createElement } from 'react'
import { CigaretteOff } from 'lucide-react'
import { ToolPlaceholder } from '@/components/ToolPlaceholder'
import type { Tool } from '@/tools'

export const quit: Tool = {
  id: 'quit',
  name: '戒烟',
  path: '/quit',
  icon: CigaretteOff,
  color: 'green',
  routes: [
    { index: true, element: createElement(ToolPlaceholder, { name: '戒烟', icon: CigaretteOff }) },
  ],
}
