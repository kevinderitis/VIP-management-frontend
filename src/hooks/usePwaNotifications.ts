import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore, useSessionUser } from '../store/app-store'
import {
  ensurePushSubscription,
  getStoredNotificationPermission,
  isStandaloneMode,
  notificationsSupported,
  requestNotificationAccess,
  showAppNotification,
  syncStoredNotificationPermission,
} from '../utils/notifications'

export const usePwaNotifications = () => {
  const user = useSessionUser()
  const accessToken = useAppStore((state) => state.accessToken)
  const isReady = useAppStore((state) => state.isReady)
  const [permission, setPermission] = useState(getStoredNotificationPermission())
  const [isEnabling, setIsEnabling] = useState(false)

  const eligibleRole = user?.role === 'volunteer' || user?.role === 'cleaner'
  const supported = typeof window !== 'undefined' && notificationsSupported()
  const standalone = typeof window !== 'undefined' && isStandaloneMode()

  useEffect(() => {
    syncStoredNotificationPermission()
    setPermission(getStoredNotificationPermission())
  }, [])

  useEffect(() => {
    if (!isReady || !accessToken || !eligibleRole || !supported) return
    if (permission !== 'granted') return

    void ensurePushSubscription(accessToken)
  }, [accessToken, eligibleRole, isReady, permission, supported])

  const enableNotifications = useCallback(async () => {
    if (!supported || !accessToken) return

    setIsEnabling(true)
    try {
      const nextPermission = await requestNotificationAccess()
      setPermission(nextPermission)
      if (nextPermission === 'granted') {
        await ensurePushSubscription(accessToken)
        await showAppNotification('Notifications enabled', {
          body: 'You will now receive alerts even when the app is closed.',
        })
      }
    } finally {
      setIsEnabling(false)
    }
  }, [accessToken, supported])

  return useMemo(
    () => ({
      permission,
      isEnabling,
      canShowPrompt:
        Boolean(isReady && accessToken && eligibleRole && supported && standalone && permission !== 'granted'),
      enableNotifications,
      isDenied: permission === 'denied',
    }),
    [accessToken, eligibleRole, enableNotifications, isEnabling, isReady, permission, standalone, supported],
  )
}
