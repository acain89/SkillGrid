export function createMatchState() {
  return {
    gameType: null,
    players: [
      { id: 1, name: "P1", score: 0, alive: true, disconnects: 0 },
      { id: 2, name: "P2", score: 0, alive: true, disconnects: 0 }
    ],
    currentPlayerIndex: 0,
    status: "active",
    round: 1,
    winnerId: null,
    history: [],
    game: null
  };
}
