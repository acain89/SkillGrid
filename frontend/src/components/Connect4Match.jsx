// src/components/Connect4Match.jsx
import React, { useState, useEffect } from "react";
import Connect4Board from "./Connect4Board";
import { createMatch, applyMove as engineMove } from "../core/gameEngine";

// ---------------------------------------------
// GENERIC PLAYERS — replace with live usernames
// ---------------------------------------------
const PLAYER_NAMES = ["Player 1", "Player 2"];

const emptyScore = () => [0, 0];

export default function Connect4Match() {
  // Full match state (1 full board = 1 game)
  const [match, setMatch] = useState(() => createMatch("connect4"));

  // Best of 3 score
  const [score, setScore] = useState(emptyScore); // [p1Wins, p2Wins]

  // UI banners
  const [banner, setBanner] = useState("");
  const [toast, setToast] = useState("");

  // Modal for match winner
  const [matchWinner, setMatchWinner] = useState(null);

  // Disable board input (during win animation, reset, etc.)
  const [boardLocked, setBoardLocked] = useState(false);

  /* -------------------------------------------
     Helpers
  -------------------------------------------- */
  const showBanner = (text) => {
    setBanner(text);
    setTimeout(() => setBanner(""), 1800);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1400);
  };

  /* -------------------------------------------
     Reset the board after a game finishes
  -------------------------------------------- */
  const resetBoard = (startingPlayer = 0) => {
    const newMatch = createMatch("connect4");
    newMatch.currentPlayerIndex = startingPlayer;
    setMatch(newMatch);
    setBoardLocked(false);
    showBanner(`${PLAYER_NAMES[startingPlayer]} goes first!`);
  };

  /* -------------------------------------------
     Check game end
  -------------------------------------------- */
  const handleGameEnd = (winnerIndex) => {
    if (winnerIndex === null) {
      showBanner("Draw!");
      return setTimeout(() => resetBoard(0), 2000);
    }

    // Update scoreboard
    const next = [...score];
    next[winnerIndex] += 1;
    setScore(next);

    const gameNumber = next[0] + next[1];
    showBanner(`${PLAYER_NAMES[winnerIndex]} wins Game ${gameNumber}!`);

    // If someone wins 2 games -> match over
    if (next[winnerIndex] === 2) {
      setTimeout(() => setMatchWinner(winnerIndex), 1200);
      return;
    }

    // Prepare next game after 2 seconds
    setTimeout(() => {
      const nextStarter = winnerIndex === 0 ? 1 : 0;
      resetBoard(nextStarter);
    }, 2000);
  };

  /* -------------------------------------------
     Player makes a move
  -------------------------------------------- */
  const handleColumnClick = (col) => {
    if (boardLocked) return;

    const { nextMatch, event } = engineMove(match, { col });

    if (event.error) {
      return showToast("Illegal move");
    }

    if (event.type === "move") {
      setMatch(nextMatch);
      return;
    }

    if (event.type === "win") {
      setMatch(nextMatch);
      setBoardLocked(true);

      // Pass board to viewer, then evaluate game winner
      const winnerIndex = nextMatch.currentPlayerIndex;
      return handleGameEnd(winnerIndex);
    }

    if (event.type === "draw") {
      setMatch(nextMatch);
      setBoardLocked(true);
      return handleGameEnd(null);
    }
  };

  /* -------------------------------------------
     Initial greeting
  -------------------------------------------- */
  useEffect(() => {
    showBanner(`${PLAYER_NAMES[match.currentPlayerIndex]} goes first!`);
  }, []);

  /* -------------------------------------------
     Scoreboard UI
  -------------------------------------------- */
  const ScoreDots = ({ wins }) => {
    const arr = [0, 1, 2];
    return (
      <div style={{ display: "flex", gap: 6 }}>
        {arr.map((i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: wins > i ? "#0ff" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: "relative", padding: 20 }}>
      {/* BANNER */}
      {banner && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            borderRadius: 12,
            background: "rgba(0,255,200,0.15)",
            border: "1px solid #0ff4",
            color: "#0ff",
            fontSize: 22,
            fontWeight: 600,
            backdropFilter: "blur(6px)",
          }}
        >
          {banner}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 18px",
            borderRadius: 8,
            background: "#000a",
            color: "#fff",
            fontSize: 14,
          }}
        >
          {toast}
        </div>
      )}

      {/* SCOREBOARD */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 10px",
        }}
      >
        <div style={{ textAlign: "left", color: "#fff" }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>{PLAYER_NAMES[0]}</div>
          <ScoreDots wins={score[0]} />
        </div>

        <div style={{ textAlign: "right", color: "#fff" }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>{PLAYER_NAMES[1]}</div>
          <ScoreDots wins={score[1]} />
        </div>
      </div>

      {/* ACTIVE TURN */}
      {match.status === "active" && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 10,
            color: "#0ff",
            fontSize: 20,
          }}
        >
          {PLAYER_NAMES[match.currentPlayerIndex]}'s Turn
        </div>
      )}

      {/* BOARD */}
      <Connect4Board
        board={match.game.board}
        winnerCells={match.game.winnerCells || []}
        isFinished={boardLocked}
        onColumnClick={handleColumnClick}
      />

      {/* MATCH WINNER MODAL */}
      {matchWinner !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              background: "#022",
              padding: "30px 40px",
              borderRadius: 16,
              color: "#0ff",
              textAlign: "center",
              border: "2px solid #0ff6",
              boxShadow: "0 0 20px #0ff4",
            }}
          >
            <h1 style={{ fontSize: 32, marginBottom: 10 }}>
              {PLAYER_NAMES[matchWinner]} Wins the Match!
            </h1>
            <button
              onClick={() => {
                setScore(emptyScore());
                setMatchWinner(null);
                resetBoard(0);
              }}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                borderRadius: 10,
                fontSize: 16,
                cursor: "pointer",
                border: "1px solid #0ff",
                background: "#044",
                color: "#0ff",
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
