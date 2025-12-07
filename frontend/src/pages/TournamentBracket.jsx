// frontend/src/pages/TournamentBracket.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./tournamentBracket.css";

/*
  EXPECTED BACKEND RESPONSE SHAPE (adjust to your API):

  GET /api/tournament/:tid  (or /api/tournaments/:tid/view) -> returns either:

  { ok: true, bracket: { ... } }
  or
  { ...bracketFields }

  Bracket object:

  {
    id: string,
    name: string,
    lane: {
      tierLabel: "Casual" | "Pro" | "WTA",
      entryFee: number,          // 5, 10, 20 etc
      potSize: number,           // 320
      formatLabel: string,       // e.g. "Flattened", "Competitive", "Winner Takes All"
      paidPlaces: number,        // e.g. 8 for Casual, 4 for Pro, 1 for WTA
      payouts: [                 // ordered by place
        { place: 1, amount: 80 },
        { place: 2, amount: 60 },
        { place: 3, amount: 40 },
        { place: 4, amount: 40 },
        { place: 5, amount: 25 },
        ...
      ]
    },

    state: "waiting_for_players" | "countdown" | "in_progress" | "completed",
    currentRoundIndex: number,   // 0..3
    totalRounds: 4,              // always 4 for 16-player bracket
    countdown: {
      phase: "tournament_start" | "between_rounds" | null,
      endsAt: string | null      // ISO timestamp for when countdown hits 0
    },

    players: [
      { id: "uid1", name: "Player 1" },
      ...
    ],

    // rounds[roundIndex][matchIndex]
    rounds: [
      [
        {
          matchIndex: 0,
          playerAId: string | null,
          playerBId: string | null,
          winnerId: string | null,
          status: "pending" | "ready" | "in_progress" | "complete"
        },
        ...
      ],
      ...
    ],

    // embedded "me" context for the logged-in user (optional – UI degrades if missing)
    me: {
      playerId: string,
      eliminated: boolean,
      currentRoundIndex: number | null,
      currentMatchIndex: number | null
    }
  }
*/

