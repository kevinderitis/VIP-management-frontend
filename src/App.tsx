import { useEffect } from 'react'
import { ToastViewport } from './components/common/ToastViewport'
import { useOfficeCallNotifications } from './hooks/useOfficeCallNotifications'
import { usePwaNotifications } from './hooks/usePwaNotifications'
import { useRealtimeSimulation } from './hooks/useRealtimeSimulation'
import { useTaskNotifications } from './hooks/useTaskNotifications'
import { AppRouter } from './routes/AppRouter'
import { useAppStore } from './store/app-store'

function App() {
  const initializeApp = useAppStore((state) => state.initializeApp)
  const isReady = useAppStore((state) => state.isReady)

  useRealtimeSimulation()
  usePwaNotifications()
  useTaskNotifications()
  useOfficeCallNotifications()

  useEffect(() => {
    void initializeApp()
  }, [initializeApp])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shell px-6">
        <div className="rounded-[32px] bg-white/90 px-8 py-10 text-center shadow-soft backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-teal">VolunteerFlow Hostel</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Loading workspace</h1>
          <p className="mt-3 text-sm text-slate-500">Syncing users, tasks, rewards, and activity.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppRouter />
      <ToastViewport />
    </>
  )
}

export default App
