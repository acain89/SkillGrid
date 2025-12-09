// src/main.jsx

// --------------------------------------------------
// 1) Register Service Worker BEFORE Firebase loads
// --------------------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((reg) => {
        console.log("✓ FCM Service Worker Registered:", reg.scope);
      })
      .catch((err) => {
        console.error("✗ FCM SW registration failed:", err);
      });
  });
}

// --------------------------------------------------
// 2) Load Firebase + App
// --------------------------------------------------
import "./services/firebase.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

// --------------------------------------------------
// 3) Mount Application
// --------------------------------------------------
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
