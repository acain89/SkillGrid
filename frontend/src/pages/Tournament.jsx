// src/pages/Tournament.jsx
// SkillGrid – Unified Tournament Bracket (Triathlon-aware)

import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./tournamentBracket.css";
import { playSound } from "../core/sound";

const CLICK_SOUND = "/sounds/ui-click.mp3";

// temporary user ID until auth is wired
const CURRENT_USER_ID = "p_you";

/* -------------------------------------------------------
   TOURNAMENT FORMAT CONFIG (PAYOUTS)
--------------------------------------------------------*/
const FORMAT_CONFIG = {
  flattened: {
    label: "FLATTENED BRACKET — LIVE",
    payouts: {
      first: 80,
      second: 60,
      thirdFourth: 40,
      fifthToEighth: 25,
      others: 0,
    },
  },
  competitive: {
    label: "COMPETITIVE BRACKET — LIVE",
    payouts: {
      first: 160,
      second: 100,
      thirdFourth: 30,
      fifthToEighth: 0,
      others: 0,
    },
  },
  wta: {
    label: "WINNER-TAKES-ALL BRACKET — LIVE",
    payouts: {
      first: 320,
      second: 0,
      thirdFourth: 0,
      fifthToEighth: 0,
      others: 0,
    },
  },
};

