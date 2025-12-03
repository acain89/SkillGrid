// src/core/tournamentEngine.js

/* ============================================================
   UNIVERSAL SKILLGRID TOURNAMENT ENGINE
   Supports: Connect 4, Checkers, future games
   Bracket sizes: 4, 8, 16, 32 (default: 16)
   ============================================================ */

import { createMatch, applyMove } from "./gameEngine.js";

/* ------------------------------------------------------------
   CREATE SINGLE MATCH WRAPPER
   ------------------------------------------------------------ */
function makeMatch(gameType, p1, p2, bestOf = 3) {
  return {
    id: crypto.randomUUID(),
    gameType,
    p1,
    p2,
    currentGame: 1,
    bestOf,
    wins: { p1: 0, p2: 0 },

    match: createMatch(gameType), // internal game state
    status: "waiting",            // waiting | active | finished
    winner: null,
    loser: null,
    history: []
  };
}

/* ------------------------------------------------------------
   CREATE BRACKET
   players = [{id, username, seed}, ...]
   ------------------------------------------------------------ */
export function createTournament(gameType, players, bestOf = 3) {
  if (players.length !== 16)
    throw new Error("Tournament requires exactly 16 players.");

  const rounds = {
    1: [], // Round of 16
    2: [], // Quarterfinals
    3: [], // Semifinals
    4: []  // Finals
  };

  // Pair players based on seed
  for (let i = 0; i < 16; i += 2) {
    const p1 = players[i];
    const p2 = players[i + 1];

    rounds[1].push(makeMatch(gameType, p1, p2, bestOf));
  }

  return {
    id: crypto.randomUUID(),
    gameType,
    bestOf,
    players,
    rounds,
    currentRound: 1,
    champion: null
  };
}

/* ------------------------------------------------------------
   START A MATCH
   ------------------------------------------------------------ */
export function startMatch(bracket, matchId) {
  const match = findMatch(bracket, matchId);
  if (!match) return;

  match.status = "active";
  match.match = createMatch(match.gameType);

  return {
    type: "match-started",
    match
  };
}

/* ------------------------------------------------------------
   APPLY MOVE TO MATCH
   ------------------------------------------------------------ */
export function tournamentMove(bracket, matchId, move) {
  const match = findMatch(bracket, matchId);
  if (!match || match.status !== "active") return;

  const result = applyMove(match.match, move);
  match.match = result.nextMatch;
  match.history.push(result.event);

  /* ---------- WIN HANDLING ---------- */
  if (result.event.type === "win") {
    const winnerIndex = match.match.currentPlayerIndex;
    if (winnerIndex === 0) match.wins.p1++;
    else match.wins.p2++;

    /* Best-of logic */
    const needed = Math.ceil(match.bestOf / 2);

    if (match.wins.p1 === needed || match.wins.p2 === needed) {
      match.status = "finished";
      match.winner = match.wins.p1 > match.wins.p2 ? match.p1 : match.p2;
      match.loser = match.winner === match.p1 ? match.p2 : match.p1;

      return {
        type: "match-complete",
        match,
        winner: match.winner,
        loser: match.loser
      };
    }

    /* Not finished → new game */
    match.currentGame++;
    match.match = createMatch(match.gameType);

    return {
      type: "round-win",
      match,
      winnerIndex
    };
  }

  /* ---------- DRAW HANDLING ---------- */
  if (result.event.type === "draw") {
    match.currentGame++; // replay game
    match.match = createMatch(match.gameType);

    return {
      type: "draw",
      match
    };
  }

  /* ---------- NORMAL MOVE ---------- */
  return {
    type: "move",
    match,
    event: result.event
  };
}

/* ------------------------------------------------------------
   ADVANCE WINNERS TO NEXT ROUND
   ------------------------------------------------------------ */
export function advanceBracket(bracket) {
  const round = bracket.currentRound;
  const matches = bracket.rounds[round];

  const finished = matches.every((m) => m.status === "finished");
  if (!finished) return null;

  const winners = matches.map((m) => m.winner);

  // FINAL ROUND
  if (round === 4) {
    bracket.champion = winners[0];
    return {
      type: "tournament-complete",
      champion: winners[0]
    };
  }

  // Prepare next round
  const nextRound = round + 1;
  const nextMatches = [];

  for (let i = 0; i < winners.length; i += 2) {
    nextMatches.push(
      makeMatch(bracket.gameType, winners[i], winners[i + 1], bracket.bestOf)
    );
  }

  bracket.rounds[nextRound] = nextMatches;
  bracket.currentRound = nextRound;

  return {
    type: "round-advance",
    newRound: nextRound,
    matches: nextMatches
  };
}

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */
export function findMatch(bracket, matchId) {
  return (
    bracket.rounds[1].find((m) => m.id === matchId) ||
    bracket.rounds[2].find((m) => m.id === matchId) ||
    bracket.rounds[3].find((m) => m.id === matchId) ||
    bracket.rounds[4].find((m) => m.id === matchId) ||
    null
  );
}
