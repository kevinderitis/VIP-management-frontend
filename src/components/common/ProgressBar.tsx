import { cn } from '../../utils/cn'

export const ProgressBar = ({
  value,
  max,
  className,
}: {
  value: number
  max: number
  className?: string
}) => (
  <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200', className)}>
    <div
      className="h-full rounded-full bg-gradient-to-r from-teal to-lagoon transition-all duration-500"
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
    />
  </div>
)
