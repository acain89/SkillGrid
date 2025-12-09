// backend/state/tournamentStore.js
//
// 16-player in-memory tournament engine.
// Push notifications + Vault payout integration.
//

import { sendMatchReadyPush } from "../push/sendMatchReadyPush.js";
import { addToVault } from "./vaultStore.js";

const tournaments = new Map();

/* ============================================================
   Helpers
============================================================ */

function isRoundComplete(t) {
  const r = t.rounds[t.currentRound];
  if (!r) return false;
  return r.matches.every((m) => m.status === "finished");
}

function buildNextRoundPairings(t) {
  const round = t.rounds[t.currentRound];
  const winners = round.matches.map((m) => m.winnerId);

  const nextRoundIndex = t.currentRound + 1;
  const nextMatches = [];

  for (let i = 0; i < winners.length; i += 2) {
    nextMatches.push({
      id: `r${nextRoundIndex}m${i / 2}`,
      roundIndex: nextRoundIndex,
      matchIndex: i / 2,
      playerIds: [winners[i], winners[i + 1]],
      status: "pending",
      winnerId: null,
      loserId: null,
    });
  }

  t.rounds[nextRoundIndex] = {
    roundIndex: nextRoundIndex,
    matches: nextMatches,
  };
  t.currentRound = nextRoundIndex;
}

/* ============================================================
   Core Store API
============================================================ */

export function createTournamentEntry(t) {
  if (!t || !t.id) throw new Error("createTournamentEntry requires an id");

  const base = {
    status: "waiting", // "waiting" | "running" | "finished"
    currentRound: 0,
    rounds: [],
    champion: null,
    createdAt: Date.now(),
    ...t,
  };

  tournaments.set(t.id, base);
  return base;
}

export function getTournament(id) {
  return tournaments.get(id) || null;
}

export function updateTournament(id, updater) {
  const existing = tournaments.get(id);
  if (!existing) return null;

  const next =
    typeof updater === "function" ? updater(structuredClone(existing)) : updater;

  tournaments.set(id, next);
  return next;
}

export function getOrCreateTournament(id, factory) {
  const existing = tournaments.get(id);
  if (existing) return existing;
  if (typeof factory !== "function")
    throw new Error("getOrCreateTournament missing factory");

  const created = factory();
  tournaments.set(id, created);
  return created;
}

/* ============================================================
   Bracket Initialization
============================================================ */

export function buildInitialBracket(tournament) {
  if (!tournament.players || tournament.players.length !== 16) {
    throw new Error("buildInitialBracket requires exactly 16 players");
  }

  const players = tournament.players;
  const round0Matches = [];

  for (let i = 0; i < 16; i += 2) {
    round0Matches.push({
      id: `r0m${i / 2}`,
      roundIndex: 0,
      matchIndex: i / 2,
      playerIds: [players[i].id, players[i + 1].id],
      status: "pending",
      winnerId: null,
      loserId: null,
    });
  }

  // 🔥 Push notifications for Round 1
  for (const m of round0Matches) {
    sendMatchReadyPush(tournament, m, "connect4");
  }

  return {
    ...tournament,
    status: "running",
    currentRound: 0,
    rounds: [{ roundIndex: 0, matches: round0Matches }],
  };
}

/* ============================================================
   Prize Table (matches UI + business rules)
============================================================ */

function computePrize(tier, format, placementLabel) {
  const t = tier || "casual";
  const f = format || "casual";

  // WTA format (ELITE)
  if (f === "wta") {
    if (placementLabel === "1st") return 320;
    return 0;
  }

  // CASUAL tier (flattened)
  if (t === "casual") {
    switch (placementLabel) {
      case "1st": return 80;
      case "2nd": return 60;
      case "3rd–4th": return 40;
      case "5th–8th": return 25;
      default: return 0;
    }
  }

  // PRO tier (competitive)
  if (t === "pro") {
    switch (placementLabel) {
      case "1st": return 140;
      case "2nd": return 100;
      case "3rd–4th": return 40;
      default: return 0;
    }
  }

  // ELITE tier (WTA) – 1st handled above via format
  if (t === "elite") {
    switch (placementLabel) {
      case "1st": return 320;
      default: return 0;
    }
  }

  return 0;
}

