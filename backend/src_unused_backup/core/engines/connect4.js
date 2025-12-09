// backend/src/core/engines/connect4.js

/* ----------------- helpers ----------------- */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ======================================================
   =============== CONNECT 4 ENGINE =====================
   ====================================================== */

const C4_ROWS = 6;
const C4_COLS = 7;

export function createState() {
  return {
    board: Array.from({ length: C4_ROWS }, () =>
      Array.from({ length: C4_COLS }, () => null)
    ),
    winnerCells: []
  };
}

function getValidConnect4Columns(board) {
  const cols = [];
  for (let c = 0; c < C4_COLS; c++) {
    if (board[0][c] === null) cols.push(c);
  }
  return cols;
}

function checkConnect4Win(board, row, col, player) {
  const dirs = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diag down-right
    [1, -1]   // diag down-left
  ];

  for (const [dr, dc] of dirs) {
    let cells = [[row, col]];

    // forward
    let r = row + dr;
    let c = col + dc;
    while (
      r >= 0 &&
      r < C4_ROWS &&
      c >= 0 &&
      c < C4_COLS &&
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
      r < C4_ROWS &&
      c >= 0 &&
      c < C4_COLS &&
      board[r][c] === player
    ) {
      cells.push([r, c]);
      r -= dr;
      c -= dc;
    }

    if (cells.length >= 4) {
      // can be 4,5,6,7 in a row – return all
      return cells;
    }
  }

  return null;
}

export function applyMove(match, move) {
  const next = clone(match);
  const board = next.game.board;
  const col = move.col;

  let placedRow = -1;
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      board[r][col] = next.currentPlayerIndex;
      placedRow = r;
      break;
    }
  }
  if (placedRow === -1) {
    return { error: "column-full" };
  }

  const playerIndex = next.currentPlayerIndex;
  const winCells = checkConnect4Win(board, placedRow, col, playerIndex);

  let event = {
    type: "move",
    gameType: "connect4",
    playerId: next.players[playerIndex].id,
    col,
    row: placedRow,
    winnerCells: []
  };

  if (winCells) {
    next.status = "finished";
    next.winnerId = next.players[playerIndex].id;
    next.game.winnerCells = winCells;
    event.type = "win";
    event.winnerCells = winCells;
  } else if (getValidConnect4Columns(board).length === 0) {
    next.status = "finished";
    next.winnerId = null;
    event.type = "draw";
  } else {
    next.currentPlayerIndex = next.currentPlayerIndex === 0 ? 1 : 0;
  }

  next.history.push(event);
  return { nextMatch: next, event };
}

export function demoMove(match) {
  const board = match.game.board;
  const cols = getValidConnect4Columns(board);
  if (!cols.length) {
    return { nextMatch: match, event: { type: "no-move" } };
  }
  const col = cols[Math.floor(Math.random() * cols.length)];
  return applyMove(match, { col });
}
