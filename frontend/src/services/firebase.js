// ------------------------------------------------------------
// Logging for debugging
// ------------------------------------------------------------
console.log("Vite ENV:", import.meta.env);
console.log("VAPID KEY:", import.meta.env.VITE_FCM_VAPID_KEY);

// ------------------------------------------------------------
// Firebase imports
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
// Messaging
// ------------------------------------------------------------
let messagingPromise = null;

export async function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported();
      if (!supported) return null;
      return getMessaging(app);
    })();
  }
  return messagingPromise;
}

export async function requestFcmToken() {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.warn("Missing VAPID key.");
      return null;
    }
    const token = await getToken(messaging, { vapidKey });
    console.log("FCM Token:", token);
    return token;
  } catch (err) {
    console.error("Token error:", err);
    return null;
  }
}

export async function saveFcmTokenToUser(uid, token) {
  try {
    const ref = doc(db, "users", uid, "pushTokens", token);
    await setDoc(ref, { createdAt: Date.now() }, { merge: true });
    console.log("Token saved:", uid);
  } catch (err) {
    console.error("Save error:", err);
  }
}

export async function subscribeToForegroundMessages(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("[FCM] Foreground:", payload);
    callback?.(payload);
  });
}

// DevTools helpers
if (typeof window !== "undefined") {
  window.requestFcmToken = requestFcmToken;
  window.subscribeToForegroundMessages = subscribeToForegroundMessages;
}
