// src/services/profileStats.js
import { db } from "./firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

const BADGE_IDS = {
  casual: {
    flattened: "casual_flat_winner",
    competitive: "casual_comp_winner",
    wta: "casual_wta_winner",
  },
  pro: {
    flattened: "pro_flat_winner",
    competitive: "pro_comp_winner",
    wta: "pro_wta_winner",
  },
  elite: {
    flattened: "elite_flat_winner",
    competitive: "elite_comp_winner",
    wta: "elite_wta_winner",
  },
};

const TRIAD_BADGE = "triad_master";
const ALL_STAR_BADGE = "all_star";

// Helper: recompute averages
function updateAverage(prevTotal, prevCount, newValue) {
  const total = (prevTotal || 0) + newValue;
  const count = (prevCount || 0) + 1;
  return {
    total,
    avg: count > 0 ? Number((total / count).toFixed(1)) : 0,
    count,
  };
}

/**
 * Call this when a tournament finishes for the current user.
 * tier: "casual" | "pro" | "elite"
 * format: "flattened" | "competitive" | "wta"
 * placement: 1..16
 * prize: number (dollars won)
 */
export async function awardTournamentResult(userId, { tier, format, placement, prize }) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const stats = data.stats || {};
  const formats = data.formats || {};
  const existingBadges = new Set(data.badges || []);

  // ---------- BASE STATS ----------
  const played = (stats.played || 0) + 1;
  const wins = (stats.wins || 0) + (placement === 1 ? 1 : 0);
  const top4 = (stats.top4 || 0) + (placement <= 4 ? 1 : 0);
  const winnings = (stats.winnings || 0) + (prize || 0);
  const biggest = Math.max(stats.biggest || 0, prize || 0);
  const streak = placement === 1 ? (stats.streak || 0) + 1 : 0; // reset on non-win

  const avgOverall = updateAverage(stats.totalPlacement, stats.played || 0, placement);

  const newStats = {
    played,
    wins,
    top4,
    winnings,
    biggest,
    streak,
    totalPlacement: avgOverall.total,
    avgPlace: avgOverall.avg,
    winRate: played > 0 ? `${((wins / played) * 100).toFixed(1)}%` : "0%",
  };

  // ---------- FORMAT STATS ----------
  const tierStats = formats[tier] || {};
  const avgTier = updateAverage(tierStats.totalPlacement, tierStats.played || 0, placement);

  formats[tier] = {
    played: (tierStats.played || 0) + 1,
    wins: (tierStats.wins || 0) + (placement === 1 ? 1 : 0),
    avg: avgTier.avg,
    totalPlacement: avgTier.total,
  };

  // ---------- BADGES ----------
  const newBadgeIds = [];

  // 1) Tier-format win badge
  if (placement === 1 && BADGE_IDS[tier] && BADGE_IDS[tier][format]) {
    newBadgeIds.push(BADGE_IDS[tier][format]);
  }

  // Merge into set
  newBadgeIds.forEach((id) => existingBadges.add(id));

  // 2) Triad badge: all 3 formats in ELITE won
  const eliteSet = new Set([
    BADGE_IDS.elite.flattened,
    BADGE_IDS.elite.competitive,
    BADGE_IDS.elite.wta,
  ]);
  const hasAllElite = [...eliteSet].every((id) => existingBadges.has(id));
  if (hasAllElite) existingBadges.add(TRIAD_BADGE);

  // 3) All-Star badge: all 9 base badges
  const allBase = [
    BADGE_IDS.casual.flattened,
    BADGE_IDS.casual.competitive,
    BADGE_IDS.casual.wta,
    BADGE_IDS.pro.flattened,
    BADGE_IDS.pro.competitive,
    BADGE_IDS.pro.wta,
    BADGE_IDS.elite.flattened,
    BADGE_IDS.elite.competitive,
    BADGE_IDS.elite.wta,
  ];
  const hasAllBase = allBase.every((id) => existingBadges.has(id));
  if (hasAllBase) existingBadges.add(ALL_STAR_BADGE);

  // ---------- SAVE ----------
  await updateDoc(ref, {
    stats: newStats,
    formats,
    badges: Array.from(existingBadges),
    vaultBalance: (data.vaultBalance || 0) + (prize || 0),
  });
}
