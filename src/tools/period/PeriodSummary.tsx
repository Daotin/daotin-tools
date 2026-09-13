import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { ToolCardOpen } from '@/components/ToolCard'
import type { Period } from '@/lib/database.types'
import { fetchPeriods } from './data'
import { isMock, mockPeriods } from './mock'
import { predict, statusText } from './predict'

/** 首页卡片摘要：和工具页 Hero Card 用同一份 statusText。没有记录时显示"打开"。 */
export function PeriodSummary() {
  const [periods, setPeriods] = useState<Period[] | null>(null)
  const { search } = useLocation()

  useEffect(() => {
    if (import.meta.env.DEV && isMock(search)) {
      setPeriods(mockPeriods(search))
      return
    }
    fetchPeriods()
      .then(setPeriods)
      .catch(() => setPeriods([]))
  }, [search])

  const status = statusText(periods ?? [], predict(periods ?? []))
  if (!status) return <ToolCardOpen />

  return (
    <>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-rounded text-stat font-bold">{status.value}</span>
        {/* 首页只放"天"，方向交给下面那行说明（"预计经期开始" / "已推迟"） */}
        <span className="text-caption text-foreground-secondary">天</span>
      </div>
      <div className="mt-0.5 text-caption text-foreground-secondary">{status.summary}</div>
    </>
  )
}
