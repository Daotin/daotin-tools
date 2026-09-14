import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * shadcn 的 sonner 原版从 next-themes 读主题，本项目不是 Next.js，
 * 改成读自己的 data-theme（没有就是跟随系统）。
 * 配色和圆角接 DESIGN.md 的 token，不用 shadcn 默认值。
 */
function Toaster(props: ToasterProps) {
  const attr = document.documentElement.dataset.theme
  const theme: ToasterProps['theme'] = attr === 'light' || attr === 'dark' ? attr : 'system'

  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      duration={2000}
      // 底部留 32px；手机端左右留 0，否则 sonner 会给 16px 偏移，胶囊就不在屏幕正中了
      offset={{ top: 24, right: 24, bottom: 32, left: 24 }}
      mobileOffset={{ top: 16, right: 0, bottom: 32, left: 0 }}
      toastOptions={{
        // sonner 自带的样式表是运行时注入的，排在 Tailwind 之后，普通工具类压不过它，
        // 所以这几条要带 !。inset-x-0 + mx-auto 把胶囊在底部居中，不碰 transform（进出场动画在用）。
        className:
          'inset-x-0! mx-auto! w-fit! justify-center px-5! py-3! text-body-sm! shadow-none!',
      }}
      style={
        {
          '--normal-bg': 'var(--foreground)',
          '--normal-text': 'var(--background)',
          '--normal-border': 'transparent',
          '--border-radius': 'var(--radius-pill)',
          '--width': 'fit-content',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
