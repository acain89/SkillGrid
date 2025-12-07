// backend/routes/xpRoutes.js
import express from "express";
import {
  awardEntryXpHandler,
  awardTop4BonusHandler,
  getXpSummaryHandler,
} from "../controllers/xpController.js";

const router = express.Router();

// POST /xp/award-entry
router.post("/award-entry", awardEntryXpHandler);

// POST /xp/award-top4
router.post("/award-top4", awardTop4BonusHandler);

// GET /xp/summary/:uid
router.get("/summary/:uid", getXpSummaryHandler);

export default router;
