// src/components/XpBar.jsx
import React, { useState, useEffect } from "react";
import "./xpBar.css";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const TIERS = [
  { id: "rookie", label: "Rookie Pass", threshold: 150 },
  { id: "pro", label: "Pro Pass", threshold: 300 },
  { id: "elite", label: "Elite Pass", threshold: 600 },
];

export default function XpBar({ userId, xp: xpProp = 0, freePasses: passesProp }) {
  const [xp, setXp] = useState(xpProp || 0);
  const [freePasses, setFreePasses] = useState(
    passesProp || { five: 0, ten: 0, twenty: 0 }
  );
  const [redeemingTier, setRedeemingTier] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setXp(xpProp || 0);
  }, [xpProp]);

  useEffect(() => {
    setFreePasses(
      passesProp || { five: 0, ten: 0, twenty: 0 }
    );
  }, [passesProp]);

  const maxXp = TIERS[TIERS.length - 1].threshold;
  const progressPct = Math.min(100, (xp / maxXp) * 100);

  function canRedeem(tier) {
    return xp >= tier.threshold;
  }

  function openRedeem(tier) {
    if (!canRedeem(tier)) return;
    setError("");
    setRedeemingTier(tier);
  }

  async function confirmRedeem(choice) {
    if (!redeemingTier || !userId) return;

    const tier = redeemingTier;
    const cost = tier.threshold;

    if (xp < cost) {
      setError("Not enough XP.");
      return;
    }

    // map choices → passes
    let addFive = 0;
    let addTen = 0;
    let addTwenty = 0;

    if (tier.threshold === 150) {
      // only 1× $5
      addFive = 1;
    } else if (tier.threshold === 300) {
      if (choice === "1x10") addTen = 1;
      if (choice === "2x5") addFive = 2;
    } else if (tier.threshold === 600) {
      if (choice === "1x20") addTwenty = 1;
      if (choice === "2x10") addTen = 2;
      if (choice === "4x5") addFive = 4;
    }

    try {
      const newXp = xp - cost;
      const newPasses = {
        five: (freePasses.five || 0) + addFive,
        ten: (freePasses.ten || 0) + addTen,
        twenty: (freePasses.twenty || 0) + addTwenty,
      };

      const ref = doc(db, "users", userId);
      await updateDoc(ref, {
        xp: newXp,
        "freePasses.five": newPasses.five,
        "freePasses.ten": newPasses.ten,
        "freePasses.twenty": newPasses.twenty,
      });

      setXp(newXp);
      setFreePasses(newPasses);
      setRedeemingTier(null);
      setError("");
    } catch (err) {
      setError(err.message || "Redeem failed.");
    }
  }

  function renderChoiceButtons() {
    if (!redeemingTier) return null;
    const tier = redeemingTier;

    if (tier.threshold === 150) {
      return (
        <button
          className="xp-modal-choice"
          onClick={() => confirmRedeem("1x5")}
        >
          Redeem 1× $5 Pass (150 XP)
        </button>
      );
    }

    if (tier.threshold === 300) {
      return (
        <>
          <button
            className="xp-modal-choice"
            onClick={() => confirmRedeem("1x10")}
          >
            1× $10 Pass (300 XP)
          </button>
          <button
            className="xp-modal-choice"
            onClick={() => confirmRedeem("2x5")}
          >
            2× $5 Passes (300 XP)
          </button>
        </>
      );
    }

    if (tier.threshold === 600) {
      return (
        <>
          <button
            className="xp-modal-choice"
            onClick={() => confirmRedeem("1x20")}
          >
            1× $20 Pass (600 XP)
          </button>
          <button
            className="xp-modal-choice"
            onClick={() => confirmRedeem("2x10")}
          >
            2× $10 Passes (600 XP)
          </button>
          <button
            className="xp-modal-choice"
            onClick={() => confirmRedeem("4x5")}
          >
            4× $5 Passes (600 XP)
          </button>
        </>
      );
    }

    return null;
  }

  return (
    <div className="xp-bar-root">
      <div className="xp-header-row">
        <span className="xp-label">XP</span>
        <span className="xp-value">{xp}</span>
        <span className="xp-passes">
          Free passes: {freePasses.five || 0}×$5 ·{" "}
          {freePasses.ten || 0}×$10 · {freePasses.twenty || 0}×$20
        </span>
      </div>

      <div className="xp-bar-track">
        <div
          className="xp-bar-fill"
          style={{ width: `${progressPct}%` }}
        />
        {TIERS.map((tier) => {
          const leftPct = (tier.threshold / maxXp) * 100;
          const unlocked = canRedeem(tier);
          return (
            <div
              key={tier.id}
              className={`xp-marker ${unlocked ? "xp-marker-unlocked" : ""}`}
              style={{ left: `${leftPct}%` }}
            >
              <div className="xp-marker-dot" />
              <div className="xp-marker-label">
                {tier.threshold} XP
              </div>
            </div>
          );
        })}
      </div>

      <div className="xp-tier-buttons">
        {TIERS.map((tier) => {
          const unlocked = canRedeem(tier);
          return (
            <button
              key={tier.id}
              className={`xp-tier-btn ${
                unlocked ? "xp-tier-btn-unlocked" : "xp-tier-btn-locked"
              }`}
              disabled={!unlocked}
              onClick={() => openRedeem(tier)}
            >
              {tier.label}
            </button>
          );
        })}
      </div>

      {error && <div className="xp-error">{error}</div>}

      {redeemingTier && (
        <div className="xp-modal-backdrop" onClick={() => setRedeemingTier(null)}>
          <div
            className="xp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Redeem {redeemingTier.label}</h3>
            <p>Choose how you want to use this XP.</p>
            <div className="xp-modal-choices">
              {renderChoiceButtons()}
            </div>
            <button
              className="xp-modal-close"
              onClick={() => setRedeemingTier(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
