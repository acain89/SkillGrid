// backend/core/tournamentEngine.js
// Pure in-memory tournament engine for 16-player single-elimination triathlon.
// Games: Connect4, Checkers, Grid-Trap. Each game-type is Best-of-3.
// Match winner = first player to win 2 of the 3 game-types.

import crypto from "crypto";

/** Helper to generate simple ids */
function makeId(prefix = "t") {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

/**
 * Create a new tournament object.
 *
 * @param {Object} config
 * @param {"rookie"|"pro"|"elite"} config.tier
 * @param {"casual"|"pro"|"wta"} config.format
 * @param {number} config.entryFee
 * @param {Array<{id:string,name:string}>} config.players - exactly 16 players
 */
export function createTournament(config) {
  const { tier, format, entryFee, players } = config;
  if (!Array.isArray(players) || players.length !== 16) {
    throw new Error("createTournament: expected exactly 16 players");
  }

  const id = config.id || makeId("t");
  const pot = entryFee * players.length;

  const tournament = {
    id,
    tier,
    format,
    entryFee,
    pot,
    players: [...players],
    rounds: [],
    currentRound: 0,
    nextRoundStartsAt: null,
    tournamentComplete: false,
    placementResults: {}, // { playerId: { place, prize } }
    // Internal counters for assigning equal-bucket placements
    _placementCounters: {
      r16: 9, // Round of 16 losers → 9-16
      qf: 5,  // Quarterfinal losers → 5-8
      sf: 3,  // Semifinal losers → 3-4
    },
  };

  seedInitialBracket(tournament);
  return tournament;
}

/**
 * Build the Round-of-16 bracket from the players list.
 */
function seedInitialBracket(tournament) {
  const players = [...tournament.players];

  // For v1: no seeding, just use order as given.
  const matches = [];
  for (let i = 0; i < 16; i += 2) {
    matches.push(createEmptyMatch(players[i].id, players[i + 1].id));
  }

  tournament.rounds = [
    {
      roundIndex: 0,
      name: "Round of 16",
      matches,
    },
  ];
  tournament.currentRound = 0;
}

/**
 * Create a blank match structure between two playerIds.
 */
function createEmptyMatch(playerAId, playerBId) {
  return {
    playerA: playerAId,
    playerB: playerBId,
    winner: null,
    loser: null,
    gameTypeIndex: 0, // 0 = c4, 1 = check, 2 = grid
    // Board-win scores inside each game type (Best-of-3 per type)
    gameWins: {
      c4: { A: 0, B: 0 },
      check: { A: 0, B: 0 },
      grid: { A: 0, B: 0 },
    },
    // Winner per game type
    gameTypeWinner: {
      c4: null,   // "A" | "B"
      check: null,
      grid: null,
    },
    // Game-type wins in the triathlon
    seriesWins: { A: 0, B: 0 },
    matchComplete: false,
  };
}

/**
 * Record the result of a game-type (after its Best-of-3 is finished).
 *
 * @param {Object} tournament
 * @param {Object} payload
 * @param {number} payload.roundIndex
 * @param {number} payload.matchIndex
 * @param {"c4"|"check"|"grid"} payload.gameType
 * @param {string} payload.winnerId - userId of the game-type winner
 * @param {string} payload.callerId - userId of the player making the request (for perspective)
 * @returns {{ status: "continue"|"advance"|"eliminated"|"champion", placement: number|null, prize: number|null, tournament: Object }}
 */
export function reportGameResult(tournament, payload) {
  const { roundIndex, matchIndex, gameType, winnerId, callerId } = payload;

  if (tournament.tournamentComplete) {
    const callerPlacement = tournament.placementResults[callerId] || null;
    return {
      status: "champion",
      placement: callerPlacement?.place ?? null,
      prize: callerPlacement?.prize ?? null,
      tournament,
    };
  }

  const round = tournament.rounds[roundIndex];
  if (!round) throw new Error("Invalid roundIndex");
  const match = round.matches[matchIndex];
  if (!match) throw new Error("Invalid matchIndex");

  if (match.matchComplete) {
    // Already done; just return current status for caller.
    return buildStatusForCaller(tournament, match, callerId);
  }

  if (!["c4", "check", "grid"].includes(gameType)) {
    throw new Error("Invalid gameType");
  }

  // Map winnerId to "A" or "B"
  let winnerSide = null;
  if (winnerId === match.playerA) winnerSide = "A";
  else if (winnerId === match.playerB) winnerSide = "B";
  else throw new Error("winnerId does not match playerA or playerB");

  // Only record the game-type winner once.
  if (!match.gameTypeWinner[gameType]) {
    match.gameTypeWinner[gameType] = winnerSide;
    match.seriesWins[winnerSide] += 1;
  }

  // Track which gameType index we're on (0=c4,1=check,2=grid).
  if (gameType === "c4") match.gameTypeIndex = 1;
  else if (gameType === "check") match.gameTypeIndex = 2;
  else match.gameTypeIndex = 2;

  // If all 3 game types played, decide match
  const allDecided =
    match.gameTypeWinner.c4 &&
    match.gameTypeWinner.check &&
    match.gameTypeWinner.grid;

  if (allDecided) {
    finalizeMatchAndAdvance(tournament, roundIndex, matchIndex);
  }

  // Build perspective for caller
  return buildStatusForCaller(tournament, match, callerId);
}

/**
 * Decide winner/loser of a match and advance the bracket / assign placements.
 */
function finalizeMatchAndAdvance(tournament, roundIndex, matchIndex) {
  const round = tournament.rounds[roundIndex];
  const match = round.matches[matchIndex];

  if (match.matchComplete) return;

  const { seriesWins } = match;
  const totalA = seriesWins.A;
  const totalB = seriesWins.B;

  let winnerSide = null;
  if (totalA > totalB) winnerSide = "A";
  else if (totalB > totalA) winnerSide = "B";
  else {
    // Extremely rare: perfect tie; for v1 we break ties in favor of playerA.
    winnerSide = "A";
  }

  const loserSide = winnerSide === "A" ? "B" : "A";

  const winnerId = winnerSide === "A" ? match.playerA : match.playerB;
  const loserId = loserSide === "A" ? match.playerA : match.playerB;

  match.winner = winnerId;
  match.loser = loserId;
  match.matchComplete = true;

  // Assign placement + prize for loser
  const place = assignPlacementForLoser(tournament, roundIndex, loserId);
  const prize = computePrizeForPlacement(tournament, place);
  tournament.placementResults[loserId] = { place, prize };

  // Advance winner to next round or mark champion
  const isFinalRound = roundIndex === 3;

  if (isFinalRound) {
    // Champion + runner-up
    const winnerPlace = 1;
    const winnerPrize = computePrizeForPlacement(tournament, winnerPlace);
    tournament.placementResults[winnerId] = {
      place: winnerPlace,
      prize: winnerPrize,
    };

    // Loser already assigned as 2nd inside assignPlacementForLoser
    tournament.tournamentComplete = true;
    return;
  }

  // Ensure next round exists
  ensureNextRound(tournament, roundIndex);

  const nextRound = tournament.rounds[roundIndex + 1];

  // Determine which slot in next round this match feeds into.
  const targetMatchIndex = Math.floor(matchIndex / 2);
  const target = nextRound.matches[targetMatchIndex];

  if (matchIndex % 2 === 0) {
    target.playerA = winnerId;
  } else {
    target.playerB = winnerId;
  }

  // If all matches in this round now complete, schedule next round start.
  const allDone = round.matches.every((m) => m.matchComplete);
  if (allDone) {
    const now = Date.now();
    tournament.nextRoundStartsAt = new Date(now + 30_000).toISOString();
    tournament.currentRound = roundIndex + 1;
  }
}

/**
 * Ensure tournament.rounds[roundIndex + 1] exists.
 */
function ensureNextRound(tournament, roundIndex) {
  const nextIndex = roundIndex + 1;
  if (tournament.rounds[nextIndex]) return;

  let size;
  let name;
  if (nextIndex === 1) {
    size = 8;
    name = "Quarterfinals";
  } else if (nextIndex === 2) {
    size = 4;
    name = "Semifinals";
  } else if (nextIndex === 3) {
    size = 2;
    name = "Final";
  } else {
    throw new Error("Invalid next round index");
  }

  const matches = [];
  for (let i = 0; i < size; i += 2) {
    matches.push(createEmptyMatch(null, null));
  }

  tournament.rounds[nextIndex] = {
    roundIndex: nextIndex,
    name,
    matches,
  };
}

/**
 * Assign placement for a loser based on which round they lost in.
 * Round 0 → 9-16
 * Round 1 → 5-8
 * Round 2 → 3-4
 * Round 3 → 2
 */
function assignPlacementForLoser(tournament, roundIndex, loserId) {
  const c = tournament._placementCounters;

  if (roundIndex === 0) {
    const place = c.r16;
    c.r16 += 1;
    return place; // 9..16
  }

  if (roundIndex === 1) {
    const place = c.qf;
    c.qf += 1;
    return place; // 5..8
  }

  if (roundIndex === 2) {
    const place = c.sf;
    c.sf += 1;
    return place; // 3..4
  }

  if (roundIndex === 3) {
    // Final loser is always 2nd
    return 2;
  }

  // Fallback
  return 16;
}

/**
 * Compute cash prize for a given placement based on tournament format & entryFee.
 * For v1 we define base payouts assuming entryFee = 20 and scale linearly.
 *
 * You can tweak these numbers easily later.
 */
function computePrizeForPlacement(tournament, place) {
  const { format, entryFee } = tournament;
  const scale = entryFee / 20;

  let base = 0;

  if (format === "casual") {
    // 8 spots paid: 80 / 60 / 40 / 40 / 25 / 25 / 25 / 25 (sum 320 @ $20)
    const table = {
      1: 80,
      2: 60,
      3: 40,
      4: 40,
      5: 25,
      6: 25,
      7: 25,
      8: 25,
    };
    base = table[place] || 0;
  } else if (format === "pro") {
    // 4 spots paid: 160 / 80 / 40 / 40 (sum 320 @ $20)
    const table = {
      1: 160,
      2: 80,
      3: 40,
      4: 40,
    };
    base = table[place] || 0;
  } else if (format === "wta") {
    // Winner-takes-all
    const table = { 1: 320 };
    base = table[place] || 0;
  } else {
    base = 0;
  }

  return base * scale;
}

/**
 * Build status for the perspective of a given caller.
 */
function buildStatusForCaller(tournament, match, callerId) {
  const { placementResults, tournamentComplete } = tournament;

  if (match.matchComplete) {
    const callerPlacement = placementResults[callerId] || null;
    const isWinner = match.winner === callerId;

    if (tournamentComplete && isWinner) {
      const info =
        placementResults[callerId] || {
          place: 1,
          prize: computePrizeForPlacement(tournament, 1),
        };
      return {
        status: "champion",
        placement: info.place,
        prize: info.prize,
        tournament,
      };
    }

    if (callerPlacement) {
      return {
        status: callerPlacement.place === 1 ? "champion" : "eliminated",
        placement: callerPlacement.place,
        prize: callerPlacement.prize,
        tournament,
      };
    }

    // Winner but tournament not yet over
    return {
      status: "advance",
      placement: null,
      prize: null,
      tournament,
    };
  }

  // Match not complete; still in mid-series.
  return {
    status: "continue",
    placement: null,
    prize: null,
    tournament,
  };
}

/**
 * Mark the next round as started (clears nextRoundStartsAt).
 */
export function startNextRound(tournament) {
  tournament.nextRoundStartsAt = null;
  return tournament;
}
