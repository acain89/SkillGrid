// src/core/xp/awardXp.js
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

/* ============================================================
   CONSTANTS
   ============================================================ */
export const XP_RULES = {
  TOURNAMENT: {
    5: 5,
    10: 10,
    20: 20,
  },
  DAILY_TOP4: 15,
  DAILY_THREE_TOURNIES: 10,
};

const today = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   LOAD USER XP STATE
   ============================================================ */
async function getUserXpState(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      xp: 0,
      freePasses: { five: 0, ten: 0, twenty: 0 },
      xpDaily: {
        date: today(),
        top4Claimed: false,
        threeTourneyClaimed: false,
        tournamentsPlayedToday: 0,
      },
    });
    return (await getDoc(ref)).data();
  }

  const data = snap.data();

  // Daily reset
  if (!data.xpDaily || data.xpDaily.date !== today()) {
    data.xpDaily = {
      date: today(),
      top4Claimed: false,
      threeTourneyClaimed: false,
      tournamentsPlayedToday: 0,
    };
  }

  return data;
}

/* ============================================================
   SAVE USER XP STATE
   ============================================================ */
async function saveUserXpState(uid, data) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data);
}

/* ============================================================
   AWARD XP FOR JOINING A TOURNAMENT
   ============================================================ */
export async function awardTournamentXp(uid, entryCost) {
  const data = await getUserXpState(uid);

  const xpGain = XP_RULES.TOURNAMENT[entryCost] ?? 0;
  data.xp += xpGain;

  data.xpDaily.tournamentsPlayedToday += 1;

  // Daily 3-tournament bonus
  if (
    data.xpDaily.tournamentsPlayedToday === 3 &&
    !data.xpDaily.threeTourneyClaimed
  ) {
    data.xp += XP_RULES.DAILY_THREE_TOURNIES;
    data.xpDaily.threeTourneyClaimed = true;
  }

  await saveUserXpState(uid, data);
  return data;
}

/* ============================================================
   AWARD XP FOR FINISHING TOP 4
   ============================================================ */
export async function awardTop4Xp(uid) {
  const data = await getUserXpState(uid);

  if (!data.xpDaily.top4Claimed) {
    data.xp += XP_RULES.DAILY_TOP4;
    data.xpDaily.top4Claimed = true;
  }

  await saveUserXpState(uid, data);
  return data;
}

/* ============================================================
   DEDUCT XP & GRANT PASSES (REDEMPTION)
   ============================================================ */
export async function redeemXpReward(uid, xpCost, award) {
  // award = { five: n, ten: n, twenty: n }
  const data = await getUserXpState(uid);

  if (data.xp < xpCost) {
    throw new Error("Not enough XP");
  }

  data.xp -= xpCost;

  // Add passes
  data.freePasses.five += award.five ?? 0;
  data.freePasses.ten += award.ten ?? 0;
  data.freePasses.twenty += award.twenty ?? 0;

  await saveUserXpState(uid, data);
  return data;
}
