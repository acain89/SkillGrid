// backend/state/vaultStore.js
//
// Centralized Vault system — safe money accounting.
// Stores balances + writes immutable ledger entries.
// All values stored in cents (integer) to avoid precision loss.

import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  setDoc
} from "firebase/firestore";

// Convert dollars → integer cents
function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

// Convert cents → dollars
function toDollars(cents) {
  return Math.round(cents) / 100;
}

/* -------------------------------------------------------
   GET BALANCE
-------------------------------------------------------- */
export async function getVaultBalance(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return 0;
  return snap.data().vaultBalance || 0;
}

/* -------------------------------------------------------
   WRITE LEDGER ENTRY
-------------------------------------------------------- */
async function writeLedger(uid, type, amountCents, meta = {}) {
  const entryId = `L_${Date.now()}`;
  const ledgerRef = doc(db, "users", uid, "vaultLedger", entryId);

  await setDoc(ledgerRef, {
    id: entryId,
    type,                 // "payout", "withdrawal", "entry_fee", etc.
    amountCents,          // positive or negative depending on operation
    amount: toDollars(Math.abs(amountCents)),
    direction: amountCents >= 0 ? "credit" : "debit",
    meta,
    ts: Date.now()
  });

  return entryId;
}

/* -------------------------------------------------------
   CREDIT (add winnings)
-------------------------------------------------------- */
export async function addToVault(uid, amountDollars, meta = {}) {
  const amountCents = toCents(amountDollars);
  if (amountCents <= 0) return;

  const ref = doc(db, "users", uid);

  await updateDoc(ref, {
    vaultBalance: increment(amountCents)
  });

  await writeLedger(uid, "payout", amountCents, meta);

  console.log(`💰 Vault credit: +$${amountDollars} → ${uid}`);
}

/* -------------------------------------------------------
   DEBIT (entry fees, withdrawals, etc.)
-------------------------------------------------------- */
export async function subtractFromVault(uid, amountDollars, meta = {}) {
  const amountCents = toCents(amountDollars);
  if (amountCents <= 0) return false;

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  const current = snap.data().vaultBalance || 0;

  if (current < amountCents) {
    console.warn(`❌ Vault insufficient: uid=${uid}, need=${amountCents}, have=${current}`);
    return false;
  }

  await updateDoc(ref, {
    vaultBalance: current - amountCents
  });

  await writeLedger(uid, "debit", -amountCents, meta);

  console.log(`🧾 Vault debit: -$${amountDollars} → ${uid}`);

  return true;
}

/* -------------------------------------------------------
   ELIGIBILITY CHECK
-------------------------------------------------------- */
export async function isEligibleForCashout(uid, minDollars = 30) {
  const balance = await getVaultBalance(uid);
  return balance >= toCents(minDollars);
}
