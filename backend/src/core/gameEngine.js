// backend/src/core/gameEngine.js

import { createMatchState } from "./matchState.js";
import * as connect4 from "./engines/connect4.js";
import * as checkers from "./engines/checkers.js";
import * as triad from "./engines/triad.js";

const ENGINES = {
  connect4,
  checkers,
  triad
};

export function createMatch(gameType) {
  const engine = ENGINES[gameType];
  if (!engine) throw new Error("Unknown gameType: " + gameType);

  const match = createMatchState();
  match.gameType = gameType;
  match.currentPlayerIndex = 0;
  match.status = "active";
  match.game = engine.createState();

  return match;
}

export function applyMove(match, move) {
  const engine = ENGINES[match.gameType];
  if (!engine) throw new Error("Unknown game type: " + match.gameType);
  return engine.applyMove(match, move);
}

export function demoRandomMove(match) {
  const engine = ENGINES[match.gameType];
  if (!engine || !engine.demoMove) {
    return { nextMatch: match, event: { type: "no-op" } };
  }
  return engine.demoMove(match);
}
