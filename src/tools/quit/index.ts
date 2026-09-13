import { createElement } from 'react'
import { CigaretteOff } from 'lucide-react'
import type { Tool } from '@/tools'
import { CalendarPanel } from './QuitCalendar'
import { QuitLayout } from './QuitLayout'
import { QuitSettings } from './QuitSettings'
import { QuitStats } from './QuitStats'
import { QuitSummary } from './QuitSummary'
import { QuitTimer } from './QuitTimer'

export const quit: Tool = {
  id: 'quit',
  name: '戒烟',
  path: '/quit',
  icon: CigaretteOff,
  color: 'green',
  hasSettings: true,
  Summary: QuitSummary,
  routes: [
    {
      element: createElement(QuitLayout),
      children: [
        { index: true, element: createElement(QuitTimer) },
        { path: 'calendar', element: createElement(CalendarPanel) },
        { path: 'stats', element: createElement(QuitStats) },
      ],
    },
    { path: 'settings', element: createElement(QuitSettings) },
  ],
}
