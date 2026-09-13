import type { ToolColor } from '@/tools'

/** 把当前工具的颜色槽注入 --tool-solid / --tool-soft，子树内所有 tool 色都跟着变。 */
export function ToolColorProvider({
  color,
  children,
}: {
  color: ToolColor
  children: React.ReactNode
}) {
  return (
    <div
      /* display:contents：不产生盒子，子元素直接参与外层布局，CSS 变量照常继承 */
      className="contents"
      style={
        {
          '--tool-solid': `var(--${color}-solid)`,
          '--tool-soft': `var(--${color}-soft)`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
