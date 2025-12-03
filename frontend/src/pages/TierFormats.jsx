// src/pages/TournamentHome.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./tournamentArena.css";
import { playSound } from "../core/sound";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

import ProfilePanel from "../components/ProfilePanel.jsx";
import RulesPanel from "../components/RulesPanel.jsx";

const CLICK_SOUND = "/sounds/ui-click.mp3";

export default function TournamentHome() {
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

  // LOAD PROFILE
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
      <button
        className="arena-logout-btn"
        onClick={() => navigate("/login")}
      >
        Logout
      </button>

      {/* Background glow */}
      <div className="arena-bg-glow"></div>

      {/* HEADER */}
      <header className="arena-header">
        <h1 className="arena-title">TOURNAMENT ARENA</h1>
        <p className="arena-subtitle">
          Choose your format. Same $320 pot. Different ways to win.
        </p>
      </header>

      <main className="arena-main">

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
                <button className="arena-join-btn">JOIN TOURNAMENT</button>
              </div>
            </div>
          </article>

          {/* PRO */}
          <article className="arena-card arena-card--orange">
            <div className="arena-card-inner">
              <div className="arena-card-solid-bar"></div>

              <div className="arena-card-header">
                <h2 className="arena-card-title">PRO</h2>
                <p className="arena-card-subtitle">Classic payout structure for real competition.</p>
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
                <button className="arena-join-btn">JOIN TOURNAMENT</button>
              </div>
            </div>
          </article>

          {/* ELITE */}
          <article className="arena-card arena-card--magenta">
            <div className="arena-card-inner">
              <div className="arena-card-solid-bar"></div>

              <div className="arena-card-header">
                <h2 className="arena-card-title">ELITE</h2>
                <p className="arena-card-subtitle">16 players. Only one prize.</p>
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
                <button className="arena-join-btn">JOIN TOURNAMENT</button>
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
        <button className="arena-profile-btn" onClick={() => setShowProfile(true)}>
          Profile
        </button>

        <button className="arena-rules-btn" onClick={() => setShowRules(true)}>
          Rules
        </button>

      </main>

      {/* RULES PANEL */}
      {showRules && (
        <RulesPanel onClose={() => setShowRules(false)} />
      )}

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
