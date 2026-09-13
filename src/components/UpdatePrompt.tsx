import { useRegisterSW } from 'virtual:pwa-register/react'

/** 有新版本时底部常驻 toast，点"刷新"才更新，不自动刷新。 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="flex items-center gap-4 rounded-pill bg-foreground px-5 py-3 text-body-sm text-white shadow-[var(--shadow-raised)]">
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
