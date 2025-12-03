// frontend/src/core/engines/checkers.js

/* ===============================================
   CHECKERS ENGINE — SkillGrid Tournament Edition
   =============================================== */

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const SIZE = 8;

/* ---------------- INITIAL STATE ---------------- */
export function createState() {
  const board = Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(null));

  // Player 0 (bottom) moves UP
  for (let r = SIZE - 1; r >= SIZE - 3; r--) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { player: 0, king: false };
    }
  }

  // Player 1 (top) moves DOWN
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { player: 1, king: false };
    }
  }

  return {
    board,
    // kept but unused now
    forcedRow: null,
    forcedCol: null,
    winner: null,
    captureChain: false
  };
}

function inside(r, c) {
  return r >= 0 && c >= 0 && r < SIZE && c < SIZE;
}

/* ------------------------------------------------
   All moves (simple + multi-jump chains) 
   for a single piece at (r, c)
   ------------------------------------------------ */
function getMovesForPieceAll(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const moves = [];

  // Base movement directions for simple (non-jump) moves
  const baseDirs = piece.king
    ? [-1, 1]            // kings move both ways
    : piece.player === 0
    ? [-1]               // red moves up
    : [1];               // black moves down

  /* ----------------- SIMPLE NON-JUMP MOVES ----------------- */
  for (const dr of baseDirs) {
    for (const dc of [-1, 1]) {
      const nr = r + dr;
      const nc = c + dc;

      if (inside(nr, nc) && board[nr][nc] == null) {
        moves.push({
          fromRow: r,
          fromCol: c,
          toRow: nr,
          toCol: nc,
          captures: []
        });
      }
    }
  }

  /* ----------------- MULTI-JUMP RECURSION ----------------- */
  function exploreJump(curR, curC, curBoard, capturesSoFar) {
    let foundFurther = false;

    // Jumps ALWAYS use full king movement set
    const jumpDirs = piece.king ? [-1, 1] : baseDirs;

    for (const dr of jumpDirs) {
      for (const dc of [-1, 1]) {
        const midR = curR + dr;
        const midC = curC + dc;
        const destR = curR + 2 * dr;
        const destC = curC + 2 * dc;

        if (!inside(midR, midC) || !inside(destR, destC)) continue;

        const midCell = curBoard[midR][midC];
        const destCell = curBoard[destR][destC];

        const isValidJump =
          midCell &&
          midCell.player !== piece.player &&
          destCell == null;

        if (isValidJump) {
          foundFurther = true;

          // clone board for branching path
          const cloned = curBoard.map((row) => row.slice());

          cloned[curR][curC] = null;
          cloned[midR][midC] = null;
          cloned[destR][destC] = piece;

          const newCaps = [...capturesSoFar, { r: midR, c: midC }];

          // recurse deeper
          exploreJump(destR, destC, cloned, newCaps);
        }
      }
    }

    // End of chain = valid landing square
    if (!foundFurther && capturesSoFar.length > 0) {
      moves.push({
        fromRow: r,
        fromCol: c,
        toRow: curR,
        toCol: curC,
        captures: capturesSoFar
      });
    }
  }

  exploreJump(r, c, board, []);

  return moves;
}

/* ---------------- ALL MOVES FOR PLAYER ---------------- */
function getAllMoves(match) {
  const board = match.game.board;
  const p = match.currentPlayerIndex;

  let all = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];
      if (!piece || piece.player !== p) continue;

      const moves = getMovesForPieceAll(board, r, c);
      all = all.concat(moves);
    }
  }

  // ❗ NO FORCED CAPTURE — all legal moves (simple + jumps)
  return all;
}

/* ---------------- DECLARE WINNER ---------------- */
function declareWinner(next) {
  const loser = next.currentPlayerIndex;
  const winner = loser === 0 ? 1 : 0;

  next.game.winner = winner;

  return {
    nextMatch: next,
    event: { type: "win", winner }
  };
}

/* ---------------- APPLY MOVE ---------------- */
export function applyMove(match, move) {
  const next = clone(match);
  const board = next.game.board;

  if (move.timeout) {
    next.currentPlayerIndex = next.currentPlayerIndex === 0 ? 1 : 0;
    return { nextMatch: next, event: { type: "timeout" } };
  }

  const legalMoves = getAllMoves(next);
  const legal = legalMoves.find(
    (m) =>
      m.fromRow === move.fromRow &&
      m.fromCol === move.fromCol &&
      m.toRow === move.toRow &&
      m.toCol === move.toCol
  );

  if (!legal) {
    return { nextMatch: match, event: { type: "illegal" } };
  }

  const { fromRow, fromCol, toRow, toCol, captures } = legal;

  const piece = board[fromRow][fromCol];
  board[fromRow][fromCol] = null;
  board[toRow][toCol] = piece;

  let didJump = false;

  if (captures && captures.length > 0) {
    captures.forEach((cap) => {
      board[cap.r][cap.c] = null;
    });
    didJump = true;
  }

  // Promote?
  if (!piece.king) {
    if (piece.player === 0 && toRow === 0) piece.king = true;
    if (piece.player === 1 && toRow === SIZE - 1) piece.king = true;
  }

  // Check win
  const nextMoves = getAllMoves(next);
  if (nextMoves.length === 0) {
    return declareWinner(next);
  }

  // Switch turn
  next.currentPlayerIndex = next.currentPlayerIndex === 0 ? 1 : 0;

  return {
    nextMatch: next,
    event: {
      type: didJump ? "jump" : "move",
      fromRow,
      fromCol,
      toRow,
      toCol,
      capture: captures && captures.length > 0 ? captures : null,
      chain: false
    }
  };
}
