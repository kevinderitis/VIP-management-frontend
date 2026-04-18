self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'New notification', body: event.data.text() }
  }

  const {
    title = 'VolunteerFlow Hostel',
    body,
    tag,
    url = '/',
    icon = '/icons/icon-192.png',
    badge = '/icons/icon-192.png',
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon,
      badge,
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => 'focus' in client)
      if (matchingClient) {
        matchingClient.navigate(targetUrl)
        return matchingClient.focus()
      }

      return self.clients.openWindow(targetUrl)
    }),
  )
})
