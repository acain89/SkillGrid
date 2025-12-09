// backend/stripe.js
//
// Central Stripe client for SkillGrid backend.
// Make sure STRIPE_SECRET_KEY is set in your Render / .env.

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠ STRIPE_SECRET_KEY is not set. Stripe payouts will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default stripe;
