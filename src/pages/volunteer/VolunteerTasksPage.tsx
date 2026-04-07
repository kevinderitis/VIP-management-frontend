import { useMemo } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'
import { SectionHeader } from '../../components/common/SectionHeader'
import { TaskCard } from '../../components/volunteer/TaskCard'
import { useAppStore, useSessionUser } from '../../store/app-store'

export const VolunteerTasksPage = () => {
  const user = useSessionUser()
  const allTasks = useAppStore((state) => state.tasks)
  const takeTask = useAppStore((state) => state.takeTask)
  const tasks = useMemo(
    () => allTasks.filter((task) => task.audience === 'volunteer' && task.status === 'available'),
    [allTasks],
  )

  return (
    <div className="grid gap-6">
      <SectionHeader
        eyebrow="Available now"
        title="Open task board"
        description="When you claim a task, it disappears from this board and moves straight into My Tasks."
      />
      {tasks.length ? (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              actionLabel="Claim task"
              onAction={() => user && takeTask(task.id, user.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ClipboardCheck />}
          title="No tasks are available right now"
          description="The system will publish new tasks automatically as soon as their scheduled time arrives."
        />
      )}
    </div>
  )
}
