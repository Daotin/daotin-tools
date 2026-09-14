import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, LayoutGrid, Monitor, Moon, Settings, Sun, User, X } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { cn } from '@/lib/cn'
import { ErrorBoundary } from './ErrorBoundary'
import { PageSkeleton } from './Skeleton'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { isRefreshing, subscribeRefresh } from '@/lib/cache'
import { useSession } from '@/lib/auth'
import { tools } from '@/tools'

const SITE_NAME = 'Daotin 的工具箱'

/** 站点栏上的图标按钮样式，工具页通过 SiteAction 往里塞按钮时共用。 */
export const roundButton = buttonVariants({ variant: 'ghost', size: 'icon' })

const THEMES = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
] as const

type Theme = (typeof THEMES)[number]['value']

const readTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('dt:theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // 隐私模式读不到：当跟随系统处理
  }
  return 'system'
}

/** 主题：三项下拉（浅色 / 深色 / 跟随系统），落到 <html> 上的 dark class。 */
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    // 跟随系统时，系统白天黑夜切换要跟着变
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  function pick(next: Theme) {
    setTheme(next)
    try {
      localStorage.setItem('dt:theme', next)
    } catch {
      // 隐私模式写不进去：本次切换照样生效，只是刷新后回到跟随系统
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="主题">
          <Sun className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((item) => (
          <DropdownMenuItem key={item.value} onClick={() => pick(item.value)}>
            <item.icon />
            {item.label}
            {theme === item.value && <span className="ml-auto text-muted-foreground">·</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** 电脑端常驻、手机端从左侧滑出的导航（Sidebar 自带手机适配）。 */
function AppSidebar() {
  const { session } = useSession()
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const email = session?.user.email
  const items = [
    { to: '/', icon: LayoutGrid, label: '首页' },
    ...tools.map((tool) => ({ to: tool.path, icon: tool.icon, label: tool.name })),
  ]
  // 首页要精确匹配，工具页匹配它下面的所有子路由
  const active = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-16 justify-center px-4">
        <span className="truncate font-semibold">{SITE_NAME}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={active(item.to)}>
                    {/* 手机端点完要把抽屉收起来 */}
                    <Link to={item.to} viewTransition onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={active('/account')}>
              <Link to="/account" viewTransition onClick={() => setOpenMobile(false)}>
                <User />
                <span className="truncate">{email?.split('@')[0] ?? '账号'}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

const SITE_ACTION_ID = 'site-action'

/**
 * 工具页把自己的站点栏右侧按钮塞进站点栏（倒数日的 + / ✓ / 编辑）。
 * 用 portal 而不是把按钮传给 AppShell，是因为按钮的可用状态由页面自己的表单决定。
 */
export function SiteAction({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => setHost(document.getElementById(SITE_ACTION_ID)), [])
  return host ? createPortal(children, host) : null
}

/** 离线横幅：可关闭；回到在线自动消失。 */
function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    const goOnline = () => {
      setOffline(false)
      // 下次再离线时横幅重新出现，不因为上次关过就永久消失
      setClosed(false)
    }
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <div
      data-open={offline && !closed}
      className="reveal flex items-center gap-2 border-b bg-muted px-4 py-2 text-sm text-muted-foreground lg:px-6"
    >
      <span className="flex-1">当前离线，显示的是上次数据</span>
      <button type="button" aria-label="关闭" onClick={() => setClosed(true)}>
        <X className="size-4" />
      </button>
    </div>
  )
}

/**
 * 顶部后台刷新进度条：有缓存的页面静默刷新时亮起，否则用户不知道数据在更新。
 * 节点常驻，只切 data-open，这样结束时能淡出（假数据模式不发请求，计数一直是 0）。
 * Progress 不传 value 就是不定值，指示条的来回扫在 index.css 里。
 */
function RefreshBar() {
  const refreshing = useSyncExternalStore(subscribeRefresh, isRefreshing)
  return (
    <Progress
      aria-hidden
      data-open={refreshing}
      className="refresh-bar pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 rounded-none bg-transparent"
    />
  )
}

export function AppShell() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const isHome = pathname === '/'
  // 回上一级路径而不是 navigate(-1)：从外部链接直接进来时历史里没有上一页
  const parent = pathname.slice(0, pathname.lastIndexOf('/')) || '/'
  // 工具页右侧换成该工具的设置齿轮；设置页本身不再显示
  const tool = tools.find((t) => pathname.startsWith(t.path))
  const settingsPath = tool?.hasSettings ? `${tool.path}/settings` : null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <RefreshBar />
        <OfflineBanner />
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          {!isHome && (
            <>
              <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
              <Button
                variant="ghost"
                size="icon"
                aria-label="返回"
                onClick={() => navigate({ pathname: parent, search }, { viewTransition: true })}
              >
                <ChevronLeft />
              </Button>
            </>
          )}
          <div className="ml-auto flex items-center gap-1">
            {/* 工具页把右操作位让给页面自己（见 SiteAction） */}
            <div id={SITE_ACTION_ID} className="flex items-center gap-1" />
            {settingsPath && pathname !== settingsPath && (
              <Link
                to={settingsPath}
                viewTransition
                aria-label="设置"
                className={cn(roundButton)}
              >
                <Settings />
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col px-4 pt-4 pb-8 lg:px-6 lg:pb-12">
          <div
            className={cn(
              'mx-auto flex w-full flex-1 flex-col',
              isHome ? 'max-w-5xl' : 'max-w-3xl',
            )}
          >
            {/* 工具页是按需加载的 chunk，加载期间用骨架屏占位，加载失败落到 ErrorBoundary */}
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
