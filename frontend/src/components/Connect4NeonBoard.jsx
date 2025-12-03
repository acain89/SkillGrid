// src/components/Connect4NeonBoard.jsx

import React from "react";
import "../pages/connect4Neon.css";

export default function Connect4NeonBoard({
  board,
  onMove,
  canMove,
  winningCells,
  lastMovePos
}) {
  const handleColumn = (col) => {
    if (!canMove) return;
    onMove(col);
  };

  return (
    <div className="c4-grid">
      {board[0].map((_, col) => (
        <div
          key={col}
          className="c4-col"
          onClick={() => handleColumn(col)}
        >
          {[...board].reverse().map((row, r) => {
            const realRow = board.length - 1 - r;
            const cell = board[realRow][col];

            const isWinCell =
              winningCells &&
              winningCells.some(([wr, wc]) => wr === realRow && wc === col);

            const isLastMove =
              lastMovePos &&
              lastMovePos.row === realRow &&
              lastMovePos.col === col;

            // 🔥 FIX: map engine values 0/1 → CSS classes p1/p2
            let colorClass = "";
            if (cell === 0) colorClass = "p1";
            if (cell === 1) colorClass = "p2";

            return (
              <div
                key={realRow}
                className={`c4-cell ${isWinCell ? "win-cell" : ""}`}
              >
                {cell !== null && (
                  <div
                    className={`chip ${colorClass} ${
                      isLastMove ? "falling" : ""
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
