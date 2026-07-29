self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(self.registration.showNotification(data.title || 'PairUp', {
    body: data.body || 'There is new activity in your workspace.',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'pairup',
    data: { url: data.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
})