// src/pages/GridTrap.jsx
import React, { useEffect, useMemo, useState } from "react";
import GridTrapBoard from "../components/GridTrapBoard";
import GridTrapPlayerCard from "../components/GridTrapPlayerCard";
import {
  createGridTrapMatch,
  getLegalMoves,
  getLegalBlocks,
  applyGridTrapTurn,
  PLAYER,
} from "../core/engines/gridTrap";
import "./gridTrap.css";
import ChatBox from "../components/ChatBox.jsx";


export default function GridTrap() {
  const [match, setMatch] = useState(() => createGridTrapMatch());
  const [phase, setPhase] = useState("move"); // "move" | "block"
  const [selectedMove, setSelectedMove] = useState(null);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  // simple session wins tracker
  const [wins, setWins] = useState({ [PLAYER.A]: 0, [PLAYER.B]: 0 });

  const selectableMoves = useMemo(
    () =>
      phase === "move" && !match.winner
        ? getLegalMoves(match, match.currentPlayer)
        : [],
    [match, phase]
  );

  const selectableBlocks = useMemo(
    () =>
      phase === "block" && !match.winner
        ? getLegalBlocks(match, match.currentPlayer)
        : [],
    [match, phase]
  );

  // When a winner appears, bump wins once
  useEffect(() => {
    if (!match.winner) return;
    setWins((prev) => ({
      ...prev,
      [match.winner]: (prev[match.winner] || 0) + 1,
    }));
  }, [match.winner]);

  function handleCellClick(row, col) {
    if (match.winner) return;

    if (phase === "move") {
      const isLegal = selectableMoves.some(
        (m) => m.row === row && m.col === col
      );
      if (!isLegal) {
        setError("Illegal move.");
        return;
      }
      setSelectedMove({ row, col });
      setPhase("block");
      setError("");
      return;
    }

    if (phase === "block") {
      const isLegal = selectableBlocks.some(
        (b) => b.row === row && b.col === col
      );
      if (!isLegal) {
        setError("Illegal block.");
        return;
      }

      try {
        const next = applyGridTrapTurn(match, {
          moveTo: selectedMove,
          blockAt: { row, col },
        });
        setMatch(next);
        setSelectedMove(null);
        setPhase("move");
        setError("");
      } catch (e) {
        console.error(e);
        setError(e.message || "Invalid turn.");
      }
    }
  }

  function handleResetBoard() {
    setMatch(createGridTrapMatch());
    setPhase("move");
    setSelectedMove(null);
    setError("");
  }

  function handleResetWins() {
    setWins({ [PLAYER.A]: 0, [PLAYER.B]: 0 });
  }

  const statusText = (() => {
    if (match.winner) {
      return `Player ${match.winner} wins! ${
        match.winReason ? `(${match.winReason})` : ""
      }`;
    }
    return `Player ${match.currentPlayer}'s turn — ${
      phase === "move" ? "select a move" : "select a block"
    }`;
  })();

  const blocksPlacedA = match.blockedByPlayer[PLAYER.A].length;
  const blocksPlacedB = match.blockedByPlayer[PLAYER.B].length;

  return (
    <div className="gridtrap-page">
      <div className="gridtrap-header">
        <h1>GRID-TRAP</h1>
        <p className="gridtrap-subtitle">
          Neon maze duel. Start in the center. Trap your opponent in the grid.
        </p>
      </div>

      <div className="gridtrap-layout">
        {/* Left player card */}
        <GridTrapPlayerCard
          player={PLAYER.A}
          isActive={!match.winner && match.currentPlayer === PLAYER.A}
          wins={wins[PLAYER.A]}
          tokens={0}
          blocksPlaced={blocksPlacedA}
        />

        {/* Center board */}
        <div className="gridtrap-center">
          <GridTrapBoard
            match={match}
            phase={phase}
            selectableMoves={selectableMoves}
            selectableBlocks={selectableBlocks}
            onCellClick={handleCellClick}
          />
        </div>

<ChatBox 
  onSend={(emoji) => {
    console.log("Sent emoji:", emoji);
    // FUTURE: socket.io send here
  }}
/>


        {/* Right player + controls */}
        <div className="gridtrap-right">
          <GridTrapPlayerCard
            player={PLAYER.B}
            isActive={!match.winner && match.currentPlayer === PLAYER.B}
            wins={wins[PLAYER.B]}
            tokens={0}
            blocksPlaced={blocksPlacedB}
          />

          <div className="gridtrap-controls">
            <div className="gridtrap-status">{statusText}</div>

            {error && <div className="gridtrap-error">{error}</div>}

            <div className="gridtrap-buttons">
              <button className="gridtrap-btn" onClick={handleResetBoard}>
                New Game
              </button>
              <button
                className="gridtrap-btn gridtrap-btn--secondary"
                onClick={handleResetWins}
              >
                Reset Wins
              </button>
              <button
                className="gridtrap-btn gridtrap-btn--ghost"
                onClick={() => setShowRules(true)}
              >
                Rules
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sliding rules panel */}
      <div
        className={
          showRules
            ? "gridtrap-rules-panel gridtrap-rules-panel--open"
            : "gridtrap-rules-panel"
        }
      >
        <div className="gridtrap-rules-header">
          <h2>Grid-Trap Rules</h2>
          <button
            className="gridtrap-rules-close"
            onClick={() => setShowRules(false)}
          >
            ✕
          </button>
        </div>
        <div className="gridtrap-rules-body">
          <p>
            <strong>Objective:</strong> Trap your opponent so they have no legal
            moves left.
          </p>
          <ul>
            <li>
              The board is 9×9. Both robots start in the center, side by side.
            </li>
            <li>
              At the start of each game, 15–20 static wall tiles appear randomly
              in the outer rows and columns.
            </li>
            <li>
              On your turn, first move your robot 1 square (up, down, left, or
              right) onto an empty tile.
            </li>
            <li>
              Then place 1 block on any empty tile. Your first block can be
              anywhere.
            </li>
            <li>
              After your first block, new blocks must be placed orthogonally
              adjacent to one of your existing blocks (your chain spreads).
            </li>
            <li>
              You cannot move onto walls, blocked tiles, or the opponent&apos;s
              tile.
            </li>
            <li>If you begin your turn with no legal moves, you lose.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
