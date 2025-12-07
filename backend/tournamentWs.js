// backend/tournamentWs.js
//
// Very small wrapper around ws.WebSocketServer. It accepts
// connections on /ws/tournament and simply logs any inbound
// messages. Outbound messages are sent from server.js via
// the broadcast callback bound in routes/tournamentRoutes.js.

import { WebSocketServer } from "ws";

export function createTournamentWsServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/tournament",
  });

  console.log("💠 WebSocket server initialized at /ws/tournament");

  wss.on("connection", (socket) => {
    console.log("💠 WS: client connected");

    socket.on("message", (buffer) => {
      let msg = null;
      try {
        msg = JSON.parse(buffer.toString());
      } catch (err) {
        console.warn("WS: failed to parse message", err);
        return;
      }

      // For now we just log what clients send; later you can
      // add explicit subscribe / ping-pong behavior here.
      console.log("💠 WS message from client:", msg?.type || msg);
    });

    socket.on("close", () => {
      console.log("💠 WS: client disconnected");
    });
  });

  return wss;
}
