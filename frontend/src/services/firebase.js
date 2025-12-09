// ------------------------------------------------------------
// Debug Logs
// ------------------------------------------------------------
console.log("🔥 FIREBASE.JS LOADED");
console.log("🔥 VAPID KEY:", import.meta.env.VITE_FCM_VAPID_KEY);
console.log("🔥 API BASE:", import.meta.env.VITE_API_BASE);

// ------------------------------------------------------------
// Firebase Imports
// ------------------------------------------------------------
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

// ------------------------------------------------------------
// Firebase Config
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBTZHVlHQe7WZN6qt6HkhEBwE0kN-F6VAE",
  authDomain: "skillgrid-9f618.firebaseapp.com",
  projectId: "skillgrid-9f618",
  storageBucket: "skillgrid-9f618.appspot.com",
  messagingSenderId: "15811834130",
  appId: "1:15811834130:web:7575ad3d4ae0580d4103cb",
};

// ------------------------------------------------------------
// Initialization
// ------------------------------------------------------------
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ------------------------------------------------------------
// Messaging Setup (Lazy Load Because Browsers Break Otherwise)
// ------------------------------------------------------------
let messagingPromise = null;

export async function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported();
      if (!supported) {
        console.warn("❌ Messaging not supported on this browser.");
        return null;
      }
      return getMessaging(app);
    })();
  }
  return messagingPromise;
}

// ------------------------------------------------------------
// Request FCM Token
// ------------------------------------------------------------
export async function requestFcmToken() {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.warn("❌ Missing VAPID key in .env");
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    console.log("🔥 FCM Token Retrieved:", token);
    return token;
  } catch (err) {
    console.error("❌ Token error:", err);
    return null;
  }
}

// ------------------------------------------------------------
// Save Token — FIXED VERSION FOR YOUR RULES
// Path: users/{uid}/pushTokens/{token}
// ------------------------------------------------------------
export async function saveFcmTokenToUser(uid, token) {
  try {
    if (!uid || !token) {
      console.warn("❌ Missing UID or token.");
      return;
    }

    // Firestore rules allow exactly this path:
    // match /users/{uid}/pushTokens/{token}
    const ref = doc(db, "users", uid, "pushTokens", token);

    await setDoc(ref, {
      uid,
      token,
      createdAt: Date.now(),
    });

    console.log("✅ Token saved to Firestore:", ref.path);
  } catch (err) {
    console.error("❌ Failed to save token:", err);
  }
}

// ------------------------------------------------------------
// Foreground Notifications
// ------------------------------------------------------------
export async function subscribeToForegroundMessages(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📬 Foreground FCM:", payload);
    callback?.(payload);
  });
}

// ------------------------------------------------------------
// DevTools Helper
// ------------------------------------------------------------
if (typeof window !== "undefined") {
  window.requestFcmToken = requestFcmToken;
  window.subscribeToForegroundMessages = subscribeToForegroundMessages;
}
