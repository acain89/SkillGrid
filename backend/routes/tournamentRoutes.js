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

import { depositToVault } from "../payouts/vaultEngine.js";

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
    return res
      .status(400)
      .json({ ok: false, error: "tournament-already-full" });
  }

  existing.players.push({ id, name });

  let updated = existing;
  const filled = existing.players.length === 16;

  if (filled) {
    updated = buildInitialBracket(existing);
    updateTournament(req.params.id, updated);
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
   MATCH RESULT REPORTING + VAULT CREDIT
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
    return res
      .status(400)
      .json({ ok: false, error: "invalid-round-match-or-winnerSide" });
  }

  const result = await recordMatchResult(
    tournament,
    roundIndex,
    matchIndex,
    winnerSide
  );

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
    prizeAmount = computePrize(tier, format, "1st");
  }

  if (result.placementLabel) {
    placementLabel = result.placementLabel;
    prizeAmount = computePrize(tier, format, result.placementLabel);
    status =
      placementLabel === "2nd" && isFinalRound ? "runner-up" : "eliminated";
  }

  // 🔺 VAULT PAYOUTS (server-side only, independent of response)
  try {
    const payouts = [];

    // Champion prize (1st place)
    if (isFinalRound && updatedTournament.champion) {
      const amt1 = computePrize(tier, format, "1st");
      if (amt1 > 0) {
        payouts.push({
          uid: updatedTournament.champion,
          amount: amt1,
          placement: "1st",
        });
      }
    }

    // Loser prize (2nd, 3rd–4th, 5th–8th, etc.)
    if (result.placementLabel) {
      const loserPrize = computePrize(tier, format, result.placementLabel);
      if (loserPrize > 0 && result.match?.loserId) {
        payouts.push({
          uid: result.match.loserId,
          amount: loserPrize,
          placement: result.placementLabel,
        });
      }
    }

    for (const p of payouts) {
      await depositToVault(p.uid, p.amount, "prize", {
        tournamentId: updatedTournament.id,
        placement: p.placement,
      });
    }
  } catch (err) {
    console.error("Vault payout error:", err);
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
