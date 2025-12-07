// backend/controllers/xpController.js
import { db } from "../firebaseAdmin.js";

/**
 * Utility: normalize dailyXp object to "today"
 */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDailyXp(raw) {
  const todayKey = getTodayKey();

  const base = {
    dateKey: todayKey,
    tournamentsToday: 0,
    threeBonusGranted: false,
    top4BonusGranted: false,
  };

  if (!raw) return base;
  if (raw.dateKey !== todayKey) return base;

  return { ...base, ...raw, dateKey: todayKey };
}

/**
 * Internal helper: load user doc
 */
async function getUserDoc(uid) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("User not found");
  }
  return { ref, data: snap.data() };
}

/**
 * INTERNAL:
 * Award "entry XP" (based on entryFee) + daily 3-tournament bonus if applicable.
 * This is meant to be called ONCE per tournament for a user.
 */
async function awardEntryXpForUser(uid) {
  const { ref, data } = await getUserDoc(uid);

  const active = data.activeTournament;
  if (!active) {
    return { ok: false, reason: "No active tournament" };
  }

  if (active.entryXpGranted) {
    return {
      ok: true,
      xpAdded: 0,
      alreadyGranted: true,
      xp: data.xp || 0,
    };
  }

  const fee = active.entryFee || 0;
  let xpFromFee = 0;

  if (fee >= 20) xpFromFee = 20;
  else if (fee >= 10) xpFromFee = 10;
  else if (fee >= 5) xpFromFee = 5;

  // If it was some free entry, we still mark entryXpGranted but no XP
  let dailyXp = normalizeDailyXp(data.dailyXp);
  dailyXp.tournamentsToday = (dailyXp.tournamentsToday || 0) + 1;

  let xpDelta = xpFromFee;

  // 3-tournament daily bonus
  if (
    dailyXp.tournamentsToday >= 3 &&
    !dailyXp.threeBonusGranted
  ) {
    xpDelta += 10;
    dailyXp.threeBonusGranted = true;
  }

  const newXp = (data.xp || 0) + xpDelta;

  await ref.update({
    xp: newXp,
    dailyXp,
    "activeTournament.entryXpGranted": true,
  });

  return {
    ok: true,
    xpAdded: xpDelta,
    xp: newXp,
    dailyXp,
  };
}

/**
 * INTERNAL:
 * Award Top-4 bonus (once per day).
 * We'll use +15 XP for top-4.
 */
async function awardTop4BonusForUser(uid) {
  const { ref, data } = await getUserDoc(uid);

  let dailyXp = normalizeDailyXp(data.dailyXp);

  if (dailyXp.top4BonusGranted) {
    return {
      ok: true,
      xpAdded: 0,
      alreadyGranted: true,
      xp: data.xp || 0,
    };
  }

  const bonus = 15;
  const newXp = (data.xp || 0) + bonus;
  dailyXp.top4BonusGranted = true;

  await ref.update({
    xp: newXp,
    dailyXp,
  });

  return {
    ok: true,
    xpAdded: bonus,
    xp: newXp,
    dailyXp,
  };
}

/* =======================================================
   EXPRESS HANDLERS (API)
   ======================================================= */

/**
 * POST /xp/award-entry
 * body: { uid: string }
 *
 * Called from frontend when:
 *  - Player starts their FIRST Connect 4 game in a tournament
 */
export async function awardEntryXpHandler(req, res) {
  try {
    const { uid } = req.body || {};
    if (!uid) {
      return res.status(400).json({ ok: false, error: "Missing uid" });
    }

    const result = await awardEntryXpForUser(uid);
    return res.json(result);
  } catch (err) {
    console.error("awardEntryXpHandler error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Internal server error",
    });
  }
}

/**
 * POST /xp/award-top4
 * body: { uid: string }
 *
 * Intended to be called from:
 *  - Tournament engine when user secures a Top-4 placement
 */
export async function awardTop4BonusHandler(req, res) {
  try {
    const { uid } = req.body || {};
    if (!uid) {
      return res.status(400).json({ ok: false, error: "Missing uid" });
    }

    const result = await awardTop4BonusForUser(uid);
    return res.json(result);
  } catch (err) {
    console.error("awardTop4BonusHandler error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Internal server error",
    });
  }
}

/**
 * GET /xp/summary/:uid
 * Returns basic XP + dailyXp snapshot for debugging/UI
 */
export async function getXpSummaryHandler(req, res) {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ ok: false, error: "Missing uid" });
    }

    const { data } = await getUserDoc(uid);
    const dailyXp = normalizeDailyXp(data.dailyXp);

    return res.json({
      ok: true,
      xp: data.xp || 0,
      dailyXp,
      activeTournament: data.activeTournament || null,
    });
  } catch (err) {
    console.error("getXpSummaryHandler error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Internal server error",
    });
  }
}

// Expose internals for use in the tournament engine later if needed.
export { awardEntryXpForUser, awardTop4BonusForUser };
