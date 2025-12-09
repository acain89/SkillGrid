// backend/routes/webhook.js
//
// Handles Stripe checkout completion securely.
// Verifies signature → extracts metadata → performs tournament entry logic.
//
// Required env vars:
//  - STRIPE_SECRET_KEY
//  - STRIPE_WEBHOOK_SECRET
//  - FRONTEND_URL

import express from "express";
import Stripe from "stripe";
import { db } from "../firebase.js";
import { doc, updateDoc, setDoc } from "firebase/firestore";

const router = express.Router();

// Stripe library
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* -------------------------------------------------------
   RAW BODY PARSER (required by Stripe)
-------------------------------------------------------- */
export const rawBodyBuffer = (req, res, buf) => {
  if (buf && buf.length) req.rawBody = buf.toString("utf8");
};

/* -------------------------------------------------------
   WEBHOOK ENDPOINT
-------------------------------------------------------- */
router.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // -----------------------------
  // SUCCESSFUL PAYMENT
  // -----------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const uid = session.metadata.uid;
    const formatKey = session.metadata.formatKey;
    const tierKey = session.metadata.tierKey;
    const entryFee = Number(session.metadata.entryFee);
    const hostFee = Number(session.metadata.hostFee);
    const totalCost = Number(session.metadata.totalCost);

    console.log("✅ Stripe Checkout Complete:", {
      uid, formatKey, tierKey, entryFee, hostFee, totalCost
    });

    /* -------------------------------------------------------
       1. Mark user activeTournament with paymentVerified: true
    -------------------------------------------------------- */
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      activeTournament: {
        tier: tierKey,
        format: formatKey,
        entryFee,
        hostFee,
        totalCost,
        joinedAt: Date.now(),
        paymentVerified: true,
        entryXpGranted: false
      }
    });

    /* -------------------------------------------------------
       2. Log transaction in Firestore ledger
    -------------------------------------------------------- */
    const ledgerRef = doc(
      db,
      "users",
      uid,
      "ledger",
      `stripe_${session.id}`
    );

    await setDoc(ledgerRef, {
      type: "tournament_entry",
      tier: tierKey,
      format: formatKey,
      entryFee,
      hostFee,
      totalCost,
      date: Date.now(),
      stripeSessionId: session.id
    });

    console.log("💾 Ledger updated.");

    /* -------------------------------------------------------
       3. Respond to Stripe (MUST be 200)
    -------------------------------------------------------- */
    return res.json({ received: true });
  }

  // -----------------------------
  // IGNORED EVENTS
  // -----------------------------
  res.json({ ok: true });
});

export default router;
