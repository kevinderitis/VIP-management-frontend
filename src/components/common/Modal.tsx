import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export const Modal = ({
  open,
  title,
  description,
  onClose,
  children,
  panelClassName,
  bodyClassName,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  panelClassName?: string
  bodyClassName?: string
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        className={cn(
          'flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white p-6 shadow-2xl',
          panelClassName,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-ink">{title}</h3>
            {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>
        <div className={cn('mt-6 min-h-0 overflow-y-auto', bodyClassName)}>{children}</div>
      </div>
    </div>
  )
}
