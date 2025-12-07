// src/main.jsx

// 1) Register the service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then(() => console.log("FCM Service Worker Registered"))
    .catch((err) =>
      console.error("FCM SW registration failed:", err)
    );
}

// 2) Init Firebase + Auth
import "./services/firebase.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

// 3) Mount app
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
