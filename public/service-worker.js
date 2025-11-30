// Service Worker para Web Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {
    title: 'Gestor Financeiro',
    body: 'Nova notificação'
  };

  const options = {
    body: data.body,
    icon: '/lock.png',
    badge: '/lock.png',
    tag: data.tag || 'notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gestor Financeiro', options)
  );
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

self.addEventListener('notificationclose', () => {
  // Executar lógica de "marcar como lido"
});
