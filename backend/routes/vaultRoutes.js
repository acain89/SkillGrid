// backend/routes/vaultRoutes.js
//
// Vault API + Stripe Instant Payout Integration
//
//  - GET  /vault/balance/:uid
//  - GET  /vault/ledger/:uid
//  - POST /vault/use
//  - POST /vault/withdraw   (Instant Stripe payout)
//

import { Router } from "express";
import {
  getVaultBalance,
  getVaultLedger,
  deductFromVault,
  isEligibleForCashout,
} from "../payouts/vaultEngine.js";

import { db } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

import stripe from "../stripe.js"; // ← NEW Stripe client

const router = Router();

/* ============================================================
   GET: Vault Balance
============================================================ */
router.get("/balance/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const balance = await getVaultBalance(uid);
    res.json({ ok: true, uid, balance });
  } catch (err) {
    console.error("Vault balance error:", err);
    res.status(500).json({ ok: false, error: "vault-balance-failed" });
  }
});

/* ============================================================
   GET: Vault Ledger
============================================================ */
router.get("/ledger/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const ledger = await getVaultLedger(uid, 100); // last 100 entries
    res.json({ ok: true, uid, ledger });
  } catch (err) {
    console.error("Vault ledger error:", err);
    res.status(500).json({ ok: false, error: "vault-ledger-failed" });
  }
});

/* ============================================================
   POST: Spend Vault Funds (entry fees)
============================================================ */
router.post("/use", async (req, res) => {
  try {
    const { uid, amount, reason, metadata } = req.body || {};
    const amt = Number(amount);

    if (!uid || !amt || amt <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: "missing-or-invalid-uid-or-amount" });
    }

    const newBalance = await deductFromVault(
      uid,
      amt,
      reason || "entry_fee",
      metadata || {}
    );

    res.json({ ok: true, uid, newBalance });
  } catch (err) {
    console.error("Vault use error:", err);
    res.status(500).json({ ok: false, error: err.message || "vault-use-failed" });
  }
});

/* ============================================================
   POST: Withdraw → Instant Stripe Payout
============================================================ */
router.post("/withdraw", async (req, res) => {
  try {
    const { uid, amount } = req.body || {};
    const amt = Number(amount);

    if (!uid || !amt || amt <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: "missing-or-invalid-uid-or-amount" });
    }

    // Must have ≥ $30 to be eligible
    const eligible = await isEligibleForCashout(uid, 30);
    if (!eligible) {
      return res
        .status(400)
        .json({ ok: false, error: "vault-below-cashout-threshold" });
    }

    // Fetch the user's connected Stripe account ID
    const acctRef = doc(db, "stripeAccounts", uid);
    const acctSnap = await getDoc(acctRef);

    if (!acctSnap.exists()) {
      return res.status(400).json({
        ok: false,
        error: "stripe-connected-account-missing",
        note: "User must finish Stripe onboarding before withdrawing.",
      });
    }

    const { accountId } = acctSnap.data();
    if (!accountId) {
      return res.status(400).json({
        ok: false,
        error: "stripe-accountId-missing",
      });
    }

    // Deduct from Vault first
    const newBalance = await deductFromVault(uid, amt, "withdrawal", {});

    // Stripe expects amounts in cents
    const cents = Math.round(amt * 100);

    // 🔥 Instant payout → Stripe Transfer
    const transfer = await stripe.transfers.create({
      amount: cents,
      currency: "usd",
      destination: accountId,
      metadata: {
        uid,
        type: "vault_withdrawal",
      },
    });

    res.json({
      ok: true,
      uid,
      amount,
      newBalance,
      stripeTransferId: transfer.id,
      message: "Instant payout sent to your Stripe-connected account.",
    });
  } catch (err) {
    console.error("Vault withdraw error:", err);

    res.status(500).json({
      ok: false,
      error: err.message || "vault-withdraw-failed",
    });
  }
});

/* ============================================================
   POST: Tournament Entry Payment (Vault → Stripe fallback)
============================================================ */
router.post("/pay", async (req, res) => {
  try {
    const { uid, amount } = req.body || {};
    const amt = Number(amount);

    if (!uid || !amt || amt <= 0) {
      return res.status(400).json({
        ok: false,
        error: "missing-or-invalid-uid-or-amount",
      });
    }

    // Current vault balance
    const balance = await getVaultBalance(uid);

    // FULL coverage from vault
    if (balance >= amt) {
      const newBalance = await deductFromVault(uid, amt, "entry_fee", {});
      return res.json({
        ok: true,
        usedVault: amt,
        stripeRequired: false,
        newBalance,
      });
    }

    // PARTIAL coverage → vault empties, Stripe remainder needed
    const vaultUsed = balance;
    const remainder = amt - balance;

    await deductFromVault(uid, balance, "entry_fee_partial", {});

    return res.json({
      ok: true,
      usedVault: vaultUsed,
      stripeRequired: true,
      stripeAmount: remainder,
      newBalance: 0,
    });
  } catch (err) {
    console.error("Vault pay error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "vault-pay-failed",
    });
  }
});


export default router;
