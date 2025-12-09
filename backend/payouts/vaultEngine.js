// backend/payouts/vaultEngine.js
//
// Centralized Vault Engine
// - Reads vault balance
// - Returns ledger history
// - Deducts from vault (using atomic vaultStore)
// - Checks cashout eligibility
// - Sends Stripe Connect payouts for withdrawals
//
// Firestore layout:
//   users/{uid}.vaultBalance: number
//   users/{uid}.stripeAccountId: string (connected account ID)
//   users/{uid}/vaultLedger/{entryId}: {...}

import Stripe from "stripe";
import { db } from "../firebase/admin.js";
import {
  getVaultBalance as storeGetVaultBalance,
  addToVault,
  subtractFromVault,
} from "../state/vaultStore.js";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ---------------------------------------------------------
   1️⃣  Get vault balance (wrapper around vaultStore)
--------------------------------------------------------- */
export async function getVaultBalance(uid) {
  return storeGetVaultBalance(uid);
}

/* ---------------------------------------------------------
   2️⃣  Get vault ledger for a user
--------------------------------------------------------- */
export async function getVaultLedger(uid, limit = 50) {
  const colRef = db
    .collection("users")
    .doc(uid)
    .collection("vaultLedger")
    .orderBy("createdAt", "desc")
    .limit(limit);

  const snap = await colRef.get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/* ---------------------------------------------------------
   3️⃣  Deduct from vault (entries, rebuys, withdrawals)
   Returns the new balance after deduction.
--------------------------------------------------------- */
export async function deductFromVault(
  uid,
  amount,
  reason = "debit",
  metadata = {}
) {
  // subtractFromVault throws if insufficient
  await subtractFromVault(uid, amount, reason, metadata);
  // Return fresh balance
  return await storeGetVaultBalance(uid);
}

/* ---------------------------------------------------------
   4️⃣  Cashout eligibility
   Example: threshold = 30 → must have >= $30
--------------------------------------------------------- */
export async function isEligibleForCashout(uid, threshold = 30) {
  const balance = await storeGetVaultBalance(uid);
  return balance >= threshold;
}

/* ---------------------------------------------------------
   5️⃣  Stripe payout helper
   Sends funds from your platform → user Stripe Connected Account
--------------------------------------------------------- */
export async function sendStripePayout(uid, amount) {
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = snap.data();
  if (!user.stripeAccountId) {
    throw new Error("MISSING_STRIPE_ACCOUNT");
  }

  const cents = Math.round(Number(amount) * 100);

  try {
    const transfer = await stripe.transfers.create({
      amount: cents,
      currency: "usd",
      destination: user.stripeAccountId,
      description: `SkillGrid Vault Cashout $${amount}`,
    });

    return transfer;
  } catch (err) {
    console.error("Stripe payout error:", err);
    throw new Error("STRIPE_PAYOUT_FAILED");
  }
}

/* ---------------------------------------------------------
   6️⃣  High-level withdrawal flow
   - Check threshold (e.g. $30)
   - Deduct from vault (atomic, ledger)
   - Send Stripe payout
--------------------------------------------------------- */
export async function processWithdrawal(uid, amount, minThreshold = 30) {
  const amt = Number(amount);
  if (!uid || !amt || amt <= 0) {
    throw new Error("INVALID_WITHDRAW_AMOUNT");
  }

  const eligible = await isEligibleForCashout(uid, minThreshold);
  if (!eligible) {
    throw new Error("VAULT_BELOW_CASHOUT_THRESHOLD");
  }

  // Step 1: deduct from vault with reason "withdrawal"
  await subtractFromVault(uid, amt, "withdrawal", {});

  // Step 2: Stripe Connect payout
  const transfer = await sendStripePayout(uid, amt);

  // Step 3: final balance for response/UI
  const newBalance = await storeGetVaultBalance(uid);

  return {
    ok: true,
    uid,
    newBalance,
    stripeTransferId: transfer.id,
  };
}
