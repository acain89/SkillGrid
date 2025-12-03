// src/pages/Connect4Neon.jsx

import React, { useState, useEffect, useRef } from "react";
import Connect4NeonBoard from "../components/Connect4NeonBoard";
import WinnerBanner from "../components/WinnerBanner";

import { playSound } from "../core/sound";
import { runRoundCountdown } from "../core/roundCountdown";
import { createMatch } from "../core/gameEngine";
import { applyMove as engineMove } from "../core/engines/connect4.js";
import ChatBox from "../components/ChatBox.jsx";


import "./connect4Neon.css";

const PLAYERS = ["Player 1", "Player 2"];
const MOVE_TIME = 20;

export default function Connect4Neon() {
  // random starter for game 1
  const [starter, setStarter] = useState(
    () => (Math.random() < 0.5 ? 0 : 1)
  );

  const [match, setMatch] = useState(() =>
    createMatch("connect4", starter)
  );

  const [timer, setTimer] = useState(MOVE_TIME);
  const [countdownText, setCountdownText] = useState(null);
  const [inputLocked, setInputLocked] = useState(true);

  const [round, setRound] = useState(1);
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [matchWinnerIndex, setMatchWinnerIndex] = useState(null);

  const [winningCells, setWinningCells] = useState(null);
  const [lastMovePos, setLastMovePos] = useState(null);

  const timerRef = useRef(null);

  /* ---------------- ROUND START ---------------- */
  useEffect(() => {
    startRound(1);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startRound(roundNumber) {
    clearInterval(timerRef.current);
    setRound(roundNumber);
    setCountdownText(null);
    setInputLocked(true);
    setWinningCells(null);
    setLastMovePos(null);

    runRoundCountdown(roundNumber, setCountdownText, () => {
      setInputLocked(false);
      resetTimer();
    });

    playSound("/sounds/round-start.mp3");
  }

  /* ---------------- TIMER ---------------- */
  function resetTimer() {
    clearInterval(timerRef.current);
    setTimer(MOVE_TIME);

    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return MOVE_TIME;
        }
        return t - 1;
      });
    }, 1000);
  }

  function handleTimeout() {
    if (inputLocked || matchWinnerIndex !== null) return;

    playSound("/sounds/timeout.mp3");

    // Skip turn in-place; do NOT erase moves
    setMatch((prev) => ({
      ...prev,
      currentPlayerIndex: prev.currentPlayerIndex === 0 ? 1 : 0
    }));

    resetTimer();
  }

  /* ---------------- MOVE ---------------- */
function handleMove(col) {
  if (inputLocked || matchWinnerIndex !== null) return;

  const result = engineMove(match, col);
  const { nextMatch, event } = result;

  if (event.type === "column-full") {
    playSound("/sounds/error.mp3");
    return;
  }

  if (event.type === "move" || event.type === "win" || event.type === "draw") {
    setLastMovePos({ row: event.row, col: event.col });
    playSound("/sounds/drop.mp3");
  }

  if (event.type === "win") {
    handleRoundWin(nextMatch);
    return;
  }

  if (event.type === "draw") {
    handleDraw(nextMatch);
    return;
  }

  // Normal move
  setMatch({ ...nextMatch });
  resetTimer();
}

/* ---------------- ROUND WIN ---------------- */
function handleRoundWin(nextMatch) {
  clearInterval(timerRef.current);
  setInputLocked(true);

  const winnerIndex = match.currentPlayerIndex;
  const loserIndex = winnerIndex === 0 ? 1 : 0;

  setWinningCells(nextMatch.game.winnerCells || null);

  setWins((prev) => ({
    p1: prev.p1 + (winnerIndex === 0 ? 1 : 0),
    p2: prev.p2 + (winnerIndex === 1 ? 1 : 0)
  }));

  playSound("/sounds/win.mp3");
  setMatch({ ...nextMatch });

  setTimeout(() => {
    const p1Wins = wins.p1 + (winnerIndex === 0 ? 1 : 0);
    const p2Wins = wins.p2 + (winnerIndex === 1 ? 1 : 0);

    if (p1Wins === 2 || p2Wins === 2) {
      handleMatchOver(p1Wins > p2Wins ? 0 : 1);
    } else {
      startNextRound(loserIndex);
    }
  }, 5000);
}

