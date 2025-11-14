// service-worker.js

// This event is triggered when a push message is received from the server.
self.addEventListener('push', function(event) {
  // Parse the data from the push message, which we expect to be a JSON object.
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Reboque360';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: '/favicon.svg', // A default icon for the notification
    badge: '/favicon.svg' // An icon for the notification tray on mobile devices
  };

  // Tell the browser to wait until the notification is shown.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// This event is triggered when a user clicks on a notification.
self.addEventListener('notificationclick', function(event) {
  // Close the notification pop-up.
  event.notification.close();
  
  // This logic attempts to focus on an open window of the app.
  // If one isn't open, it opens a new one.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it.
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
