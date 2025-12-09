// backend/routes/stripeRoutes.js
//
// Stripe Connect Express onboarding + status lookup.
//

import { Router } from "express";
import { stripe } from "../stripe.js"; 
import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const router = Router();

/* -------------------------------------------------------
   GET STRIPE ONBOARDING LINK
-------------------------------------------------------- */
router.post("/account-link", async (req, res) => {
  try {
    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ ok: false, error: "missing-uid" });

    // Lookup local Firestore record for Stripe account
    const ref = doc(db, "stripeAccounts", uid);
    let snap = await getDoc(ref);

    let accountId = snap.exists() ? snap.data().accountId : null;

    // Create account if needed
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: null, // Stripe pulls from user later
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await setDoc(ref, {
        uid,
        accountId,
        createdAt: Date.now(),
      });
    }

    // Create onboarding URL
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: process.env.FRONTEND_URL + "/profile",
      return_url: process.env.FRONTEND_URL + "/profile",
      type: "account_onboarding",
    });

    return res.json({
      ok: true,
      url: link.url,
      accountId,
    });
  } catch (err) {
    console.error("Stripe onboarding error:", err);
    return res.status(500).json({ ok: false, error: "onboarding-failed" });
  }
});

/* -------------------------------------------------------
   GET PAYOUT STATUS
   Returns: { requirementsComplete: true/false }
-------------------------------------------------------- */
router.get("/status/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ ok: false, error: "missing-uid" });

    const ref = doc(db, "stripeAccounts", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return res.json({
        ok: true,
        exists: false,
        requirementsComplete: false,
      });
    }

    const { accountId } = snap.data();

    const acct = await stripe.accounts.retrieve(accountId);

    const requirementsComplete =
      acct.requirements?.currently_due?.length === 0 &&
      acct.details_submitted === true;

    return res.json({
      ok: true,
      exists: true,
      requirementsComplete,
      accountId,
    });
  } catch (err) {
    console.error("Stripe status error:", err);
    return res.status(500).json({ ok: false, error: "stripe-status-failed" });
  }
});

export default router;
