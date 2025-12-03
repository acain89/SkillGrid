// backend/server.js
import http from "http";
import express from "express";
import cors from "cors";
import { createTournamentWsServer } from "./tournamentWs.js";  // <-- NEW

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
//  Your REST API routes
// ----------------------
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "SkillGrid backend online." });
});

// TODO: your existing routes go here:
// app.use("/api", require("./src/routes/..."))

const PORT = process.env.PORT || 10000;

// ----------------------
//  Create HTTP server
// ----------------------
const httpServer = http.createServer(app);

// ----------------------
//  Start WebSocket server
// ----------------------
createTournamentWsServer(httpServer);

// ----------------------
//  Start HTTP + WS
// ----------------------
httpServer.listen(PORT, () => {
  console.log(`💡 SkillGrid API + WS running on port ${PORT}`);
});
