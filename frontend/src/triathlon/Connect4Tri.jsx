// src/triathlon/Connect4Tri.jsx
import React, { useState, useEffect, useRef } from "react";
import Connect4NeonBoard from "../components/Connect4NeonBoard";
import WinnerBanner from "../components/WinnerBanner";

import { playSound } from "../core/sound";
import { createMatch } from "../core/gameEngine";
import { applyMove as engineMove } from "../core/engines/connect4.js";

import "../pages/connect4Neon.css";

const PLAYERS = ["Player 1", "Player 2"];
const MOVE_TIME = 20;

export default function Connect4Tri({ onMatchComplete }) {
  const [starter, setStarter] = useState(
    () => (Math.random() < 0.5 ? 0 : 1)
  );

  const [match, setMatch] = useState(() =>
    createMatch("connect4", starter)
  );

  const [timer, setTimer] = useState(MOVE_TIME);
  const [countdownText, setCountdownText] = useState(null);

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
  }, []);

  function startRound(roundNumber) {
    clearInterval(timerRef.current);
    setRound(roundNumber);
    setCountdownText(null);
    setWinningCells(null);
    setLastMovePos(null);

    resetTimer();
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
    if (matchWinnerIndex !== null) return;

    playSound("/sounds/timeout.mp3");

    setMatch((prev) => ({
      ...prev,
      currentPlayerIndex: prev.currentPlayerIndex === 0 ? 1 : 0,
    }));

    resetTimer();
  }

  /* ---------------- MOVE ---------------- */
  function handleMove(col) {
    if (matchWinnerIndex !== null) return;

    const result = engineMove(match, { col });
    const { nextMatch, event } = result;

    if (event.type === "column-full") {
      playSound("/sounds/error.mp3");
      return;
    }

    if (["move", "win", "draw"].includes(event.type)) {
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

    setMatch({ ...nextMatch });
    resetTimer();
  }

  /* ---------------- ROUND WIN ---------------- */
  function handleRoundWin(nextMatch) {
    clearInterval(timerRef.current);

    const winnerIndex = match.currentPlayerIndex;
    const loserIndex = winnerIndex === 0 ? 1 : 0;

    setWinningCells(nextMatch.game.winnerCells || null);

    setWins((prev) => ({
      p1: prev.p1 + (winnerIndex === 0 ? 1 : 0),
      p2: prev.p2 + (winnerIndex === 1 ? 1 : 0),
    }));

    playSound("/sounds/win.mp3");
    setMatch({ ...nextMatch });

    setTimeout(() => {
      const p1Wins = wins.p1 + (winnerIndex === 0 ? 1 : 0);
      const p2Wins = wins.p2 + (winnerIndex === 1 ? 1 : 0);

      if (p1Wins === 2 || p2Wins === 2) {
        handleMatchOver(winnerIndex);
      } else {
        startNextRound(loserIndex);
      }
    }, 4000);
  }

  function handleDraw() {
    clearInterval(timerRef.current);

    playSound("/sounds/draw.mp3");

    setTimeout(() => {
      const fresh = createMatch("connect4", starter);
      setMatch(fresh);
      startRound(round);
    }, 2000);
  }

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
      onMatchComplete && onMatchComplete(winnerIndex);
    }, 2000);
  }

  const pIndex = match.currentPlayerIndex;

  return (
    <div className="c4-container">
      {countdownText && (
        <div className="countdown-overlay">{countdownText}</div>
      )}

      {matchWinnerIndex !== null && (
        <WinnerBanner
          text={`${PLAYERS[matchWinnerIndex]} wins the match!`}
          duration={3000}
        />
      )}

      <div className="tournament-header">
        <div className="t-title">CONNECT 4 — TOURNAMENT MATCH</div>
        <div className="t-sub">Round {round} • Best of 3</div>
      </div>

      {/* PLAYER CARDS */}
      <div className="checkers-player-row">
        <PlayerCard
          name="Player 1"
          active={pIndex === 0 && matchWinnerIndex === null}
          timer={pIndex === 0 ? timer : null}
          wins={wins.p1}
          chipClass="p1"    // 🔥 FIXED: matches board chip color
        />
        <PlayerCard
          name="Player 2"
          active={pIndex === 1 && matchWinnerIndex === null}
          timer={pIndex === 1 ? timer : null}
          wins={wins.p2}
          chipClass="p2"    // 🔥 FIXED: matches board chip color
        />
      </div>

      <div className="board-area">
        <Connect4NeonBoard
          board={match.game.board}
          onMove={handleMove}
          canMove={matchWinnerIndex === null}
          winningCells={winningCells}
          lastMovePos={lastMovePos}
        />
      </div>
    </div>
  );
}


/* ---------------- PLAYER CARD ---------------- */
function PlayerCard({ name, active, timer, wins, chipClass }) {
  return (
    <div className={`checkers-player-card ${active ? "active" : ""}`}>
      <div className="tri-top">
        <div className="tri-name">{name}</div>
        <div className="tri-turn">{active ? "YOUR TURN" : ""}</div>
      </div>

      <div className="tri-middle">
        <div className="tri-wins">Wins: {wins}</div>

        <div className="tri-timer">
          {active && (
            <div className="tri-timer-ring">
              <span>{timer}</span>
            </div>
          )}
        </div>
      </div>

      <div className="tri-bottom">
        <div className={`tri-chip ${chipClass}`} />
      </div>
    </div>
  );
}
