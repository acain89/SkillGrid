// src/pages/Tournament.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./tournamentBracket.css";
import { playSound } from "../core/sound";
import { awardTournamentResult } from "../services/profileLogic";

const CLICK_SOUND = "/sounds/ui-click.mp3";
const CURRENT_USER_ID = "p_you";

/* ---------------------------------------------
   FORMAT CONFIG
--------------------------------------------- */
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

/* ---------------------------------------------
   MOCK BRACKET DATA
--------------------------------------------- */
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
      // … keep the rest of your match data unchanged
    ],
  },
  {
    id: 2,
    label: "Round 2 – 8 players",
    matches: [],
  },
  {
    id: 3,
    label: "Round 3 – 4 players",
    matches: [],
  },
  {
    id: 4,
    label: "Round 4 – Final",
    matches: [
      {
        id: "r4m1",
        roundIndex: 3,
        playerA: { id: "f1a", name: "Winner Semi 1" },
        playerB: { id: "f1b", name: "Winner Semi 2" },
        score: { a: 2, b: 0 },
        status: "finished",
        winner: "A",
      },
    ],
  },
];

/* ---------------------------------------------
   PLACEMENT HELPER
--------------------------------------------- */
function getPlacementInfo(formatKey, roundIndex, isWinner, isFinal) {
  const cfg = FORMAT_CONFIG[formatKey]?.payouts;
  if (!cfg) return null;

  if (!isWinner) {
    if (roundIndex === 0) return { label: "9th–16th place", amount: cfg.others };
    if (roundIndex === 1)
      return { label: "5th–8th place", amount: cfg.fifthToEighth };
    if (roundIndex === 2)
      return { label: "3rd–4th place", amount: cfg.thirdFourth };
    if (roundIndex === 3) return { label: "2nd place", amount: cfg.second };
  }

  if (isWinner && isFinal) {
    return { label: "Champion", amount: cfg.first };
  }

  return null;
}

/* ---------------------------------------------
   MAIN COMPONENT — CLEAN, FINALLY
--------------------------------------------- */
export default function TournamentBracket() {
  const { gameType } = useParams();
  const navigate = useNavigate();

  const formatKey =
    gameType === "competitive" ||
    gameType === "wta" ||
    gameType === "flattened"
      ? gameType
      : "flattened";

  const [rounds] = useState(MOCK_ROUNDS);
  const [currentRoundIndex] = useState(0);

  const currentRound = useMemo(
    () => rounds[currentRoundIndex],
    [rounds, currentRoundIndex]
  );

  /* ---------------------------------------------
     TOURNAMENT COMPLETION DETECTION
  --------------------------------------------- */
  useEffect(() => {
    const finalMatch = rounds[3].matches[0];
    if (!finalMatch) return;

    const done =
      finalMatch.status === "finished" && finalMatch.winner !== null;

    if (!done) return;

    const winner =
      finalMatch.winner === "A" ? finalMatch.playerA : finalMatch.playerB;

    awardTournamentResult({
      winnerId: winner.id,
      winnerName: winner.name,
      format: formatKey,
    });

    alert(`🏆 ${winner.name} wins the tournament!`);

    setTimeout(() => navigate("/home"), 5000);
  }, [rounds, navigate, formatKey]);

  /* ---------------------------------------------
     RENDER UI
  --------------------------------------------- */
  return (
    <div className="br-root">
      <div className="br-bg-glow" />

      <header className="br-header">
        <h1 className="br-title">{FORMAT_CONFIG[formatKey].label}</h1>
        <p className="br-subtitle">{currentRound.label}</p>
      </header>

      {/* DESKTOP BRACKET */}
      <div className="br-desktop-wrapper">
        <div className="br-desktop-bracket">
          {rounds.map((round, idx) => (
            <div
              key={round.id}
              className={`br-column ${
                idx === currentRoundIndex ? "br-column--current" : ""
              }`}
            >
              <div className="br-column-label">{round.label}</div>
              <div className="br-column-matches">
                {round.matches.map((m) => (
                  <BracketMatch
                    key={m.id}
                    match={m}
                    formatKey={formatKey}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="br-connector-layer" />
        </div>
      </div>

      {/* MOBILE */}
      <main className="br-mobile-wrapper">
        <div className="br-mobile-header">
          <span className="br-mobile-round">{currentRound.label}</span>
          <span className="br-mobile-round-note">Showing current round only</span>
        </div>

        <div className="br-mobile-match-list">
          {currentRound.matches.map((m) => (
            <MobileMatchLine
              key={m.id}
              match={m}
              formatKey={formatKey}
              onClick={() => playSound(CLICK_SOUND, 0.4)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ---------------------------------------------
   SUBCOMPONENTS
--------------------------------------------- */

function BracketMatch({ match, formatKey }) {
  const { playerA, playerB, score, status, winner, roundIndex } = match;

  const isFinal = roundIndex === 3;
  const isAWinner = winner === "A";
  const isBWinner = winner === "B";

  const placementA =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, isAWinner, isFinal)
      : null;

  const placementB =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, isBWinner, isFinal)
      : null;

  return (
    <div className="br-match">
      <div className="br-match-body">
        {/* PLAYER A */}
        <div
          className={`br-player-row ${
            status === "finished"
              ? isAWinner
                ? "br-row--winner"
                : "br-row--loser"
              : ""
          }`}
        >
          <span className="br-player-name">{playerA.name}</span>
          {status === "finished" && (
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

        {/* PLAYER B */}
        <div
          className={`br-player-row ${
            status === "finished"
              ? isBWinner
                ? "br-row--winner"
                : "br-row--loser"
              : ""
          }`}
        >
          <span className="br-player-name">{playerB.name}</span>
          {status === "finished" && (
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
      </div>
    </div>
  );
}

function MobileMatchLine({ match, formatKey, onClick }) {
  const { playerA, playerB, status, score, winner, roundIndex } = match;

  const isFinal = roundIndex === 3;

  const placementA =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, winner === "A", isFinal)
      : null;

  const placementB =
    status === "finished"
      ? getPlacementInfo(formatKey, roundIndex, winner === "B", isFinal)
      : null;

  return (
    <button className="br-mobile-match" onClick={onClick}>
      <div className="br-mobile-line">
        <div className="br-mobile-player-block">
          <div className="br-mobile-player-name-row">
            {playerA.name}
            {status === "finished" && (
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

          <div className="br-mobile-player-name-row">
            {playerB.name}
            {status === "finished" && (
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
      </div>
    </button>
  );
}
