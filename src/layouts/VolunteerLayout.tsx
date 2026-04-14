import { useEffect, useState } from 'react'
import { Coins, Gift, Home, LogOut, Medal, ClipboardCheck, Trophy } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppStore, useSessionUser } from '../store/app-store'
import { ProgressBar } from '../components/common/ProgressBar'

const navItems = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/app/tasks', label: 'Available', icon: ClipboardCheck },
  { to: '/app/my-tasks', label: 'My Tasks', icon: Medal },
  { to: '/app/rewards', label: 'Rewards', icon: Gift },
  { to: '/app/profile', label: 'Profile', icon: Medal },
]

export const VolunteerLayout = () => {
  const user = useSessionUser()
  const logout = useAppStore((state) => state.logout)
  const nextRewardGoal = Math.max(120, Math.ceil((user?.points ?? 0) / 50) * 50 + 50)
  const [isExpanded, setIsExpanded] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 72) {
        setIsExpanded(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const revealPointsCard = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setIsExpanded(true)
  }

  return (
    <div className="min-h-screen bg-shell pb-24">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div className="sticky top-3 z-20">
          <div
            className={`glass-panel flex items-center justify-between gap-3 rounded-[28px] px-4 py-3 shadow-soft transition-all duration-300 ${
              isExpanded
                ? 'pointer-events-none -translate-y-3 opacity-0'
                : 'pointer-events-auto translate-y-0 opacity-100'
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={revealPointsCard}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-3 py-2 text-sm font-semibold text-white shadow-float"
              >
                <Trophy size={15} className="text-amber-300" />
                {user?.points ?? 0}
              </button>
              <button
                onClick={logout}
                className="rounded-2xl border border-white/70 bg-white/80 p-2.5 text-slate-500"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>

        <header
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'mt-0 max-h-[420px] opacity-100'
              : 'mt-0 max-h-0 opacity-0'
          }`}
        >
          <div className="glass-panel rounded-[32px] bg-gradient-to-br from-white/90 to-mist p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-teal">Volunteer app</p>
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
            <div className="mt-6">
              <div className="rounded-[24px] bg-ink p-5 text-white">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/60">
                  <Coins size={14} />
                  Points earned
                </p>
                <div className="mt-2 flex items-end gap-3">
                  <p className="font-display text-4xl font-semibold">{user?.points ?? 0}</p>
                  <div className="mb-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-200">
                    Coin stash
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/70">Every completed task drops new coins and brings you closer to the next reward.</p>
                <ProgressBar value={user?.points ?? 0} max={nextRewardGoal} className="mt-4 bg-white/20" />
              </div>
            </div>
          </div>
        </header>
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
      <nav className="fixed bottom-4 left-4 right-4 z-30 rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-soft backdrop-blur lg:left-1/2 lg:right-auto lg:w-[420px] lg:-translate-x-1/2">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
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
