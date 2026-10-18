// Firebase Cloud Messaging background service worker.
// Config is passed via query string at registration time (see push.service.js).
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const params = new URLSearchParams(self.location.search);
const config = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

if (config.apiKey && config.projectId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload?.notification || {};
    const data = payload?.data || {};
    self.registration.showNotification(notification.title || data.title || 'GatherUp', {
      body: notification.body || data.body || 'You have a new message',
      icon: '/icon.png',
      badge: '/icon.png',
      data,
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/#/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
