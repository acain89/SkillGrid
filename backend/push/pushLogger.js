// backend/push/pushLogger.js
import { db } from "../firebaseAdmin.js"; 
// Uses Firebase Admin SDK Firestore

/**
 * Log push events for debugging + analytics
 */
export async function logPushEvent(event) {
  try {
    await db.collection("pushLogs").add({
      ...event,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("Failed to log push event:", err.message);
  }
}
