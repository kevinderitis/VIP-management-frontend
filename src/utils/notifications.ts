import { apiRequest } from '../lib/api'

const NOTIFICATION_PERMISSION_KEY = 'vip-management.notifications.permission'

type BrowserPushSubscription = {
  endpoint: string
  expirationTime?: number | null
  keys?: {
    auth?: string
    p256dh?: string
  }
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0))
}

export const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)

export const notificationsSupported = () =>
  'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

export const shouldUseWebPushOnly = () =>
  notificationsSupported() && isStandaloneMode() && Notification.permission === 'granted'

export const getStoredNotificationPermission = () =>
  notificationsSupported() ? window.localStorage.getItem(NOTIFICATION_PERMISSION_KEY) ?? Notification.permission : 'unsupported'

export const requestNotificationAccess = async () => {
  if (!notificationsSupported()) return 'unsupported'

  const permission = await Notification.requestPermission()
  window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission)
  return permission
}

export const syncStoredNotificationPermission = () => {
  if (!notificationsSupported()) return
  window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, Notification.permission)
}

export const ensurePushSubscription = async (token: string) => {
  if (!notificationsSupported()) return false
  if (Notification.permission !== 'granted') return false

  const registration = await navigator.serviceWorker.ready
  const { publicKey } = await apiRequest<{ publicKey?: string }>('/push/public-key')
  if (!publicKey) return false

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const payload = subscription.toJSON() as BrowserPushSubscription
  if (!payload.endpoint || !payload.keys?.auth || !payload.keys?.p256dh) return false

  await apiRequest('/push/subscriptions', {
    method: 'POST',
    token,
    body: {
      endpoint: payload.endpoint,
      expirationTime: payload.expirationTime ?? null,
      keys: {
        auth: payload.keys.auth,
        p256dh: payload.keys.p256dh,
      },
    },
  })

  return true
}

export const showAppNotification = async (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.showNotification(title, {
        badge: '/icons/icon-192.png',
        icon: '/icons/icon-192.png',
        ...options,
      })
      return
    }
  }

  new Notification(title, options)
}
