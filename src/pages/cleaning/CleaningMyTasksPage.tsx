import { useMemo } from 'react'
import { CalendarClock } from 'lucide-react'
import { CleaningTaskCard } from '../../components/cleaning/CleaningTaskCard'
import { EmptyState } from '../../components/common/EmptyState'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore, useSessionUser } from '../../store/app-store'
import { toLocalDateKey } from '../../utils/format'

export const CleaningMyTasksPage = () => {
  const user = useSessionUser()
  const allTasks = useAppStore((state) => state.tasks)
  const completeCleaningTask = useAppStore((state) => state.completeCleaningTask)
  const releaseCleaningTask = useAppStore((state) => state.releaseCleaningTask)
  const today = toLocalDateKey()

  const tasks = useMemo(
    () =>
      allTasks.filter(
        (task) =>
          task.audience === 'cleaning' &&
          task.assignedTo === user?.id &&
          ['assigned', 'scheduled'].includes(task.status) &&
          toLocalDateKey(task.scheduledAt ?? task.publishedAt) === today,
      ),
    [allTasks, today, user?.id],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Assigned today"
        title="My cleaning tasks"
        description="A simple day view of the tasks already assigned to you."
      />
      {tasks.length ? (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <CleaningTaskCard
              key={task.id}
              task={task}
              actionLabel="Mark as completed"
              onAction={() => completeCleaningTask(task.id)}
              secondaryActionLabel="Release task"
              onSecondaryAction={() => releaseCleaningTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarClock />}
          title="Nothing assigned for today"
          description="You can claim something from the cleaning board if extra help is needed."
        />
      )}
    </div>
  )
}
