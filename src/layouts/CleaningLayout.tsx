import { LogOut } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { useAppStore, useSessionUser } from '../store/app-store'

export const CleaningLayout = () => {
  const user = useSessionUser()
  const logout = useAppStore((state) => state.logout)

  return (
    <div className="min-h-screen bg-shell pb-10">
      <div className="mx-auto max-w-2xl px-4 py-4">
        <header className="flex items-center justify-between gap-3 rounded-[24px] bg-white p-4 shadow-soft">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Cleaning</p>
            <p className="truncate font-display text-2xl font-semibold text-ink">{user?.name}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-[52px] items-center gap-2 rounded-2xl bg-slate-100 px-5 text-lg font-semibold text-slate-600"
          >
            <LogOut size={20} /> Log out
          </button>
        </header>

        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
