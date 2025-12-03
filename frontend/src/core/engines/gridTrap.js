// src/core/engines/gridTrap.js

export const GRIDTRAP_SIZE = 9;

export const CELL_TYPE = {
  EMPTY: "EMPTY",
  BLOCKED: "BLOCKED",
};

export const PLAYER = {
  A: "A",
  B: "B",
};

// ---------- helpers ----------

function inBounds(row, col) {
  return row >= 0 && row < GRIDTRAP_SIZE && col >= 0 && col < GRIDTRAP_SIZE;
}

function key(row, col) {
  return `${row},${col}`;
}

export function neighbors4(row, col) {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];
}

function createEmptyBoard() {
  const board = [];
  for (let r = 0; r < GRIDTRAP_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRIDTRAP_SIZE; c++) {
      row.push({
        type: CELL_TYPE.EMPTY,
        occupant: null,   // "A" | "B"
        blockedBy: null,  // "A" | "B" | "STATIC"
      });
    }
    board.push(row);
  }
  return board;
}

/**
 * Static walls only in the outer ring:
 * rows 0–2 and 6–8, cols 0–2 and 6–8.
 * Never on the player start tiles.
 */
function generateStaticWalls(positions) {
  const candidates = [];

  for (let r = 0; r < GRIDTRAP_SIZE; r++) {
    for (let c = 0; c < GRIDTRAP_SIZE; c++) {
      const isOuterRow = r <= 2 || r >= GRIDTRAP_SIZE - 3;
      const isOuterCol = c <= 2 || c >= GRIDTRAP_SIZE - 3;
      if (!isOuterRow && !isOuterCol) continue;

      const onPlayer =
        (positions[PLAYER.A].row === r && positions[PLAYER.A].col === c) ||
        (positions[PLAYER.B].row === r && positions[PLAYER.B].col === c);
      if (onPlayer) continue;

      candidates.push({ row: r, col: c });
    }
  }

  const walls = [];
  const maxWalls = Math.min(candidates.length, 20);
  const minWalls = Math.min(candidates.length, 15);
  const target =
    minWalls +
    Math.floor(Math.random() * Math.max(1, maxWalls - minWalls + 1));

  const pool = [...candidates];
  while (walls.length < target && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool.splice(idx, 1)[0];
    walls.push(picked);
  }

  return walls;
}

/**
 * 9×9, both players start center row, side-by-side:
 * A at (4,4), B at (4,5)
 */
export function createGridTrapMatch() {
  const positions = {
    [PLAYER.A]: { row: 4, col: 4 },
    [PLAYER.B]: { row: 4, col: 5 },
  };

  const board = createEmptyBoard();

  // players
  board[positions[PLAYER.A].row][positions[PLAYER.A].col].occupant = PLAYER.A;
  board[positions[PLAYER.B].row][positions[PLAYER.B].col].occupant = PLAYER.B;

  // static walls
  const walls = generateStaticWalls(positions);
  for (const w of walls) {
    const cell = board[w.row][w.col];
    cell.type = CELL_TYPE.BLOCKED;
    cell.blockedBy = "STATIC";
  }

  return {
    board,
    positions,
    staticWalls: walls.map((w) => key(w.row, w.col)),

    currentPlayer: PLAYER.A,

    // track player-placed blocks (for stats / UI)
    blockedByPlayer: {
      [PLAYER.A]: [],
      [PLAYER.B]: [],
    },

    winner: null,
    winReason: null,
  };
}

// ---------- move / block logic ----------

export function getLegalMoves(match, player) {
  if (match.winner) return [];

  const pos = match.positions[player];
  if (!pos) return [];

  const res = [];
  for (const n of neighbors4(pos.row, pos.col)) {
    if (!inBounds(n.row, n.col)) continue;
    const cell = match.board[n.row][n.col];
    if (cell.occupant) continue;
    if (cell.type === CELL_TYPE.BLOCKED) continue;
    res.push({ row: n.row, col: n.col });
  }
  return res;
}

/**
 * Unlimited blocks.
 * First block: anywhere empty (not occupied, not blocked).
 * Later blocks: must be orthogonally adjacent to
 *   - ANY of your own blocks, OR
 *   - ANY static wall ("stones").
 */
export function getLegalBlocks(match, player) {
  if (match.winner) return [];

  const hasBlockedBefore = match.blockedByPlayer[player].length > 0;
  const result = [];

  for (let r = 0; r < GRIDTRAP_SIZE; r++) {
    for (let c = 0; c < GRIDTRAP_SIZE; c++) {
      const cell = match.board[r][c];

      // cannot block where someone stands, or on any existing block
      if (cell.occupant) continue;
      if (cell.type === CELL_TYPE.BLOCKED) continue;

      // FIRST BLOCK: anywhere
      if (!hasBlockedBefore) {
        result.push({ row: r, col: c });
        continue;
      }

      // AFTER FIRST: adjacent to your block or a static wall
      let ok = false;

      for (const n of neighbors4(r, c)) {
        if (!inBounds(n.row, n.col)) continue;
        const neighbor = match.board[n.row][n.col];

        if (
          neighbor.type === CELL_TYPE.BLOCKED &&
          (neighbor.blockedBy === player || neighbor.blockedBy === "STATIC")
        ) {
          ok = true;
          break;
        }
      }

      if (ok) result.push({ row: r, col: c });
    }
  }

  return result;
}

/**
 * Start-of-turn check:
 * if a player has no legal moves at the start of their turn,
 * they lose (isolated).
 */
export function evaluateStartOfTurn(match, player) {
  if (match.winner) return match;

  const clone = structuredClone(match);
  const opponent = player === PLAYER.A ? PLAYER.B : PLAYER.A;

  const moves = getLegalMoves(clone, player);
  if (moves.length === 0) {
    clone.winner = opponent;
    clone.winReason = `${player} has no legal moves`;
    return clone;
  }

  return clone;
}

/**
 * Apply a full turn: move + block
 * action = { moveTo: {row,col}, blockAt: {row,col} }
 */
export function applyGridTrapTurn(match, action) {
  if (match.winner) return match;

  const player = match.currentPlayer;
  const opponent = player === PLAYER.A ? PLAYER.B : PLAYER.A;
  const { moveTo, blockAt } = action;

  const legalMoves = getLegalMoves(match, player);
  const isMoveLegal = legalMoves.some(
    (m) => m.row === moveTo.row && m.col === moveTo.col
  );
  if (!isMoveLegal) throw new Error("Illegal move");

  const legalBlocks = getLegalBlocks(match, player);
  const isBlockLegal = legalBlocks.some(
    (b) => b.row === blockAt.row && b.col === blockAt.col
  );
  if (!isBlockLegal) throw new Error("Illegal block");

  // cannot move onto and block the same tile
  if (moveTo.row === blockAt.row && moveTo.col === blockAt.col) {
    throw new Error("Move and block cannot target the same tile.");
  }

  const clone = structuredClone(match);

  // move
  const curPos = clone.positions[player];
  clone.board[curPos.row][curPos.col].occupant = null;
  clone.positions[player] = { row: moveTo.row, col: moveTo.col };
  clone.board[moveTo.row][moveTo.col].occupant = player;

  // block
  const blockCell = clone.board[blockAt.row][blockAt.col];
  blockCell.type = CELL_TYPE.BLOCKED;
  blockCell.blockedBy = player;

  clone.blockedByPlayer[player] = [
    ...clone.blockedByPlayer[player],
    key(blockAt.row, blockAt.col),
  ];

  // next player's turn
  clone.currentPlayer = opponent;
  const evaluated = evaluateStartOfTurn(clone, opponent);

  return evaluated;
}