/* -------------------------------------------------------
   TEMP: MOCK ROUNDS (replace with backend data later)
--------------------------------------------------------*/
const MOCK_ROUNDS = [
  {
    id: 1,
    label: "Round 1 – 16 players",
    matches: [
      {
        id: "r1m1",
        roundIndex: 0,
        playerA: { id: "p_you", name: "You" },
        playerB: { id: "p2", name: "Opponent 2" },
        score: { a: 2, b: 0 },
        status: "finished",
        winner: "A",
      },
      {
        id: "r1m2",
        roundIndex: 0,
        playerA: { id: "p3", name: "Player 3" },
        playerB: { id: "p4", name: "Player 4" },
        score: { a: 2, b: 1 },
        status: "finished",
        winner: "A",
      },
      {
        id: "r1m3",
        roundIndex: 0,
        playerA: { id: "p5", name: "Player 5" },
        playerB: { id: "p6", name: "Player 6" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
      {
        id: "r1m4",
        roundIndex: 0,
        playerA: { id: "p7", name: "Player 7" },
        playerB: { id: "p8", name: "Player 8" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
      {
        id: "r1m5",
        roundIndex: 0,
        playerA: { id: "p9", name: "Player 9" },
        playerB: { id: "p10", name: "Player 10" },
        score: { a: 1, b: 2 },
        status: "finished",
        winner: "B",
      },
      {
        id: "r1m6",
        roundIndex: 0,
        playerA: { id: "p11", name: "Player 11" },
        playerB: { id: "p12", name: "Player 12" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
      {
        id: "r1m7",
        roundIndex: 0,
        playerA: { id: "p13", name: "Player 13" },
        playerB: { id: "p14", name: "Player 14" },
        score: { a: 2, b: 0 },
        status: "finished",
        winner: "A",
      },
      {
        id: "r1m8",
        roundIndex: 0,
        playerA: { id: "p15", name: "Player 15" },
        playerB: { id: "p16", name: "Player 16" },
        score: { a: 1, b: 1 },
        status: "in_progress",
        winner: null,
      },
    ],
  },
  {
    id: 2,
    label: "Round 2 – 8 players",
    matches: [
      {
        id: "r2m1",
        roundIndex: 1,
        playerA: { id: "w1", name: "Winner Match 1" },
        playerB: { id: "w2", name: "Winner Match 2" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
      {
        id: "r2m2",
        roundIndex: 1,
        playerA: { id: "w3", name: "Winner Match 3" },
        playerB: { id: "w4", name: "Winner Match 4" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
      {
        id: "r2m3",
        roundIndex: 1,
        playerA: { id: "w5", name: "Winner Match 5" },
        playerB: { id: "w6", name: "Winner Match 6" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
      {
        id: "r2m4",
        roundIndex: 1,
        playerA: { id: "w7", name: "Winner Match 7" },
        playerB: { id: "w8", name: "Winner Match 8" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
    ],
  },
  {
    id: 3,
    label: "Round 3 – 4 players",
    matches: [
      {
        id: "r3m1",
        roundIndex: 2,
        playerA: { id: "sf1a", name: "Winner R2M1" },
        playerB: { id: "sf1b", name: "Winner R2M2" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
      {
        id: "r3m2",
        roundIndex: 2,
        playerA: { id: "sf2a", name: "Winner R2M3" },
        playerB: { id: "sf2b", name: "Winner R2M4" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
    ],
  },
  {
    id: 4,
    label: "Round 4 – 2 players (Final)",
    matches: [
      {
        id: "r4m1",
        roundIndex: 3,
        playerA: { id: "f1a", name: "Winner Semi 1" },
        playerB: { id: "f1b", name: "Winner Semi 2" },
        score: { a: 0, b: 0 },
        status: "in_progress",
        winner: null,
      },
    ],
  },
];

/* -------------------------------------------------------
   PLACEMENT / PAYOUT CALCULATOR
--------------------------------------------------------*/
function getPlacementInfo(formatKey, roundIndex, isWinner, isFinal) {
  const cfg = FORMAT_CONFIG[formatKey]?.payouts;
  if (!cfg) return null;

  if (!isWinner) {
    if (roundIndex === 0) return { label: "9th–16th place", amount: cfg.others };
    if (roundIndex === 1) return { label: "5th–8th place", amount: cfg.fifthToEighth };
    if (roundIndex === 2) return { label: "3rd–4th place", amount: cfg.thirdFourth };
    if (roundIndex === 3) return { label: "2nd place", amount: cfg.second };
  } else {
    if (roundIndex === 3 && isFinal) return { label: "Champion", amount: cfg.first };
  }

  return null;
}

/* -------------------------------------------------------
   MAIN BRACKET COMPONENT
--------------------------------------------------------*/
export default function TournamentBracket() {
  const { gameType } = useParams(); // flattened | competitive | wta
  const navigate = useNavigate();

  const formatKey =
    gameType === "competitive" ||
    gameType === "wta" ||
    gameType === "flattened"
      ? gameType
      : "flattened";

  const [rounds] = useState(MOCK_ROUNDS);
  const [currentRoundIndex] = useState(0); // later: backend controlled

  const formatLabel = FORMAT_CONFIG[formatKey]?.label ?? "TOURNAMENT BRACKET";
  const currentRound = useMemo(
    () => rounds[currentRoundIndex],
    [rounds, currentRoundIndex]
  );

  function isUsersMatch(match) {
    const { playerA, playerB } = match;
    return (
      playerA?.id === CURRENT_USER_ID ||
      playerB?.id === CURRENT_USER_ID
    );
  }

  function handleMatchClick(match) {
    playSound(CLICK_SOUND, 0.4);

    if (!isUsersMatch(match)) {
      // Not your match – just ignore for now
      return;
    }

    if (match.status !== "in_progress") {
      // Already finished, no new triathlon
      return;
    }

    // 🔗 Go to triathlon flow for this match
    navigate(`/triathlon/${formatKey}/${match.id}`);
  }

  return (
    <div className="br-root">
      <div className="br-bg-glow" />

      <header className="br-header">
        <h1 className="br-title">{formatLabel}</h1>
        <p className="br-subtitle">{currentRound.label}</p>
      </header>

      {/* DESKTOP BRACKET (view-only) */}
      <div className="br-desktop-wrapper">
        <div className="br-desktop-bracket">
          {rounds.map((round, rIdx) => (
            <div
              key={round.id}
              className={`br-column ${
                rIdx === currentRoundIndex ? "br-column--current" : ""
              }`}
            >
              <div className="br-column-label">{round.label}</div>
              <div className="br-column-matches">
                {round.matches.map((m, idx) => (
                  <BracketMatch
                    key={m.id}
                    match={m}
                    index={idx}
                    formatKey={formatKey}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="br-connector-layer" aria-hidden="true" />
        </div>
      </div>

      {/* MOBILE BRACKET (click to enter triathlon if it's your match) */}
      <main className="br-mobile-wrapper">
        <div className="br-mobile-header">
          <span className="br-mobile-round">{currentRound.label}</span>
          <span className="br-mobile-round-note">
            Tap your match to enter the triathlon
          </span>
        </div>

        <div className="br-mobile-match-list">
          {currentRound.matches.map((m, idx) => (
            <MobileMatchLine
              key={m.id}
              match={m}
              index={idx}
              formatKey={formatKey}
              onClick={() => handleMatchClick(m)}
              isUsersMatch={isUsersMatch(m)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------
   DESKTOP MATCH CARD
--------------------------------------------------------*/
function BracketMatch({ match, formatKey }) {
  const { playerA, playerB, score, status, winner, roundIndex } = match;

  const isFinalRound = roundIndex === 3;
  const isAWinner = winner === "A";
  const isBWinner = winner === "B";

  const placementA =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, isAWinner, isFinalRound)
      : null;
  const placementB =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, isBWinner, isFinalRound)
      : null;

  const showScore = status === "finished";

  const rowAClasses = [
    "br-player-row",
    status === "finished" && !isAWinner ? "br-row--loser" : "",
    status === "finished" && isAWinner ? "br-row--winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const rowBClasses = [
    "br-player-row",
    status === "finished" && !isBWinner ? "br-row--loser" : "",
    status === "finished" && isBWinner ? "br-row--winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="br-match">
      <div className="br-match-lines">
        <div className="br-line-vert" />
        <div className="br-line-horiz" />
      </div>

      <div className="br-match-body">
        {/* A row */}
        <div className={rowAClasses}>
          <span className="br-player-name">{playerA.name}</span>
          {showScore && (
            <span className="br-player-score">
              {score.a}–{score.b}
            </span>
          )}
        </div>
        {placementA && (
          <div className="br-placement-row">
            {placementA.label} — ${placementA.amount}
          </div>
        )}

        {/* B row */}
        <div className={rowBClasses}>
          <span className="br-player-name">{playerB.name}</span>
          {showScore && (
            <span className="br-player-score">
              {score.b}–{score.a}
            </span>
          )}
        </div>
        {placementB && (
          <div className="br-placement-row">
            {placementB.label} — ${placementB.amount}
          </div>
        )}

        {status === "in_progress" && (
          <div className="br-status-row">In progress…</div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MOBILE MATCH CARD
--------------------------------------------------------*/
function MobileMatchLine({ match, formatKey, onClick, isUsersMatch }) {
  const { playerA, playerB, score, status, winner, roundIndex } = match;

  const isFinalRound = roundIndex === 3;
  const isAWinner = winner === "A";
  const isBWinner = winner === "B";

  const placementA =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, isAWinner, isFinalRound)
      : null;
  const placementB =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, isBWinner, isFinalRound)
      : null;

  const showScore = status === "finished";

  const rowAClasses = [
    "br-mobile-player-name-row",
    status === "finished" && !isAWinner ? "br-row--loser" : "",
    status === "finished" && isAWinner ? "br-row--winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const rowBClasses = [
    "br-mobile-player-name-row",
    status === "finished" && !isBWinner ? "br-row--loser" : "",
    status === "finished" && isBWinner ? "br-row--winner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isClickable = isUsersMatch && status === "in_progress";

  return (
    <button
      className={`br-mobile-match ${
        isClickable ? "br-mobile-match--active" : "br-mobile-match--disabled"
      }`}
      onClick={isClickable ? onClick : undefined}
      type="button"
    >
      <div className="br-mobile-line">
        <div className="br-mobile-player-block">
          <div className={rowAClasses}>
            <span className="br-mobile-player-name">{playerA.name}</span>
            {showScore && (
              <span className="br-mobile-score">
                {score.a}–{score.b}
              </span>
            )}
          </div>
          {placementA && (
            <div className="br-placement-row br-placement-row--mobile">
              {placementA.label} — ${placementA.amount}
            </div>
          )}

          <div className={rowBClasses}>
            <span className="br-mobile-player-name">{playerB.name}</span>
            {showScore && (
              <span className="br-mobile-score">
                {score.b}–{score.a}
              </span>
            )}
          </div>
          {placementB && (
            <div className="br-placement-row br-placement-row--mobile">
              {placementB.label} — ${placementB.amount}
            </div>
          )}
        </div>

        <div className="br-mobile-connector">
          <div className="br-mobile-vert-line" />
          <div className="br-mobile-horiz-line" />
        </div>

        <div className="br-mobile-meta">
          {status === "in_progress" && (
            <span className="br-mobile-status br-mobile-status--inprogress">
              {isClickable ? "Tap to enter" : "In progress…"}
            </span>
          )}
          {status === "finished" && (
            <span className="br-mobile-status br-mobile-status--finished">
              Completed
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
