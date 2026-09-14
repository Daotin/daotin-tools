import { toast as sonnerToast } from 'sonner'

/** 轻量提示：底部弹出的胶囊，2 秒消失。内部走 sonner，签名保持不变。 */
export function toast(message: string) {
  sonnerToast(message)
}

export { Toaster } from '@/components/ui/sonner'
