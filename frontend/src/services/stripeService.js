// src/services/stripeService.js
//
// Frontend helpers for Stripe Connect onboarding + payout status.
// These call backend endpoints under /stripe/*
//

const API = import.meta.env.VITE_API_BASE; // "https://your-backend.onrender.com"

/* -------------------------------------------------------
   Begin Stripe Onboarding — get URL + redirect user
-------------------------------------------------------- */
export async function startStripeOnboarding(uid) {
  try {
    const res = await fetch(`${API}/stripe/account-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });

    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error };

    // Stripe gives a one-time-use URL — redirect immediately
    return { ok: true, url: data.url };
  } catch (err) {
    console.error("startStripeOnboarding error:", err);
    return { ok: false, error: "network-error" };
  }
}

/* -------------------------------------------------------
   Check Stripe payout status
   Returns: {
     ok,
     exists,                // stripe account exists
     requirementsComplete,  // onboarding done?
     accountId
   }
-------------------------------------------------------- */
export async function getStripeStatus(uid) {
  try {
    const res = await fetch(`${API}/stripe/status/${uid}`, {
      method: "GET",
    });

    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error };

    return data;
  } catch (err) {
    console.error("getStripeStatus error:", err);
    return { ok: false, error: "network-error" };
  }
}
