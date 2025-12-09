// firebase-messaging-sw.js
// Must be located in: /public/firebase-messaging-sw.js

/* --------------------------------------------------------
   BASIC SW LIFECYCLE (Correct + Required)
--------------------------------------------------------- */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/* global self, importScripts, firebase */

/* --------------------------------------------------------
   IMPORT FIREBASE COMPAT VERSIONS
   Service workers CANNOT use ES modules.
--------------------------------------------------------- */
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

/* --------------------------------------------------------
   FIREBASE CONFIG
--------------------------------------------------------- */
firebase.initializeApp({
  apiKey: "AIzaSyBTZHVlHQe7WZN6qt6HkhEBwE0kN-F6VAE",
  authDomain: "skillgrid-9f618.firebaseapp.com",
  projectId: "skillgrid-9f618",
  storageBucket: "skillgrid-9f618.appspot.com",
  messagingSenderId: "15811834130",
  appId: "1:15811834130:web:7575ad3d4ae0580d4103cb",
});

/* --------------------------------------------------------
   INIT MESSAGING
--------------------------------------------------------- */
const messaging = firebase.messaging();

/* --------------------------------------------------------
   BACKGROUND NOTIFICATIONS
   Triggered when app is in background or closed.
--------------------------------------------------------- */
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM] Background message:", payload);

  const notificationTitle = payload.notification?.title || "SkillGrid Alert";
  const notificationOptions = {
    body: payload.notification?.body || "Tournament update.",
    icon: "/icon.png",
    data: payload.data || {}, // route, matchId, etc.
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

/* --------------------------------------------------------
   CLICK HANDLER
   Lets notifications open a specific route in your app.
--------------------------------------------------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const route = event.notification.data?.route || "/";

  event.waitUntil(
    clients.openWindow(route)
  );
});
