// src/pages/TierFormats.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./tournamentArena.css";
import { playSound } from "../core/sound";

import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import ProfilePanel from "../components/ProfilePanel.jsx";
import RulesPanel from "../components/RulesPanel.jsx";

// --------------------------------------------------------
// Host fees by tier
// --------------------------------------------------------
const HOST_FEE = {
  rookie: 0.99,
  pro: 1.99,
  elite: 3.49,
};

// --------------------------------------------------------
// Entry fee + XP by tier
// (Entry fee does NOT include host fee)
// --------------------------------------------------------
const TIER_CONFIG = {
  rookie: { entryFee: 5, xpAward: 5 },
  pro: { entryFee: 10, xpAward: 10 },
  elite: { entryFee: 20, xpAward: 20 },
};

const CLICK_SOUND = "/sounds/ui-click.mp3";

export default function TierFormats() {
  const navigate = useNavigate();

  const [showRules, setShowRules] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    vaultBalance: 0,
    stats: {},
    formats: {},
    games: {},
    recent: [],
    badges: [],
    createdAt: "—",
    activeTournament: null,
  });

  // --------------------------------------------------------
  // Load profile (including vaultBalance)
  // --------------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setProfileData({
          username: data.username || "",
          email: data.email || user.email,
          vaultBalance: data.vaultBalance || 0,
          stats: data.stats || {},
          formats: data.formats || {},
          games: data.games || {},
          recent: data.recent || [],
          badges: data.badges || [],
          createdAt: data.createdAt || "—",
          activeTournament: data.activeTournament || null,
        });
      }
    }

    loadProfile();
  }, []);

  // --------------------------------------------------------
  // Use Vault API
  // --------------------------------------------------------
  async function apiUseVault(uid, amount, reason) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/vault/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, amount, reason }),
      });

      const data = await res.json();
      return data.ok ? data.newBalance : null;
    } catch (err) {
      console.error("Vault error:", err);
      return null;
    }
  }

  // --------------------------------------------------------
  // Silent Stripe redirect
  // --------------------------------------------------------
  function redirectToStripeCheckout(formatKey, tierKey) {
    navigate(`/checkout?tier=${tierKey}&format=${formatKey}`);
  }

  // --------------------------------------------------------
  // JOIN LOGIC
  // --------------------------------------------------------
  async function handleJoin(formatKey, tierKey) {
    playSound(CLICK_SOUND, 0.5);

    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const tierCfg = TIER_CONFIG[tierKey];
    if (!tierCfg) {
      console.warn("Unknown tier:", tierKey);
      return;
    }

    const entryFee = tierCfg.entryFee;
    const hostFee = HOST_FEE[tierKey];
    const totalCost = entryFee + hostFee;

    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.warn("Missing user profile");
        return;
      }

      const vault = snap.data().vaultBalance || 0;

      // --------------------------------------------------------
      // CASE 1 — Vault CAN cover total cost
      // --------------------------------------------------------
      if (vault >= totalCost) {
        const newBalance = await apiUseVault(
          user.uid,
          totalCost,
          "tournament_entry"
        );

        if (newBalance !== null) {
          await updateDoc(ref, {
            vaultBalance: newBalance,
            activeTournament: {
              tier: tierKey,
              entryFee,
              xpAward: tierCfg.xpAward,
              format: formatKey,
              joinedAt: Date.now(),
              entryXpGranted: false,
            },
          });

          navigate(`/tournament/${formatKey}`);
          return;
        }
      }

      // --------------------------------------------------------
      // CASE 2 — Not enough vault => send to Stripe
      // --------------------------------------------------------
      redirectToStripeCheckout(formatKey, tierKey);
    } catch (err) {
      console.error("Join tournament failed:", err);
    }
  }

  // --------------------------------------------------------
  // UI Rendering
  // --------------------------------------------------------
  return (
    <div className="arena-root">

      {/* BACK BUTTON */}
      <button
        className="arena-back-btn"
        onClick={() => {
          playSound(CLICK_SOUND, 0.5);
          navigate("/home");
        }}
      >
        ← Back
      </button>

      {/* LOGOUT BUTTON */}
      <button className="arena-logout-btn" onClick={() => navigate("/login")}>
        Logout
      </button>

      <div className="arena-bg-glow"></div>

      <header className="arena-header">
        <h1 className="arena-title">TOURNAMENT ARENA</h1>
        <p className="arena-subtitle">
          Choose your format. Same $320 pot. Different ways to win.
        </p>
      </header>

      <main className="arena-main">

        {/* GRID */}
        <section className="arena-card-grid">
          {/* CASUAL */}
          <article className="arena-card arena-card--cyan">
            <div className="arena-card-inner">
              <div className="arena-card-solid-bar"></div>

              <div className="arena-card-header">
                <h2 className="arena-card-title">CASUAL</h2>
                <p className="arena-card-subtitle">Friendly game with more prizes.</p>
              </div>

              <div className="arena-card-main">
                <div className="arena-card-pot-row">
                  <span className="arena-card-pot-label">Pot</span>
                  <span className="arena-card-pot-value">$320</span>
                  <span className="arena-card-players-cap">16 players</span>
                </div>

                <div className="arena-card-payout-block">
                  <ul className="arena-card-payouts">
                    <li>1st $80</li>
                    <li>2nd $60</li>
                    <li>3rd–4th $40</li>
                    <li>5th–8th $25</li>
                  </ul>
                </div>
              </div>

              <div className="arena-card-footer">
                <button
                  className="arena-join-btn"
                  onClick={() => handleJoin("flattened", "rookie")}
                >
                  JOIN TOURNAMENT
                </button>
              </div>
            </div>
          </article>

          {/* PRO */}
          <article className="arena-card arena-card--orange">
            <div className="arena-card-inner">
              <div className="arena-card-solid-bar"></div>

              <div className="arena-card-header">
                <h2 className="arena-card-title">PRO</h2>
                <p className="arena-card-subtitle">
                  Classic payout structure for real competition.
                </p>
              </div>

              <div className="arena-card-main">
                <div className="arena-card-pot-row">
                  <span className="arena-card-pot-label">Pot</span>
                  <span className="arena-card-pot-value">$320</span>
                </div>

                <div className="arena-card-payout-block">
                  <ul className="arena-card-payouts">
                    <li>1st $140</li>
                    <li>2nd $100</li>
                    <li>3rd–4th $40</li>
                  </ul>
                </div>
              </div>

              <div className="arena-card-footer">
                <button
                  className="arena-join-btn"
                  onClick={() => handleJoin("competitive", "pro")}
                >
                  JOIN TOURNAMENT
                </button>
              </div>
            </div>
          </article>

          {/* ELITE */}
          <article className="arena-card arena-card--magenta">
            <div className="arena-card-inner">
              <div className="arena-card-solid-bar"></div>

              <div className="arena-card-header">
                <h2 className="arena-card-title">ELITE</h2>
                <p className="arena-card-subtitle">One prize. Winner takes all.</p>
              </div>

              <div className="arena-card-main">
                <div className="arena-card-pot-row">
                  <span className="arena-card-pot-label">Pot</span>
                  <span className="arena-card-pot-value">$320</span>
                </div>

                <div className="arena-card-payout-block">
                  <ul className="arena-card-payouts">
                    <li>1st $320</li>
                  </ul>
                </div>
              </div>

              <div className="arena-card-footer">
                <button
                  className="arena-join-btn"
                  onClick={() => handleJoin("wta", "elite")}
                >
                  JOIN TOURNAMENT
                </button>
              </div>
            </div>
          </article>
        </section>

        {/* TRUST LIST */}
        <div className="trust-checklist">
          <p>✓ Zero hidden fees</p>
          <p>✓ 100% of entry fees go to the prize pool</p>
          <p>✓ Secure Stripe payments</p>
          <p>✓ Instant payouts</p>
          <p>✓ Transparent brackets</p>
          <p>✓ Skill-based games only</p>
        </div>

        {/* PROFILE + RULES */}
        <button className="arena-profile-btn" onClick={() => setShowProfile(true)}>
          Profile
        </button>

        <button className="arena-rules-btn" onClick={() => setShowRules(true)}>
          Rules
        </button>
      </main>

      {showRules && <RulesPanel onClose={() => setShowRules(false)} />}
      {showProfile && (
        <ProfilePanel
          profile={profileData}
          vaultBalance={profileData.vaultBalance}
          stats={profileData.stats}
          formats={profileData.formats}
          games={profileData.games}
          badges={profileData.badges}
          recent={profileData.recent}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
