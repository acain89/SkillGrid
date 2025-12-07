console.log("Vite ENV:", import.meta.env);
console.log("VAPID KEY:", import.meta.env.VITE_FCM_VAPID_KEY);


// frontend/src/services/firebase.js
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
// Correct Firebase Config
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
const app = initializeApp(firebaseConfig);

// --- Auth & Firestore ---
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ------------------------------------------------------------
//     FIREBASE CLOUD MESSAGING (FRONTEND)
// ------------------------------------------------------------

let messagingPromise = null;

export async function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported();
      if (!supported) {
        console.warn("FCM not supported in this environment.");
        return null;
      }
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
      console.warn("Missing VITE_FCM_VAPID_KEY in environment.");
      return null;
    }

    const token = await getToken(messaging, { vapidKey });

    if (token) {
      console.log("FCM Token:", token.slice(0, 14) + "…");
      return token;
    } else {
      console.warn("User blocked notifications or token unavailable.");
      return null;
    }
  } catch (err) {
    console.warn("Error retrieving FCM token:", err.message);
    return null;
  }
}

// ------------------------------------------------------------
// Save token under users/{uid}/pushTokens/{token}
// ------------------------------------------------------------
export async function saveFcmTokenToUser(uid, token) {
  try {
    const ref = doc(db, "users", uid, "pushTokens", token);
    await setDoc(ref, { createdAt: Date.now() }, { merge: true });
    console.log("Saved FCM token to user:", uid);
  } catch (err) {
    console.error("Failed to save FCM token:", err.message);
  }
}

// ------------------------------------------------------------
// Foreground message listener
// ------------------------------------------------------------
export async function subscribeToForegroundMessages(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("[FCM] Foreground message:", payload);

    const { title, body } = payload.notification || {};
    const route = payload.data?.route;

    if (title || body) {
      const n = new Notification(title || "SkillGrid Alert", {
        body: body || "",
        data: { route },
      });

      n.onclick = () => {
        if (route) window.location.href = route;
      };
    }

    callback?.(payload);
  });
}

// ------------------------------------------------------------
// Expose for browser console testing
// ------------------------------------------------------------
if (typeof window !== "undefined") {
  window.requestFcmToken = requestFcmToken;
  window.subscribeToForegroundMessages = subscribeToForegroundMessages;
}
