import { Button } from '@/components/ui/button'

/** 数据读取失败时在页面里就地显示的错误 + 重试，不用 toast、也不留白屏。 */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null
  return (
    <div className="mb-3 flex items-center gap-2">
      <p className="flex-1 text-caption text-red-solid">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="xs" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  )
}
