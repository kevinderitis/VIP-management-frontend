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
  if (!open) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-[70] sm:inset-x-auto sm:right-4 sm:w-[360px]">
      <div className="rounded-[28px] border border-teal/20 bg-white/96 p-4 shadow-soft backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-teal/10 p-2 text-teal">
            <BellRing size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">Enable notifications</p>
            <p className="mt-1 text-sm text-slate-600">
              Get office calls and task alerts even when the app is closed.
            </p>
            {isDenied ? (
              <p className="mt-2 text-xs text-amber-700">
                Notifications are currently blocked. Tap the button again after enabling them in your browser or system settings.
              </p>
            ) : null}
            <div className="mt-3">
              <Button type="button" size="sm" onClick={() => void onEnable()} disabled={isBusy}>
                {isBusy ? 'Enabling...' : 'Enable notifications'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