/* ============================================================
   Match Result + Round Progression + Vault Payouts
============================================================ */

export async function recordMatchResult(
  tournament,
  roundIndex,
  matchIndex,
  winnerSide
) {
  if (!tournament.rounds || !tournament.rounds[roundIndex]) {
    throw new Error("Invalid round index");
  }

  const round = tournament.rounds[roundIndex];
  const match = round.matches[matchIndex];
  if (!match) throw new Error("Invalid match index");

  // Prevent double handling
  if (match.status === "finished") {
    return {
      tournament,
      match,
      placementLabel: null,
      prizeAmount: 0,
      status: "already-finished",
    };
  }

  const p1 = match.playerIds[0];
  const p2 = match.playerIds[1];
  const winnerId = winnerSide === 0 ? p1 : p2;
  const loserId = winnerSide === 0 ? p2 : p1;

  match.status = "finished";
  match.winnerId = winnerId;
  match.loserId = loserId;

  const isFinal = roundIndex === 3;
  const isSemi = roundIndex === 2;
  const isQF = roundIndex === 1;
  const isR16 = roundIndex === 0;

  let placementLabel = null;

  // NOTE: placementLabel here is always for the *loser* of this match
  if (isFinal) {
    tournament.champion = winnerId;
    tournament.status = "finished";
    placementLabel = "2nd"; // loser gets 2nd
  } else if (isSemi) {
    placementLabel = "3rd–4th";
  } else if (isQF) {
    placementLabel = "5th–8th";
  } else if (isR16) {
    placementLabel = "9th–16th";
  }

  const tier = tournament.tier || "casual";
  const format = tournament.format || "casual";

  /* --------------------------------------------------------
     🔥 Vault payouts – LOSER (placement prize)
  -------------------------------------------------------- */
  if (placementLabel) {
    const loserPrize = computePrize(tier, format, placementLabel);
    if (loserPrize > 0) {
      await addToVault(loserId, loserPrize, {
        kind: "tournament_prize",
        placement: placementLabel,
        tournamentId: tournament.id,
      });
    }
  }

  /* --------------------------------------------------------
     🔥 Vault payout – WINNER (1st place)
     Only happens ONCE in the final match.
  -------------------------------------------------------- */
  if (isFinal) {
    const winnerPrize = computePrize(tier, format, "1st");
    if (winnerPrize > 0) {
      await addToVault(winnerId, winnerPrize, {
        kind: "tournament_prize",
        placement: "1st",
        tournamentId: tournament.id,
      });
    }
  }

  /* --------------------------------------------------------
     Next Round + push notifications
  -------------------------------------------------------- */
  if (!isFinal && isRoundComplete(tournament)) {
    buildNextRoundPairings(tournament);

    const nextRound = tournament.rounds[tournament.currentRound];

    for (const m of nextRound.matches) {
      await sendMatchReadyPush(tournament, m, "connect4");
    }
  }

  return {
    tournament,
    match,
    placementLabel,        // loser’s placement for UI if needed
    prizeAmount: 0,        // kept for compatibility; real money is in vault
    status: isFinal ? "finalized" : "advance-or-eliminate",
  };
}

/* ============================================================
   Admin Helpers
============================================================ */

export function listTournaments() {
  return Array.from(tournaments.values()).map((t) => ({
    id: t.id,
    tier: t.tier || "casual",
    format: t.format || "casual",
    currentRound: t.currentRound,
    players: t.players?.length || 0,
    champion: t.champion || null,
    status: t.status,
  }));
}

export function resetTournaments() {
  tournaments.clear();
}
