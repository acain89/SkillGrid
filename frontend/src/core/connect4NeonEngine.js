// src/core/connect4NeonEngine.js
import { applyMove } from "./engines/connect4.js";

export function engineMove(match, col) {
  const move = { col };
  const result = applyMove(match, move);

  // keep full event so we have type/row/col/winnerCells
  return {
    nextMatch: result.nextMatch,
    event: result.event
  };
}
