// backend/services/stripe.js
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("[Stripe] Missing STRIPE_SECRET_KEY in .env");
  process.exit(1);
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // ok if Stripe bumps, just use latest
});

/**
 * Create a transfer to a connected account (test mode).
 * amountCents: integer, e.g. 1234 = $12.34
 */
export async function createWinnerTransfer({
  amountCents,
  destinationAccountId,
  tournamentId,
  userId,
  currency = "usd",
}) {
  console.log("[StripeTransfer][START]", {
    userId,
    tournamentId,
    destinationAccountId,
    amountCents,
  });

  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency,
    destination: destinationAccountId, // Stripe Connect account ID
    metadata: {
      tournamentId: tournamentId || "unknown",
      userId: userId || "unknown",
      reason: "SkillGrid tournament payout",
    },
  });

  console.log("[StripeTransfer][SUCCESS]", {
    transferId: transfer.id,
    amount: transfer.amount,
    destination: transfer.destination,
  });

  return transfer;
}
