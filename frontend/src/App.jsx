// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Pages */
import TierSelect from "./pages/TierSelect";     // NEW HOME SCREEN
import TierFormats from "./pages/TierFormats";   // RENAMED TournamentHome

import TournamentPage from "./pages/Tournament";
import Connect4Neon from "./pages/Connect4Neon";
import CheckersNeon from "./pages/CheckersNeon";
import GridTrap from "./pages/GridTrap";
import Landing from "./pages/Landing";
import TournamentBracket from "./pages/TournamentBracket";
import Rules from "./pages/Rules.jsx";
import Profile from "./pages/Profile.jsx";




/* Triathlon system */
import TriathlonMatch from "./triathlon/TriathlonMatch";

/* Auth pages */
import Login from "./pages/Login";
import Signup from "./pages/Signup";

/* Auth provider */
import { AuthProvider } from "./context/AuthContext";

/* Global CSS for Landing Page */
import "./pages/landing.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* 🌟 Landing page */}
          <Route path="/" element={<Landing />} />

          {/* 🔐 Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🏟️ NEW → Tier selection (Rookie/Pro/Elite) */}
          <Route path="/home" element={<TierSelect />} />

          {/* 🎯 When user selects a tier, show its formats */}
          <Route path="/tier/:tierId" element={<TierFormats />} />

          {/* 🧩 Old tournament page (still supported if needed) */}
          <Route
            path="/tournament/:gameType/:timeSlot"
            element={<TournamentPage />}
          />

          {/* 🧩 NEW tournament bracket */}
          <Route path="/bracket/:gameType" element={<TournamentBracket />} />

          {/* 🎮 Direct game routes (dev/testing only) */}
          <Route path="/connect4" element={<Connect4Neon />} />
          <Route path="/checkers" element={<CheckersNeon />} />
          <Route path="/gridtrap" element={<GridTrap />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rules" element={<Rules />} />


          {/* 🏆 Triathlon — full 3-game sequence */}
          <Route
            path="/triathlon/:formatKey/:matchId"
            element={<TriathlonMatch />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
