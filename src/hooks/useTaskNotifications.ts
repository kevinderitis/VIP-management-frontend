import { useEffect, useRef } from 'react'
import { useAppStore, useSessionUser } from '../store/app-store'
import { formatDateTime } from '../utils/format'
import { shouldUseWebPushOnly, showAppNotification } from '../utils/notifications'

export const useTaskNotifications = () => {
  const user = useSessionUser()
  const tasks = useAppStore((state) => state.tasks)
  const previousTaskIdsRef = useRef<string[] | null>(null)

  useEffect(() => {
    previousTaskIdsRef.current = null
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    if (shouldUseWebPushOnly()) return

    const currentTasks = tasks
      .filter(
        (task) =>
          task.assignedTo === user.id &&
          ['assigned', 'scheduled'].includes(task.status),
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        when: task.scheduledAt ?? task.publishedAt,
      }))

    if (!previousTaskIdsRef.current) {
      previousTaskIdsRef.current = currentTasks.map((task) => task.id)
      return
    }

    const newTasks = currentTasks.filter((task) => !previousTaskIdsRef.current?.includes(task.id))
    previousTaskIdsRef.current = currentTasks.map((task) => task.id)

    newTasks.forEach((task) => {
      void showAppNotification('New task assigned', {
        body: `${task.title} · ${formatDateTime(task.when)}`,
        tag: `task-${task.id}`,
      })
    })
  }, [tasks, user])
}
