
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/firebase-messaging-sw.js")
    .then(() => console.log("FCM Service Worker Registered"))
    .catch(err => console.error("FCM SW registration failed:", err));
}


// src/main.jsx
import "./services/firebase.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";



// 🚫 NO React.StrictMode (Google popup breaks under StrictMode)
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
