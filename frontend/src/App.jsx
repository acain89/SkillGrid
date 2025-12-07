// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Pages */
import TierSelect from "./pages/TierSelect";
import TierFormats from "./pages/TierFormats";
import TournamentPage from "./pages/Tournament";
import Connect4Neon from "./pages/Connect4Neon";
import CheckersNeon from "./pages/CheckersNeon";
import GridTrap from "./pages/GridTrap";
import Landing from "./pages/Landing";
import TournamentBracket from "./pages/TournamentBracket";
import Rules from "./pages/Rules.jsx";
import Profile from "./pages/Profile.jsx";

/* Triathlon */
import TriathlonMatch from "./triathlon/TriathlonMatch";

/* Auth pages */
import Login from "./pages/Login";
import Signup from "./pages/Signup";

/* Global CSS */
import "./pages/landing.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Home */}
        <Route path="/home" element={<TierSelect />} />

        {/* Tier formats */}
        <Route path="/tier/:tierId" element={<TierFormats />} />

        {/* Old tournament */}
        <Route
          path="/tournament/:gameType/:timeSlot"
          element={<TournamentPage />}
        />

        {/* Bracket */}
        <Route path="/bracket/:gameType" element={<TournamentBracket />} />

        {/* Games */}
        <Route path="/connect4" element={<Connect4Neon />} />
        <Route path="/checkers" element={<CheckersNeon />} />
        <Route path="/gridtrap" element={<GridTrap />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rules" element={<Rules />} />

        {/* Triathlon */}
        <Route
          path="/triathlon/:formatKey/:matchId"
          element={<TriathlonMatch />}
        />

      </Routes>
    </BrowserRouter>
  );
}
