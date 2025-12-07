// backend/state/tournamentStore.js
//
// Simple in-memory 16-player single-elimination tournament store.
// This is meant for live testing and can later be replaced with
// a persistent store (Firestore, SQL, etc).

import { sendMatchReadyPush } from "../push/sendMatchReadyPush.js";

const tournaments = new Map();

/* ============================================================
   Helpers
============================================================ */

/**
 * Check whether the current round is fully complete.
 */
function isRoundComplete(t) {
  const r = t.rounds[t.currentRound];
  if (!r) return false;
  return r.matches.every((m) => m.status === "finished");
}

/**
 * Build the next round pairings from winners of the current round.
 */
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
   Core Tournament Store API
============================================================ */

export function createTournamentEntry(t) {
  if (!t || !t.id) {
    throw new Error("createTournamentEntry requires an id");
  }
  const base = {
    status: "waiting", // "waiting" | "ready" | "running" | "finished"
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
  if (typeof factory !== "function") {
    throw new Error("getOrCreateTournament missing factory");
  }
  const created = factory();
  tournaments.set(id, created);
  return created;
}

/* ============================================================
   Bracket Building
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

  return {
    ...tournament,
    status: "running",
    currentRound: 0,
    rounds: [
      {
        roundIndex: 0,
        matches: round0Matches,
      },
    ],
  };
}

/* ============================================================
   Match Result + Progression Logic
============================================================ */

export async function recordMatchResult(tournament, roundIndex, matchIndex, winnerSide) {
  if (!tournament.rounds || !tournament.rounds[roundIndex]) {
    throw new Error("Invalid round index");
  }

  const round = tournament.rounds[roundIndex];
  const match = round.matches[matchIndex];
  if (!match) throw new Error("Invalid match index");

  // Prevent double-processing
  if (match.status === "finished") {
    return {
      tournament,
      match,
      placementLabel: null,
      prizeAmount: 0,
      status: "already-finished",
    };
  }

  const p1Id = match.playerIds[0];
  const p2Id = match.playerIds[1];
  const winnerId = winnerSide === 0 ? p1Id : p2Id;
  const loserId = winnerSide === 0 ? p2Id : p1Id;

  match.status = "finished";
  match.winnerId = winnerId;
  match.loserId = loserId;

  const isFinalRound = roundIndex === 3;
  const isSemiFinal = roundIndex === 2;
  const isQuarterFinal = roundIndex === 1;
  const isRoundOf16 = roundIndex === 0;

  let placementLabel = null;

  if (isFinalRound) {
    tournament.champion = winnerId;
    tournament.status = "finished";
    placementLabel = "2nd";
  } else if (isSemiFinal) {
    placementLabel = "3rd–4th";
  } else if (isQuarterFinal) {
    placementLabel = "5th–8th";
  } else if (isRoundOf16) {
    placementLabel = "9th–16th";
  }

  // Round-complete check using reliable helper
  if (!isFinalRound && isRoundComplete(tournament)) {
    // Build next round
    buildNextRoundPairings(tournament);

    // Identify new round + first match
    const nextRound = tournament.rounds[tournament.currentRound];
    const nextMatch = nextRound.matches[0];

    // Send a "match-ready" push notification to the 2 players
    await sendMatchReadyPush(tournament, nextMatch, "connect4");
  }

  return {
    tournament,
    match,
    placementLabel,
    prizeAmount: 0,
    status: isFinalRound ? "finalized" : "advance-or-eliminate",
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
