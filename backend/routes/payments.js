// backend/routes/payments.js
//
// Secure Stripe Checkout session creation.
// The backend computes prices and NEVER trusts the client.

import { Router } from "express";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* -----------------------------------------
   SERVER-SIDE PRICE TABLE (authoritative)
----------------------------------------- */
const TIER_PRICING = {
  rookie: { entryFee: 5, hostFee: 0.99 },
  pro:    { entryFee: 10, hostFee: 1.99 },
  elite:  { entryFee: 20, hostFee: 3.49 },
};

/* -----------------------------------------
   POST /payments/create-checkout-session
----------------------------------------- */
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { uid, tierKey, formatKey } = req.body || {};

    if (!uid || !tierKey || !formatKey) {
      return res.status(400).json({ ok: false, error: "missing-fields" });
    }

    const tierCfg = TIER_PRICING[tierKey];
    if (!tierCfg) {
      return res.status(400).json({ ok: false, error: "invalid-tier" });
    }

    // 🔒 SERVER CALCULATES REAL PRICE — never trust the client
    const entryFee = tierCfg.entryFee;
    const hostFee = tierCfg.hostFee;
    const totalCost = entryFee + hostFee;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `SkillGrid ${tierKey.toUpperCase()} Entry`,
            },
            unit_amount: Math.round(totalCost * 100), // Dollars → cents
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,

      // Metadata will appear in Stripe webhook → allows secure join
      metadata: {
        uid,
        formatKey,
        tierKey,
        entryFee,
        hostFee,
        totalCost,
      },
    });

    return res.json({ ok: true, url: session.url });

  } catch (err) {
    console.error("Stripe session creation failed:", err);
    return res.status(500).json({ ok: false, error: "stripe-session-failed" });
  }
});

export default router;
