// src/core/gameMatchController.js

export const MATCH_BEST_OF = 3;
export const ROUNDS_TO_WIN = 2;

export function createMatchController() {
  return {
    p1Wins: 0,
    p2Wins: 0,
    roundNumber: 1,
    matchOver: false,

    recordWin(playerIndex) {
      if (playerIndex === 0) this.p1Wins++;
      else this.p2Wins++;

      if (this.p1Wins === ROUNDS_TO_WIN || this.p2Wins === ROUNDS_TO_WIN) {
        this.matchOver = true;
      }
    },

    nextRound() {
      if (!this.matchOver) this.roundNumber++;
    },

    getMatchWinner() {
      if (!this.matchOver) return null;
      return this.p1Wins === ROUNDS_TO_WIN ? 0 : 1;
    },

    getScore() {
      return { p1: this.p1Wins, p2: this.p2Wins };
    }
  };
}
