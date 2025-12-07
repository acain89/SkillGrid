// src/pages/TierFormats.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./tournamentArena.css";
import { playSound } from "../core/sound";
import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import ProfilePanel from "../components/ProfilePanel.jsx";
import RulesPanel from "../components/RulesPanel.jsx";

const CLICK_SOUND = "/sounds/ui-click.mp3";

/* -------------------------------------------------------
   XP IS BASED ON TIER (BUY-IN AMOUNT), NOT FORMAT
-------------------------------------------------------- */
const TIER_CONFIG = {
  rookie: { entryFee: 5, xpAward: 5 },
  pro: { entryFee: 10, xpAward: 10 },
  elite: { entryFee: 20, xpAward: 20 },
};

export default function TierFormats() {
  const navigate = useNavigate();

  // RULES + PROFILE MODALS
  const [showRules, setShowRules] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // PROFILE DATA
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

  /* -------------------------------------------------------
     LOAD PROFILE ON MOUNT
  -------------------------------------------------------- */
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
          activeTournament: data.activeTournament || null,
          createdAt: data.createdAt || "—",
        });
      }
    }

    loadProfile();
  }, []);

  /* -------------------------------------------------------
     JOIN BUTTON HANDLER
     formatKey = flattened | competitive | wta
     tierKey   = rookie | pro | elite
  -------------------------------------------------------- */
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

    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.warn("User doc missing; cannot join tournament.");
        return;
      }

      // Store tournament selection for XP logic
      await updateDoc(ref, {
        activeTournament: {
          tier: tierKey,                 // rookie | pro | elite
          entryFee: tierCfg.entryFee,    // 5 / 10 / 20
          xpAward: tierCfg.xpAward,      // XP given once game actually starts
          format: formatKey,             // flattened | competitive | wta
          joinedAt: Date.now(),
          entryXpGranted: false,         // Connect4Neon will check this
        },
      });

      // Navigate to the bracket page for this format
      navigate(`/tournament/${formatKey}`);
    } catch (err) {
      console.error("Join tournament failed:", err);
    }
  }

  /* -------------------------------------------------------
     RENDER UI
  -------------------------------------------------------- */
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

      {/* BACKGROUND */}
      <div className="arena-bg-glow"></div>

      {/* HEADER */}
      <header className="arena-header">
        <h1 className="arena-title">TOURNAMENT ARENA</h1>
        <p className="arena-subtitle">
          Choose your format. Same $320 pot. Different ways to win.
        </p>
      </header>

      <main className="arena-main">
        {/* FORMAT + TIER GRID */}
        <section className="arena-card-grid">
          {/* CASUAL → Rookie Tier */}
          <article className="arena-card arena-card--cyan">
            <div className="arena-card-inner">
              <div className="arena-card-solid-bar"></div>

              <div className="arena-card-header">
                <h2 className="arena-card-title">CASUAL</h2>
                <p className="arena-card-subtitle">
                  Friendly game with more prizes.
                </p>
              </div>

              <div className="arena-card-main">
                <div className="arena-card-pot-row">
                  <span className="arena-card-pot-label">Pot</span>
                  <span className="arena-card-pot-value">$320</span>
                  <span className="arena-card-players-cap">16 players</span>
                </div>

                <div className="arena-card-payout-block">
                  <div className="arena-card-payout-title">Payouts</div>
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

          {/* PRO → Pro Tier */}
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
                  <span className="arena-card-players-cap">16 players</span>
                </div>

                <div className="arena-card-payout-block">
                  <div className="arena-card-payout-title">Payouts</div>
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

          {/* ELITE → Elite Tier */}
          <article className="arena-card arena-card--magenta">
            <div className="arena-card-inner">
              <div className="arena-card-solid-bar"></div>

              <div className="arena-card-header">
                <h2 className="arena-card-title">ELITE</h2>
                <p className="arena-card-subtitle">
                  16 players. Only one prize.
                </p>
              </div>

              <div className="arena-card-main">
                <div className="arena-card-pot-row">
                  <span className="arena-card-pot-label">Pot</span>
                  <span className="arena-card-pot-value">$320</span>
                  <span className="arena-card-players-cap">16 players</span>
                </div>

                <div className="arena-card-payout-block">
                  <div className="arena-card-payout-title">Payouts</div>
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

        {/* TRUST CHECKLIST */}
        <div className="trust-checklist">
          <p>✓ Zero hidden fees</p>
          <p>✓ 100% of entry fees go to the prize pool</p>
          <p>✓ Secure Stripe payments</p>
          <p>✓ Instant payouts</p>
          <p>✓ Transparent brackets</p>
          <p>✓ Skill-based games only</p>
        </div>

        {/* PROFILE & RULES BUTTONS */}
        <button
          className="arena-profile-btn"
          onClick={() => setShowProfile(true)}
        >
          Profile
        </button>

        <button
          className="arena-rules-btn"
          onClick={() => setShowRules(true)}
        >
          Rules
        </button>
      </main>

      {/* RULES PANEL */}
      {showRules && <RulesPanel onClose={() => setShowRules(false)} />}

      {/* PROFILE PANEL */}
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
