// frontend/src/services/fcm.js
import { requestFcmToken } from "./firebase";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * Call this after user signs in / joins tournament.
 * It will:
 *  - Request Notification permission
 *  - Obtain FCM token
 *  - Send it to backend for this user
 */
export async function registerNotificationToken() {
  try {
    // Ask browser permission first
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted:", permission);
      return null;
    }

    const token = await requestFcmToken();
    if (!token) return null;

    const res = await fetch(`${API_BASE}/api/notifications/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      console.warn("Failed to register FCM token with backend.");
      return null;
    }

    console.log("FCM token registered with backend.");
    return token;
  } catch (err) {
    console.warn("registerNotificationToken error:", err.message);
    return null;
  }
}
