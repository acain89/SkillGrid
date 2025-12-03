// src/pages/TierSelect.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./tournamentArena.css";
import { playSound } from "../core/sound";

const CLICK_SOUND = "/sounds/ui-click.mp3";

const TIERS = [
  {
    id: "rookie",
    label: "ROOKIE",
    price: 5,
    color: "cyan"
  },
  {
    id: "pro",
    label: "PRO",
    price: 10,
    color: "orange"
  },
  {
    id: "elite",
    label: "ELITE",
    price: 20,
    color: "magenta"
  }
];

export default function TierSelect() {
  const navigate = useNavigate();

  return (
    <div className="arena-root">
      <div className="arena-bg-glow" />

      <header className="arena-header">
        <h1 className="arena-title">SELECT YOUR TIER</h1>
      </header>

      <main className="arena-main">
        <section className="arena-card-grid">
          {TIERS.map((tier) => (
            <article
              key={tier.id}
              className={`arena-card arena-card--${tier.color}`}
            >
              <div className="arena-card-inner">

                {/* Neon bar */}
                <div className="arena-card-solid-bar" />

                {/* Header */}
                <div className="arena-card-header">
                  <h2 className="arena-card-title">{tier.label}</h2>
                </div>

                {/* Middle section */}
                <div className="arena-card-main">
                  <div className="arena-card-pot-row">
                    <div className="arena-card-pot">
                      <span className="arena-card-pot-label">ENTRY</span>
                      <span className="arena-card-pot-value">
                        ${tier.price}
                      </span>
                    </div>

                    <div className="arena-card-pot-dot" />

                    <div className="arena-card-players-cap">
                      3 FORMATS
                    </div>
                  </div>

                  <div className="arena-card-payout-block">
                    <div className="arena-card-payout-title">
                      FORMATS INCLUDED
                    </div>
                    <ul className="arena-card-payouts">
                      <li>Casual — Half of the players win something.</li>
                      <li>Pro — Stiffer competition. Bigger Prizes.</li>
                      <li>Winner-Takes-All — 1 Champion. 1 Prize.</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="arena-card-footer">
                  <button
                    className="arena-join-btn"
                    onClick={() => {
                      playSound(CLICK_SOUND, 0.5);
                      navigate(`/tier/${tier.id}`);
                    }}
                  >
                    VIEW FORMATS
                  </button>
                </div>

              </div>
            </article>
          ))}
        </section>

        {/* TRUST CHECKLIST */}
        <div className="trust-checklist">
          <p>✔ Zero hidden fees</p>
          <p>✔ 100% of entry fees go to the prize pool</p>
          <p>✔ Secure Stripe payments</p>
          <p>✔ Instant payouts</p>
          <p>✔ Transparent brackets & fair matchmaking</p>
          <p>✔ Skill-based competition — not gambling</p>
        </div>
      </main>
    </div>
  );
}
