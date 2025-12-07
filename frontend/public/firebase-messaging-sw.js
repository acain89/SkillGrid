/* global self, importScripts, firebase */

importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBTZHVlHQe7WZN6qt6HkhEBwE0kN-F6VAE",
  authDomain: "skillgrid-9f618.firebaseapp.com",
  projectId: "skillgrid-9f618",
  storageBucket: "skillgrid-9f618.appspot.com",
  messagingSenderId: "15811834130",
  appId: "1:15811834130:web:7575ad3d4ae0580d4103cb",
});

const messaging = firebase.messaging();

/**
 * BACKGROUND NOTIFICATIONS
 * (When the app is closed or hidden)
 */
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM] Background message:", payload);

  const notificationTitle = payload.notification?.title || "SkillGrid Alert";
  const notificationOptions = {
    body: payload.notification?.body || "Tournament update.",
    data: payload.data || {}, // <-- holds route for click actions
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * CLICK HANDLER (Fix B)
 * Allows notification → open game / bracket page
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const route = event.notification.data?.route || "/";

  event.waitUntil(clients.openWindow(route));
});
