// src/components/Connect4Board.jsx
import React from "react";
import { motion } from "framer-motion";

export default function Connect4Board({
  board,
  winnerCells = [],
  isFinished = false,
  onColumnClick = null,
}) {
  if (!board?.length) return null;

  const rows = board.length;
  const cols = board[0].length;

  const isWinnerCell = (r, c) =>
    winnerCells.some(([wr, wc]) => wr === r && wc === c);

  const handleClick = (col) => {
    if (isFinished) return;
    if (typeof onColumnClick === "function") onColumnClick(col);
  };

  return (
    <div
      style={{
        width: cols * 60,
        height: rows * 60,
        padding: 12,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 8,
        borderRadius: 16,
        background: "rgba(0,0,0,0.3)",
        border: "3px solid #0ff3",
        boxShadow: "0 0 10px #0ff4, inset 0 0 8px #0ff2",
        margin: "0 auto",
      }}
    >
      {board.flat().map((cell, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;

        const chipColor = cell === 0 ? "yellow" : "red";
        const winning = isWinnerCell(r, c);

        return (
          <div
            key={idx}
            onClick={() => handleClick(c)}
            style={{
              background:
                "radial-gradient(circle at 50% 50%, #000 40%, #002 100%)",
              borderRadius: 12,
              border: "2px solid #022",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: !isFinished ? "pointer" : "default",
            }}
          >
            {cell !== null && (
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: "80%",
                  height: "80%",
                  borderRadius: "50%",
                  background:
                    chipColor === "red"
                      ? "radial-gradient(circle, #ff4444, #a00000)"
                      : "radial-gradient(circle, #ffee55, #bb9900)",
                  boxShadow: winning
                    ? `0 0 16px ${
                        chipColor === "red" ? "#ff4444" : "#ffee55"
                      }`
                    : "0 0 4px #0008",
                  filter: winning ? "brightness(1.4)" : "brightness(0.75)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
