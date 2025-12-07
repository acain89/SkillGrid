// backend/push/sendPushToUser.js

import { sendPushToToken } from "./sendPushCore.js";
import { logPushEvent } from "./pushLogger.js";
import { db } from "../firebaseAdmin.js";  // ✔ Admin Firestore

/**
 * Look up the user's FCM token and send them a notification.
 */
export async function sendPushToUser(uid, payload) {
  await logPushEvent({
    type: "queued",
    uid,
    payload,
    ts: Date.now(),
  });

  // Fetch user doc via Admin SDK
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();

  if (!snap.exists || !snap.data().fcmToken) {
    await logPushEvent({
      type: "no-token",
      uid,
      payload,
    });
    return null;
  }

  const token = snap.data().fcmToken;

  return sendPushToToken(token, payload);
}
