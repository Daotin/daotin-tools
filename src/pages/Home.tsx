import { ToolCard } from '@/components/ToolCard'
import { tools } from '@/tools'

export function Home() {
  return (
    <>
      <h1 className="mt-1 mb-4 font-rounded text-title">工具</h1>
      <div className="grid grid-cols-2 items-start gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </>
  )
}
