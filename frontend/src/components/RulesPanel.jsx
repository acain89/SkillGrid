// src/components/RulesPanel.jsx
import React from "react";
import "./RulesPanel.css";
import { playSound } from "../core/sound";

const CLICK_SOUND = "/sounds/ui-click.mp3";

export default function RulesPanel({ onClose }) {
  return (
    <div className="rules-backdrop" onClick={onClose}>
      <div className="rules-panel" onClick={(e) => e.stopPropagation()}>
        
        <h1 className="rules-title">Rules</h1>

        <div className="rules-content">
          <h2>Game Rules</h2>
          <p>All games are strictly skill-based. No randomness. No chance elements.</p>

          <h3>Connect 4</h3>
          <p>Drop pieces into a 7×6 board. First player to connect 4 wins.</p>

          <h3>Checkers</h3>
          <p>Jump to capture. Kings move both directions. No forced jumps.</p>

          <h3>Grid-Trap</h3>
          <p>Block your opponent until they cannot move. Full board control wins.</p>

          <h2>Tournament Rules</h2>
          <p>All SkillGrid tournaments are single-elimination, best-of-3 per game.</p>

          <ul>
            <li>16 players per tournament</li>
            <li>No randomness or chance mechanics</li>
            <li>Transparent bracket structure</li>
            <li>Top placements earn payouts based on tier</li>
          </ul>
        </div>

        <button
          className="rules-close-btn"
          onClick={() => {
            playSound(CLICK_SOUND, 0.5);
            onClose();
          }}
        >
          Close
        </button>

      </div>
    </div>
  );
}
