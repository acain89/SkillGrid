// frontend/src/pages/CheckersNeon.jsx
import React, { useEffect, useRef, useState } from "react";
import CheckersBoard from "../components/CheckersBoard";
import { createMatch } from "../core/gameEngine";
import { applyMove as engineMove } from "../core/engines/checkers.js";
import "./checkers.css";
import ChatBox from "../components/ChatBox.jsx";


const MOVE_TIME = 20; // seconds
const PLAYERS = ["Player 1", "Player 2"];

export default function CheckersNeon() {
  const [match, setMatch] = useState(() => createMatch("checkers"));
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState({ p1: 0, p2: 0 });
  const [matchWinnerIndex, setMatchWinnerIndex] = useState(null);

  const [timer, setTimer] = useState(MOVE_TIME);
  const [timeouts, setTimeouts] = useState({ p1: 0, p2: 0 });
  const [timeoutLoser, setTimeoutLoser] = useState(null);

  const [lastMove, setLastMove] = useState(null);
  const [lastCapture, setLastCapture] = useState(null);

  const timerRef = useRef(null);

  const currentPlayerIndex =
    match && typeof match.currentPlayerIndex === "number"
      ? match.currentPlayerIndex
      : 0;

  /* -------------------- TIMER -------------------- */
  useEffect(() => {
    if (matchWinnerIndex !== null) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerIndex, matchWinnerIndex]);

  const handleTimeout = () => {
    if (!match || matchWinnerIndex !== null) return;

    const timedOutIndex = currentPlayerIndex;
    const opponent = timedOutIndex === 0 ? 1 : 0;

    setTimeouts((prev) => {
      const key = timedOutIndex === 0 ? "p1" : "p2";
      const updated = { ...prev, [key]: prev[key] + 1 };
      const count = updated[key];

      if (count >= 3) {
        setMatchWinnerIndex(opponent);
        setWins((w) => {
          const winKey = opponent === 0 ? "p1" : "p2";
          return { ...w, [winKey]: w[winKey] + 1 };
        });
        setTimeoutLoser(timedOutIndex);
        return updated;
      }

      setMatch((prevMatch) => {
        if (!prevMatch) return prevMatch;
        return {
          ...prevMatch,
          currentPlayerIndex:
            prevMatch.currentPlayerIndex === 0 ? 1 : 0
        };
      });
      setTimer(MOVE_TIME);

      return updated;
    });
  };

  /* -------------------- MOVES -------------------- */

  const handleMove = (fromRow, fromCol, toRow, toCol) => {
    if (!match || matchWinnerIndex !== null) return;

    try {
      const result = engineMove(match, {
        fromRow,
        fromCol,
        toRow,
        toCol
      });

      if (!result || !result.nextMatch) {
        return;
      }

      const nextMatch = result.nextMatch;
      setMatch(nextMatch);
      setTimer(MOVE_TIME);
      setLastMove({ fromRow, fromCol, toRow, toCol });

      // capture can be an array now
      const caps = result.event?.capture || null;
      let captureCell = null;
      if (Array.isArray(caps) && caps.length > 0) {
        captureCell = caps[caps.length - 1];
      }
      setLastCapture(captureCell);

      if (result.event && typeof result.event.winner === "number") {
        const winIdx = result.event.winner;
        setMatchWinnerIndex(winIdx);
        setWins((prev) => {
          const key = winIdx === 0 ? "p1" : "p2";
          return { ...prev, [key]: prev[key] + 1 };
        });
      }
    } catch (err) {
      console.error("Checkers engine move failed:", err);
    }
  };

  const handleResetRound = () => {
    const newMatch = createMatch("checkers");
    setMatch(newMatch);
    setTimer(MOVE_TIME);
    setMatchWinnerIndex(null);
    setTimeouts({ p1: 0, p2: 0 });
    setTimeoutLoser(null);
    setLastMove(null);
    setLastCapture(null);
    setRound((r) => r + 1);
  };

  return (
    <div className="checkers-page">
      <div className="checkers-header">
        <h1 className="checkers-title">CHECKERS — TOURNAMENT MATCH</h1>
        <p className="checkers-subtitle">Round {round} • Best of 3</p>
      </div>

      {/* PLAYER CARDS (all info lives here) */}
      <div className="checkers-player-row">
        {/* Player 1 = Red */}
        <div
          className={
            "checkers-player-card " +
            (currentPlayerIndex === 0 && matchWinnerIndex === null
              ? "active"
              : "")
          }
        >
          <div className="checkers-card-top">
            <div className="checkers-player-label">Player 1</div>
            {currentPlayerIndex === 0 && matchWinnerIndex === null && (
              <div className="checkers-player-turn-tag">YOUR TURN</div>
            )}
          </div>

          <div className="checkers-card-middle">
            <div className="checkers-player-wins">
              Wins: <span>{wins.p1}</span>
            </div>
            {currentPlayerIndex === 0 && matchWinnerIndex === null && (
              <div className="checkers-timer-ring">
                <div className="checkers-timer-circle">
                  <span>{timer}</span>
                </div>
              </div>
            )}
          </div>

          <div className="checkers-card-bottom">
            <div className="checkers-player-chip-icon red" />
          </div>
        </div>

        {/* Player 2 = Black */}
        <div
          className={
            "checkers-player-card " +
            (currentPlayerIndex === 1 && matchWinnerIndex === null
              ? "active"
              : "")
          }
        >
          <div className="checkers-card-top">
            <div className="checkers-player-label">Player 2</div>
            {currentPlayerIndex === 1 && matchWinnerIndex === null && (
              <div className="checkers-player-turn-tag">YOUR TURN</div>
            )}
          </div>

          <div className="checkers-card-middle">
            <div className="checkers-player-wins">
              Wins: <span>{wins.p2}</span>
            </div>
            {currentPlayerIndex === 1 && matchWinnerIndex === null && (
              <div className="checkers-timer-ring">
                <div className="checkers-timer-circle">
                  <span>{timer}</span>
                </div>
              </div>
            )}
          </div>

          <div className="checkers-card-bottom">
            <div className="checkers-player-chip-icon black" />
          </div>
        </div>
      </div>

      {/* BOARD */}
      <div className="checkers-board-frame">
  {match && match.game && match.game.board && (
    <CheckersBoard
      board={match.game.board}
      onMove={handleMove}
      lastMove={lastMove}
      lastCapture={lastCapture}
      amIBottom={true}   // 🔥 Perspective locked for local player
    />
  )}
</div>

<ChatBox 
  onSend={(emoji) => {
    console.log("Sent emoji:", emoji);
    // FUTURE: socket.io send here
  }}
/>



      {/* TIMEOUT FORFEIT POPUP */}
      {timeoutLoser !== null && (
        <div className="checkers-modal-backdrop">
          <div className="checkers-modal">
            <h2>Timeout Forfeit</h2>
            <p>
              {timeoutLoser === 0 ? "Player 1 (Red)" : "Player 2 (Black)"} has
              timed out 3 times and forfeits this game.
            </p>
            <button
              className="checkers-modal-btn"
              onClick={handleResetRound}
            >
              Next Round
            </button>
          </div>
        </div>
      )}

      {/* ROUND WIN POPUP (optional future – currently handled by header/button) */}
    </div>
  );
}
