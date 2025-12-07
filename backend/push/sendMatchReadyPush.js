// backend/push/sendMatchReadyPush.js
import { sendPushToUser } from "./sendPushToUser.js";

export async function sendMatchReadyPush(tournament, match, gameType) {
  const title = "Your Match Is Ready";
  const body = `Enter ${gameType.toUpperCase()} now — your opponent is waiting.`;
  const route = `/tournament/${tournament.id}/game/${gameType}`;

  const payload = {
    notification: { title, body },
    data: {
      route,
      tournamentId: tournament.id,
      roundIndex: String(match.roundIndex),
      matchIndex: String(match.matchIndex),
      gameType,
    },
  };

  for (const uid of match.playerIds) {
    await sendPushToUser(uid, payload);
  }
}
