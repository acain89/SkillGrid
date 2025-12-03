// src/core/engines/connect4.js

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const ROWS = 6;
const COLS = 7;

export function createState() {
  return {
    board: Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => null)
    ),
    winnerCells: [],
    history: []
  };
}

function getValidColumns(board) {
  const valid = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) valid.push(c);
  }
  return valid;
}

function checkWin(board, row, col, player) {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [dr, dc] of dirs) {
    const cells = [[row, col]];

    // forward
    let r = row + dr;
    let c = col + dc;
    while (
      r >= 0 &&
      r < ROWS &&
      c >= 0 &&
      c < COLS &&
      board[r][c] === player
    ) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }

    // backward
    r = row - dr;
    c = col - dc;
    while (
      r >= 0 &&
      r < ROWS &&
      c >= 0 &&
      c < COLS &&
      board[r][c] === player
    ) {
      cells.push([r, c]);
      r -= dr;
      c -= dc;
    }

    if (cells.length >= 4) return cells;
  }

  return null;
}

export function applyMove(match, move) {
  const next = clone(match);
  const board = next.game.board;

  /* ---------------- TIMEOUT TURN FORFEIT ---------------- */
  if (move.timeout === true) {
    next.currentPlayerIndex = next.currentPlayerIndex === 0 ? 1 : 0;

    return {
      nextMatch: next,
      event: { type: "timeout-skip" }
    };
  }

  /* ---------------- NORMAL MOVE ---------------- */
  const col = move.col;
  let placedRow = -1;

  // gravity (bottom-up)
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      board[r][col] = next.currentPlayerIndex;
      placedRow = r;
      break;
    }
  }

  if (placedRow === -1) {
    return {
      nextMatch: match,
      event: { type: "column-full", col }
    };
  }

  const player = next.currentPlayerIndex;
  const win = checkWin(board, placedRow, col, player);

  let event = {
    type: "move",
    row: placedRow,
    col
  };

  /* ---------------- WIN ---------------- */
  if (win) {
    next.status = "finished";
    next.game.winnerCells = win;

    event.type = "win";
    event.winnerCells = win;
  }

  /* ---------------- DRAW ---------------- */
  else if (getValidColumns(board).length === 0) {
    next.status = "finished";
    event.type = "draw";
  }

  /* ---------------- SWITCH TURN ---------------- */
  else {
    next.currentPlayerIndex = player === 0 ? 1 : 0;
  }

  /* ---------------- CLEAN + RETURN ---------------- */
  next.history = [...next.history, event];
  return { nextMatch: next, event };
}
