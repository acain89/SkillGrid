// frontend/src/services/matchApi.js

const API = import.meta.env.VITE_API_BASE || "http://localhost:10000";

export const matchApi = {
  // ---------------------------- CREATE MATCH ----------------------------
  async create(gameType = "connect4") {
    const res = await fetch(`${API}/api/match/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType })
    });

    if (!res.ok) {
      console.error("Create match server error:", res.status);
      return { ok: false, error: "server-error" };
    }

    return res.json();
  },

  // ---------------------------- GET MATCH ----------------------------
  async get(matchId) {
    const res = await fetch(`${API}/api/match/${matchId}`);

    if (!res.ok) {
      console.error("Get match server error:", res.status);
      return { ok: false, error: "server-error" };
    }

    return res.json();
  },

  // ---------------------------- APPLY MOVE ----------------------------
  async move(id, move) {
    const res = await fetch(`${API}/api/match/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move })
    });

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      return { ok: false, error: "invalid-json" };
    }

    // ✔ Prevent crashing the frontend when an illegal move happens
    if (!data.ok || !data.state) {
      console.warn("Move rejected or invalid:", data);
      return data;
    }

    return data;
  }
};
