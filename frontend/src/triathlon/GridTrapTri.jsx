// src/triathlon/GridTrapTri.jsx

import React, { useMemo, useState, useEffect } from "react";
import GridTrapBoard from "../components/GridTrapBoard";
import GridTrapPlayerCard from "../components/GridTrapPlayerCard";

import {
  createGridTrapMatch,
  getLegalMoves,
  getLegalBlocks,
  applyGridTrapTurn,
  PLAYER,
} from "../core/engines/gridTrap";

import "../pages/gridTrap.css";

export default function GridTrapTri({ onMatchComplete }) {
  const [match, setMatch] = useState(() => createGridTrapMatch());
  const [phase, setPhase] = useState("move");
  const [selectedMove, setSelectedMove] = useState(null);
  const [error, setError] = useState("");

  // track wins internally but not used for triathlon result
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

  /* AUTO-TRIGGER TRATHLON CALLBACK */
  useEffect(() => {
    if (!match.winner) return;

    setWins((prev) => ({
      ...prev,
      [match.winner]: (prev[match.winner] || 0) + 1,
    }));

    setTimeout(() => {
      onMatchComplete && onMatchComplete(match.winner === PLAYER.A ? 0 : 1);
    }, 1300);
  }, [match.winner]);

  /* ---------------- MOVE CLICK ---------------- */
  function handleCellClick(row, col) {
    if (match.winner) return;

    if (phase === "move") {
      const legal = selectableMoves.some(
        (m) => m.row === row && m.col === col
      );
      if (!legal) {
        setError("Illegal move.");
        return;
      }
      setSelectedMove({ row, col });
      setPhase("block");
      setError("");
      return;
    }

    if (phase === "block") {
      const legal = selectableBlocks.some(
        (b) => b.row === row && b.col === col
      );
      if (!legal) {
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

  return (
    <div className="gridtrap-page">
      <div className="gridtrap-header">
        <h1>GRID-TRAP</h1>
        <p className="gridtrap-subtitle">
          Neon maze duel. Trap your opponent.
        </p>
      </div>

      <div className="gridtrap-layout">
        {/* Player A */}
        <GridTrapPlayerCard
          player={PLAYER.A}
          isActive={!match.winner && match.currentPlayer === PLAYER.A}
          wins={wins[PLAYER.A]}
          tokens={0}
          blocksPlaced={match.blockedByPlayer[PLAYER.A].length}
        />

        {/* Board */}
        <div className="gridtrap-center">
          <GridTrapBoard
            match={match}
            phase={phase}
            selectableMoves={selectableMoves}
            selectableBlocks={selectableBlocks}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Player B */}
        <GridTrapPlayerCard
          player={PLAYER.B}
          isActive={!match.winner && match.currentPlayer === PLAYER.B}
          wins={wins[PLAYER.B]}
          tokens={0}
          blocksPlaced={match.blockedByPlayer[PLAYER.B].length}
        />
      </div>

      {error && <div className="gridtrap-error">{error}</div>}
    </div>
  );
}
