// backend/utils/xpAwards.js

// ⚠️ REQUIREMENT:
// Run this in your backend project:
//   npm install firebase
//
// Then COPY the same firebaseConfig you already use in
// frontend/src/services/firebase.js and paste it below.

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// 🔹 TODO: paste your real config here (same as frontend/services/firebase.js)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE",
};

// Single app instance
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

/* -------------------------------------------------------
   DATE HELPERS
-------------------------------------------------------- */
function getTodayKey() {
  // YYYY-MM-DD (UTC is fine for now)
  return new Date().toISOString().slice(0, 10);
}

function normalizeDailyXp(raw) {
  const todayKey = getTodayKey();

  const base = {
    dateKey: todayKey,
    tournamentsToday: 0,
    threeBonusGranted: false, // +10 XP after 3+ tournaments
    top4BonusGranted: false,  // +15 XP once per day
  };

  if (!raw) return base;

  if (!raw.dateKey || raw.dateKey !== todayKey) {
    // New day -> reset counters/flags
    return base;
  }

  return {
    ...base,
    ...raw,
    dateKey: todayKey,
  };
}

/* -------------------------------------------------------
   XP FROM BUY-IN (TIER-BASED, NOT FORMAT-BASED)
   Rookie: $5  → +5 XP
   Pro:    $10 → +10 XP
   Elite:  $20 → +20 XP
-------------------------------------------------------- */
function xpFromEntryFee(entryFee) {
  if (entryFee >= 20) return 20; // Elite
  if (entryFee >= 10) return 10; // Pro
  if (entryFee >= 5) return 5;   // Rookie
  return 0;                      // free / weird cases
}

/* -------------------------------------------------------
   awardEntryXpOnce(userId, entryFee)
   - Called when Round 1 of C4 actually starts.
   - Gives XP based on BUY-IN amount.
   - Also applies the "3 tournaments/day" bonus (+10 XP once)
-------------------------------------------------------- */
export async function awardEntryXpOnce(userId, entryFee) {
  if (!userId) return;

  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() || {};

  let dailyXp = normalizeDailyXp(data.dailyXp);
  const baseXp = xpFromEntryFee(entryFee);

  if (baseXp <= 0) {
    // free or invalid entry; nothing to do
    return;
  }

  dailyXp.tournamentsToday = (dailyXp.tournamentsToday || 0) + 1;

  let xpDelta = baseXp;

  // ⭐ Option B: 3 tournaments/day bonus (+10 XP) once per day
  if (
    dailyXp.tournamentsToday >= 3 &&
    !dailyXp.threeBonusGranted
  ) {
    xpDelta += 10;
    dailyXp.threeBonusGranted = true;
  }

  const currentXp = data.xp || 0;
  const newXp = currentXp + xpDelta;

  await updateDoc(ref, {
    xp: newXp,
    dailyXp,
  });
}

/* -------------------------------------------------------
   awardTop4BonusOnce(userId)
   - Called once when we confirm they finished top-4
   - +15 XP ONCE per calendar day (Option B)
-------------------------------------------------------- */
export async function awardTop4BonusOnce(userId) {
  if (!userId) return;

  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() || {};

  let dailyXp = normalizeDailyXp(data.dailyXp);

  // already granted today → do nothing
  if (dailyXp.top4BonusGranted) return;

  const currentXp = data.xp || 0;
  const newXp = currentXp + 15; // +15 XP once/day for any top-4

  dailyXp.top4BonusGranted = true;

  await updateDoc(ref, {
    xp: newXp,
    dailyXp,
  });
}
