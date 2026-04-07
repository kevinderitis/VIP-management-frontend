import { useEffect } from 'react'
import { BellRing, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../../store/app-store'

const toastIcon = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
}

export const ToastViewport = () => {
  const toasts = useAppStore((state) => state.toasts)
  const dismissToast = useAppStore((state) => state.dismissToast)

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), 3600),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [dismissToast, toasts])

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[60] flex w-full max-w-sm flex-col gap-3 sm:bottom-6">
      {toasts.map((toast) => {
        const Icon = toastIcon[toast.tone] ?? BellRing
        return (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-3xl border border-white/70 bg-white/95 p-4 shadow-soft backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-mist p-2 text-teal">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-ink">{toast.title}</p>
                <p className="mt-1 text-sm text-slate-500">{toast.message}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
