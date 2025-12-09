// backend/src/state/matchStore.js

let NEXT_ID = 1;

// Stored as: id → { id, gameType, state, createdAt }
const matches = new Map();

export function createNewMatch(gameType, initialState) {
  const id = String(NEXT_ID++);

  matches.set(id, {
    id,
    gameType,
    state: initialState,     // ✅ ALWAYS store state here
    createdAt: Date.now()
  });

  return id;
}

export function getMatch(id) {
  return matches.get(String(id)) || null;
}

export function updateMatch(id, newState) {
  const entry = matches.get(String(id));
  if (!entry) return;

  matches.set(String(id), {
    ...entry,
    state: newState           // ✅ NEVER remove other fields
  });
}

export function resetMatches() {
  matches.clear();
  NEXT_ID = 1;
}
