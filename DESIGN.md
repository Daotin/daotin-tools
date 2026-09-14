---
name: daotin-tools
description: 个人小工具站的全站通用视觉规则。直接采用 shadcn/ui 官方设计语言（neutral 主题），中性灰、有边框的卡片、克制的字号层级，工具身份色走 chart 槽。
---

# Design

## 1. Overview

**本项目不再自造设计语言，整站对齐 shadcn/ui 官方美学。**

规则只有一条总纲：**能用 `src/components/ui/` 下的 shadcn 组件就用，不要自己写外观**。
只有 shadcn 确实没有的东西（工具身份色、农历日历、后台刷新条）才在上面薄薄包一层，
并且这层壳只负责本项目的语义，不负责重新定义视觉。

视觉特征跟着 shadcn 默认值走：

- 中性灰（neutral）配色，页面底 `--background`，卡片 `--card` 且**有 1px 边框**。
- 圆角一套 `--radius: 0.625rem`，派生 sm / md / lg / xl。
- 排版用 Tailwind 默认字号（`text-xs` … `text-2xl`），辅助文字一律 `text-muted-foreground`。
- 字体用 Tailwind 默认 `font-sans`（系统栈），没有自托管字体、没有圆体。
- 深色模式是 `<html class="dark">`，不是 `data-theme`，也不看 `prefers-color-scheme` 媒体查询。

## 2. Tokens

**来源：shadcn/ui 官方注册表的 neutral 主题**，完整搬进 `src/index.css`，
`:root` 是浅色组，`.dark` 是深色组，`@theme inline` 按官方写法映射成 `--color-*` 工具类。

只有一处偏离官方：`--chart-1..5`。官方 neutral 主题的 chart 色是灰阶，
拿来区分工具没有辨识度，所以覆盖成五个低饱和的彩色（绿 / 蓝 / 橙 / 玫 / 紫，OKLCH，
浅色 L≈0.58、深色 L≈0.72）。除此之外不要新增颜色 token。

不要再出现这些**已删除**的旧 token：
`--surface*`、`--foreground-secondary/tertiary`、8 个 `--*-solid` / `--*-soft` 颜色槽、
`--tool-solid` / `--tool-soft`、`--raised-shadow`、`--font-rounded`、
自定义字阶 `--text-display / stat / title / heading / body / caption`。

保留的非 shadcn token 只有动效三档：`--ease-quint`、
`--transition-duration-fast|base|page`，以及 `prefers-reduced-motion` 归零规则。

## 3. 工具身份色

四个工具各有一个颜色，通过 chart 槽表达：

- `ToolColorProvider` 在进入某个工具的路由时，把 `--chart-tool` 写到 `<html>` 上
  （写在 `<html>` 而不是包一层 div，因为弹层、抽屉、站点栏按钮都是 portal 出去的）。
- 页面里用工具类 `text-tool` / `bg-tool/10` / `border-tool` / `stroke-tool` 取这个颜色。
- 图表里不直接写工具色：`ChartConfig` 的 `color` 填 `var(--color-tool)`，
  线和点用它生成的 `var(--color-<dataKey>)`，这样 tooltip 的色块也跟着走。
- 首页工具卡不在当前工具路由下，各自用行内 `style={{ '--chart-tool': ... }}` 覆盖。
- **首页摘要里取工具色必须用工具类**（`stroke-tool` / `fill-tool` / `text-tool`）。`--color-tool` 是 `@theme inline` 在 `:root` 上就地展开的，写 `var(--color-tool)` 取不到卡片行内给的 `--chart-tool`，会退回默认色。工具路由内部两种写法都行。
- 名字到 chart 槽的映射表在 `ToolColorProvider.tsx` 的 `CHART_SLOT`。

工具身份色只用在图标、图表、少量强调文字上。**主按钮、选中态、焦点环一律用中性的
`--primary` / `--ring`**，不要染成工具色——那是旧设计，会让页面看起来不像 shadcn。

## 4. 组件

| 需求 | 用什么 |
|---|---|
| 卡片 | `ui/card`（`Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` / `CardAction`） |
| 表单 | `ui/field` + `ui/label` + `ui/input` + `ui/textarea` + `ui/switch` |
| 按钮 | `ui/button`，变体 default / outline / secondary / ghost / link / destructive；`loading` 是本项目加的一个 prop |
| 列表行 | `ui/item`（`ItemGroup` / `Item` / `ItemMedia` / `ItemContent` / `ItemTitle` / `ItemActions`） |
| 空状态 | `ui/empty` |
| 分段切换 | `ui/tabs`（`components/Segmented` 只是铺满一行的薄封装） |
| 弹层 | `components/Sheet`：手机 `ui/drawer`，电脑（≥1024px）`ui/dialog` |
| 日期 | `components/DatePicker` = `ui/popover` + `ui/calendar`（官方 Date Picker 范式，加农历显示） |
| 导航 | `ui/sidebar`（电脑常驻、手机自动变 `ui/sheet` 侧滑） |
| 提示 | `sonner`（`components/Toast` 的 `toast()`）、`ui/alert`（`components/InlineError`） |
| 进度 | `ui/progress`（顶部后台刷新条是它的不定值形态） |
| 表格 | `ui/table`（`Table` / `TableBody` / `TableRow` / `TableCell`） |
| 图表 | `ui/chart`（`ChartContainer` 自带 ResponsiveContainer 和坐标轴配色，别再手填 `tick={{ fill }}`）+ `ChartTooltip` / `ChartTooltipContent` |
| 转圈 | `ui/spinner`，不要自己写 `LoaderCircle` + `animate-spin` |

图标直接写 `<Icon className="size-4 text-muted-foreground" />`。**不要再做实色圆形图标底。**

自己写外观只剩两种正当理由：shadcn 没有对应物（戒烟和经期的日历格子要标破戒、经期、排卵，
`ui/calendar` 给不了），或者是薄封装（`Segmented` / `ListRow` / `Sheet` / `DatePicker`）。

改 `ui/` 下的文件只有一种正当理由：本项目必须的功能扩展（例如 button 的 `loading`、
sonner 读 `.dark` class）。**不要为了"更好看"去改它们的默认外观。**

## 5. 深色模式

- 三态：跟随系统 / 浅色 / 深色，存 `localStorage` 的 `dt:theme`。
- `index.html` 的内联脚本在首屏前算出结果，给 `<html>` 加 `dark` class 并设 `color-scheme`，避免闪白。
- 站点栏的主题按钮是 `ui/dropdown-menu` 三项菜单（shadcn 官方 dark mode 文档的做法）。
- 组件里写深色差异用 `dark:` 变体，这是 shadcn 组件的原生写法，不要删。

## 6. 动效

只有三档时长（fast 150ms / base 200ms / page 250ms），曲线统一 `--ease-quint`，不弹跳。
页面切换用 View Transitions 横移 12px 淡入；列表项增删用 `.item-in` / `.item-out`；
条状提示用 `.reveal`（节点常驻，切 `data-open`）。开启系统"减少动态效果"时全部归零。

## 7. 可访问性

- 对比度 WCAG AA，深色也要过；辅助文字用 `text-muted-foreground`，不要再调更浅。
- 可点区域不小于 44 × 44px（shadcn 默认按钮 h-9 偏小，移动端主操作用 `size="lg"` 或补 `h-11`）。
- 颜色不作为唯一信息载体：日历上的经期、排卵期除了颜色还要有文字或形状区分。
- 会变化的数字局部加 `tabular-nums`（计时器、表格），不再全站强制。
