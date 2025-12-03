// src/core/triathlonEngine.js

export const TRI_GAMES = ["connect4", "checkers", "gridtrap"];
export const PLAYER = { A: "A", B: "B" };

/**
 * Create a fresh triathlon match state.
 * startingPlayer: "A" or "B" -> who starts Game 1, Round 1.
 */
export function createTriMatch(startingPlayer = PLAYER.A) {
  return {
    games: TRI_GAMES.map((id) => ({
      id,
      winsA: 0,
      winsB: 0,
      completed: false,
      gameWinner: null, // "A" | "B" | null
    })),

    currentGameIndex: 0,      // 0 = connect4, 1 = checkers, 2 = gridtrap
    currentRound: 1,          // 1..3 within that game
    gamesWonA: 0,
    gamesWonB: 0,

    // who started Game 0 Round 1
    startingPlayerGame0: startingPlayer,
    // for each game index -> who starts Round 1
    startingPlayerByGame: {
      0: startingPlayer,
      1: startingPlayer === PLAYER.A ? PLAYER.B : PLAYER.A, // flip for game 2
      2: startingPlayer, // flip back for game 3 (A,B,A pattern)
    },

    // who starts THIS round (will flip within the game)
    startingPlayerThisRound: startingPlayer,

    triWinner: null,        // "A" | "B" | null
    triFinished: false,
  };
}

export function getCurrentGame(tri) {
  return tri.games[tri.currentGameIndex];
}

/**
 * Return the player who should start the CURRENT game, CURRENT round.
 */
export function getStartingPlayerForCurrentRound(tri) {
  return tri.startingPlayerThisRound;
}

/**
 * Record the winner of a single round in the current game.
 * winner: "A" or "B"
 *
 * Returns { next, gameJustCompleted, triFinished }
 */
export function recordRoundResult(tri, winner) {
  if (tri.triFinished) {
    return { next: tri, gameJustCompleted: false, triFinished: true };
  }

  const next = structuredClone(tri);
  const currentGame = next.games[next.currentGameIndex];

  if (currentGame.completed) {
    return { next, gameJustCompleted: false, triFinished: next.triFinished };
  }

  if (winner === PLAYER.A) currentGame.winsA += 1;
  else if (winner === PLAYER.B) currentGame.winsB += 1;

  let gameJustCompleted = false;

  // Check if this game is now won (best of 3 => first to 2)
  if (currentGame.winsA >= 2 || currentGame.winsB >= 2) {
    currentGame.completed = true;
    currentGame.gameWinner =
      currentGame.winsA > currentGame.winsB ? PLAYER.A : PLAYER.B;
    gameJustCompleted = true;

    if (currentGame.gameWinner === PLAYER.A) next.gamesWonA += 1;
    else next.gamesWonB += 1;

    // Check triathlon victory (first to 2 games)
    if (next.gamesWonA >= 2 || next.gamesWonB >= 2) {
      next.triFinished = true;
      next.triWinner = next.gamesWonA > next.gamesWonB ? PLAYER.A : PLAYER.B;
    }
  }

  // If tri finished, we don't advance further
  if (next.triFinished) {
    return { next, gameJustCompleted, triFinished: true };
  }

  // If game still ongoing, advance to next round within same game
  if (!currentGame.completed) {
    next.currentRound += 1;
    // Flip round starter inside this game (A/B/A)
    next.startingPlayerThisRound =
      next.startingPlayerThisRound === PLAYER.A ? PLAYER.B : PLAYER.A;

    return { next, gameJustCompleted, triFinished: false };
  }

  // Game completed but tri not finished -> move to next game (if exists)
  if (currentGame.completed) {
    // Move to next game index, if any
    if (next.currentGameIndex < TRI_GAMES.length - 1) {
      next.currentGameIndex += 1;
      next.currentRound = 1;

      const gi = next.currentGameIndex;
      const starter = next.startingPlayerByGame[gi];

      next.startingPlayerThisRound = starter;
    } else {
      // All games done, but no one hit 2 wins? (edge case; in practice
      // someone should have 2 games out of 3)
      next.triFinished = true;
      next.triWinner =
        next.gamesWonA >= next.gamesWonB ? PLAYER.A : PLAYER.B;
    }

    return { next, gameJustCompleted, triFinished: next.triFinished };
  }

  return { next, gameJustCompleted, triFinished: next.triFinished };
}
