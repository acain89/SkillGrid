// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import { playSound } from "../core/sound";

import {
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";

import { auth, db, googleProvider } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CLICK_SOUND = "/sounds/ui-click.mp3";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* -------------------------------------------------------
     EMAIL/PASSWORD LOGIN
  ------------------------------------------------------- */
  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    playSound(CLICK_SOUND, 0.5);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      const userDoc = doc(db, "users", user.uid);
      let snap = null;

      try {
        snap = await getDoc(userDoc);
      } catch (err) {
        console.warn("Firestore read failed:", err);
      }

      if (!snap || !snap.exists()) {
        try {
          await setDoc(userDoc, {
            username: user.displayName || null,
            email: user.email,
            createdAt: Date.now(),
          });
        } catch (err) {
          console.warn("Firestore write failed:", err);
        }
      }

      navigate("/home");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------------------------------
     GOOGLE LOGIN (FIXED — NO UI BREAKS)
  ------------------------------------------------------- */
  async function handleGoogleLogin() {
    setError("");
    setBusy(true);
    playSound(CLICK_SOUND, 0.5);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      let snap = null;

      // Try reading Firestore user doc (DON'T break UI if it fails)
      try {
        snap = await getDoc(doc(db, "users", user.uid));
      } catch (err) {
        console.warn("Firestore read failed:", err);
      }

      // If user doc missing OR username missing → create
      if (!snap || !snap.exists() || !snap.data().username) {
        let finalUsername = user.displayName || "";

        // If missing username → prompt
        if (!finalUsername) {
          while (!finalUsername) {
            const namePrompt = window.prompt("Choose a username:", "");
            if (namePrompt === null) throw new Error("Username required.");
            finalUsername = namePrompt.trim();
          }
        }

        const lower = finalUsername.toLowerCase();
        const userDoc = doc(db, "users", user.uid);
        const nameDocRef = doc(db, "usernames", lower);

        try {
          // Check if username taken
          const nameSnap = await getDoc(nameDocRef);
          if (nameSnap.exists()) {
            throw new Error("That username is already taken.");
          }

          await setDoc(userDoc, {
            username: finalUsername,
            email: user.email,
            createdAt: Date.now(),
          });

          await setDoc(nameDocRef, { uid: user.uid });
        } catch (err) {
          console.warn("Firestore write failed:", err);
        }
      }

      // LOGIN SUCCESSFUL → MOVE TO HOME
      navigate("/home");

    } catch (err) {
      setError(err.message || "Google login failed.");
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------------------------------
     JSX RETURN
  ------------------------------------------------------- */
  return (
    <div className="auth-root">
      <div className="auth-triangle"></div>

      <div className="auth-card">
        <h1 className="auth-title">Login</h1>

        <form className="auth-form" onSubmit={handleEmailLogin}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="auth-error">{error}</div>}

          <button
            className="auth-btn auth-btn-primary"
            type="submit"
            disabled={busy}
          >
            {busy ? "Logging in…" : "Login"}
          </button>
        </form>

        <button
          className="auth-btn auth-btn-google"
          onClick={handleGoogleLogin}
          disabled={busy}
        >
          <span className="auth-google-icon">G</span>
          Sign in with Google
        </button>

        <div className="auth-switch">
          Need an account?{" "}
          <Link to="/signup" className="auth-switch-link">
            Sign up →
          </Link>
        </div>
      </div>
    </div>
  );
}