async function fetchTournament(tid) {
  // Primary call – matches your existing backend:
  //   app.use("/api/tournament", tournamentRoutes);
  //   router.get("/:id", ...)
  const res = await fetch(`/api/tournament/${tid}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load tournament.");
  }
  const body = await res.json();

  // Support both { ok, bracket } and bare bracket
  if (body && body.ok && body.bracket) return body.bracket;
  return body;
}

const ROUND_LABELS = ["Round of 16", "Quarterfinals", "Semifinals", "Final"];

export default function TournamentBracket() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // local countdown in seconds (derived from server's endsAt)
  const [secondsLeft, setSecondsLeft] = useState(null);

  /* -------------------------------------------------------
     LOAD TOURNAMENT SNAPSHOT (polling every 3s)
  -------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchTournament(tournamentId);
        if (!cancelled) {
          setTournament(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load tournament.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Poll every 3s for updates
    const pollId = setInterval(load, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, [tournamentId]);

  /* -------------------------------------------------------
     COUNTDOWN TIMER (DRIVEN BY server countdown.endsAt)
  -------------------------------------------------------- */
  useEffect(() => {
    if (!tournament || !tournament.countdown || !tournament.countdown.endsAt) {
      setSecondsLeft(null);
      return;
    }

    const endTime = new Date(tournament.countdown.endsAt).getTime();

    function update() {
      const now = Date.now();
      const diffMs = endTime - now;
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsLeft(secs);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [tournament]);

  /* -------------------------------------------------------
     AUTO-NAVIGATION INTO MATCHES
     - Only if player is alive
     - Only after countdown completes
     - Only if state === "in_progress" and match is ready
  -------------------------------------------------------- */
  useEffect(() => {
    if (!tournament) return;

    const { state, currentRoundIndex, rounds, me, countdown } = tournament;
    if (!me || me.eliminated) return;

    // If we're still in a countdown phase, DO NOT navigate yet.
    if (countdown && countdown.phase && secondsLeft && secondsLeft > 0) {
      return;
    }

    // Need a current match in the current round.
    if (
      typeof me.currentRoundIndex === "number" &&
      typeof me.currentMatchIndex === "number" &&
      me.currentRoundIndex === currentRoundIndex &&
      rounds &&
      rounds[currentRoundIndex]
    ) {
      const match = rounds[currentRoundIndex][me.currentMatchIndex];
      if (!match) return;

      // Only jump into arena when the server marks the match "ready" or "in_progress"
      if (match.status === "ready" || match.status === "in_progress") {
        navigate(
          `/arena/connect4/${tournamentId}/${currentRoundIndex}/${me.currentMatchIndex}`
        );
      }
    }
  }, [tournament, secondsLeft, navigate, tournamentId]);

  /* -------------------------------------------------------
     DERIVED VIEW HELPERS
  -------------------------------------------------------- */
  const countdownLabel = useMemo(() => {
    if (!tournament || !tournament.countdown || secondsLeft == null) return null;

    if (!tournament.countdown.phase) return null;

    if (tournament.countdown.phase === "tournament_start") {
      return `Tournament starts in: ${secondsLeft}s`;
    }

    if (tournament.countdown.phase === "between_rounds") {
      return `Next round in: ${secondsLeft}s`;
    }

    return null;
  }, [tournament, secondsLeft]);

  const payoutSummary = useMemo(() => {
    if (!tournament) return null;
    const { lane } = tournament;
    if (!lane) return null;

    return {
      tierLabel: lane.tierLabel,
      formatLabel: lane.formatLabel,
      entryFee: lane.entryFee,
      potSize: lane.potSize,
      paidPlaces: lane.paidPlaces,
      payouts: lane.payouts || [],
    };
  }, [tournament]);

  if (loading && !tournament) {
    return (
      <div className="bracket-page">
        <div className="bracket-loading">Loading tournament…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bracket-page">
        <div className="bracket-error">{error}</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="bracket-page">
        <div className="bracket-error">Tournament not found.</div>
      </div>
    );
  }

  const { state, currentRoundIndex, rounds, players, me } = tournament;

  /* -------------------------------------------------------
     RENDER HELPERS
  -------------------------------------------------------- */
  function getPlayerName(id) {
    if (!id || !players) return "--";
    const p = players.find((p) => p.id === id);
    return p ? p.name : "Player";
  }

  function renderMatchCell(match, idx, roundIdx) {
    const aName = getPlayerName(match.playerAId);
    const bName = getPlayerName(match.playerBId);

    const isCurrent =
      me &&
      !me.eliminated &&
      me.currentRoundIndex === roundIdx &&
      me.currentMatchIndex === idx;

    const winnerName = match.winnerId ? getPlayerName(match.winnerId) : null;

    let statusTag = null;
    if (match.status === "pending") statusTag = "Pending";
    else if (match.status === "ready") statusTag = "Ready";
    else if (match.status === "in_progress") statusTag = "In Progress";
    else if (match.status === "complete") statusTag = "Complete";

    return (
      <div
        key={idx}
        className={
          "bracket-match" +
          (isCurrent ? " bracket-match--mine" : "") +
          (match.status === "in_progress" ? " bracket-match--live" : "") +
          (match.status === "complete" ? " bracket-match--complete" : "")
        }
      >
        <div className="bracket-match-header">
          <span className="bracket-match-label">Match {idx + 1}</span>
          {statusTag && (
            <span
              className={`bracket-match-status bracket-match-status--${match.status}`}
            >
              {statusTag}
            </span>
          )}
        </div>

        <div className="bracket-match-players">
          <div
            className={
              "bracket-player" +
              (match.winnerId && match.winnerId === match.playerAId
                ? " bracket-player--winner"
                : "")
            }
          >
            {aName}
          </div>
          <div
            className={
              "bracket-player" +
              (match.winnerId && match.winnerId === match.playerBId
                ? " bracket-player--winner"
                : "")
            }
          >
            {bName}
          </div>
        </div>

        {winnerName && (
          <div className="bracket-winner-tag">Winner: {winnerName}</div>
        )}

        {isCurrent && !me?.eliminated && (
          <div className="bracket-you-tag">Your match</div>
        )}
      </div>
    );
  }

  return (
    <div className="bracket-page">
      {/* TOP HEADER */}
      <div className="bracket-top">
        <div className="bracket-title">
          {tournament.name || "SkillGrid Tournament"}
        </div>

        <div className="bracket-meta">
          {payoutSummary && (
            <>
              <span className="bracket-pill">
                {payoutSummary.tierLabel} • {payoutSummary.formatLabel}
              </span>
              <span className="bracket-pill">
                Entry: ${payoutSummary.entryFee}
              </span>
              <span className="bracket-pill">
                Pot: ${payoutSummary.potSize}
              </span>
              <span className="bracket-pill">
                Places paid: {payoutSummary.paidPlaces}
              </span>
            </>
          )}
        </div>

        {/* 🔹 Game order line for clarity */}
        <div className="bracket-game-order">
          Game order: Connect 4 → Checkers → Grid-Trap (best of 3 each)
        </div>

        {countdownLabel && (
          <div className="bracket-countdown">{countdownLabel}</div>
        )}

        {state === "completed" && (
          <div className="bracket-state-tag">Tournament completed</div>
        )}
      </div>

      {/* MAIN LAYOUT: BRACKET + PAYOUTS */}
      <div className="bracket-main">
        {/* BRACKET COLUMNS (desktop) / stacks (mobile via CSS) */}
        <div className="bracket-columns">
          {rounds.map((roundMatches, roundIdx) => (
            <div
              key={roundIdx}
              className={
                "bracket-round" +
                (roundIdx === currentRoundIndex
                  ? " bracket-round--current"
                  : "")
              }
            >
              <div className="bracket-round-header">
                {ROUND_LABELS[roundIdx] || `Round ${roundIdx + 1}`}
              </div>
              <div className="bracket-round-body">
                {roundMatches.map((m, i) => renderMatchCell(m, i, roundIdx))}
              </div>
            </div>
          ))}
        </div>

        {/* PAYOUT SUMMARY PANEL */}
        {payoutSummary && (
          <div className="bracket-sidebar">
            <div className="bracket-sidebar-card">
              <div className="bracket-sidebar-title">Payouts</div>
              <div className="bracket-payout-list">
                {payoutSummary.payouts.map((p) => (
                  <div key={p.place} className="bracket-payout-row">
                    <span className="bracket-payout-place">
                      {p.place === 1
                        ? "1st"
                        : p.place === 2
                        ? "2nd"
                        : p.place === 3
                        ? "3rd"
                        : `${p.place}th`}
                    </span>
                    <span className="bracket-payout-amount">${p.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {me && me.eliminated && (
              <div className="bracket-sidebar-card bracket-sidebar-card--info">
                <div className="bracket-sidebar-title">
                  You’ve been eliminated
                </div>
                <p className="bracket-text-sm">
                  You can return to the arena home and join another
                  tournament.
                </p>
                <button
                  className="bracket-button"
                  onClick={() => navigate("/home")}
                >
                  Back to Tournament Home
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
