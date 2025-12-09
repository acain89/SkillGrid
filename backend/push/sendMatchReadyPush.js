// backend/push/sendMatchReadyPush.js
import { sendPushToUser } from "./sendPushToUser.js";

export async function sendMatchReadyPush(tournament, match) {
  if (!match?.playerIds) return;

  const { playerIds } = match;

  for (const uid of playerIds) {
    await sendPushToUser(uid, {
      title: "Your tournament is starting!",
      body: "Your first match is ready. Good luck!",
      route: `/tournament/${tournament.id}`
    });
  }
}
