// frontend/src/components/CheckersBoard.jsx
import React, { useMemo, useState } from "react";

const SIZE = 8;

function inBounds(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function decodePiece(cell) {
  if (!cell) return null;
  return {
    isRed: cell.player === 0,
    isBlack: cell.player === 1,
    isKing: !!cell.king
  };
}

/* ============================================================
   Compute moves (unchanged)
   ============================================================ */
function computePossibleMoves(board, row, col) {
  const cell = board[row][col];
  const pieceInfo = decodePiece(cell);
  if (!pieceInfo) return [];

  const { isRed, isBlack, isKing } = pieceInfo;
  const directions = [];

  if (isKing) directions.push(-1, 1);
  else if (isRed) directions.push(-1);
  else if (isBlack) directions.push(1);

  const moves = [];
  const seen = new Set();
  const destKey = (r, c) => `${r},${c}`;

  // simple moves
  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const nr = row + dr;
      const nc = col + dc;
      if (inBounds(nr, nc) && board[nr][nc] == null) {
        const key = destKey(nr, nc);
        if (!seen.has(key)) {
          seen.add(key);
          moves.push({ row: nr, col: nc });
        }
      }
    }
  }

  // recursive jump exploration
  function exploreJump(cr, cc, curBoard) {
    for (const dr of directions) {
      for (const dc of [-1, 1]) {
        const midR = cr + dr;
        const midC = cc + dc;
        const destR = cr + 2 * dr;
        const destC = cc + 2 * dc;

        if (!inBounds(midR, midC) || !inBounds(destR, destC)) continue;

        const midCell = curBoard[midR][midC];
        const destCell = curBoard[destR][destC];

        if (
          midCell &&
          midCell.player !== board[row][col].player &&
          destCell == null
        ) {
          const cloned = curBoard.map((row) => row.slice());
          cloned[cr][cc] = null;
          cloned[midR][midC] = null;
          cloned[destR][destC] = cell;

          const key = destKey(destR, destC);
          if (!seen.has(key)) {
            seen.add(key);
            moves.push({ row: destR, col: destC });
          }

          exploreJump(destR, destC, cloned);
        }
      }
    }
  }

  exploreJump(row, col, board);
  return moves;
}

/* ============================================================
   MAIN COMPONENT — Now perspective-aware
   ============================================================ */
export default function CheckersBoard({
  board,
  onMove,
  lastMove,
  lastCapture,
  amIBottom = true   // 🔥 NEW — perspective toggle
}) {
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(false);

  if (!board) return null;

  /* ------------------------------------------------------------
     🔥 1. Create *displayBoard* (flipped if I'm top)
     ------------------------------------------------------------ */
  const displayBoard = amIBottom
    ? board
    : board.slice().map((r) => r.slice()).reverse().map((r) => r.reverse());

  /* ------------------------------------------------------------
     Helper: convert display coords back to real board coords
     ------------------------------------------------------------ */
  const toRealCoords = (row, col) => {
    if (amIBottom) return { r: row, c: col };
    return {
      r: SIZE - 1 - row,
      c: SIZE - 1 - col
    };
  };

  /* ------------------------------------------------------------
     Possible move calculation (must use REAL coords)
     ------------------------------------------------------------ */
  const possibleMoves = useMemo(() => {
    if (!selected) return [];

    const { r, c } = toRealCoords(selected.row, selected.col);
    return computePossibleMoves(board, r, c);
  }, [board, selected, amIBottom]);

  const isMoveTarget = (row, col) => {
    const { r, c } = toRealCoords(row, col);
    return possibleMoves.some((m) => m.row === r && m.col === c);
  };

  /* ------------------------------------------------------------
     Tile click — convert coords back before calling onMove()
     ------------------------------------------------------------ */
  const handleTileClick = (row, col) => {
    const { r, c } = toRealCoords(row, col);
    const cell = board[r][c];

    if (selected && selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }

    if (selected && isMoveTarget(row, col)) {
      const fromReal = toRealCoords(selected.row, selected.col);
      onMove(fromReal.r, fromReal.c, r, c);
      setSelected(null);
      return;
    }

    if (cell) {
      setSelected({ row, col });
      return;
    }

    if (selected && !isMoveTarget(row, col)) {
      setShake(true);
      setTimeout(() => setShake(false), 150);
    }

    setSelected(null);
  };

  const isLastMoved = (row, col) => {
    if (!lastMove) return false;
    const { r, c } = toRealCoords(row, col);
    return lastMove.toRow === r && lastMove.toCol === c;
  };

  const isLastCapture = (row, col) => {
    if (!lastCapture) return false;
    const { r, c } = toRealCoords(row, col);
    return lastCapture.r === r && lastCapture.c === c;
  };

  /* ------------------------------------------------------------
     RENDER (same JSX, but uses displayBoard)
     ------------------------------------------------------------ */
  return (
    <div className={"checkers-board" + (shake ? " shake" : "")}>
      {displayBoard.map((rowArr, rowIdx) => (
        <div className="checkers-row" key={rowIdx}>
          {rowArr.map((cell, colIdx) => {
            const isDark = (rowIdx + colIdx) % 2 === 1;
            const isSelected =
              selected &&
              selected.row === rowIdx &&
              selected.col === colIdx;

            const moveTarget = isMoveTarget(rowIdx, colIdx);
            const { r: realR, c: realC } = toRealCoords(rowIdx, colIdx);

            const pieceInfo = decodePiece(board[realR][realC]);
            let pieceClass = "piece";
            if (pieceInfo?.isRed) pieceClass += " piece-red";
            if (pieceInfo?.isBlack) pieceClass += " piece-black";
            if (pieceInfo?.isKing) pieceClass += " piece-king";
            if (isLastMoved(rowIdx, colIdx)) pieceClass += " piece-last-move";

            return (
              <div
                key={colIdx}
                className={
                  "checkers-tile " +
                  (isDark ? "tile-dark" : "tile-light") +
                  (isSelected ? " tile-selected" : "") +
                  (moveTarget ? " tile-move-target" : "") +
                  (isLastCapture(rowIdx, colIdx)
                    ? " tile-capture-flash"
                    : "")
                }
                onClick={() => handleTileClick(rowIdx, colIdx)}
              >
                {moveTarget && <div className="move-target-outline" />}
                {isSelected && <div className="selected-outline" />}

                {pieceInfo && (
                  <div className={pieceClass}>
                    {pieceInfo?.isKing && (
                      <span className="piece-king-label">K</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
