// src/pages/Landing.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";
import LegalModal from "../components/LegalModal";

const LOGIN_ROUTE = "/login";
const SIGNUP_ROUTE = "/signup";

function LoadingScreen() {
  return (
    <div className="landing-root landing-loading">
      <div className="landing-bg-glow" />
      <div className="landing-loading-inner">
        <div className="landing-triangle landing-triangle--large" />
        <div className="landing-loading-text">Loading SkillGrid…</div>
      </div>
    </div>
  );
}

function LandingContent() {
  const navigate = useNavigate();
  const [legalVariant, setLegalVariant] = useState(null);

  const clickRoute = (route) => {
    // removed playSound — was causing crashes
    navigate(route);
  };

  const openLegal = (variant) => {
    // removed playSound — was causing crashes
    setLegalVariant(variant);
  };

  const closeLegal = () => setLegalVariant(null);

  return (
    <div className="landing-root">
      <div className="landing-bg-glow" />

      <main className="landing-main">
        <div className="landing-hero">
          <div className="landing-triangle" />
          <h1 className="landing-title">SKILLGRID</h1>

          <p className="landing-tagline">
            <strong>Fast. Fair. Skill-Based.</strong>
          </p>

          <p className="landing-description landing-description--tight">
            Compete in <strong>16-player tournaments</strong> to win{" "}
            <strong>instant cash prizes</strong>.
          </p>

          <p className="landing-description landing-description--micro">
            No randomness. No gambling. <strong>Just skill.</strong>
          </p>
        </div>

        <section className="landing-actions">
          <button
            className="landing-btn landing-btn--primary"
            onClick={() => clickRoute(LOGIN_ROUTE)}
          >
            Login
          </button>

          <button
            className="landing-btn landing-btn--secondary"
            onClick={() => clickRoute(SIGNUP_ROUTE)}
          >
            Create Account
          </button>

          <button
            className="landing-btn landing-btn--google"
            onClick={() => clickRoute(LOGIN_ROUTE)}
          >
            <span className="landing-google-icon">G</span>
            <span>Sign in with Google</span>
          </button>

          <p className="landing-legal-snippet">
            SkillGrid tournaments are 100% skill-based. No wagering, no
            randomness, no gambling mechanics.
          </p>
        </section>
      </main>

      <footer className="landing-footer">
        <button
          className="landing-footer-link"
          onClick={() => openLegal("terms")}
        >
          Terms
        </button>
        <span className="landing-footer-sep">•</span>
        <button
          className="landing-footer-link"
          onClick={() => openLegal("privacy")}
        >
          Privacy
        </button>
        <span className="landing-footer-sep">•</span>
        <button
          className="landing-footer-link"
          onClick={() => openLegal("legal")}
        >
          Legal
        </button>
      </footer>

      <LegalModal
        variant={legalVariant}
        isOpen={!!legalVariant}
        onClose={closeLegal}
      />
    </div>
  );
}

export default function Landing() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 1300);
    return () => clearTimeout(id);
  }, []);

  return loading ? <LoadingScreen /> : <LandingContent />;
}
