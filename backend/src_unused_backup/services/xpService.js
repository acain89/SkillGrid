// backend/src/services/xpService.js
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/*
  XP RULES — BASED ON TIER PAID
  Rookie  ($5)  → +5 XP
  Pro     ($10) → +10 XP
  Elite   ($20) → +20 XP
*/
const XP_BY_TIER = {
  rookie: 5,
  pro: 10,
  elite: 20,
};

/*
  Daily bonus awards (once per day)
  - play 3 tournaments → +10 XP
  - finish top 4       → +15 XP
*/
const DAILY_BONUS = {
  threeTournies: 10,
  top4: 15,
};

// Reset daily keys at midnight by using YYYY-MM-DD
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function awardTournamentEntryXP(userId, tier) {
  const ref = db.collection("users").doc(userId);
  const snap = await ref.get();

  if (!snap.exists) throw new Error("User not found");
  const data = snap.data();

  const xpHistory = data.xpHistory || {};
  const today = getTodayKey();

  if (!XP_BY_TIER[tier]) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  // Prevent duplicate XP for this tournament
  if (xpHistory.lastTournamentAward === today + ":" + tier) {
    return { ok: true, awarded: 0, totalXP: data.xp || 0 };
  }

  const xpGain = XP_BY_TIER[tier];
  const newTotal = (data.xp || 0) + xpGain;

  await ref.update({
    xp: newTotal,
    xpHistory: {
      ...xpHistory,
      lastTournamentAward: today + ":" + tier,
      entriesToday: (xpHistory.entriesToday || 0) + 1,
    },
  });

  return { ok: true, awarded: xpGain, totalXP: newTotal };
}

export async function awardDailyTop4(userId) {
  const ref = db.collection("users").doc(userId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("User not found");

  const data = snap.data();
  const xpHistory = data.xpHistory || {};
  const today = getTodayKey();

  if (xpHistory.top4Award === today) {
    return { ok: true, awarded: 0, totalXP: data.xp || 0 };
  }

  const gain = DAILY_BONUS.top4;
  const newTotal = (data.xp || 0) + gain;

  await ref.update({
    xp: newTotal,
    xpHistory: {
      ...xpHistory,
      top4Award: today,
    },
  });

  return { ok: true, awarded: gain, totalXP: newTotal };
}

export async function awardDailyThreeTournies(userId) {
  const ref = db.collection("users").doc(userId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("User not found");

  const data = snap.data();
  const xpHistory = data.xpHistory || {};
  const today = getTodayKey();

  if (xpHistory.threeTourniesAward === today) {
    return { ok: true, awarded: 0, totalXP: data.xp || 0 };
  }

  if ((xpHistory.entriesToday || 0) < 3) {
    return { ok: false, reason: "Not enough tournaments played today" };
  }

  const gain = DAILY_BONUS.threeTournies;
  const newTotal = (data.xp || 0) + gain;

  await ref.update({
    xp: newTotal,
    xpHistory: {
      ...xpHistory,
      threeTourniesAward: today,
    },
  });

  return { ok: true, awarded: gain, totalXP: newTotal };
}
