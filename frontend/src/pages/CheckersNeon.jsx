// src/pages/CheckersNeon.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import CheckersBoard from "../components/CheckersBoard";
import WinnerBanner from "../components/WinnerBanner";
import ChatBox from "../components/ChatBox.jsx";
import { createMatch } from "../core/gameEngine";
import { applyMove as engineMove } from "../core/engines/checkers.js";

import "./checkers.css";

const MOVE_TIME = 20;
const PLAYERS = ["Player 1", "Player 2"];

export default function CheckersNeon() {
  const navigate = useNavigate();
  const { tournamentId, roundIndex: roundParam, matchIndex: matchParam } =
    useParams();
  const [searchParams] = useSearchParams();

  // Triathlon set score coming into Checkers
  const incomingSeriesP1 = Number(searchParams.get("s1") || 0);
  const incomingSeriesP2 = Number(searchParams.get("s2") || 0);

  const roundIndex = Number(roundParam || 0);
  const matchIndex = Number(matchParam || 0);

  const [match, setMatch] = useState(() => createMatch("checkers"));
  const [round, setRound] = useState(1); // Bo3 rounds 1–3
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [matchWinnerIndex, setMatchWinnerIndex] = useState(null);

  const [timer, setTimer] = useState(MOVE_TIME);
  const [timeouts, setTimeouts] = useState({ p1: 0, p2: 0 });
  const [timeoutLoser, setTimeoutLoser] = useState(null);

  const [lastMove, setLastMove] = useState(null);
  const [lastCapture, setLastCapture] = useState(null);

  const [nextGameCountdown, setNextGameCountdown] = useState(null);

  const timerRef = useRef(null);
  const nextGameTimerRef = useRef(null);

  const currentPlayerIndex =
    typeof match?.currentPlayerIndex === "number"
      ? match.currentPlayerIndex
      : 0;

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (matchWinnerIndex !== null) return;

    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return MOVE_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(nextGameTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerIndex, matchWinnerIndex]);

  function handleTimeout() {
    if (matchWinnerIndex !== null) return;

    const loserIndex = currentPlayerIndex;
    const opponent = loserIndex === 0 ? 1 : 0;

    setTimeouts((prev) => {
      const key = loserIndex === 0 ? "p1" : "p2";
      const updated = { ...prev, [key]: prev[key] + 1 };

      if (updated[key] >= 3) {
        const winKey = opponent === 0 ? "p1" : "p2";

        setMatchWinnerIndex(opponent);
        setWins((w) => ({ ...w, [winKey]: w[winKey] + 1 }));
        setTimeoutLoser(loserIndex);

        handleSetOver(opponent);
        return updated;
      }

      // Skip turn
      setMatch((prevMatch) => {
        if (!prevMatch) return prevMatch;
        return {
          ...prevMatch,
          currentPlayerIndex:
            prevMatch.currentPlayerIndex === 0 ? 1 : 0,
        };
      });

      setTimer(MOVE_TIME);
      return updated;
    });
  }

  /* ---------------- HANDLE MOVE ---------------- */
  function handleMove(fromRow, fromCol, toRow, toCol) {
    if (!match || matchWinnerIndex !== null) return;

    try {
      const result = engineMove(match, {
        fromRow,
        fromCol,
        toRow,
        toCol,
      });

      if (!result || !result.nextMatch) return;

      const nextMatch = result.nextMatch;

      setMatch(nextMatch);
      setTimer(MOVE_TIME);
      setLastMove({ fromRow, fromCol, toRow, toCol });

      const caps = result.event?.capture || null;
      let captureCell = null;
      if (Array.isArray(caps) && caps.length > 0) {
        captureCell = caps[caps.length - 1];
      }
      setLastCapture(captureCell);

      if (result.event?.winner !== undefined) {
        const winIdx = result.event.winner;
        const updatedWins = {
          p1: wins.p1 + (winIdx === 0 ? 1 : 0),
          p2: wins.p2 + (winIdx === 1 ? 1 : 0),
        };

        setMatchWinnerIndex(winIdx);
        setWins(updatedWins);

        const p1Wins = updatedWins.p1;
        const p2Wins = updatedWins.p2;

        if (p1Wins === 2 || p2Wins === 2) {
          handleSetOver(p1Wins > p2Wins ? 0 : 1);
        } else {
          // New round inside Checkers set
          setRound((r) => r + 1);
          const newMatch = createMatch("checkers");
          setMatch(newMatch);
          setTimer(MOVE_TIME);
          setTimeouts({ p1: 0, p2: 0 });
          setTimeoutLoser(null);
          setLastMove(null);
          setLastCapture(null);
        }
      }
    } catch (err) {
      console.error("Checkers move failed:", err);
    }
  }

  /* ---------------- SET OVER → move to Grid-Trap ---------------- */
  function handleSetOver(winnerIndex) {
    playSound("/sounds/match-win.mp3");

    // Update triathlon series
    const nextSeriesP1 = incomingSeriesP1 + (winnerIndex === 0 ? 1 : 0);
    const nextSeriesP2 = incomingSeriesP2 + (winnerIndex === 1 ? 1 : 0);

    if (!tournamentId) {
      return;
    }

    let remaining = 5;
    setNextGameCountdown(remaining);

    clearInterval(nextGameTimerRef.current);
    nextGameTimerRef.current = setInterval(() => {
      remaining -= 1;
      setNextGameCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(nextGameTimerRef.current);
        navigate(
          `/match/${tournamentId}/${roundIndex}/${matchIndex}/gridtrap?s1=${nextSeriesP1}&s2=${nextSeriesP2}`
        );
      }
    }, 1000);
  }

  /* ---------------- NEXT ROUND RESET (button / timeout popup) ---------------- */
  function handleResetRound() {
    const newMatch = createMatch("checkers");

    setMatch(newMatch);
    setTimer(MOVE_TIME);
    setMatchWinnerIndex(null);

    setTimeouts({ p1: 0, p2: 0 });
    setTimeoutLoser(null);

    setLastMove(null);
    setLastCapture(null);

    setRound((r) => r + 1);
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="checkers-page">
      {matchWinnerIndex !== null && (
        <WinnerBanner
          text={`${PLAYERS[matchWinnerIndex]} wins the Checkers set!${
            tournamentId ? " Grid-Trap in 5…" : ""
          }`}
          duration={3000}
        />
      )}

      <div className="checkers-header">
        <h1 className="checkers-title">CHECKERS — TOURNAMENT MATCH</h1>
        <p className="checkers-subtitle">
          Set 2 of 3 • Best of 3 rounds
          {tournamentId && (
            <span className="t-sub-mini">
              {" "}
              • Series: {incomingSeriesP1}–{incomingSeriesP2}
            </span>
          )}
        </p>
      </div>

      {/* PLAYER CARDS */}
      <div className="checkers-player-row">
        <PlayerCard
          label="Player 1"
          colorClass="red"
          isActive={currentPlayerIndex === 0 && matchWinnerIndex === null}
          wins={wins.p1}
          timer={
            currentPlayerIndex === 0 && matchWinnerIndex === null
              ? timer
              : null
          }
        />

        <PlayerCard
          label="Player 2"
          colorClass="black"
          isActive={currentPlayerIndex === 1 && matchWinnerIndex === null}
          wins={wins.p2}
          timer={
            currentPlayerIndex === 1 && matchWinnerIndex === null
              ? timer
              : null
          }
        />
      </div>

      {/* BOARD */}
      <div className="checkers-board-frame">
        {match?.game?.board && (
          <CheckersBoard
            board={match.game.board}
            onMove={handleMove}
            lastMove={lastMove}
            lastCapture={lastCapture}
            amIBottom={true}
          />
        )}
      </div>

      <ChatBox onSend={(emoji) => console.log("Sent emoji:", emoji)} />

      {/* TIMEOUT FORFEIT POPUP */}
      {timeoutLoser !== null && (
        <div className="checkers-modal-backdrop">
          <div className="checkers-modal">
            <h2>Timeout Forfeit</h2>
            <p>
              {timeoutLoser === 0 ? "Player 1 (Red)" : "Player 2 (Black)"} has
              timed out 3 times and forfeits this round.
            </p>
            <button className="checkers-modal-btn" onClick={handleResetRound}>
              Next Round
            </button>
          </div>
        </div>
      )}

      {matchWinnerIndex !== null && nextGameCountdown !== null && (
        <div className="next-game-toast">
          Grid-Trap in {nextGameCountdown}…
        </div>
      )}
    </div>
  );
}

/* ---------------- PLAYER CARD COMPONENT ---------------- */
function PlayerCard({ label, colorClass, isActive, wins, timer }) {
  return (
    <div className={`checkers-player-card ${isActive ? "active" : ""}`}>
      <div className="checkers-card-top">
        <div className="checkers-player-label">{label}</div>
        {isActive && (
          <div className="checkers-player-turn-tag">YOUR TURN</div>
        )}
      </div>

      <div className="checkers-card-middle">
        <div className="checkers-player-wins">
          Wins: <span>{wins}</span>
        </div>

        {isActive && (
          <div className="checkers-timer-ring">
            <div className="checkers-timer-circle">
              <span>{timer}</span>
            </div>
          </div>
        )}
      </div>

      <div className="checkers-card-bottom">
        <div className={`checkers-player-chip-icon ${colorClass}`} />
      </div>
    </div>
  );
}
