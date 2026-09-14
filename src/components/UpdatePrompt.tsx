import { useRegisterSW } from 'virtual:pwa-register/react'

/** 有新版本时底部常驻 toast，点"刷新"才更新，不自动刷新。 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <div
      data-open={needRefresh}
      className="reveal fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 [--reveal-offset:8px]"
    >
      {/* 底 --foreground、字 --background：深色下自然反转，不写死黑白 */}
      <div className="flex items-center gap-4 rounded-pill bg-foreground px-5 py-3 text-body-sm text-background shadow-raised">
        有新版本
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="underline underline-offset-4"
        >
          刷新
        </button>
      </div>
    </div>
  )
}
