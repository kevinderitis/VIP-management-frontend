import { useEffect } from 'react'
import { useAppStore, useSessionUser } from '../store/app-store'
import {
  requestNotificationAccess,
  shouldPromptForNotifications,
  showAppNotification,
  syncStoredNotificationPermission,
} from '../utils/notifications'

export const usePwaNotifications = () => {
  const user = useSessionUser()
  const isReady = useAppStore((state) => state.isReady)

  useEffect(() => {
    syncStoredNotificationPermission()
  }, [])

  useEffect(() => {
    if (!isReady || !user) return
    if (!shouldPromptForNotifications()) return

    const run = async () => {
      const permission = await requestNotificationAccess()
      if (permission === 'granted') {
        await showAppNotification('Notifications enabled', {
          body: 'You will now receive alerts for new tasks assigned to you.',
        })
      }
    }

    void run()
  }, [isReady, user])
}
