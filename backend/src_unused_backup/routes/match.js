// backend/src/routes/match.js
//
// Simple match service for ad-hoc games (non-tournament).
// If your frontend is now shifting to the full tournament
// flow you may eventually deprecate this, but keeping it
// working is useful for quick tests.

import { Router } from "express";
import { createMatch, applyMove } from "../core/gameEngine.js";
import {
  createNewMatch,
  getMatch,
  updateMatch,
} from "../state/matchStore.js";

const router = Router();

/* ---------------------------------------------------------
   CREATE MATCH
   Body: { gameType?: "connect4" | "checkers" | "gridtrap" }
--------------------------------------------------------- */
router.post("/create", (req, res) => {
  const { gameType = "connect4" } = req.body || {};

  const initialState = createMatch(gameType);
  const id = createNewMatch(gameType, initialState);

  return res.json({
    ok: true,
    id,
    state: initialState,
  });
});

/* ---------------------------------------------------------
   GET MATCH BY ID
--------------------------------------------------------- */
router.get("/:id", (req, res) => {
  const match = getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ ok: false, error: "match-not-found" });
  }

  res.json({ ok: true, state: match });
});

/* ---------------------------------------------------------
   APPLY MOVE TO MATCH
   Body: { move: any }
--------------------------------------------------------- */
router.post("/:id/move", (req, res) => {
  const match = getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ ok: false, error: "match-not-found" });
  }

  const { move } = req.body || {};
  if (typeof move === "undefined") {
    return res.status(400).json({ ok: false, error: "missing-move" });
  }

  const result = applyMove(match, move);

  if (!result || !result.nextMatch) {
    return res.json({ ok: false, error: result?.error || "invalid-move" });
  }

  updateMatch(req.params.id, result.nextMatch);

  return res.json({
    ok: true,
    state: result.nextMatch,
    event: result.event,
  });
});

export default router;
