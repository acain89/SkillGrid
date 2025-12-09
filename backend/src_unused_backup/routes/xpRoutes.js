// backend/src/routes/xpRoutes.js
import express from "express";
import {
  awardTournamentEntryXP,
  awardDailyTop4,
  awardDailyThreeTournies,
} from "../services/xpService.js";

const router = express.Router();

/*
  POST /xp/award
  body: { userId, tier }
*/
router.post("/award", async (req, res) => {
  try {
    const { userId, tier } = req.body;
    const result = await awardTournamentEntryXP(userId, tier);
    res.json(result);
  } catch (err) {
    console.error("XP award error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/*
  POST /xp/top4
  body: { userId }
*/
router.post("/top4", async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await awardDailyTop4(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/*
  POST /xp/three
  body: { userId }
*/
router.post("/three", async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await awardDailyThreeTournies(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
