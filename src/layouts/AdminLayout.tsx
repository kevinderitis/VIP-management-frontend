import { useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, ClipboardList, Gift, LayoutDashboard, LogOut, Menu, Repeat2, Sparkles, Users2, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore, useSessionUser } from '../store/app-store'
import { cn } from '../utils/cn'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/admin/standard-tasks', label: 'Recurring Tasks', icon: Repeat2 },
  { to: '/admin/assignments', label: 'Assignments', icon: CalendarRange },
  { to: '/admin/volunteers', label: 'Volunteers', icon: Users2 },
  { to: '/admin/cleaners', label: 'Cleaning Staff', icon: Users2 },
  { to: '/admin/cleaning-tasks', label: 'Cleaning Tasks', icon: Sparkles },
  { to: '/admin/rewards', label: 'Rewards', icon: Gift },
]

export const AdminLayout = () => {
  const user = useSessionUser()
  const logout = useAppStore((state) => state.logout)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-shell">
      <div
        className={cn(
          'mx-auto grid min-h-screen max-w-[1600px]',
          sidebarCollapsed ? 'lg:grid-cols-[96px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]',
        )}
      >
        <aside
          className={cn(
            'hidden h-screen self-start overflow-y-auto border-r border-white/60 bg-admin py-8 text-white lg:sticky lg:top-0 lg:flex lg:flex-col',
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
                  VF
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">VolunteerFlow</p>
                <h1 className="mt-3 font-display text-3xl font-semibold">Hostel Control Hub</h1>
                <p className="mt-3 text-sm text-white/70">
                  Operations, volunteers, assignments, and rewards in one live workspace.
                </p>
              </>
            )}
          </div>

          <nav className="mt-8 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-2xl py-3 text-sm font-medium text-white/70 transition',
                      sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4',
                      isActive ? 'bg-white text-ink shadow-soft' : 'hover:bg-white/10 hover:text-white',
                    )
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {sidebarCollapsed ? null : item.label}
                </NavLink>
              )
            })}
          </nav>
          <button
            onClick={logout}
            className={cn(
              'mt-auto flex items-center rounded-2xl border border-white/10 py-3 text-sm text-white/80 hover:bg-white/10',
              sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4',
            )}
            title={sidebarCollapsed ? 'Sign out' : undefined}
          >
            <LogOut size={18} />
            {sidebarCollapsed ? null : 'Sign out'}
          </button>
        </aside>
        <main className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
          <header className="fixed inset-x-0 top-0 z-30 border-b border-white/60 bg-white/80 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur sm:px-6 sm:py-4 lg:sticky lg:z-20 lg:px-8">
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
                <p className="text-xs uppercase tracking-[0.25em] text-teal">Admin backoffice</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">Hello, {user?.name}</p>
                </div>
              </div>
              <div className="hidden rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-soft sm:block">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                <p className="mt-1 font-semibold text-ink">Connected and running live</p>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-x-hidden px-4 pb-6 pt-[calc(env(safe-area-inset-top)+6.5rem)] sm:px-6 sm:pt-24 lg:px-8 lg:py-6">
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
  )
}