/* ---------------- DRAW HANDLING ---------------- */
function handleDraw(nextMatch) {
  clearInterval(timerRef.current);
  setInputLocked(true);

  playSound("/sounds/draw.mp3");

  // Show banner
  setCountdownText(`Draw — Replaying Round ${round}`);

  // Reset board to a fresh match, same starter as before
  setTimeout(() => {
    setCountdownText(null);

    const fresh = createMatch("connect4", starter);
    setMatch(fresh);

    // start same round again
    startRound(round);
  }, 3000);
}


  /* ---------------- NEXT ROUND ---------------- */
  function startNextRound(nextStarterIndex) {
    setStarter(nextStarterIndex);
    const freshMatch = createMatch("connect4", nextStarterIndex);
    setMatch(freshMatch);

    const nextRound = round + 1;
    startRound(nextRound);
  }

  /* ---------------- MATCH OVER ---------------- */
  function handleMatchOver(winnerIndex) {
    setMatchWinnerIndex(winnerIndex);
    playSound("/sounds/match-win.mp3");

    setTimeout(() => {
      if (winnerIndex === 0) {
        window.location.href = "/bracket";
      } else {
        window.location.href = "/game-pass";
      }
    }, 3000);
  }

  const pIndex = match.currentPlayerIndex;
  const activeColor = pIndex === 0 ? "#ff004f" : "#00eaff";

  return (
    <div className="c4-container">
      {/* ROUND COUNTDOWN */}
      {countdownText && (
        <div className="countdown-overlay">{countdownText}</div>
      )}

      {/* MATCH WINNER BANNER */}
      {matchWinnerIndex !== null && (
        <WinnerBanner
          text={`${PLAYERS[matchWinnerIndex]} wins the match!`}
          duration={3000}
        />
      )}

      {/* HEADER */}
      <div className="tournament-header">
        <div className="t-title">CONNECT 4 — TOURNAMENT MATCH</div>
        <div className="t-sub">Round {round} • Best of 3</div>
      </div>

      {/* PLAYER CARDS */}
      <div className="players-row">
        <PlayerCard
          name={PLAYERS[0]}
          color="#ff004f"
          active={pIndex === 0 && matchWinnerIndex === null}
          timer={pIndex === 0 ? timer : null}
          wins={wins.p1}
        />
        <PlayerCard
          name={PLAYERS[1]}
          color="#00eaff"
          active={pIndex === 1 && matchWinnerIndex === null}
          timer={pIndex === 1 ? timer : null}
          wins={wins.p2}
        />
      </div>

      {/* INSTRUCTIONS */}
      <div className="instructions" style={{ color: activeColor }}>
        {matchWinnerIndex !== null
          ? `${PLAYERS[matchWinnerIndex]} wins the match.`
          : `${PLAYERS[pIndex]} — Your turn.`}
      </div>

      {/* BOARD */}
      <div className="board-area">
        <Connect4NeonBoard
          board={match.game.board}
          onMove={handleMove}
          canMove={!inputLocked && matchWinnerIndex === null}
          winningCells={winningCells}
          lastMovePos={lastMovePos}
        />
      </div>
    </div>
  );
}

<ChatBox 
  onSend={(emoji) => {
    console.log("Sent emoji:", emoji);
    // FUTURE: socket.io send here
  }}
/>

/* ---------------- PLAYER CARD ---------------- */
function PlayerCard({ name, color, active, timer, wins }) {
  return (
    <div className={`player-card ${active ? "active" : ""}`}>
      <div className="p-name" style={{ color }}>
        {name}
      </div>

      {active && (
        <div className="turn-label" style={{ color }}>
          YOUR TURN
        </div>
      )}

      <div className="score-marks">
        Wins:{" "}
        {wins > 0
          ? Array.from({ length: wins })
              .map(() => "I")
              .join(" ")
          : "-"}
      </div>

      {active && (
        <div className="timer-ring">
          <svg viewBox="0 0 40 40">
            <circle className="bg" cx="20" cy="20" r="18" />
            <circle
              className="fg"
              cx="20" cy="20" r="18"
              style={{
                strokeDashoffset: 113 - (113 * timer) / MOVE_TIME
              }}
            />
          </svg>
          <span className="timer-text">{timer}</span>
        </div>
      )}
    </div>
  );
}
