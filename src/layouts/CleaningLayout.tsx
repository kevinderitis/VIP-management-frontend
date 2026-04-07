import { useMemo } from 'react'
import { ClipboardCheck, Home, LogOut, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore, useSessionUser } from '../store/app-store'

const navItems = [
  { to: '/cleaning', label: 'Home', icon: Home },
  { to: '/cleaning/tasks', label: 'Available', icon: ClipboardCheck },
  { to: '/cleaning/my-tasks', label: 'Today', icon: ClipboardCheck },
  { to: '/cleaning/profile', label: 'Profile', icon: UserRound },
]

export const CleaningLayout = () => {
  const user = useSessionUser()
  const logout = useAppStore((state) => state.logout)
  const todayTasks = useMemo(
    () => user?.activeTaskIds.length ?? 0,
    [user?.activeTaskIds.length],
  )

  return (
    <div className="min-h-screen bg-shell pb-24">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <header className="glass-panel rounded-[30px] bg-gradient-to-br from-white/90 to-sky-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-teal">Cleaning service</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{user?.name}</h1>
              <p className="mt-2 text-sm text-slate-500">{user?.title} · {user?.shift}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-2xl border border-white/70 bg-white/80 p-3 text-slate-500 shadow-soft"
            >
              <LogOut size={18} />
            </button>
          </div>
          <div className="mt-5 rounded-[24px] bg-ink p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Today</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="font-display text-4xl font-semibold">{todayTasks}</p>
              <div className="mb-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200">
                assigned tasks
              </div>
            </div>
            <p className="mt-2 text-sm text-white/70">
              Review what is already assigned to you and pick up any available cleaning work that still needs coverage.
            </p>
          </div>
        </header>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>

      <nav className="fixed bottom-4 left-4 right-4 z-30 rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-soft backdrop-blur lg:left-1/2 lg:right-auto lg:w-[380px] lg:-translate-x-1/2">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/cleaning'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-medium ${
                    isActive ? 'bg-ink text-white' : 'text-slate-500'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
