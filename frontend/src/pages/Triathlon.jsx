// src/pages/Triathlon.jsx
import React, { useEffect, useState } from "react";
import {
  createTriMatch,
  recordRoundResult,
  getCurrentGame,
  getStartingPlayerForCurrentRound,
  TRI_GAMES,
  PLAYER,
} from "../core/triathlonEngine";
import "./triathlon.css";

const GAME_LABELS = {
  connect4: "Connect 4",
  checkers: "Checkers",
  gridtrap: "Grid-Trap",
};

export default function Triathlon() {
  const [tri, setTri] = useState(() => createTriMatch(PLAYER.A));
  const [phase, setPhase] = useState("playing"); // "playing" | "betweenGames" | "finished"
  const [countdown, setCountdown] = useState(0);

  // Start a fresh tri-match
  function resetTri() {
    setTri(createTriMatch(PLAYER.A));
    setPhase("playing");
    setCountdown(0);
  }

  function handleRoundWin(winner) {
    if (phase !== "playing") return;
    const { next, gameJustCompleted, triFinished } = recordRoundResult(
      tri,
      winner
    );
    setTri(next);

    if (triFinished) {
      setPhase("finished");
      setCountdown(0);
      return;
    }

    if (gameJustCompleted) {
      // Enter between-games phase with 20-second timer
      setPhase("betweenGames");
      setCountdown(20);
    }
  }

  // Between-games 20-second countdown
  useEffect(() => {
    if (phase !== "betweenGames") return;
    if (countdown <= 0) {
      setPhase("playing");
      return;
    }

    const id = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [phase, countdown]);

  const currentGame = getCurrentGame(tri);
  const startingPlayer = getStartingPlayerForCurrentRound(tri);

  const triStatus = tri.triFinished
    ? `Triathlon winner: Player ${tri.triWinner}`
    : `Games won — A: ${tri.gamesWonA}  •  B: ${tri.gamesWonB}`;

  const betweenLabel =
    phase === "betweenGames" && currentGame
      ? `${GAME_LABELS[currentGame.id]} starts in ${countdown}…`
      : "";

  return (
    <div className="tri-page">
      <header className="tri-header">
        <h1>SKILLGRID TRIATHLON</h1>
        <p>Best-of-3 in Connect 4, Checkers, and Grid-Trap. Win 2 games to win the match.</p>
      </header>

      <main className="tri-main">
        {/* LEFT: overall scoreboard */}
        <section className="tri-panel tri-panel--left">
          <h2>Match Score</h2>
          <div className="tri-status">{triStatus}</div>

          <div className="tri-games-table">
            {tri.games.map((g, idx) => (
              <div
                key={g.id}
                className={
                  "tri-game-row" +
                  (idx === tri.currentGameIndex ? " tri-game-row--active" : "") +
                  (g.completed ? " tri-game-row--done" : "")
                }
              >
                <div className="tri-game-name">
                  {idx + 1}. {GAME_LABELS[g.id]}
                </div>
                <div className="tri-game-score">
                  A {g.winsA} – {g.winsB} B
                  {g.completed && g.gameWinner && (
                    <span className="tri-game-winner-tag">
                      Winner: {g.gameWinner}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="tri-btn tri-btn--secondary" onClick={resetTri}>
            Reset Triathlon (dev)
          </button>
        </section>

        {/* CENTER: placeholder for active game area */}
        <section className="tri-panel tri-panel--center">
          {tri.triFinished ? (
            <div className="tri-finished">
              <div className="tri-finished-title">
                Player {tri.triWinner} wins the SkillGrid Triathlon!
              </div>
              <p className="tri-finished-sub">
                Connect 4, Checkers, and Grid-Trap combined.
              </p>
            </div>
          ) : (
            <>
              <div className="tri-current-game-label">
                {currentGame
                  ? `Current game: ${GAME_LABELS[currentGame.id]} (Round ${tri.currentRound} of up to 3)`
                  : "All games completed"}
              </div>
              <div className="tri-starting-player">
                Starting player this round: <strong>{startingPlayer}</strong>
              </div>

              {/* For now: dev controls to simulate who wins a round.
                  Later, this section will host the actual game components
                  which call handleRoundWin("A" or "B") when a round ends. */}
              <div className="tri-dev-controls">
                <div className="tri-dev-title">Dev Controls (temporary)</div>
                <p className="tri-dev-text">
                  Click below to record who won the current round. This lets you
                  test triathlon flow, scoring, and countdowns before wiring in
                  the real games.
                </p>
                <div className="tri-dev-buttons">
                  <button
                    className="tri-btn tri-btn--playerA"
                    onClick={() => handleRoundWin(PLAYER.A)}
                    disabled={phase !== "playing"}
                  >
                    Player A wins round
                  </button>
                  <button
                    className="tri-btn tri-btn--playerB"
                    onClick={() => handleRoundWin(PLAYER.B)}
                    disabled={phase !== "playing"}
                  >
                    Player B wins round
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* RIGHT: between-games countdown */}
        <section className="tri-panel tri-panel--right">
          <h2>Next Game</h2>
          {phase === "betweenGames" ? (
            <div className="tri-countdown">
              <div className="tri-countdown-label">Transition</div>
              <div className="tri-countdown-main">{betweenLabel}</div>
            </div>
          ) : tri.triFinished ? (
            <div className="tri-countdown tri-countdown--idle">
              Triathlon completed.
            </div>
          ) : (
            <div className="tri-countdown tri-countdown--idle">
              Playing {currentGame && GAME_LABELS[currentGame.id]}…
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
