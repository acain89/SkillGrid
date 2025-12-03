import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* Correct triathlon versions */
import Connect4Tri from "./Connect4Tri";
import CheckersTri from "./CheckersTri";
import GridTrapTri from "./GridTrapTri";

import "./triathlon.css";

export default function TriathlonMatch() {
  const { formatKey, matchId } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState(0); 
  const [transitionTime, setTransitionTime] = useState(null);

  /* ----------------------------------------------
     AUTO 20 SECOND TRANSITION
  ------------------------------------------------*/
  useEffect(() => {
    if (transitionTime === null) return;

    if (transitionTime <= 0) {
      setTransitionTime(null);
      setStage((s) => s + 1);
      return;
    }

    const t = setTimeout(() => {
      setTransitionTime((t) => t - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [transitionTime]);

  /* ----------------------------------------------
     RENDER STAGES
  ------------------------------------------------*/
  function renderStage() {

    // Stage 0 → Connect 4
    if (stage === 0) {
      return (
        <Connect4Tri
          onMatchComplete={() => {
            setTransitionTime(20);
          }}
        />
      );
    }

    // Stage 1 → transition screen before Checkers
    if (stage === 1) {
      return (
        <TransitionScreen
          text="Checkers begins in"
          time={transitionTime}
        />
      );
    }

    // Stage 2 → Checkers
    if (stage === 2) {
      return (
        <CheckersTri
          onMatchComplete={() => {
            setTransitionTime(20);
          }}
        />
      );
    }

    // Stage 3 → transition before GridTrap
    if (stage === 3) {
      return (
        <TransitionScreen
          text="Grid-Trap begins in"
          time={transitionTime}
        />
      );
    }

    // Stage 4 → GridTrap
    if (stage === 4) {
      return (
        <GridTrapTri
          onMatchComplete={() => {
            setTimeout(() => {
              navigate(`/bracket/${formatKey}`);
            }, 2500);
          }}
        />
      );
    }

    return <div>Error</div>;
  }

  return (
    <div className="triathlon-wrapper">
      {renderStage()}
    </div>
  );
}

/* ----------------------------------------------
   TRANSiTION SCREEN
---------------------------------------------- */
function TransitionScreen({ text, time }) {
  return (
    <div className="triathlon-transition-screen">
      <h1>{text}</h1>
      <h2>{time}</h2>
    </div>
  );
}
