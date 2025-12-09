// backend/routes/payoutRoutes.js
import { Router } from "express";
import { createWinnerTransfer } from "../services/stripe.js";

const router = Router();

/**
 * POST /api/payouts/transfer
 * body: { amountCents, destinationAccountId, tournamentId, userId }
 */
router.post("/transfer", async (req, res) => {
  const { amountCents, destinationAccountId, tournamentId, userId } = req.body;

  if (!amountCents || !destinationAccountId) {
    console.warn("[StripeTransfer][VALIDATION_FAIL]", { amountCents, destinationAccountId });
    return res.status(400).json({ ok: false, error: "MISSING_FIELDS" });
  }

  try {
    const transfer = await createWinnerTransfer({
      amountCents,
      destinationAccountId,
      tournamentId,
      userId,
    });

    return res.json({
      ok: true,
      transferId: transfer.id,
      amount: transfer.amount,
      destination: transfer.destination,
    });
  } catch (err) {
    console.error("[StripeTransfer][ERROR]", {
      message: err.message,
      type: err.type,
      code: err.code,
    });

    return res.status(500).json({
      ok: false,
      error: "TRANSFER_FAILED",
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

export default router;
