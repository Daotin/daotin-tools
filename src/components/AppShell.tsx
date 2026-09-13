import { Suspense, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, LayoutGrid, Settings, User, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { cn } from '@/lib/cn'
import { ErrorBoundary } from './ErrorBoundary'
import { IconBadge } from './IconBadge'
import { PageSkeleton } from './Skeleton'
import { useSession } from '@/lib/auth'
import { tools } from '@/tools'

const SITE_NAME = '工具'

/** 站点栏的 40px 白底圆形 ghost 按钮样式。有色按钮在此基础上覆盖 bg / text。 */
export const roundButton =
  'flex size-10 shrink-0 items-center justify-center rounded-pill bg-surface text-foreground transition-transform active:scale-[0.97] [&_svg]:size-5'

/** 电脑端左侧导航：240px 固定，与页面底同色无边框。 */
function Sidebar() {
  const { session } = useSession()
  const email = session?.user.email
  return (
    <aside className="hidden w-60 shrink-0 flex-col lg:flex">
      <div className="flex h-[72px] items-center px-6 font-rounded text-title">
        {SITE_NAME}
      </div>
      <nav className="flex flex-col gap-1 px-3">
        <NavItem to="/" end icon={<IconBadge icon={LayoutGrid} size={32} color="blue" />}>
          首页
        </NavItem>
        {tools.map((tool) => (
          <NavItem
            key={tool.id}
            to={tool.path}
            icon={<IconBadge icon={tool.icon} size={32} color={tool.color} />}
          >
            {tool.name}
          </NavItem>
        ))}
      </nav>
      <div className="mt-auto px-3 pb-3">
        <NavItem to="/account" icon={<IconBadge icon={User} size={32} color="blue" />}>
          {email?.split('@')[0] ?? '账号'}
        </NavItem>
      </div>
    </aside>
  )
}

function NavItem({
  to,
  end,
  icon,
  children,
}: {
  to: string
  end?: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      viewTransition
      className={({ isActive }) =>
        cn(
          'flex h-12 items-center gap-3 rounded-sm px-3 font-rounded text-body-sm font-semibold',
          isActive && 'bg-surface',
        )
      }
    >
      {icon}
      {children}
    </NavLink>
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

/** 离线横幅：orange soft 底 orange solid 字，可关闭；回到在线自动消失。 */
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

  if (!offline || closed) return null
  return (
    <div className="flex items-center gap-2 bg-orange-soft px-4 py-2 text-caption text-orange-solid lg:px-8">
      <span className="flex-1">当前离线，显示的是上次数据</span>
      <button type="button" aria-label="关闭" onClick={() => setClosed(true)}>
        <X className="size-4" />
      </button>
    </div>
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
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        {/* 手机顶部站点栏：56px，与页面底同色无边框 */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
          {isHome ? (
            /* 首页不显示返回按钮，站名落在内容区第一行 */
            <span />
          ) : (
            <button
              type="button"
              aria-label="返回"
              onClick={() => navigate({ pathname: parent, search })}
              className={cn(roundButton, 'lg:hidden')}
            >
              <ChevronLeft />
            </button>
          )}
          {/* 右操作位：工具页是设置齿轮，其余页面手机上是账号（电脑端账号在左侧导航） */}
          {settingsPath && pathname !== settingsPath ? (
            <Link to={settingsPath} aria-label="设置" className={cn(roundButton, 'ml-auto')}>
              <Settings />
            </Link>
          ) : tool ? (
            /* 没有设置齿轮的工具，把右操作位让给页面自己（见 SiteAction）。
               portal 的内容挂在站点栏里，拿不到 ToolColorProvider 的变量，这里补一份。 */
            <div
              id={SITE_ACTION_ID}
              className="ml-auto flex"
              style={
                {
                  '--tool-solid': `var(--${tool.color}-solid)`,
                  '--tool-soft': `var(--${tool.color}-soft)`,
                } as React.CSSProperties
              }
            />
          ) : (
            <Link to="/account" aria-label="账号" className={cn(roundButton, 'ml-auto lg:hidden')}>
              <User />
            </Link>
          )}
        </header>
        <main className="flex flex-1 flex-col px-4 pb-8 lg:px-8 lg:pb-12">
          <div
            className={cn(
              'mx-auto flex w-full flex-1 flex-col',
              isHome ? 'max-w-[960px]' : 'max-w-[720px]',
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
      </div>
    </div>
  )
}
