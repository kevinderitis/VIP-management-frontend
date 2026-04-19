import { useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import { Button } from './Button'

export const NotificationPermissionBanner = ({
  open,
  isDenied,
  isBusy,
  onEnable,
}: {
  open: boolean
  isDenied: boolean
  isBusy: boolean
  onEnable: () => void | Promise<void>
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return undefined
    }

    setVisible(true)
    const timeout = window.setTimeout(() => setVisible(false), 9000)
    return () => window.clearTimeout(timeout)
  }, [open])

  if (!open || !visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] flex justify-center sm:inset-x-auto sm:right-4 sm:top-4 sm:block sm:w-[360px]">
      <div className="pointer-events-auto w-full max-w-[420px] rounded-[28px] border border-teal/20 bg-white/96 p-4 shadow-soft backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-teal/10 p-2 text-teal">
            <BellRing size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">
              {isDenied ? 'Notifications are blocked' : 'Enable notifications'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {isDenied
                ? 'To receive alerts, enable notifications from your browser or app settings.'
                : 'Get office calls and task alerts even when the app is closed.'}
            </p>
            {isDenied ? (
              <p className="mt-2 text-xs text-amber-700">
                On iPhone, open Settings, find this app or Safari website settings, and allow notifications there.
              </p>
            ) : (
              <div className="mt-3">
                <Button type="button" size="sm" onClick={() => void onEnable()} disabled={isBusy}>
                  {isBusy ? 'Enabling...' : 'Enable notifications'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
