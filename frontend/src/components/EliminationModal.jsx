// src/components/EliminationModal.jsx
import React, { useMemo } from "react";
import "./eliminationModal.css";

function formatPlacement(placement) {
  if (!placement || placement <= 0) return "—";
  const lastDigit = placement % 10;
  const lastTwo = placement % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${placement}th`;
  if (lastDigit === 1) return `${placement}st`;
  if (lastDigit === 2) return `${placement}nd`;
  if (lastDigit === 3) return `${placement}rd`;
  return `${placement}th`;
}

function getTierTheme(tier) {
  switch (tier) {
    case "pro":
      return {
        name: "Pro",
        primary: "#ff9d00",
        glow: "#ffb733",
        accent: "#ffd36b",
      };
    case "elite":
      return {
        name: "Elite",
        primary: "#ff0077",
        glow: "#ff55a6",
        accent: "#ff9fd1",
      };
    case "casual":
    default:
      return {
        name: "Casual",
        primary: "#00eaff",
        glow: "#4af4ff",
        accent: "#9ff8ff",
      };
  }
}

export default function EliminationModal({
  isOpen,
  onClose,
  placement,
  prize,
  rounds,
  defeated,
  streak,
  onPurchase,
  tier = "casual",
}) {
  if (!isOpen) return null;

  const hasPrize = typeof prize === "number" && prize > 0;
  const placementLabel = formatPlacement(placement);
  const theme = useMemo(() => getTierTheme(tier), [tier]);

  const titleText = hasPrize
    ? "Tournament Complete"
    : "Tournament Over";

  const mainLine = hasPrize
    ? `You finished in ${placementLabel} place.`
    : "You've been eliminated. Better luck next time!";

  const prizeLine = hasPrize
    ? `You won $${prize}!`
    : "";

  const statsLine = `Rounds played: ${rounds ?? "—"} • Opponents defeated: ${
    defeated ?? "—"
  } • Best streak: ${streak ?? "—"}`;

  const upsellLine =
    "Want to drastically improve your game and get bigger wins? Unlock full post-game analysis that breaks down every move you made in this tournament.";

  const confettiPieces = hasPrize ? Array.from({ length: 24 }) : [];
  const rainPieces = !hasPrize ? Array.from({ length: 18 }) : [];

  return (
    <div className="elim-backdrop">
      {/* Confetti for winners */}
      {hasPrize && (
        <div className="elim-confetti-layer">
          {confettiPieces.map((_, i) => (
            <span
              key={i}
              className="elim-confetti-piece"
              style={{
                "--confetti-left": `${Math.random() * 100}%`,
                "--confetti-delay": `${Math.random() * 0.6}s`,
                "--confetti-duration": `${1.8 + Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Particle rain for eliminated players */}
      {!hasPrize && (
        <div className="elim-rain-layer">
          {rainPieces.map((_, i) => (
            <span
              key={i}
              className="elim-rain-drop"
              style={{
                "--rain-left": `${Math.random() * 100}%`,
                "--rain-delay": `${Math.random() * 1.2}s`,
                "--rain-duration": `${2 + Math.random() * 1.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="elim-modal"
        style={{
          borderColor: theme.primary,
          boxShadow: `
            0 0 25px ${theme.primary}55,
            0 0 50px ${theme.primary}33 inset,
            0 0 10px ${theme.glow},
            0 0 10px ${theme.accent}
          `,
        }}
      >
        <div className="elim-tier-pill">
          {theme.name} bracket
        </div>

        <div className="elim-title">{titleText}</div>

        <div className="elim-placement-number" style={{ color: theme.primary }}>
          {placementLabel !== "—" ? placementLabel : ""}
        </div>

        <p className="elim-sub" style={{ color: theme.accent }}>
          {mainLine}
        </p>

        {hasPrize && <p className="elim-prize">{prizeLine}</p>}

        <p className="elim-stats">{statsLine}</p>

        <p className="elim-upsell">{upsellLine}</p>

        <div className="elim-btn-row">
          <button className="elim-btn-primary" onClick={onPurchase}>
            Get full analysis — $2.99
          </button>

          <button className="elim-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
