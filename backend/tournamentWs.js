// backend/tournamentWs.js
import { WebSocketServer } from "ws";

export function createTournamentWsServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/tournament",
  });

  console.log("💠 WebSocket server initialized: /ws/tournament");

  wss.on("connection", (socket) => {
    console.log("💠 WS: Client connected");

    socket.on("message", (buffer) => {
      let msg;
      try {
        msg = JSON.parse(buffer.toString());
      } catch {
        return;
      }

      // ---------------------------------------------
      // BROADCAST: send this message to all listeners
      // ---------------------------------------------
      for (const client of wss.clients) {
        if (client.readyState === 1) {
          client.send(JSON.stringify(msg));
        }
      }
    });

    socket.on("close", () => {
      console.log("💠 WS: Client disconnected");
    });
  });

  return wss;
}
