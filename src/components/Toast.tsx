import { useEffect, useState } from 'react'

let emit: (message: string) => void = () => {}

/** 轻量提示：底部弹出的胶囊，2 秒消失。 */
export function toast(message: string) {
  emit(message)
}

export function Toaster() {
  // 到点只关 open、不清 message：退场那 200ms 里文字还得在
  const [state, setState] = useState({ message: '', open: false })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    emit = (next) => {
      setState({ message: next, open: true })
      clearTimeout(timer)
      timer = setTimeout(() => setState((s) => ({ ...s, open: false })), 2000)
    }
    return () => {
      emit = () => {}
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      role="status"
      data-open={state.open}
      className="reveal pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center [--reveal-offset:8px]"
    >
      <span className="rounded-pill bg-foreground px-5 py-3 text-body-sm text-white">
        {state.message}
      </span>
    </div>
  )
}
