import { useEffect, useState } from 'react'

let emit: (message: string) => void = () => {}

/** 轻量提示：底部弹出的胶囊，2 秒消失。 */
export function toast(message: string) {
  emit(message)
}

export function Toaster() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    emit = (next) => {
      setMessage(next)
      clearTimeout(timer)
      timer = setTimeout(() => setMessage(''), 2000)
    }
    return () => {
      emit = () => {}
      clearTimeout(timer)
    }
  }, [])

  if (!message) return null
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center"
    >
      <span className="rounded-pill bg-foreground px-5 py-3 text-body-sm text-white">
        {message}
      </span>
    </div>
  )
}
