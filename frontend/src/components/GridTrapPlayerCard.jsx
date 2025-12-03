// src/components/GridTrapPlayerCard.jsx
import React from "react";
import { PLAYER } from "../core/engines/gridTrap";

function RingTimer({ active }) {
  return (
    <div className={`gt-ring ${active ? "gt-ring--active" : ""}`}>
      <div className="gt-ring-inner" />
    </div>
  );
}

export default function GridTrapPlayerCard({
  player,
  isActive,
  wins = 0,
  tokens = 0,
  blocksPlaced = 0,
}) {
  const label = player === PLAYER.A ? "PLAYER A" : "PLAYER B";

  return (
    <div className={`gt-card ${isActive ? "gt-card--active" : ""}`}>
      <div className="gt-card-header">
        <RingTimer active={isActive} />
        <div className="gt-card-title-block">
          <div className="gt-card-label">{label}</div>
          <div className="gt-card-sub">
            {isActive ? "Your turn" : "Waiting"}
          </div>
        </div>
      </div>

      <div className="gt-card-row">
        <span className="gt-card-tag">Wins</span>
        <span className="gt-card-value">{wins}</span>
      </div>

      <div className="gt-card-row">
        <span className="gt-card-tag">Tokens</span>
        <span className="gt-card-value">
          <span className="gt-token-icon">◎</span> {tokens}
        </span>
      </div>

      <div className="gt-card-row">
        <span className="gt-card-tag">Blocks placed</span>
        <span className="gt-card-value">{blocksPlaced}</span>
      </div>
    </div>
  );
}
