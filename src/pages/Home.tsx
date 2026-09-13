import { useEffect } from 'react'
import { ToolCard } from '@/components/ToolCard'
import { tools } from '@/tools'

export function Home() {
  useEffect(() => {
    // 空闲时把四个工具的 chunk 先下下来：点进去时只剩一次数据请求，不用「先下载再请求」两段串行
    const preload = () => tools.forEach((tool) => void tool.preload())
    const idle = window.requestIdleCallback
    if (idle) {
      const id = idle(preload)
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(preload, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <h1 className="mt-1 mb-4 font-rounded text-title">工具</h1>
      {/* items-stretch（grid 默认）+ 卡片 h-full：同一行的卡等高，有无说明行都一样 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </>
  )
}
