// backend/server.js
import http from "http";
import express from "express";
import cors from "cors";
import vaultRoutes from "./routes/vaultRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import payoutRoutes from "./routes/payoutRoutes.js";


// Routes
import tournamentRoutes, {
  bindTournamentBroadcast,
} from "./routes/tournamentRoutes.js";

import xpRoutes from "./routes/xpRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// WebSocket server creator
import { createTournamentWsServer } from "./tournamentWs.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/vault", vaultRoutes);
app.use("/stripe", stripeRoutes);
app.use(express.json());
app.use(cors());

// Stripe payouts
app.use("/api/payouts", payoutRoutes);


// ----------------------------------------------
// REST API ROUTES
// ----------------------------------------------
app.use("/api/tournament", tournamentRoutes);
app.use("/xp", xpRoutes);
app.use("/api/notifications", notificationRoutes);

// Root check
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "SkillGrid backend online." });
});

// ----------------------------------------------
// Create HTTP server
// ----------------------------------------------
const httpServer = http.createServer(app);

// ----------------------------------------------
// Start WebSocket server + bind broadcast
// ----------------------------------------------
const wss = createTournamentWsServer(httpServer);

// When tournamentRoutes wants to broadcast an update,
// it will call the function we bind here.
bindTournamentBroadcast((data) => {
  const payload = JSON.stringify(data);

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
});

// ----------------------------------------------
// Start backend system
// ----------------------------------------------
const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`💡 SkillGrid API + WS running on port ${PORT}`);
});
