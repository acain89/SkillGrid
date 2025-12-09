// src/components/ProfilePanel.jsx
import React, { useState, useEffect } from "react";
import "./ProfilePanel.css";
import { playSound } from "../core/sound";
import { BADGE_ICON_MAP } from "../components/badges/BadgeIcons";
import XpBar from "../components/XpBar";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

const CLICK_SOUND = "/sounds/ui-click.mp3";

/* ======================================================================
   PROFILE PANEL
====================================================================== */
export default function ProfilePanel({
  profile,
  vaultBalance = 0,
  badges = [],
  equippedBadge,
  onEquipBadge = () => {},
  onClose,
}) {
  const username = profile?.username || "Player";
  const email = profile?.email || "player@example.com";

  const xp = profile?.xp || 0;
  const freePasses = profile?.freePasses || { five: 0, ten: 0, twenty: 0 };

  const [stripeReady, setStripeReady] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);

  /* ------------------------------------------------------------
     CHECK STRIPE STATUS
  ------------------------------------------------------------ */
  useEffect(() => {
    async function checkStripe() {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/stripe/status/${user.uid}`
        );

        const data = await res.json();
        if (data.ok && data.payoutsEnabled) {
          setStripeReady(true);
        } else {
          setStripeReady(false);
        }
      } catch (err) {
        console.warn("Stripe status check failed:", err);
      } finally {
        setCheckingStripe(false);
      }
    }

    checkStripe();
  }, []);

  /* ------------------------------------------------------------
     TRIGGER STRIPE ONBOARDING
  ------------------------------------------------------------ */
  async function startStripeOnboarding() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/stripe/onboard/${user.uid}`
      );
      const data = await res.json();

      if (data.ok && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.warn("Stripe onboarding failed:", err);
    }
  }

  /* ------------------------------------------------------------
     WITHDRAW (VAULT → STRIPE PAYOUT)
  ------------------------------------------------------------ */
  async function handleWithdraw() {
    playSound(CLICK_SOUND, 0.5);

    if (!stripeReady) {
      alert("Stripe onboarding required before withdrawing.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/vault/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          amount: vaultBalance, // withdraw full available
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        alert("Withdraw failed: " + data.error);
        return;
      }

      alert("Withdrawal request submitted!");
    } catch (err) {
      console.error("Withdraw error:", err);
      alert("Withdrawal failed.");
    }
  }

  /* ======================================================================
     UI
  ====================================================================== */
  return (
    <div
      className="pp-backdrop"
      onClick={() => {
        playSound(CLICK_SOUND, 0.5);
        onClose();
      }}
    >
      <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="pp-header">
          <div className="pp-avatar">{username.charAt(0).toUpperCase()}</div>

          <div className="pp-header-info">
            <div className="pp-username">{username}</div>
            <div className="pp-email">{email}</div>
            <div className="pp-membersince">Member Since: Jan 2025</div>

            {/* XP BAR */}
            <div className="pp-xp-container">
              <XpBar userId={profile?.uid} xp={xp} freePasses={freePasses} />
            </div>
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        <div className="pp-section">
          <h3 className="pp-section-title">ACCOUNT</h3>

          <div className="pp-row">
            <span className="pp-row-label">Vault Balance</span>
            <span className="pp-row-value">${vaultBalance.toFixed(2)}</span>
          </div>

          {/* WITHDRAW BUTTON */}
          <button
            className={`pp-cashout-btn ${
              vaultBalance >= 30 && stripeReady ? "active" : ""
            }`}
            disabled={vaultBalance < 30 || !stripeReady}
            onClick={handleWithdraw}
          >
            {checkingStripe
              ? "Checking Stripe…"
              : !stripeReady
              ? "Complete Stripe Setup"
              : "Withdraw Funds"}
          </button>

          {/* STRIPE ONBOARDING BUTTON */}
          {!stripeReady && !checkingStripe && (
            <button className="pp-onboard-btn" onClick={startStripeOnboarding}>
              Enable Payouts (Stripe)
            </button>
          )}

          <div className="pp-row">
            <span className="pp-row-label">Active Tournament</span>
            <span className="pp-row-value">
              {profile?.activeTournament?.format || "None"}
            </span>
          </div>
        </div>

        {/* TOURNAMENT OVERVIEW */}
        <div className="pp-section">
          <h3 className="pp-section-title">TOURNAMENT OVERVIEW</h3>

          <div className="pp-row">
            <span>Tournaments Played</span>
            <span>{profile?.stats?.played ?? 0}</span>
          </div>

          <div className="pp-row">
            <span>Tournaments Won</span>
            <span>{profile?.stats?.wins ?? 0}</span>
          </div>

          <div className="pp-row">
            <span>Top-4 Finishes</span>
            <span>{profile?.stats?.top4 ?? 0}</span>
          </div>

          <div className="pp-row">
            <span>Win Rate</span>
            <span>{profile?.stats?.winRate ?? "0%"}</span>
          </div>

          <div className="pp-row">
            <span>Average Placement</span>
            <span>{profile?.stats?.avgPlace ?? "-"}</span>
          </div>

          <div className="pp-row">
            <span>Total Winnings</span>
            <span>${profile?.stats?.winnings ?? 0}</span>
          </div>

          <div className="pp-row">
            <span>Biggest Win</span>
            <span>${profile?.stats?.biggest ?? 0}</span>
          </div>

          <div className="pp-row">
            <span>Consecutive Wins</span>
            <span>{profile?.stats?.streak ?? 0}</span>
          </div>
        </div>

        {/* FORMATS SECTION */}
        <div className="pp-section">
          <h3 className="pp-section-title">FORMATS</h3>

          <div className="pp-grid-3">
            <div className="pp-card pp-cyan">
              <div className="pp-card-title">CASUAL</div>
              <div className="pp-row">
                <span>Played</span>
                <span>{profile?.formats?.casual?.played ?? 0}</span>
              </div>
              <div className="pp-row">
                <span>Wins</span>
                <span>{profile?.formats?.casual?.wins ?? 0}</span>
              </div>
              <div className="pp-row">
                <span>Avg Placement</span>
                <span>{profile?.formats?.casual?.avg ?? "-"}</span>
              </div>
            </div>

            <div className="pp-card pp-orange">
              <div className="pp-card-title">PRO</div>
              <div className="pp-row">
                <span>Played</span>
                <span>{profile?.formats?.pro?.played ?? 0}</span>
              </div>
              <div className="pp-row">
                <span>Wins</span>
                <span>{profile?.formats?.pro?.wins ?? 0}</span>
              </div>
              <div className="pp-row">
                <span>Avg Placement</span>
                <span>{profile?.formats?.pro?.avg ?? "-"}</span>
              </div>
            </div>

            <div className="pp-card pp-magenta">
              <div className="pp-card-title">ELITE</div>
              <div className="pp-row">
                <span>Played</span>
                <span>{profile?.formats?.elite?.played ?? 0}</span>
              </div>
              <div className="pp-row">
                <span>Wins</span>
                <span>{profile?.formats?.elite?.wins ?? 0}</span>
              </div>
              <div className="pp-row">
                <span>Avg Placement</span>
                <span>{profile?.formats?.elite?.avg ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BADGES */}
        <div className="pp-section">
          <h3 className="pp-section-title">BADGES</h3>

          <div className="pp-badges-grid selectable">
            {badges.length > 0 ? (
              badges.map((badgeId) => {
                const Icon = BADGE_ICON_MAP[badgeId];
                return (
                  <div
                    key={badgeId}
                    className={
                      "pp-badge " +
                      (equippedBadge === badgeId ? "selected" : "earned")
                    }
                    onClick={() => {
                      playSound(CLICK_SOUND, 0.5);
                      onEquipBadge(badgeId);
                    }}
                  >
                    {Icon ? <Icon /> : <div className="pp-badge empty">?</div>}
                  </div>
                );
              })
            ) : (
              <div className="pp-badge empty">—</div>
            )}
          </div>
        </div>

        {/* META */}
        <div className="pp-section">
          <h3 className="pp-section-title">ACCOUNT META</h3>
          <div className="pp-row">
            <span>Account ID</span>
            <span>{profile?.accountId || "—"}</span>
          </div>
          <div className="pp-row">
            <span>Last Login</span>
            <span>{profile?.lastLogin || "Today"}</span>
          </div>
          <div className="pp-row">
            <span>Device</span>
            <span>Desktop</span>
          </div>
          <div className="pp-row">
            <span>Verification</span>
            <span>Verified ✓</span>
          </div>
        </div>

        {/* CLOSE */}
        <button
          className="pp-close-btn"
          onClick={() => {
            playSound(CLICK_SOUND, 0.5);
            onClose();
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
