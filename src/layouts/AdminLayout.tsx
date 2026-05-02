import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, ClipboardList, Gift, LayoutDashboard, LogOut, Menu, QrCode, Repeat2, Sparkles, Users2, X, FileSpreadsheet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { AdminToolbarContext } from '../components/common/AdminToolbar'
import { AdminHeaderContext } from '../components/common/SectionHeader'
import { useAppStore, useSessionUser } from '../store/app-store'
import { cn } from '../utils/cn'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/admin/standard-tasks', label: 'Recurring Tasks', icon: Repeat2 },
  { to: '/admin/assignments', label: 'Assignments', icon: CalendarRange },
  { to: '/admin/check-in', label: 'Check-in', icon: QrCode },
  { to: '/admin/tm30', label: 'TM30', icon: FileSpreadsheet },
  { to: '/admin/volunteers', label: 'Volunteers', icon: Users2 },
  { to: '/admin/cleaners', label: 'Cleaning Staff', icon: Users2 },
  { to: '/admin/cleaning-tasks', label: 'Cleaning Tasks', icon: Sparkles },
  { to: '/admin/rewards', label: 'Rewards', icon: Gift },
]

export const AdminLayout = () => {
  const user = useSessionUser()
  const logout = useAppStore((state) => state.logout)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const headerRef = useRef<HTMLElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const [headerState, setHeaderState] = useState<{
    id: string
    eyebrow?: string
    title: string
    description?: string
    action?: ReactNode
  } | null>(null)
  const [headerHeight, setHeaderHeight] = useState(152)
  const [toolbarState, setToolbarState] = useState<{ id: string; content: ReactNode } | null>(null)
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const setHeader = useCallback(
    (id: string, value: { eyebrow?: string; title: string; description?: string; action?: ReactNode } | null) => {
      setHeaderState((current) => {
        if (value === null) {
          return current?.id === id ? null : current
        }

        if (
          current?.id === id &&
          current.eyebrow === value.eyebrow &&
          current.title === value.title &&
          current.description === value.description &&
          current.action === value.action
        ) {
          return current
        }

        return { id, ...value }
      })
    },
    [],
  )
  const adminHeaderContextValue = useMemo(() => ({ setHeader }), [setHeader])
  const setToolbar = useCallback((id: string, content: ReactNode | null) => {
    setToolbarState((current) => {
      if (content === null) {
        return current?.id === id ? null : current
      }

      if (current?.id === id && current.content === content) {
        return current
      }

      return { id, content }
    })
  }, [])
  const adminToolbarContextValue = useMemo(() => ({ setToolbar }), [setToolbar])
  const userInitials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'VF'

  useEffect(() => {
    const headerElement = headerRef.current
    if (!headerElement) return

    const syncHeaderHeight = () => {
      setHeaderHeight(headerElement.getBoundingClientRect().height)
    }

    syncHeaderHeight()

    const observer = new ResizeObserver(() => {
      syncHeaderHeight()
    })

    observer.observe(headerElement)
    window.addEventListener('resize', syncHeaderHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncHeaderHeight)
    }
  }, [headerState, sidebarCollapsed])

  useEffect(() => {
    const toolbarElement = toolbarRef.current
    if (!toolbarElement || !toolbarState) {
      setToolbarHeight(0)
      return
    }

    const syncToolbarHeight = () => {
      setToolbarHeight(toolbarElement.getBoundingClientRect().height)
    }

    syncToolbarHeight()

    const observer = new ResizeObserver(() => {
      syncToolbarHeight()
    })

    observer.observe(toolbarElement)
    window.addEventListener('resize', syncToolbarHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncToolbarHeight)
    }
  }, [toolbarState])

  return (
    <AdminHeaderContext.Provider value={adminHeaderContextValue}>
    <AdminToolbarContext.Provider value={adminToolbarContextValue}>
    <div className="min-h-screen bg-shell">
      <div
        className={cn(
          'mx-auto grid min-h-screen max-w-[1600px]',
          sidebarCollapsed ? 'lg:grid-cols-[96px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]',
        )}
      >
        <aside
          className={cn(
            'hidden h-screen self-start overflow-visible border-r border-white/60 bg-admin py-8 text-white lg:sticky lg:top-0 lg:z-40 lg:flex lg:flex-col',
            sidebarCollapsed ? 'px-3' : 'px-6',
          )}
        >
          <div className={cn('flex items-start', sidebarCollapsed ? 'justify-center' : 'justify-end')}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/80 transition hover:bg-white/12"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <div className={cn('mt-4 rounded-[28px] border border-white/10 bg-white/8 backdrop-blur', sidebarCollapsed ? 'p-3' : 'p-6')}>
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold text-ink">
                  {userInitials}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">VolunteerFlow</p>
                <p className="mt-3 text-xs font-medium text-white/75">{user?.name}</p>
                <p className="mt-1 text-[11px] text-white/50">{user?.title}</p>
              </div>
            )}
          </div>

          <nav className="mt-8 grid gap-2 overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center overflow-visible rounded-2xl py-3 text-sm font-medium text-white/70 transition',
                      sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4',
                      isActive ? 'bg-white text-ink shadow-soft' : 'hover:bg-white/10 hover:text-white',
                    )
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {sidebarCollapsed ? null : item.label}
                  {sidebarCollapsed ? (
                    <span className="pointer-events-none absolute left-[calc(100%+0.6rem)] top-1/2 z-[120] hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-white/15 bg-white px-3 py-2 text-xs font-semibold text-ink shadow-[0_18px_40px_rgba(15,23,42,0.18)] group-hover:block">
                      {item.label}
                    </span>
                  ) : null}
                </NavLink>
              )
            })}
          </nav>
          <button
            onClick={logout}
            className={cn(
              'group relative z-0 mt-auto flex items-center overflow-visible rounded-2xl border border-white/10 py-3 text-sm text-white/80 hover:bg-white/10',
              sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4',
            )}
          >
            <LogOut size={18} />
            {sidebarCollapsed ? null : 'Sign out'}
            {sidebarCollapsed ? (
              <span className="pointer-events-none absolute left-[calc(100%+0.6rem)] top-1/2 z-[120] hidden -translate-y-1/2 whitespace-nowrap rounded-2xl border border-white/15 bg-white px-3 py-2 text-xs font-semibold text-ink shadow-[0_18px_40px_rgba(15,23,42,0.18)] group-hover:block">
                Sign out
              </span>
            ) : null}
          </button>
        </aside>
        <main
          className="relative z-0 flex min-h-screen min-w-0 flex-col overflow-x-hidden"
          style={
            {
              '--admin-header-height': `${headerHeight}px`,
              '--admin-toolbar-height': `${toolbarHeight}px`,
            } as CSSProperties
          }
        >
          <header
            ref={headerRef}
            className={cn(
              'fixed inset-x-0 top-0 z-30 border-b border-white/60 bg-white/85 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur sm:px-6 sm:py-4 lg:right-[calc((100vw-min(100vw,1600px))/2)] lg:px-8',
              sidebarCollapsed
                ? 'lg:left-[calc((100vw-min(100vw,1600px))/2+96px)]'
                : 'lg:left-[calc((100vw-min(100vw,1600px))/2+280px)]',
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-ink shadow-soft lg:hidden"
                >
                  <Menu size={18} />
                </button>
                <div>
                  {headerState?.eyebrow ? (
                    <p className="text-xs uppercase tracking-[0.25em] text-teal">{headerState.eyebrow}</p>
                  ) : null}
                  <p className="mt-1 font-display text-2xl font-semibold text-ink">
                    {headerState?.title ?? 'VolunteerFlow'}
                  </p>
                  {headerState?.description ? (
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">{headerState.description}</p>
                  ) : null}
                </div>
              </div>
              {headerState?.action ? <div className="hidden sm:block">{headerState.action}</div> : null}
            </div>
          </header>
          {toolbarState ? (
            <div
              ref={toolbarRef}
              className={cn(
                'fixed inset-x-0 z-20 px-4 pt-3 sm:px-6 lg:right-[calc((100vw-min(100vw,1600px))/2)] lg:px-8',
                sidebarCollapsed
                  ? 'lg:left-[calc((100vw-min(100vw,1600px))/2+96px)]'
                  : 'lg:left-[calc((100vw-min(100vw,1600px))/2+280px)]',
              )}
              style={{ top: 'var(--admin-header-height, 152px)' }}
            >
              {toolbarState.content}
            </div>
          ) : null}
          <div
            className="flex-1 overflow-x-hidden px-4 pb-6 sm:px-6 lg:px-8 lg:pb-6"
            style={{ paddingTop: `calc(var(--admin-header-height, 152px) + var(--admin-toolbar-height, 0px) + 1rem)` }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 bg-ink/45 lg:hidden">
          <div className="absolute inset-y-0 left-0 flex w-[86vw] max-w-[340px] flex-col bg-admin px-5 py-5 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">VolunteerFlow</p>
                <p className="mt-2 font-display text-2xl font-semibold">Admin menu</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">Signed in</p>
              <p className="mt-2 font-semibold text-white">{user?.name}</p>
              <p className="mt-1 text-sm text-white/70">{user?.title}</p>
            </div>

            <nav className="mt-6 grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition',
                        isActive ? 'bg-white text-ink shadow-soft' : 'hover:bg-white/10 hover:text-white',
                      )
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>

            <button
              onClick={logout}
              className="mt-auto flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
          <button type="button" className="absolute inset-0 -z-10" onClick={() => setMobileNavOpen(false)} />
        </div>
      ) : null}
    </div>
    </AdminToolbarContext.Provider>
    </AdminHeaderContext.Provider>
  )
}
