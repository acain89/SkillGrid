// src/services/profileLogic.js
import { auth, db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/* ==============================
   BADGE DEFINITIONS (Option B)
   ============================== */

// Tier badges (9 total)
const BADGE_TIER = (tier, format) => `badge_${tier}_${format}`;

// Triad badge (1)
const BADGE_TRIAD = (tier) => `badge_triad_${tier}`;

// All-Star badge (1)
const BADGE_ALLSTAR = "badge_allstar";

// Champion prize lookup
const FIRST_PRIZE_BY_FORMAT = {
  flattened: 80,
  competitive: 160,
  wta: 320,
};

/* ==============================
   HELPERS
   ============================== */

function updateAverage(prevTotal = 0, prevCount = 0, newValue = 0) {
  const total = prevTotal + newValue;
  const count = prevCount + 1;
  return {
    total,
    avg: count ? Number((total / count).toFixed(1)) : 0,
    count,
  };
}

/* ==============================
   MAIN ENTRY POINT
   ============================== */
/**
 * Called when a tournament finishes.
 *
 * @param {
 *  winnerId: string,
 *  winnerName: string,
 *  format: "flattened"|"competitive"|"wta",
 *  tier: "casual"|"pro"|"elite",
 *  placement: number,
 *  prize: number
 * }
 */
export async function awardTournamentResult({
  winnerId,
  winnerName,
  format,
  tier = "elite",
  placement = 1,
  prize,
}) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data() || {};

    // ===== Pull DB fields or default =====
    const stats = data.stats || {};
    const formats = data.formats || {};
    const badges = new Set(data.badges || []);

    // ===== Prize =====
    const actualPrize =
      typeof prize === "number" ? prize : FIRST_PRIZE_BY_FORMAT[format] ?? 0;

    /* ==============================
       GLOBAL STATS
       ============================== */

    const played = (stats.played || 0) + 1;
    const wins = (stats.wins || 0) + (placement === 1 ? 1 : 0);
    const top4 = (stats.top4 || 0) + (placement <= 4 ? 1 : 0);
    const winnings = (stats.winnings || 0) + actualPrize;
    const biggest = Math.max(stats.biggest || 0, actualPrize);
    const streak = placement === 1 ? (stats.streak || 0) + 1 : 0;

    const avgData = updateAverage(
      stats.totalPlacement || 0,
      stats.played || 0,
      placement
    );

    const newStats = {
      played,
      wins,
      top4,
      winnings,
      biggest,
      streak,
      totalPlacement: avgData.total,
      avgPlace: avgData.avg,
      winRate: played > 0 ? `${((wins / played) * 100).toFixed(1)}%` : "0%",
    };

    /* ==============================
       PER-TIER FORMAT STATS
       ============================== */
    const tierStats = formats[tier] || {};

    const tierAvg = updateAverage(
      tierStats.totalPlacement || 0,
      tierStats.played || 0,
      placement
    );

    formats[tier] = {
      played: (tierStats.played || 0) + 1,
      wins: (tierStats.wins || 0) + (placement === 1 ? 1 : 0),
      avg: tierAvg.avg,
      totalPlacement: tierAvg.total,
    };

    /* ==============================
       BADGES (Option B)
       ============================== */

    // ---------- 1. Tier Badge ----------
    if (placement === 1) {
      badges.add(BADGE_TIER(tier, format));
    }

    // ---------- 2. Triad Badge (all 3 formats inside SAME tier) ----------
    const hasFlattened = badges.has(BADGE_TIER(tier, "flattened"));
    const hasCompetitive = badges.has(BADGE_TIER(tier, "competitive"));
    const hasWTA = badges.has(BADGE_TIER(tier, "wta"));

    if (hasFlattened && hasCompetitive && hasWTA) {
      badges.add(BADGE_TRIAD(tier));
    }

    // ---------- 3. All-Star Badge (must have triad in ALL 3 TIERS) ----------
    const hasTriadCasual = badges.has(BADGE_TRIAD("casual"));
    const hasTriadPro = badges.has(BADGE_TRIAD("pro"));
    const hasTriadElite = badges.has(BADGE_TRIAD("elite"));

    if (hasTriadCasual && hasTriadPro && hasTriadElite) {
      badges.add(BADGE_ALLSTAR);
    }

    /* ==============================
       SAVE TO FIREBASE
       ============================== */

    await updateDoc(ref, {
      stats: newStats,
      formats,
      badges: Array.from(badges),
      vaultBalance: (data.vaultBalance || 0) + actualPrize,
      lastWinName: winnerName || data.lastWinName || null,
      lastWinAt: Date.now(),
    });

    console.log("🏅 Updated badges:", Array.from(badges));

  } catch (err) {
    console.error("awardTournamentResult ERROR:", err);
  }
}
