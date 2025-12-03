// backend/src/core/engines/checkers.js

/* ----------------- helpers ----------------- */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ======================================================
   ==================== CHECKERS ========================
   ====================================================== */

const CH_ROWS = 8;
const CH_COLS = 8;

export function createState() {
  const board = Array.from({ length: CH_ROWS }, () =>
    Array.from({ length: CH_COLS }, () => ".")
  );

  // Top player (player 1 = b)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < CH_COLS; c++) {
      if ((r + c) % 2 === 1) board[r][c] = "b";
    }
  }

  // Bottom player (player 0 = r)
  for (let r = CH_ROWS - 3; r < CH_ROWS; r++) {
    for (let c = 0; c < CH_COLS; c++) {
      if ((r + c) % 2 === 1) board[r][c] = "r";
    }
  }

  return { board };
}

function isDarkSquare(r, c) {
  return (r + c) % 2 === 1;
}

function isKing(p) {
  return p === "R" || p === "B";
}

function belongsToPlayer(piece, playerIndex) {
  if (!piece || piece === ".") return false;
  if (playerIndex === 0) return piece === "r" || piece === "R";
  return piece === "b" || piece === "B";
}

function directionForPlayer(playerIndex) {
  return playerIndex === 0 ? -1 : +1;
}

function getNormalMoves(board, r, c, piece, playerIndex) {
  const moves = [];
  const dirs = [];

  if (isKing(piece)) {
    dirs.push([-1, -1], [-1, +1], [+1, -1], [+1, +1]);
  } else {
    const d = directionForPlayer(playerIndex);
    dirs.push([d, -1], [d, +1]);
  }

  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (
      nr >= 0 &&
      nr < CH_ROWS &&
      nc >= 0 &&
      nc < CH_COLS &&
      isDarkSquare(nr, nc) &&
      board[nr][nc] === "."
    ) {
      moves.push({ toRow: nr, toCol: nc });
    }
  }

  return moves;
}

function getJumpMoves(board, r, c, piece, playerIndex) {
  const jumps = [];
  const dirs = [];

  if (isKing(piece)) {
    dirs.push([-1, -1], [-1, +1], [+1, -1], [+1, +1]);
  } else {
    const d = directionForPlayer(playerIndex);
    dirs.push([d, -1], [d, +1]);
  }

  for (const [dr, dc] of dirs) {
    const midR = r + dr;
    const midC = c + dc;
    const landR = r + 2 * dr;
    const landC = r + 2 * dc;

    if (
      midR < 0 ||
      midR >= CH_ROWS ||
      midC < 0 ||
      midC >= CH_COLS ||
      landR < 0 ||
      landR >= CH_ROWS ||
      landC < 0 ||
      landC >= CH_COLS
    ) {
      continue;
    }

    if (!isDarkSquare(landR, landC)) continue;

    const middle = board[midR][midC];
    const landing = board[landR][landC];

    if (
      middle !== "." &&
      !belongsToPlayer(middle, playerIndex) &&
      landing === "."
    ) {
      jumps.push({
        capture: { r: midR, c: midC },
        toRow: landR,
        toCol: landC
      });
    }
  }

  return jumps;
}

export function applyMove(match, move) {
  const next = clone(match);
  const board = next.game.board;

  const { fromRow, fromCol, toRow, toCol } = move ?? {};
  const player = next.currentPlayerIndex;

  const ints = [fromRow, fromCol, toRow, toCol];
  if (!ints.every((n) => Number.isInteger(n))) {
    return { error: "invalid-coords" };
  }

  if (
    fromRow < 0 ||
    fromRow >= CH_ROWS ||
    fromCol < 0 ||
    fromCol >= CH_COLS ||
    toRow < 0 ||
    toRow >= CH_ROWS ||
    toCol < 0 ||
    toCol >= CH_COLS
  ) {
    return { error: "out-of-bounds" };
  }

  const piece = board[fromRow]?.[fromCol];
  if (!belongsToPlayer(piece, player)) return { error: "wrong-piece" };
  if (!isDarkSquare(toRow, toCol)) return { error: "light-square" };

  const normalMoves = getNormalMoves(board, fromRow, fromCol, piece, player);
  const jumpMoves = getJumpMoves(board, fromRow, fromCol, piece, player);

  let isJump = false;
  let captured = null;

  for (const j of jumpMoves) {
    if (j.toRow === toRow && j.toCol === toCol) {
      isJump = true;
      captured = j.capture;
      break;
    }
  }

  if (!isJump) {
    let ok = false;
    for (const m of normalMoves) {
      if (m.toRow === toRow && m.toCol === toCol) ok = true;
    }
    if (!ok) return { error: "illegal-move" };
  }

  if (board[toRow]?.[toCol] !== ".") return { error: "occupied" };

  board[fromRow][fromCol] = ".";
  board[toRow][toCol] = piece;

  if (isJump && captured) {
    const { r, c } = captured;
    board[r][c] = ".";
  }

  if (piece === "r" && toRow === 0) board[toRow][toCol] = "R";
  if (piece === "b" && toRow === CH_ROWS - 1) board[toRow][toCol] = "B";

  const event = {
    type: "checkers-move",
    fromRow,
    fromCol,
    toRow,
    toCol,
    isJump,
    captured: captured || null,
    moreJumpsAvailable: false
  };

  if (isJump) {
    const newPiece = board[toRow][toCol];
    const more = getJumpMoves(board, toRow, toCol, newPiece, player);

    if (more.length > 0) {
      event.moreJumpsAvailable = true;
    } else {
      next.currentPlayerIndex = player === 0 ? 1 : 0;
    }
  } else {
    next.currentPlayerIndex = player === 0 ? 1 : 0;
  }

  next.history.push(event);
  return { nextMatch: next, event };
}

export function demoMove(match) {
  // No random AI for checkers yet – just no-op
  return { nextMatch: match, event: { type: "no-op" } };
}
