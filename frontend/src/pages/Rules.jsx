import React from "react";
import "./tournamentArena.css";

export default function Rules() {
  return (
    <div className="arena-root" style={{ paddingTop: "80px" }}>
      
      <h1 className="arena-title">Rules</h1>

      <div style={{
        maxWidth: "700px",
        margin: "40px auto",
        background: "rgba(255,255,255,0.05)",
        padding: "30px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#e9f5ff",
        lineHeight: "1.7"
      }}>
        
        <h2 style={{ color: "#45f7ff" }}>Game Rules</h2>
        <p>All games are strictly skill-based. No randomness. No chance elements.</p>

        <h3>Connect 4</h3>
        <p>Drop pieces into a 7x6 board. First player to connect 4 in a row, vertically, horizontally, or diagonally, wins.</p>

        <h3>Checkers</h3>
        <p>Capture enemy pieces by jumping. Kings move both directions. No forced jumps.</p>

        <h3>Grid-Trap</h3>
        <p>Choose where you move to next. Choose where to place your block. Repeat. Do not get trapped. 
           Winner is the first player to successfully trap their opponent.</p>

        <h2 style={{ color: "#45f7ff", marginTop: "30px" }}>Tournament Rules</h2>
        <p>Each round consits of 3 games, each decided by a Best-of-3 match. Win 2 out of the 3 matches each game (Best-of-3) to win that game. Win 2 out of the 3 games (Connect4/Checkers/Grid-Trap) to win the round and advance in the tournament bracket. 
        Lose 2 out of 3 games within a round and you're eliminated.</p>
        <p>All formats in the same tier have the same sized pot, either $80, $160, or $320.</p>
        <p>The format - Casual, Competitive, and Winner-Takes-All - determines how the pot is distributed.</p>

      </div>

    </div>
  );
}
