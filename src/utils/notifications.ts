const NOTIFICATION_PERMISSION_KEY = 'vip-management.notifications.permission'
const NOTIFICATION_PERMISSION_ASKED_KEY = 'vip-management.notifications.asked'

const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)

export const getStoredNotificationPermission = () =>
  window.localStorage.getItem(NOTIFICATION_PERMISSION_KEY) ?? Notification.permission

export const shouldPromptForNotifications = () => {
  if (!('Notification' in window)) return false
  if (!isStandaloneMode()) return false
  if (Notification.permission !== 'default') return false
  return !window.localStorage.getItem(NOTIFICATION_PERMISSION_ASKED_KEY)
}

export const requestNotificationAccess = async () => {
  if (!('Notification' in window)) return 'unsupported'

  const permission = await Notification.requestPermission()
  window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission)
  window.localStorage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, new Date().toISOString())
  return permission
}

export const syncStoredNotificationPermission = () => {
  if (!('Notification' in window)) return
  window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, Notification.permission)
}

export const showAppNotification = async (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.showNotification(title, {
        badge: '/icons/icon-192.svg',
        icon: '/icons/icon-192.svg',
        ...options,
      })
      return
    }
  }

  new Notification(title, options)
}
