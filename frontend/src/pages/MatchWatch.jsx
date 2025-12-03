// src/pages/MatchWatch.jsx

import React from "react";
import "./matchWatch.css";

export default function MatchWatch({ match, onExit }) {
  if (!match) {
    return <div className="mw-container">Loading match…</div>;
  }

  const { p1, p2, wins, currentGame, status } = match;

  return (
    <div className="mw-container">
      <h1 className="mw-title">Watching Match</h1>

      <div className="mw-names">
        <div className="mw-player">
          <span className="mw-un">{p1.username}</span>
          <span className="mw-wins">Wins: {wins.p1}</span>
        </div>

        <div className="mw-vs">VS</div>

        <div className="mw-player">
          <span className="mw-un">{p2.username}</span>
          <span className="mw-wins">Wins: {wins.p2}</span>
        </div>
      </div>

      <div className="mw-status">
        {status === "active" && (
          <div className="mw-active">Game {currentGame} in progress…</div>
        )}

        {status === "finished" && (
          <div className="mw-finished">
            Winner: <b>{match.winner.username}</b>
          </div>
        )}
      </div>

      {/* Placeholder for game board (your actual game UI plugs in here) */}
      <div className="mw-board">
        <div className="mw-board-placeholder">
          Game board renders here (read-only mode)
        </div>
      </div>

      <button className="mw-exit-btn" onClick={onExit}>
        Back to Bracket
      </button>
    </div>
  );
}
