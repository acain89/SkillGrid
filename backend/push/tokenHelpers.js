// backend/push/tokenHelpers.js
import admin from "../config/firebaseAdmin.js";

export async function getUserTokens(uid) {
  try {
    const snap = await admin
      .firestore()
      .collection("userTokens")
      .doc(uid)
      .collection("tokens")
      .get();

    return snap.docs.map(d => d.id);
  } catch (err) {
    console.error("Token fetch error:", err);
    return [];
  }
}
