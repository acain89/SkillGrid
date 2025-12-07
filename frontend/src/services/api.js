const API = import.meta.env.VITE_API_BASE || "http://localhost:10000";

export const api = {
  health: async () => {
    const res = await fetch(`${API}/api/health`);
    return res.json();
  }
};

export async function reportGameResult(tournamentId, payload) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/tournaments/${tournamentId}/reportGameResult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}
