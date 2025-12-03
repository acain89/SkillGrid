// src/components/GridTrapBoard.jsx
import React from "react";
import "../pages/gridTrap.css";

import { CELL_TYPE, PLAYER } from "../core/engines/gridTrap";

function RobotIcon({ player }) {
  const stroke = player === PLAYER.A ? "#f97316" : "#60a5fa";
  const glow = player === PLAYER.A ? "gt-robot--orange" : "gt-robot--blue";

  return (
    <svg
      className={`gt-robot ${glow}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="13" y="8" width="14" height="10" rx="3" />
        <circle cx="18" cy="13" r="1.4" />
        <circle cx="22" cy="13" r="1.4" />
        <rect x="11" y="18" width="18" height="11" rx="3" />
        <line x1="20" y1="6" x2="20" y2="8" />
        <circle cx="20" cy="5" r="1.4" />
        <rect x="14" y="29" width="12" height="4" rx="2" />
      </g>
    </svg>
  );
}

export default function GridTrapBoard({
  match,
  phase,
  selectableMoves,
  selectableBlocks,
  onCellClick,
}) {
  const board = match.board;

  const moveKeySet = new Set(selectableMoves.map((m) => `${m.row},${m.col}`));
  const blockKeySet = new Set(selectableBlocks.map((b) => `${b.row},${b.col}`));

  return (
    <div className="gridtrap-board">
      {board.map((row, r) =>
        row.map((cell, c) => {
          const k = `${r},${c}`;
          const isMoveHighlight = moveKeySet.has(k);
          const isBlockHighlight = blockKeySet.has(k);

          let className = "gt-cell";

          if (cell.type === CELL_TYPE.BLOCKED) {
            className += " gt-cell--blocked";

            if (cell.blockedBy === "STATIC") {
              className += " gt-cell--blocked-static";
            } else if (cell.blockedBy === PLAYER.A) {
              className += " gt-cell--blocked-A";
            } else if (cell.blockedBy === PLAYER.B) {
              className += " gt-cell--blocked-B";
            }
          } else {
            className += " gt-cell--empty";
          }

          if (cell.occupant === PLAYER.A) {
            className += " gt-cell--playerA";
          } else if (cell.occupant === PLAYER.B) {
            className += " gt-cell--playerB";
          }

          if (phase === "move" && isMoveHighlight) {
            className += " gt-cell--highlight-move";
          }

          if (phase === "block" && isBlockHighlight) {
            className += " gt-cell--highlight-block";
          }

          return (
            <button
              key={k}
              className={className}
              onClick={() => onCellClick(r, c)}
            >
              {cell.occupant && <RobotIcon player={cell.occupant} />}
            </button>
          );
        })
      )}
    </div>
  );
}
