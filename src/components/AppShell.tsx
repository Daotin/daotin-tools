import { ChevronLeft, LayoutGrid, User } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { cn } from 'cn'
import { IconBadge } from './IconBadge'
import { useSession } from '@/lib/auth'
import { tools } from '@/tools'

const SITE_NAME = '工具'

/** 站点栏的 40px 白底圆形 ghost 按钮样式。 */
const roundButton =
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

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isHome = pathname === '/'

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 手机顶部站点栏：56px，与页面底同色无边框 */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
          {isHome ? (
            /* 首页不显示返回按钮，站名落在内容区第一行 */
            <span />
          ) : (
            <button
              type="button"
              aria-label="返回"
              onClick={() => navigate(-1)}
              className={roundButton}
            >
              <ChevronLeft />
            </button>
          )}
          {/* 右操作位：手机上是账号，电脑端账号在左侧导航 */}
          <Link to="/account" aria-label="账号" className={cn(roundButton, 'lg:hidden')}>
            <User />
          </Link>
        </header>
        <main className="flex-1 px-4 pb-8 lg:px-8 lg:pb-12">
          <div
            className={cn(
              'mx-auto',
              isHome ? 'max-w-[960px]' : 'max-w-[720px]',
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
