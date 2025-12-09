// backend/src/core/engines/triad.js

/* ----------------- helpers ----------------- */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ======================================================
   ===================== TRIAD ==========================
   ====================================================== */

export function createState() {
  return { targetScore: 35, turn: 0 };
}

export function applyMove(match, move) {
  const next = clone(match);
  const p = next.players[next.currentPlayerIndex];
  const pts = move.points || 1;

  p.score += pts;
  next.game.turn++;

  let event = {
    type: "triad-move",
    points: pts,
    playerId: p.id,
    total: p.score
  };

  if (p.score >= next.game.targetScore) {
    next.status = "finished";
    next.winnerId = p.id;
    event.type = "triad-win";
  } else {
    next.currentPlayerIndex = next.currentPlayerIndex === 0 ? 1 : 0;
  }

  next.history.push(event);
  return { nextMatch: next, event };
}

export function demoMove(match) {
  const pts = 1 + Math.floor(Math.random() * 5);
  return applyMove(match, { points: pts });
}
