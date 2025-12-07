// frontend/src/core/tournamentClient.js
//
// Helper for talking to the tournament REST API from the
// game pages (Connect4Neon, CheckersNeon, GridTrap, etc).

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:10000";

/**
 * Report a finished tournament match.
 *
 * params:
 *   - tournamentId: string
 *   - roundIndex: number
 *   - matchIndex: number
 *   - winnerSide: 0 | 1   (0 = first seat, 1 = second seat)
 *   - gameType?: "connect4" | "checkers" | "gridtrap"
 */
export async function reportMatchResult({
  tournamentId,
  roundIndex,
  matchIndex,
  winnerSide,
  gameType,
}) {
  const url = `${API_BASE}/api/tournament/${tournamentId}/report-result`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roundIndex,
      matchIndex,
      winnerSide,
      gameType,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to report match result (${res.status}): ${
        text || "unknown error"
      }`
    );
  }

  const data = await res.json();
  return data;
}
