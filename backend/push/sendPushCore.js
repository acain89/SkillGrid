// backend/push/sendPushCore.js
import admin from "firebase-admin";
import { logPushEvent } from "./pushLogger.js";

const messaging = admin.messaging();

/**
 * Send a push notification using FCM v1 via firebase-admin.
 */
export async function sendPushToToken(deviceToken, payload) {
  const message = {
    token: deviceToken,
    notification: payload.notification || {},
    data: payload.data || {},
  };

  try {
    const result = await messaging.send(message);

    await logPushEvent({
      type: "send-result",
      deviceToken,
      payload,
      success: true,
      result,
      ts: Date.now(),
    });

    return result;
  } catch (err) {
    await logPushEvent({
      type: "send-error",
      deviceToken,
      error: err.message,
      payload,
      ts: Date.now(),
    });

    console.error("Push send error:", err.message);
    throw err;
  }
}
