// src/pages/Connect4Neon.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Connect4NeonBoard from "../components/Connect4NeonBoard";
import WinnerBanner from "../components/WinnerBanner";
import ChatBox from "../components/ChatBox.jsx";

import { playSound } from "../core/sound";
import { runRoundCountdown } from "../core/roundCountdown";
import { createMatch } from "../core/gameEngine";
import { applyMove as engineMove } from "../core/engines/connect4.js";

import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import "./connect4Neon.css";

const PLAYERS = ["Player 1", "Player 2"];
const MOVE_TIME = 20;

export default function Connect4Neon() {
  const navigate = useNavigate();
  const { tournamentId, roundIndex: roundParam, matchIndex: matchParam } =
    useParams();
  const [searchParams] = useSearchParams();

  // Triathlon set score coming into Connect 4
  const incomingSeriesP1 = Number(searchParams.get("s1") || 0);
  const incomingSeriesP2 = Number(searchParams.get("s2") || 0);

  const roundIndex = Number(roundParam || 0);
  const matchIndex = Number(matchParam || 0);

  const [starter, setStarter] = useState(() =>
    Math.random() < 0.5 ? 0 : 1
  );
  const [match, setMatch] = useState(() =>
    createMatch("connect4", starter)
  );

  const [round, setRound] = useState(1); // Bo3: rounds 1–3
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [matchWinnerIndex, setMatchWinnerIndex] = useState(null); // who won this game-type

  const [timer, setTimer] = useState(MOVE_TIME);
  const [inputLocked, setInputLocked] = useState(true);
  const [countdownText, setCountdownText] = useState(null);

  const [winningCells, setWinningCells] = useState(null);
  const [lastMovePos, setLastMovePos] = useState(null);
  const [xpGranted, setXpGranted] = useState(false);

  const timerRef = useRef(null);
  const [nextGameCountdown, setNextGameCountdown] = useState(null);
  const nextGameTimerRef = useRef(null);

  const currentPlayerIndex =
    typeof match?.currentPlayerIndex === "number"
      ? match.currentPlayerIndex
      : 0;

  /* ---------------- DAILY XP HELPERS ---------------- */
  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function normalizeDailyXp(raw) {
    const todayKey = getTodayKey();

    const base = {
      dateKey: todayKey,
      tournamentsToday: 0,
      threeBonusGranted: false,
      top4BonusGranted: false,
    };

    if (!raw) return base;
    if (raw.dateKey !== todayKey) return base;

    return { ...base, ...raw, dateKey: todayKey };
  }

  async function awardEntryXpAndDailyOnce() {
    if (xpGranted) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      const active = data.activeTournament;
      if (!active) return;

      if (active.entryXpGranted) {
        setXpGranted(true);
        return;
      }

      const fee = active.entryFee || 0;
      let xpFromFee = 0;

      if (fee >= 20) xpFromFee = 20;
      else if (fee >= 10) xpFromFee = 10;
      else if (fee >= 5) xpFromFee = 5;

      if (xpFromFee <= 0) {
        await updateDoc(ref, {
          "activeTournament.entryXpGranted": true,
        });
        setXpGranted(true);
        return;
      }

      let dailyXp = normalizeDailyXp(data.dailyXp);
      dailyXp.tournamentsToday = (dailyXp.tournamentsToday || 0) + 1;

      let xpDelta = xpFromFee;

      if (
        dailyXp.tournamentsToday >= 3 &&
        !dailyXp.threeBonusGranted
      ) {
        xpDelta += 10;
        dailyXp.threeBonusGranted = true;
      }

      const newXp = (data.xp || 0) + xpDelta;

      await updateDoc(ref, {
        xp: newXp,
        dailyXp,
        "activeTournament.entryXpGranted": true,
      });

      setXpGranted(true);
    } catch (err) {
      console.warn("Entry XP/daily bonus failed:", err.message);
    }
  }

  /* ---------------- ROUND START ---------------- */
  useEffect(() => {
    startRound(1);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(nextGameTimerRef.current);
    };
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
      if (roundNumber === 1 && tournamentId) {
        awardEntryXpAndDailyOnce();
      }
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

    setMatch((prev) => ({
      ...prev,
      currentPlayerIndex: prev.currentPlayerIndex === 0 ? 1 : 0,
    }));

    resetTimer();
  }

  /* ---------------- MOVE ---------------- */
  function handleMove(col) {
    if (inputLocked || matchWinnerIndex !== null) return;

    const result = engineMove(match, col);
    const { nextMatch, event } = result || {};

    if (!nextMatch || !event) return;

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
      handleDraw();
      return;
    }

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

    const updatedWins = {
      p1: wins.p1 + (winnerIndex === 0 ? 1 : 0),
      p2: wins.p2 + (winnerIndex === 1 ? 1 : 0),
    };
    setWins(updatedWins);

    playSound("/sounds/win.mp3");
    setMatch({ ...nextMatch });

    setTimeout(() => {
      const p1Wins = updatedWins.p1;
      const p2Wins = updatedWins.p2;

      if (p1Wins === 2 || p2Wins === 2) {
        handleSetOver(p1Wins > p2Wins ? 0 : 1);
      } else {
        startNextRound(loserIndex);
      }
    }, 1500);
  }

  /* ---------------- DRAW ---------------- */
  function handleDraw() {
    clearInterval(timerRef.current);
    setInputLocked(true);

    playSound("/sounds/draw.mp3");
    setCountdownText(`Draw — replaying Round ${round}`);

    setTimeout(() => {
      const fresh = createMatch("connect4", starter);
      setMatch(fresh);
      startRound(round);
    }, 2000);
  }

  /* ---------------- NEXT ROUND (within C4) ---------------- */
  function startNextRound(nextStarterIndex) {
    setStarter(nextStarterIndex);
    const fresh = createMatch("connect4", nextStarterIndex);
    setMatch(fresh);
    startRound(round + 1);
  }

  /* ---------------- SET OVER → move to Checkers ---------------- */
  function handleSetOver(winnerIndex) {
    setMatchWinnerIndex(winnerIndex);
    playSound("/sounds/match-win.mp3");

    // Updated triathlon series
    const nextSeriesP1 = incomingSeriesP1 + (winnerIndex === 0 ? 1 : 0);
    const nextSeriesP2 = incomingSeriesP2 + (winnerIndex === 1 ? 1 : 0);

    if (!tournamentId) {
      // Local test mode — no navigation, just hold banner.
      return;
    }

    // 5-second countdown to Checkers
    let remaining = 5;
    setNextGameCountdown(remaining);

    clearInterval(nextGameTimerRef.current);
    nextGameTimerRef.current = setInterval(() => {
      remaining -= 1;
      setNextGameCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(nextGameTimerRef.current);

        navigate(
          `/match/${tournamentId}/${roundIndex}/${matchIndex}/checkers?s1=${nextSeriesP1}&s2=${nextSeriesP2}`
        );
      }
    }, 1000);
  }

  const pIndex = currentPlayerIndex;
  const activeColor = pIndex === 0 ? "#ff004f" : "#00eaff";

  /* ---------------- UI ---------------- */
  return (
    <div className="c4-container">
      {countdownText && (
        <div className="countdown-overlay">{countdownText}</div>
      )}

      {matchWinnerIndex !== null && (
        <WinnerBanner
          text={`${PLAYERS[matchWinnerIndex]} wins the Connect 4 set!${
            tournamentId ? " Checkers in 5…" : ""
          }`}
          duration={3000}
        />
      )}

      <div className="tournament-header">
        <div className="t-title">CONNECT 4 — TOURNAMENT MATCH</div>
        <div className="t-sub">
          Set 1 of 3 • Best of 3 rounds
          {tournamentId && (
            <span className="t-sub-mini">
              {" "}
              • Series: {incomingSeriesP1}–{incomingSeriesP2}
            </span>
          )}
        </div>
      </div>

      <div className="players-row">
        <PlayerCard
          name={PLAYERS[0]}
          color="#ff004f"
          active={pIndex === 0 && matchWinnerIndex === null}
          timer={pIndex === 0 && matchWinnerIndex === null ? timer : null}
          wins={wins.p1}
        />
        <PlayerCard
          name={PLAYERS[1]}
          color="#00eaff"
          active={pIndex === 1 && matchWinnerIndex === null}
          timer={pIndex === 1 && matchWinnerIndex === null ? timer : null}
          wins={wins.p2}
        />
      </div>

      <div className="instructions" style={{ color: activeColor }}>
        {matchWinnerIndex !== null
          ? `${PLAYERS[matchWinnerIndex]} wins the set.`
          : `${PLAYERS[pIndex]} — Your turn.`}
        {nextGameCountdown !== null && matchWinnerIndex !== null && (
          <span className="next-game-count">
            {" "}
            • Checkers in {nextGameCountdown}…
          </span>
        )}
      </div>

      <div className="board-area">
        <Connect4NeonBoard
          board={match.game.board}
          onMove={handleMove}
          canMove={!inputLocked && matchWinnerIndex === null}
          winningCells={winningCells}
          lastMovePos={lastMovePos}
        />
      </div>

      <ChatBox
        onSend={(emoji) => {
          console.log("Sent emoji:", emoji);
        }}
      />
    </div>
  );
}

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
              cx="20"
              cy="20"
              r="18"
              style={{
                strokeDashoffset: 113 - (113 * timer) / MOVE_TIME,
              }}
            />
          </svg>
          <span className="timer-text">{timer}</span>
        </div>
      )}
    </div>
  );
}
