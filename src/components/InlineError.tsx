import { Button } from '@/components/ui/button'

/** 数据读取失败时在页面里就地显示的错误 + 重试，不用 toast、也不留白屏。 */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  // 节点常驻、用 data-open 切换：卸载掉就没有退场动画了
  return (
    <div className="reveal mb-3 flex items-center gap-2" data-open={!!message}>
      <p className="flex-1 text-caption text-red-solid">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="xs" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  )
}
