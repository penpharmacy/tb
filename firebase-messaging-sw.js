importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBcINCCqaoBBbV4egcbQ2W422ttwFl-dhE",
  authDomain: "tbmedicationreminder.firebaseapp.com",
  projectId: "tbmedicationreminder",
  storageBucket: "tbmedicationreminder.firebasestorage.app",
  messagingSenderId: "658947281549",
  appId: "1:658947281549:web:cb41c127f8b3174e83c8c4",
  measurementId: "G-Z27P0C9192"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "ถึงเวลาแล้ว!";
  const options = {
    body: payload.notification?.body || "กรุณากินยา",
    icon: payload.notification?.icon || "/icons/icon-192.png",
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(arr => {
      const url = '/';
      for(const c of arr){ if(c.url === url && 'focus' in c){ return c.focus(); } }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
