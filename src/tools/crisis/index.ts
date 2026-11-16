import { lazy } from 'react'
import { TrendingDown } from 'lucide-react'
import type { Tool } from '@/tools'

const CrisisSummary = lazy(() => import('./CrisisSummary').then((m) => ({ default: m.CrisisSummary })))

// 独立的静态页面（public/crisis/），有自己的视觉风格，不套工具站外壳
export const crisis: Tool = {
  id: 'crisis',
  name: '金融危机预警',
  path: '/crisis/index.html',
  external: true,
  icon: TrendingDown,
  color: 'red',
  requiresAuth: false,
  Summary: CrisisSummary,
}
