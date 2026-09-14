---
name: daotin-tools
description: 个人小工具站的全站通用视觉规则。浅紫灰底、白色大圆角卡片、每个工具一个颜色槽、深海军蓝圆体大数字，扁平、圆润、识别优先。
---

# Design

<!-- 本文件在编码前写成。代码落地后用 /impeccable document 重新扫描，核对实际 token 与这里是否一致。 -->

## 1. Overview

**北极星：Grow（Floating Island 的健康 App）那种"扁平、多彩、圆润、一眼看清数字"。**

整站只有一套规则，所有工具共用。视觉上四个特征：

- **每个工具一个颜色。** 全站预定义 8 个颜色槽，工具注册时挑一个，它的卡片图标、页面强调、图表、选中态全部从这个槽取色。新工具挑一个没用过的槽，不新造颜色。
- **底和字是中性的。** 页面底是极浅的紫灰，卡片纯白，文字是深海军蓝而不是黑。颜色只出现在图标、数字、图表和强调上，所以多色不乱。
- **圆润扁平。** 卡片圆角 24px，图标是实色圆形底，按钮胶囊形，没有阴影、渐变、玻璃。数字用圆体（iPhone 上是系统 SF Pro Rounded，其他设备自带 Nunito）。
- **数字是主角。** 每个工具页只有一个最大的数字，粗、等宽、左对齐。

场景句：白天在加油站阳光下掏出手机看油价，或者早上刚睁眼瞄一眼戒烟天数。所以默认浅色，深色默认跟随系统，另有手动三态切换（跟随系统 / 浅 / 深），存 localStorage 的 dt:theme。

反面参照见 PRODUCT.md：未修改的 shadcn 默认外观、玻璃拟态、渐变、艺术感细体数字、全白无色的工具页。Grow 里的渐变圆环、徽章插画、3D 图标不学，只学它的色彩结构和卡片排版。

## 2. Colors

色彩策略：**Full palette**。8 个颜色槽各有明确角色，页面底和文字保持中性。所有值用 OKLCH。

### Neutral（中性色，带紫灰调）

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--background` | `oklch(0.965 0.012 285)` | `oklch(0.19 0.02 280)` | 页面底，浅紫灰 |
| `--surface` | `oklch(1 0 0)` | `oklch(0.25 0.02 280)` | 卡片、输入框 |
| `--surface-muted` | `oklch(0.955 0.012 285)` | `oklch(0.31 0.02 280)` | 白卡内的空格子（年视图日期格等），比卡片底浅/亮一档 |
| `--surface-raised` | `oklch(1 0 0)` | `oklch(0.30 0.02 280)` | 弹层、菜单 |
| `--border` | `oklch(0.91 0.012 285)` | `oklch(0.34 0.02 280)` | 只用于输入框和分隔线；卡片无边框 |
| `--foreground` | `oklch(0.30 0.06 268)` | `oklch(0.95 0.01 280)` | 主文字，深海军蓝 |
| `--foreground-secondary` | `oklch(0.55 0.04 268)` | `oklch(0.70 0.02 280)` | 辅助文字、标签 |
| `--foreground-tertiary` | `oklch(0.70 0.03 268)` | `oklch(0.55 0.02 280)` | 占位、禁用 |

页面底和卡片之间靠"紫灰 vs 纯白"的差分层，卡片不要边框也不要阴影。深色底不是纯黑。

### Tool Palette（8 个颜色槽）

每个槽两档：`solid` 给图标底、数字强调、图表线、主按钮；`soft` 给图标外圈、选中态底、卡片色块。工具在注册表里声明 `color: 'green'` 之类，代码里用 `--tool-solid` / `--tool-soft` 两个变量，由所在工具的槽注入。

| 槽 | solid Light | soft Light | solid Dark | soft Dark |
|---|---|---|---|---|
| `green` | `oklch(0.68 0.19 148)` | `oklch(0.94 0.06 148)` | `oklch(0.75 0.17 148)` | `oklch(0.32 0.07 148)` |
| `blue` | `oklch(0.62 0.19 252)` | `oklch(0.93 0.05 252)` | `oklch(0.72 0.16 252)` | `oklch(0.32 0.07 252)` |
| `purple` | `oklch(0.60 0.20 300)` | `oklch(0.94 0.05 300)` | `oklch(0.72 0.16 300)` | `oklch(0.33 0.08 300)` |
| `orange` | `oklch(0.72 0.18 55)` | `oklch(0.95 0.06 55)` | `oklch(0.78 0.16 55)` | `oklch(0.34 0.07 55)` |
| `pink` | `oklch(0.68 0.19 350)` | `oklch(0.95 0.05 350)` | `oklch(0.76 0.16 350)` | `oklch(0.34 0.07 350)` |
| `teal` | `oklch(0.72 0.14 190)` | `oklch(0.94 0.05 190)` | `oklch(0.78 0.12 190)` | `oklch(0.32 0.06 190)` |
| `yellow` | `oklch(0.84 0.17 90)` | `oklch(0.96 0.07 90)` | `oklch(0.86 0.15 90)` | `oklch(0.36 0.07 90)` |
| `red` | `oklch(0.62 0.21 25)` | `oklch(0.95 0.05 25)` | `oklch(0.72 0.18 25)` | `oklch(0.34 0.08 25)` |

首批分配：戒烟 `green`，倒数日 `orange`，经期 `pink`，油费 `blue`。新工具从剩下的挑。

### Primary（全站通用动作色）

不属于某个工具的动作（登录、账号页、保存、全局链接）用 `blue` 槽。工具页内的主按钮用该工具的 `--tool-solid`。

| Token | 值 |
|---|---|
| `--primary` / `--primary-soft` | = `blue` 槽的 solid / soft |
| `--primary-foreground` | `oklch(1 0 0)` |

### Semantic（语义色，直接复用槽）

| 含义 | 取用 |
|---|---|
| 危险、删除、涨价、经期日 | `red` 槽 |
| 提醒、临近 | `orange` 槽 |
| 排卵期、排卵日 | `teal` 槽（2026-09-13 按用户要求从 orange 改） |
| 完成、正常、降价 | `green` 槽 |
| 信息、预测 | `blue` 槽 |

语义色和工具色撞色时（比如经期工具是 pink，经期日用 red），允许并存，两者色相差已够大。

### Named Rules

- **一页一个工具色，加最多两个语义色。** 日历类页面允许三个语义色。
- **实色底放白字只有两处：** 圆形图标底、主按钮。其他地方语义色做背景一律用 soft 档配 solid 字。
- **数字默认是海军蓝，不是彩色。** 只有"这个数字是该工具的核心指标"时才用 `--tool-solid`，一屏最多一个彩色数字。
- **禁用态用中性色。**

## 3. Typography

### 字体

两套字体栈，都不下载中文字体。

```css
/* 正文：系统字体，西文在前，中文在后 */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;

