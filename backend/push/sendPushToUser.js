// backend/push/sendPushToUser.js
import admin from "../config/firebaseAdmin.js";
import { getUserTokens } from "./tokenHelpers.js";

/**
 * Send a push notification to a single user.
 */
export async function sendPushToUser(uid, { title, body, route = "/" }) {
  try {
    const tokens = await getUserTokens(uid);
    if (!tokens || tokens.length === 0) {
      console.log("No tokens found for user:", uid);
      return;
    }

    const payload = {
      notification: { title, body },
      data: { route },
    };

    const res = await admin.messaging().sendMulticast({
      tokens,
      ...payload,
    });

    console.log("Push sent:", res.successCount, "success,", res.failureCount, "failed");
  } catch (err) {
    console.error("Error sending push:", err);
  }
}
