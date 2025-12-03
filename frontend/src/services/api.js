const API = import.meta.env.VITE_API_BASE || "http://localhost:10000";

export const api = {
  health: async () => {
    const res = await fetch(`${API}/api/health`);
    return res.json();
  }
};