/* 数字与西文展示：圆体。iPhone/Mac Safari 命中 ui-rounded（SF Pro Rounded），其他设备用自带的 Nunito */
--font-rounded: ui-rounded, "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
```

- Nunito 只带拉丁字母、数字、常用符号的子集，可变字重，woff2 放在 `public/fonts/`，`font-display: swap`。不走任何外部 CDN。
- `--font-rounded` 用于：所有数字（计时、天数、价格、统计）、按钮文字、分段切换文字、工具名。
- `--font-sans` 用于：正文、说明、表单标签、列表文字。
- 所有数字加 `font-variant-numeric: tabular-nums`。

### 字阶（固定值，不随屏幕缩放）

| Role | Size | Weight | Line-height | Font | 用途 |
|---|---|---|---|---|---|
| `display` | 72 | 700 | 1.0 | rounded | 一屏唯一的主数字（天数、价格、剩余天数） |
| `display-sm` | 48 | 700 | 1.05 | rounded | 次级大数字（时分秒、统计第一项） |
| `stat` | 32 | 600 | 1.1 | rounded | 统计数字 |
| `title` | 24 | 700 | 1.2 | rounded | 页面标题 |
| `heading` | 20 | 600 | 1.3 | sans | 分组标题 |
| `body` | 17 | 400 | 1.5 | sans | 正文、列表主文字 |
| `body-sm` | 15 | 400 | 1.5 | sans | 次要正文 |
| `caption` | 13 | 500 | 1.4 | sans | 标签、时间戳、单位 |

### Hierarchy

- 标题和数字一律左对齐。唯一例外是空状态的说明文字可以居中。
- 同一屏最多三档字号。
- 层级靠字号和字重拉开，不靠颜色。辅助文字用 `--foreground-secondary`，不再更淡。
- **`--foreground-tertiary` 只给禁用态和不可读也无妨的占位**，不得用于任何需要读的内容（星期表头、未来日期、说明文字、图标按钮一律用 secondary）。它在白卡上只有 2.7 的对比度，达不到 WCAG AA。
- 主数字的单位（"天"、"元"、"L"）用 `caption` 档，放在数字右下基线，颜色 `--foreground-secondary`。

### Named Rules

- **数字不细。** 任何数字字重不低于 600。艺术感的 200、300 字重不用。
- **数字不挤。** 字距不小于 -0.01em。

## 4. Elevation

完全扁平。分层只靠两样：页面底（紫灰）与卡片（纯白）的差、留白。

| 层 | 处理 |
|---|---|
| 页面内容 | 无阴影、无边框 |
| 卡片 | `--surface` 底，无边框、无阴影 |
| 输入框 | `--surface` 底 + 1px `--border`（卡片内的输入框改用 `--background` 底、无边框） |
| 弹层（底部抽屉、菜单、对话框、侧滑面板） | `--surface-raised` 底 + `0 12px 40px oklch(0.3 0.06 268 / 0.14)`，深色改 `oklch(0 0 0 / 0.5)` |
| 顶部站点栏、左侧导航 | 与页面底同色，无边框，滚动时不变色 |

### Named Rules

- **只有浮起来的东西有阴影。**
- **不做玻璃、不做渐变。** Grow 的渐变圆环不学。

## 5. Components

基于 shadcn/ui，但以下默认值必须改掉后再用：`--radius`、全部颜色变量、焦点环颜色、`components.json` 的 `baseColor`（不用 slate）。**装进来的每个 shadcn 组件都要删掉 `dark:` 变体**——本项目深色走 `prefers-color-scheme` + `[data-theme]`，`dark:` 会在手动选浅色时误命中。

项目组件与其 shadcn 内核的对应关系（对外 API 由项目组件定义，换内核不影响调用方）：

| 项目组件 | shadcn 内核 |
|---|---|
| `Sheet` | 手机 `drawer`（vaul），电脑 ≥1024px `dialog` |
| `Toast` | `sonner`（已去掉 next-themes，改读 `data-theme`） |
| `Segmented` | `tabs`（滑块是项目自己加的） |
| `ListRow` | `item` |
| `InlineError` | `alert` destructive |
| `DatePicker` | `calendar`（react-day-picker），外壳仍是原生 `<dialog>` |
| 空状态 | `empty` |
| 按钮转圈 | `spinner` |
| 表单 | `input` / `textarea` / `label` / `switch` |

`AppShell`、`HeroCard`、`IconBadge`、`ToolCard`、`ToolColorProvider`、`ErrorBoundary`、顶部刷新进度条没有 shadcn 对应物，保持自写。

### 圆角与间距

| Token | Value | 用途 |
|---|---|---|
| `--radius-sm` | 14px | 小控件、标签、分段切换的选中块、输入框 |
| `--radius-md` | 24px | 卡片 |
| `--radius-lg` | 28px | 弹层、抽屉、侧滑面板 |
| `--radius-pill` | 9999px | 按钮、图标底 |
| 间距 | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 | 只用这八个值 |

### Icon Badge（圆形图标底）

所有工具图标、列表项图标的统一形式：圆形，实色 `--tool-solid` 底，白色 2px 线条图标。三个尺寸：32（列表项）、44（首页卡片）、56（工具页首屏）。这是全站最主要的色彩来源。

### Buttons

高度 48px（手机）/ 40px（电脑），胶囊形，`--font-rounded` 600 字重，17px。

| Variant | 底 | 字 | 用途 |
|---|---|---|---|
| primary | 工具页用 `--tool-solid`，站点层用 `--primary` | 白 | 一屏一个：开始计时、保存、确认 |
| secondary | `--tool-soft` / `--primary-soft` | `--tool-solid` / `--primary` | 次要动作 |
| ghost | 透明 | `--foreground` | 取消、返回、工具栏图标 |
| danger | `red` soft | `red` solid | 删除、破戒 |

状态：hover 亮度 −5%；active 缩放 0.97；focus-visible 是 3px 同色半透明外环；disabled 见颜色规则；loading 时按钮内换成 18px 圆形进度，宽度不变。

### Segmented Control（分段切换）

工具内部导航。整体 `--surface` 底、`--radius-pill`、内边距 4px、高 44px；选中块 `--tool-soft` 底、`--radius-pill`、文字 `--tool-solid`，滑动过渡 200ms。未选中文字 `--foreground-secondary`。文字 `--font-rounded` 15px 600。最多 4 段。

### Cards

卡片是主要容器，但每张卡要"长得不一样"：靠图标颜色、数字大小、有无迷你图表区分，不做同尺寸同内容的重复网格。

- 卡片：`--surface`、`--radius-md`、内边距 20px，无边框无阴影。不嵌套。
- **首页工具卡**：手机两列网格（列间距 12px），电脑三或四列。卡片内从上到下：44px 圆形图标底（工具色）→ 工具名（`--font-rounded` 15px 600，`--foreground-secondary`）→ 核心数字（`--font-rounded` `stat` 32/700，`--foreground`；工具没有摘要数字时显示"打开"箭头）→ 一行说明（`caption`，`--foreground-secondary`）。可选：右下角一个 60×28 的迷你图（工具色线条或柱条）。卡片高度随内容，同一行两张对齐顶部。
- **工具页首屏卡（Hero Card）**：进入工具后第一张卡，`--tool-soft` 底（不是白），内边距 24px，左上 56px 图标底，右侧或下方 `display` 72/700 主数字（`--foreground`）加单位，下方一行说明。这是页面里唯一有颜色底的卡。
- **统计数字块**：一张白卡里两行两列，四个数字不同大小：第一项 `display-sm` 48/700 占一整行，其余三项 `stat` 32/600 一行三列。数字海军蓝，标签 `caption`。不画分隔线。
- **列表**：放在一张白卡里，行高 60px，行间无线，靠 12px 内边距分开；有图标的行用 32px 圆形图标底。

### Inputs / Fields

高度 48px，`--radius-sm`。独立时 `--surface` 底 + 1px `--border`；在白卡内时 `--background` 底无边框。内边距 16px、`body` 字号。标签在输入框上方，`caption` 档。focus 时 2px `--tool-solid` 外环；错误时 `red` solid 外环，下方一行 `caption` 的 red 说明。数字输入框内容用 `--font-rounded` 600。日期时间默认用原生 `<input type="date">` / `datetime-local`；需要同时显示农历的地方（倒数日）用 `DatePicker` 双历选择器。

### Navigation

- **手机顶部站点栏**：高 56px，与页面底同色，无边框。左侧返回（ghost 圆形按钮 40px，`--surface` 底，chevron 图标）或站名（`--font-rounded` 24/700）；中间不放标题，标题落在内容区第一行（`title` 24/700 左对齐）；右侧最多一个同样式的圆形 ghost 按钮。
- **电脑左侧导航**（宽度 ≥ 1024px 出现）：宽 240px，固定，与页面底同色，无边框。顶部站名，中间工具列表（每项 48px 高，32px 圆形图标底加名字，当前项 `--surface` 白底 `--radius-sm`），底部账号入口。
- **电脑内容区**：左侧导航之外的区域内容居中，最宽 720px；首页卡片区最宽 960px。
- 不用底部 tab 栏。

### Feedback

- 加载：骨架屏，形状对应即将出现的卡片；不在内容中央放旋转图标。
- **按钮 loading：** 凡是点了会发请求的按钮，请求期间一律给 `Button` 传 `loading`（不要只传 `disabled`）：按钮禁用、带 `aria-busy`、文字换成 18px 圆形转圈，宽度不变。同屏多个写操作各自一份 busy 状态，各转各的（导出转圈时恢复不能跟着转）。不是 `Button` 组件的按钮（站点栏圆形 ✓、列表行内的"删除"）自己把图标或文字换成同尺寸的转圈，尺寸同样不变。
- **顶部刷新进度条：** 有缓存的页面在后台静默刷新时，站点顶部亮一条 2px 高、贯穿整宽的 `--tool-solid` 细条（里面一段来回扫），请求结束淡出。首次加载归骨架屏管，不出这条；假数据模式（`?mock=1`）不发请求，也不出。计数在 `src/lib/cache.ts` 里用 module 级订阅器汇总，`AppShell` 订阅。
- 空状态：一张 `--tool-soft` 底的卡，里面 56px 图标底、一行标题、一句"下一步做什么"、一个 primary 按钮。文字居中，是全站唯一允许居中的文字。
- 错误：内联，在出错的位置旁边，red solid 字。网络错误在页面顶部一条 red soft 底的横幅，可关闭。
- 成功：轻量 toast，`--foreground` 底白字，胶囊形，底部弹出，2 秒消失。

## 6. Motion

全站动效只有三档时长一条曲线，写在 `src/index.css` 的 `@theme` 里，别处不再出现裸写的毫秒数和 `cubic-bezier()`。

### Token

| 变量 | 值 | 生成的工具类 | 用在哪 |
| --- | --- | --- | --- |
| `--ease-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-quint` | 所有动效，不弹跳 |
| `--transition-duration-fast` | 150ms | `duration-fast` | 状态切换：按钮 hover / active、卡片上浮、导航当前项、图标按钮 |
| `--transition-duration-base` | 200ms | `duration-base` | 进出场：弹层、分段滑块、Toast、列表项、骨架屏换内容 |
| `--transition-duration-page` | 250ms | `duration-page` | 页面切换（View Transitions） |

`--default-transition-duration` 和 `--default-transition-timing-function` 也指向上面两个 token，
所以只写 `transition-colors` / `transition-transform`、不写 duration 和 ease 时，默认就是 150ms + quint。
只有需要 200ms 的地方才补 `duration-base ease-quint`。

### 各处用哪档

- 页面切换：View Transitions API，`::view-transition-old/new(root)` 淡入淡出 + 横向 12px 平移，250ms，不区分前进后退。浏览器没有 `document.startViewTransition` 时直接硬切。
- 弹层（`.sheet`）：手机从下方 16px 滑入 + 遮罩淡入，电脑 0.96 → 1 缩放 + 淡入，200ms。
- 分段切换（`Segmented`）：选中块是一块绝对定位的滑块，用 `transform: translateX()` 在选项间滑动，200ms；文字颜色同步过渡。
- 首页卡片：hover 上浮 2px，按下 0.98 缩放，150ms。不做阴影、不做放大。
- 左侧导航：当前项白底和 hover 底色都走 `transition-colors`，150ms。
- 按钮：`transition-all` + 默认 150ms，hover 降亮度，按下 0.97 缩放。
- Toast / 内联错误 / 离线横幅 / 更新提示：`.reveal` 类，200ms 淡入 + 8px 位移，进出场都播。
- 列表项（倒数日列表、戒烟当天记录）：`.item-in` 高度从 0 展开 + 淡入 200ms；删除加 `.item-out` 反向，播完再从数据里去掉。
- 骨架屏换成真内容：`.fade-in`，200ms 淡入。
- 计时器数字每秒直接替换，不做滚动动画；等宽数字保证不抖。

### 退场动画怎么做

两种，按节点是不是 `<dialog>` 分：

- `<dialog>`（`.sheet`）用 `transition` + `@starting-style` + `transition-behavior: allow-discrete`，把 `display` 和 `overlay` 也列进 transition。关闭时浏览器会等动画放完再收掉，不用在 JS 里加 closing 状态延迟卸载。
- 普通节点（`.reveal`）不卸载：节点常驻 DOM，用 `data-open="true|false"` 切换，`display` 同样走 `allow-discrete`。条件 `return null` 会让退场动画没机会播，所以这类组件一律不要早退。
- 列表项删除是例外：行本来就要从数据里去掉，删除后先加 `.item-out` 等 200ms 再 reload。

`prefers-reduced-motion: reduce` 下一条全局规则把 `*`、`*::before`、`*::after`、`*::backdrop` 和 view-transition 伪元素的 `animation-duration` / `transition-duration` 全部归零，新加动效自动被覆盖。

### 禁止

- 不弹跳（不用 `cubic-bezier` 带回弹的曲线，不用 spring）。
- 不做装饰性动画、不做页面加载编排、不做悬停放大。
- 不引动画库（framer-motion / GSAP 之类），CSS 够用。
- 不在组件里写 `duration-[220ms]`、`ease-[cubic-bezier(...)]` 这种一次性值。

## 7. Do's and Don'ts

### Do

- 每屏一个最大数字，左对齐，圆体，字重 ≥ 600，等宽，海军蓝。
- 每个工具一个颜色槽，颜色出现在圆形图标底、主按钮、选中态、图表、Hero Card 底。
- 页面底紫灰、卡片纯白、文字海军蓝，三者永远中性。
- 卡片 24px 圆角无边框无阴影，按钮和图标底胶囊形或圆形。
- 用原生日期选择器、原生滚动。
- 骨架屏、空状态、内联错误三态齐全。

### Don't

- 不用 shadcn 默认的 slate 底、默认圆角、默认焦点环。
- 不用 Inter、Geist、Space Grotesk、Instrument Serif。
- 不用渐变、渐变文字、玻璃拟态、彩色左边条、悬停放大、卡片阴影。
- 不做同尺寸同结构的重复卡片网格：首页卡片靠颜色、数字、迷你图彼此区分。
- 不做居中大标题、不做 hero metric 模板（大数字 + 渐变 + 小标签那套）。
- 不用 200、300 字重的数字，不用低于 `--foreground-secondary` 对比度的正文。
- 不用底部 tab 栏，不用自定义滚动条，除双历 `DatePicker` 外不用自定义日期选择器。
- 不为单个工具在 8 个槽之外发明新颜色，不发明新字号、新圆角。
- 不学 Grow 的渐变圆环、3D 徽章、插画。
