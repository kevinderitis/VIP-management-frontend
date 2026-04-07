import { cn } from '../../utils/cn'
import { priorityStyles, statusStyles } from '../../utils/constants'
import { TaskPriority, TaskStatus } from '../../types/models'

export const StatusBadge = ({ status }: { status: TaskStatus }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize',
      statusStyles[status],
    )}
  >
    {status}
  </span>
)

export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize',
      priorityStyles[priority],
    )}
  >
    {priority}
  </span>
)
