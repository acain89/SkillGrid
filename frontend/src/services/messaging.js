// ------------------------------------------------------------
// FCM Messaging Wrapper (Frontend)
// ------------------------------------------------------------

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

import { auth, db, requestFcmToken, saveFcmTokenToUser } from "./firebase";

// Lazy-loaded messaging instance
let messagingPromise = null;

async function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported();
      if (!supported) {
        console.warn("❌ FCM not supported on this browser.");
        return null;
      }
      return getMessaging();
    })();
  }
  return messagingPromise;
}

// ------------------------------------------------------------
// REQUEST TOKEN + SAVE
// ------------------------------------------------------------
export async function initFcmForUser() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("⚠️ No user logged in. FCM disabled.");
      return null;
    }

    const token = await requestFcmToken();
    if (!token) {
      console.warn("⚠️ No token returned.");
      return null;
    }

    await saveFcmTokenToUser(user.uid, token);
    console.log("✅ FCM token stored for user:", user.uid);

    return token;
  } catch (err) {
    console.error("❌ initFcmForUser error:", err);
    return null;
  }
}

// ------------------------------------------------------------
// FOREGROUND MESSAGE LISTENER
// ------------------------------------------------------------
export async function subscribeForegroundFCM(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📬 Foreground FCM:", payload);
    callback?.(payload);
  });
}

// ------------------------------------------------------------
// DEVTOOLS
// ------------------------------------------------------------
if (typeof window !== "undefined") {
  window.initFcmForUser = initFcmForUser;
  window.subscribeForegroundFCM = subscribeForegroundFCM;
}
