import { useMemo } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { CleaningTaskCard } from '../../components/cleaning/CleaningTaskCard'
import { EmptyState } from '../../components/common/EmptyState'
import { SectionHeader } from '../../components/common/SectionHeader'
import { useAppStore } from '../../store/app-store'

export const CleaningTasksPage = () => {
  const allTasks = useAppStore((state) => state.tasks)
  const takeCleaningTask = useAppStore((state) => state.takeCleaningTask)
  const tasks = useMemo(
    () => allTasks.filter((task) => task.audience === 'cleaning' && task.status === 'available'),
    [allTasks],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Available now"
        title="Cleaning board"
        description="These tasks are ready to be picked up by any available cleaner."
      />
      {tasks.length ? (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <CleaningTaskCard
              key={task.id}
              task={task}
              actionLabel="Claim task"
              onAction={() => takeCleaningTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardCheck />}
          title="No cleaning tasks are available right now"
          description="New tasks will appear here as soon as they are published or released."
        />
      )}
    </div>
  )
}
