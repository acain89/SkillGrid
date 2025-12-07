// backend/routes/tournamentRoutes.js
//
// REST API for 16-player single-elimination tournaments.
// Uses the in-memory store in state/tournamentStore.js
// and emits websocket broadcasts via a callback bound
// from server.js (bindTournamentBroadcast).

import { Router } from "express";
import {
  createTournamentEntry,
  getTournament,
  updateTournament,
  buildInitialBracket,
  recordMatchResult,
  listTournaments,
} from "../state/tournamentStore.js";


const router = Router();

// WS broadcast hook
let wsBroadcast = () => {};

export function bindTournamentBroadcast(fn) {
  wsBroadcast = typeof fn === "function" ? fn : () => {};
}

/**
 * Compute prize amounts for placements.
 */
function computePrize(tier, format, placementLabel) {
  const t = tier || "casual";
  const f = format || "casual";

  if (f === "wta") {
    if (placementLabel === "1st") return 320;
    return 0;
  }

  if (t === "casual") {
    switch (placementLabel) {
      case "1st": return 80;
      case "2nd": return 60;
      case "3rd–4th": return 40;
      case "5th–8th": return 25;
      default: return 0;
    }
  }

  if (t === "pro") {
    switch (placementLabel) {
      case "1st": return 160;
      case "2nd": return 80;
      case "3rd–4th": return 40;
      default: return 0;
    }
  }

  if (t === "elite") {
    switch (placementLabel) {
      case "1st": return 220;
      case "2nd": return 60;
      case "3rd–4th": return 20;
      default: return 0;
    }
  }

  return 0;
}

/* ============================================================================
   BASIC ADMIN / DEBUG ROUTES
============================================================================ */

router.get("/", (req, res) => {
  res.json({ ok: true, tournaments: listTournaments() });
});

router.get("/:id", (req, res) => {
  const t = getTournament(req.params.id);
  if (!t) {
    return res.status(404).json({ ok: false, error: "tournament-not-found" });
  }
  res.json({ ok: true, tournament: t });
});

/* ============================================================================
   CREATION + REGISTRATION
============================================================================ */

router.post("/create", async (req, res) => {
  const {
    id = `t_${Date.now()}`,
    tier = "casual",
    format = "casual",
    players = [],
  } = req.body || {};

  let tournament = createTournamentEntry({ id, tier, format, players });

  const filled = players.length === 16;

  if (filled) {
    tournament = buildInitialBracket(tournament);

    // ⭐ NEW — Notify players that tournament starts in 30 seconds
    await sendPushToTournamentPlayers(tournament, {
      title: "Your bracket is full!",
      body: "Tournament starts in 30 seconds.",
    }, {
      type: "TOURNAMENT_STARTING",
      tid: tournament.id,
    });
  }

  wsBroadcast({
    type: "tournament-created",
    tournamentId: tournament.id,
    tournament,
  });

  res.json({ ok: true, tournament });
});


router.post("/:id/register", async (req, res) => {
  const { id, name } = req.body || {};
  if (!id || !name) {
    return res.status(400).json({ ok: false, error: "missing-id-or-name" });
  }

  const existing = getTournament(req.params.id);
  if (!existing) {
    return res.status(404).json({ ok: false, error: "tournament-not-found" });
  }

  if (!existing.players) existing.players = [];
  if (existing.players.length >= 16) {
    return res.status(400).json({ ok: false, error: "tournament-already-full" });
  }

  existing.players.push({ id, name });

  let updated = existing;

  const filled = existing.players.length === 16;

  if (filled) {
    updated = buildInitialBracket(existing);

    updateTournament(req.params.id, updated);

    // ⭐ NEW — Tournament full → notify all players
    await sendPushToTournamentPlayers(updated, {
      title: "Bracket locked!",
      body: "Tournament starts in 30 seconds!",
    }, {
      type: "TOURNAMENT_STARTING",
      tid: updated.id,
    });
  } else {
    updateTournament(req.params.id, existing);
  }

  wsBroadcast({
    type: "player-registered",
    tournamentId: updated.id,
    tournament: updated,
  });

  res.json({ ok: true, tournament: updated });
});

/* ============================================================================
   MATCH RESULT REPORTING
============================================================================ */

router.post("/:id/report-result", async (req, res) => {
  const { roundIndex, matchIndex, winnerSide, gameType } = req.body || {};

  const tournament = getTournament(req.params.id);
  if (!tournament) {
    return res.status(404).json({ ok: false, error: "tournament-not-found" });
  }

  if (
    typeof roundIndex !== "number" ||
    typeof matchIndex !== "number" ||
    (winnerSide !== 0 && winnerSide !== 1)
  ) {
    return res.status(400).json({ ok: false, error: "invalid-round-match-or-winnerSide" });
  }

  const result = recordMatchResult(tournament, roundIndex, matchIndex, winnerSide);

  const updatedTournament = updateTournament(req.params.id, result.tournament);

  const tier = updatedTournament.tier || "casual";
  const format = updatedTournament.format || "casual";

  let status = "advance";
  let placementLabel = null;
  let prizeAmount = 0;

  const isFinalRound = roundIndex === 3;

  if (isFinalRound && updatedTournament.champion) {
    status = "champion";
    placementLabel = "1st";
    prizeAmount = computePrize(tier, format, placementLabel);
  }

  if (result.placementLabel) {
    placementLabel = result.placementLabel;
    prizeAmount = computePrize(tier, format, placementLabel);
    status = placementLabel === "2nd" && isFinalRound ? "runner-up" : "eliminated";
  }

  // ⭐ NEW — Notify players who advanced (not eliminated)
  if (status === "advance") {
    await sendPushToAlivePlayers(updatedTournament, {
      title: "You advanced!",
      body: "Next round starts in 10 seconds!",
    }, {
      type: "ADVANCED",
      tid: updatedTournament.id,
      roundIndex: roundIndex + 1,
    });
  }

  // ⭐ NEW — When all matches in a round finish → announce next round
  const allDone = updatedTournament.rounds[roundIndex].every(
    (m) => m.winnerId
  );

  if (allDone && !isFinalRound) {
    await sendPushToAlivePlayers(updatedTournament, {
      title: `Round ${roundIndex + 2} is next`,
      body: "Next round starts in 10 seconds!",
    }, {
      type: "ROUND_START",
      tid: updatedTournament.id,
      roundIndex: roundIndex + 1,
    });
  }

  wsBroadcast({
    type: "tournament-update",
    tournamentId: updatedTournament.id,
    tournament: updatedTournament,
  });

  res.json({
    ok: true,
    status,
    placementLabel,
    prizeAmount,
    tournament: updatedTournament,
    roundIndex,
    matchIndex,
    gameType: gameType || null,
  });
});

export default router;
