// src/pages/GridTrap.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import GridTrapBoard from "../components/GridTrapBoard";
import GridTrapPlayerCard from "../components/GridTrapPlayerCard";
import ChatBox from "../components/ChatBox.jsx";
import EliminationModal from "../components/EliminationModal";
import WinnerBanner from "../components/WinnerBanner";

import {
  createGridTrapMatch,
  getLegalMoves,
  getLegalBlocks,
  applyGridTrapTurn,
  PLAYER,
} from "../core/engines/gridTrap";

import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { reportMatchResult } from "../core/tournamentClient";

import "./gridTrap.css";

export default function GridTrap() {
  const navigate = useNavigate();
  const { tournamentId, roundIndex: roundParam, matchIndex: matchParam } =
    useParams();
  const [searchParams] = useSearchParams();

  // Triathlon set score coming into Grid-Trap
  const incomingSeriesP1 = Number(searchParams.get("s1") || 0);
  const incomingSeriesP2 = Number(searchParams.get("s2") || 0);

  const roundIndex = Number(roundParam || 0);
  const matchIndex = Number(matchParam || 0);

  const [match, setMatch] = useState(() => createGridTrapMatch());
  const [phase, setPhase] = useState("move"); // "move" | "block"
  const [selectedMove, setSelectedMove] = useState(null);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  // Bo3 inside Grid-Trap
  const [wins, setWins] = useState({ [PLAYER.A]: 0, [PLAYER.B]: 0 });

  const [xpGranted, setXpGranted] = useState(false);

  // Elimination modal state
  const [showElimModal, setShowElimModal] = useState(false);
  const [finalPlacement, setFinalPlacement] = useState(null);
  const [finalPrize, setFinalPrize] = useState(0);
  const [finalStatus, setFinalStatus] = useState(null); // "advance" | "eliminated" | "runner-up" | "champion"

  const [winnerBannerText, setWinnerBannerText] = useState("");
  const [winnerBannerDuration] = useState(3000);

  /* ---------------- XP HELPERS ---------------- */
  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function normalizeDailyXp(raw) {
    const todayKey = getTodayKey();

    const base = {
      dateKey: todayKey,
      tournamentsToday: 0,
      threeBonusGranted: false,
      top4BonusGranted: false,
    };

    if (!raw) return base;
    if (raw.dateKey !== todayKey) return base;

    return { ...base, ...raw, dateKey: todayKey };
  }

  async function awardGridTrapEntryXP() {
    if (xpGranted) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      const active = data.activeTournament;
      if (!active) return;

      if (active.entryXpGrantedGT) {
        setXpGranted(true);
        return;
      }

      const fee = active.entryFee || 0;
      let xp = 0;

      if (fee >= 20) xp = 20;
      else if (fee >= 10) xp = 10;
      else if (fee >= 5) xp = 5;

      let dailyXp = normalizeDailyXp(data.dailyXp);
      dailyXp.tournamentsToday = (dailyXp.tournamentsToday || 0) + 1;

      let xpDelta = xp;

      if (
        dailyXp.tournamentsToday >= 3 &&
        !dailyXp.threeBonusGranted
      ) {
        xpDelta += 10;
        dailyXp.threeBonusGranted = true;
      }

      const newXp = (data.xp || 0) + xpDelta;

      await updateDoc(ref, {
        xp: newXp,
        dailyXp,
        "activeTournament.entryXpGrantedGT": true,
      });

      setXpGranted(true);
    } catch (err) {
      console.warn("GridTrap XP award failed:", err.message);
    }
  }

  /* ---------------- MEMOIZED LEGAL ACTIONS ---------------- */
  const selectableMoves = useMemo(
    () =>
      phase === "move" && !match.winner
        ? getLegalMoves(match, match.currentPlayer)
        : [],
    [match, phase]
  );

  const selectableBlocks = useMemo(
    () =>
      phase === "block" && !match.winner
        ? getLegalBlocks(match, match.currentPlayer)
        : [],
    [match, phase]
  );

  /* ---------------- TRACK WINS + MATCH-END (BO3) ---------------- */
  useEffect(() => {
    if (!match.winner) return;

    setWins((prev) => {
      const updated = {
        ...prev,
        [match.winner]: (prev[match.winner] || 0) + 1,
      };

      const aWins = updated[PLAYER.A] || 0;
      const bWins = updated[PLAYER.B] || 0;

      if (aWins === 2 || bWins === 2) {
        handleSetOver(aWins > bWins ? PLAYER.A : PLAYER.B);
      } else {
        // Reset for next Grid-Trap board
        setTimeout(() => {
          setMatch(createGridTrapMatch());
          setPhase("move");
          setSelectedMove(null);
          setError("");
          setWinnerBannerText(
            `Player ${match.winner} wins this Grid-Trap game. Next game in 5…`
          );
        }, 500);
      }

      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.winner]);

  /* ---------------- FINAL SET OVER → report to backend ---------------- */
  async function handleSetOver(setWinner) {
    const setWinnerSide = setWinner === PLAYER.A ? 0 : 1;

    const finalSeriesP1 =
      incomingSeriesP1 + (setWinnerSide === 0 ? 1 : 0);
    const finalSeriesP2 =
      incomingSeriesP2 + (setWinnerSide === 1 ? 1 : 0);

    const overallWinnerSide =
      finalSeriesP1 > finalSeriesP2 ? 0 : 1;

    setWinnerBannerText(
      `Player ${setWinner} wins the Grid-Trap set and the match!`
    );

    if (!tournamentId) {
      // Local test mode — no backend call, just banner.
      return;
    }

    try {
      const result = await reportMatchResult({
        tournamentId,
        roundIndex,
        matchIndex,
        winnerSide: overallWinnerSide,
        gameType: "gridtrap",
      });

      const { status, placementLabel, prizeAmount } = result;

      setFinalPlacement(placementLabel || null);
      setFinalPrize(prizeAmount || 0);
      setFinalStatus(status);

      if (status === "advance") {
        // 10 second between-round countdown handled on bracket page.
        // Just return player to bracket.
        setTimeout(() => {
          navigate(`/tournament/${tournamentId}`);
        }, 3000);
      } else {
        // eliminated / runner-up / champion → show elimination modal
        setTimeout(() => {
          setShowElimModal(true);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to report tournament result:", err);
      setError("Failed to sync result. Please contact support.");
    }
  }

  /* ---------------- ANALYSIS PURCHASE HANDLER ---------------- */
  function handlePurchaseAnalysis() {
    console.log("GridTrap analysis purchase clicked");
    // TODO: Stripe + redirect to /analysis/:tournamentId
  }

  /* ---------------- CELL CLICK LOGIC ---------------- */
  function handleCellClick(row, col) {
    if (match.winner) return;

    // First valid interaction → award entry XP
    awardGridTrapEntryXP();

    if (phase === "move") {
      const isLegal = selectableMoves.some(
        (m) => m.row === row && m.col === col
      );
      if (!isLegal) {
        setError("Illegal move.");
        return;
      }
      setSelectedMove({ row, col });
      setPhase("block");
      setError("");
      return;
    }

    if (phase === "block") {
      const isLegal = selectableBlocks.some(
        (b) => b.row === row && b.col === col
      );
      if (!isLegal) {
        setError("Illegal block.");
        return;
      }

      try {
        const next = applyGridTrapTurn(match, {
          moveTo: selectedMove,
          blockAt: { row, col },
        });
        setMatch(next);
        setSelectedMove(null);
        setPhase("move");
        setError("");
      } catch (e) {
        console.error(e);
        setError(e.message || "Invalid turn.");
      }
    }
  }

  /* ---------------- RESET HELPERS ---------------- */
  function handleResetBoard() {
    setMatch(createGridTrapMatch());
    setPhase("move");
    setSelectedMove(null);
    setError("");
  }

  function handleResetWins() {
    setWins({ [PLAYER.A]: 0, [PLAYER.B]: 0 });
  }

  /* ---------------- STATUS TEXT ---------------- */
  const statusText = (() => {
    if (match.winner) {
      return `Player ${match.winner} wins this board${
        match.winReason ? ` (${match.winReason})` : ""
      }`;
    }
    return `Player ${match.currentPlayer}'s turn — ${
      phase === "move" ? "select a move" : "select a block"
    }`;
  })();

  const blocksPlacedA = match.blockedByPlayer[PLAYER.A].length;
  const blocksPlacedB = match.blockedByPlayer[PLAYER.B].length;

  const totalRoundsPlayed = (wins[PLAYER.A] || 0) + (wins[PLAYER.B] || 0);

  return (
    <div className="gridtrap-page">
      {winnerBannerText && (
        <WinnerBanner text={winnerBannerText} duration={winnerBannerDuration} />
      )}

      <div className="gridtrap-header">
        <h1>GRID-TRAP</h1>
        <p className="gridtrap-subtitle">
          Neon maze duel. Start in the center. Trap your opponent in the grid.
        </p>
        {tournamentId && (
          <p className="gridtrap-subtitle-small">
            Set 3 of 3 • Series coming in: {incomingSeriesP1}–
            {incomingSeriesP2}
          </p>
        )}
      </div>

      <div className="gridtrap-layout">
        {/* Left player card */}
        <GridTrapPlayerCard
          player={PLAYER.A}
          isActive={!match.winner && match.currentPlayer === PLAYER.A}
          wins={wins[PLAYER.A]}
          tokens={0}
          blocksPlaced={blocksPlacedA}
        />

        {/* Center board */}
        <div className="gridtrap-center">
          <GridTrapBoard
            match={match}
            phase={phase}
            selectableMoves={selectableMoves}
            selectableBlocks={selectableBlocks}
            onCellClick={handleCellClick}
          />
        </div>

        <ChatBox
          onSend={(emoji) => {
            console.log("Sent emoji:", emoji);
          }}
        />

        {/* Right column */}
        <div className="gridtrap-right">
          <GridTrapPlayerCard
            player={PLAYER.B}
            isActive={!match.winner && match.currentPlayer === PLAYER.B}
            wins={wins[PLAYER.B]}
            tokens={0}
            blocksPlaced={blocksPlacedB}
          />

          <div className="gridtrap-controls">
            <div className="gridtrap-status">{statusText}</div>

            {error && <div className="gridtrap-error">{error}</div>}

            <div className="gridtrap-buttons">
              <button className="gridtrap-btn" onClick={handleResetBoard}>
                New Game
              </button>
              <button
                className="gridtrap-btn gridtrap-btn--secondary"
                onClick={handleResetWins}
              >
                Reset Wins
              </button>
              <button
                className="gridtrap-btn gridtrap-btn--ghost"
                onClick={() => setShowRules(true)}
              >
                Rules
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sliding rules panel */}
      <div
        className={
          showRules
            ? "gridtrap-rules-panel gridtrap-rules-panel--open"
            : "gridtrap-rules-panel"
        }
      >
        <div className="gridtrap-rules-header">
          <h2>Grid-Trap Rules</h2>
          <button
            className="gridtrap-rules-close"
            onClick={() => setShowRules(false)}
          >
            ✕
          </button>
        </div>

        <div className="gridtrap-rules-body">
          <p>
            <strong>Objective:</strong> Trap your opponent so they have no legal
            moves left.
          </p>
          <ul>
            <li>The board is 9×9. Both robots start in the center.</li>
            <li>15–20 static walls appear at game start.</li>
            <li>Each turn: move → place one block.</li>
            <li>Blocks must extend from your chain (after first block).</li>
            <li>You lose if you start a turn with no legal moves.</li>
          </ul>
        </div>
      </div>

      {/* Elimination Modal */}
      <EliminationModal
        isOpen={showElimModal}
        onClose={() => {
          setShowElimModal(false);
          navigate("/home"); // tournament home / lobby
        }}
        placement={finalPlacement}
        prize={finalPrize}
        rounds={totalRoundsPlayed}
        defeated={totalRoundsPlayed}
        streak={Math.max(wins[PLAYER.A] || 0, wins[PLAYER.B] || 0)}
        onPurchase={handlePurchaseAnalysis}
        tier="casual" // TODO: replace with real tier if needed
      />
    </div>
  );
}
