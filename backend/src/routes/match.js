import { Router } from "express";
import { createMatch, applyMove } from "../core/gameEngine.js";
import { createNewMatch, getMatch, updateMatch } from "../state/matchStore.js";

const router = Router();

/* ---------------- CREATE MATCH ---------------- */
router.post("/create", (req, res) => {
  const { gameType = "connect4" } = req.body;

  const initialState = createMatch(gameType);
  const id = createNewMatch(gameType, initialState);

  return res.json({
    ok: true,
    matchId: id,
    state: initialState
  });
});

/* ---------------- GET MATCH ---------------- */
router.get("/:id", (req, res) => {
  const match = getMatch(req.params.id);

  if (!match) {
    return res.status(404).json({ ok: false, error: "not-found" });
  }

  return res.json({
    ok: true,
    state: match.state
  });
});

/* ---------------- APPLY MOVE ---------------- */
router.post("/:id/move", (req, res) => {
  const match = getMatch(req.params.id);

  if (!match) {
    return res.status(404).json({ ok: false, error: "not-found" });
  }

  const { move } = req.body;

  const result = applyMove(match.state, move);

  if (!result?.nextMatch) {
    return res.json({ ok: false, error: result?.error || "invalid-move" });
  }

  updateMatch(req.params.id, result.nextMatch);

  return res.json({
    ok: true,
    state: result.nextMatch,
    event: result.event
  });
});

/* ---------------- EXPORT DEFAULT ---------------- */
export default router;
