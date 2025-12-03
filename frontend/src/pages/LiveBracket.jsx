// src/pages/LiveBracket.jsx

import React from "react";
import "./liveBracket.css";

export default function LiveBracket({ bracket }) {
  if (!bracket) return <div className="lb-container">Loading…</div>;

  const roundNames = {
    1: "Round of 16",
    2: "Quarterfinals",
    3: "Semifinals",
    4: "Finals"
  };

  return (
    <div className="lb-container">
      <h1 className="lb-title">{bracket.gameType.toUpperCase()} BRACKET</h1>
      <h2 className="lb-sub">Live Tournament Status</h2>

      <div className="lb-bracket">
        {Object.keys(bracket.rounds).map((rKey) => {
          const round = bracket.rounds[rKey];
          const label = roundNames[rKey];

          return (
            <div key={rKey} className="lb-round">
              <h3 className="lb-round-title">{label}</h3>

              {round.map((match) => {
                const active = match.status === "active";
                const done = match.status === "finished";
                const waiting = match.status === "waiting";

                return (
                  <div
                    key={match.id}
                    className={`lb-match-card 
                      ${active ? "lb-active" : ""}
                      ${done ? "lb-finished" : ""}
                      ${waiting ? "lb-waiting" : ""}
                    `}
                  >
                    <div className="lb-names">
                      <span className="lb-p1">{match.p1.username}</span>
                      <span className="lb-vs">vs</span>
                      <span className="lb-p2">{match.p2.username}</span>
                    </div>

                    <div className="lb-score">
                      {match.wins.p1} - {match.wins.p2}
                    </div>

                    {match.status === "finished" && (
                      <div className="lb-winner-slide">
                        Winner → {match.winner.username}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
