// backend/utils/notify.js
// Unified FCM notification system for SkillGrid.

import { adminDB, adminMessaging } from "../config/firebaseAdmin.js";

/**
 * Retrieve the FCM token for a single user.
 */
async function getUserToken(uid) {
  try {
    const ref = adminDB.collection("userTokens").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) return null;

    const data = snap.data();
    return data.token || null;
  } catch (err) {
    console.error("[FCM] Error fetching token for:", uid, err);
    return null;
  }
}

/**
 * Send ANY push notification to a user by UID.
 */
export async function sendToUser(uid, payload) {
  try {
    const token = await getUserToken(uid);
    if (!token) {
      console.warn("[FCM] No token for user:", uid);
      return false;
    }

    await adminMessaging.send({
      token,
      notification: {
        title: payload.title || "SkillGrid",
        body: payload.body || "",
      },
      data: payload.data || {},
    });

    console.log("[FCM] Push sent →", uid);
    return true;
  } catch (err) {
    console.error("[FCM] Send error:", err);
    return false;
  }
}

/**
 * Tournament-specific match-ready notification.
 * Triggered when a match is created for ANY round.
 */
export async function sendMatchReadyPush(tournament, match, gameType) {
  try {
    const p1 = match.playerIds[0];
    const p2 = match.playerIds[1];

    if (!p1 || !p2) {
      console.warn("[FCM] Missing player IDs in match:", match);
      return;
    }

    const route = `/arena/${tournament.id}/match/${match.id}`;

    const payload = {
      title: "Your Match is Ready",
      body: `Round ${match.roundIndex + 1} of ${gameType} is starting now.`,
      data: {
        route,
        tournamentId: String(tournament.id),
        matchId: String(match.id),
        gameType,
      },
    };

    await sendToUser(p1, payload);
    await sendToUser(p2, payload);

  } catch (err) {
    console.error("[FCM] MatchReadyPush error:", err);
  }
}
