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

// ✅ Correct FCM import
import { initFcmForUser } from "../services/messaging";

const CLICK_SOUND = "/sounds/ui-click.mp3";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* -------------------------------------------------------
     FCM: Request + Save Token
  -------------------------------------------------------- */
  async function registerUserToken(uid) {
    try {
      console.log("🔔 Requesting FCM token…");
      const token = await initFcmForUser();

      if (!token) {
        console.warn("⚠️ No FCM token generated.");
        return;
      }

      console.log("FCM token stored for user:", uid);
    } catch (err) {
      console.warn("Failed to save token:", err);
    }
  }

  /* -------------------------------------------------------
     EMAIL/PASSWORD LOGIN
  -------------------------------------------------------- */
  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    playSound(CLICK_SOUND, 0.5);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      const userRef = doc(db, "users", user.uid);
      let snap = null;

      try {
        snap = await getDoc(userRef);
      } catch (err) {
        console.warn("Firestore read failed:", err);
      }

      if (!snap || !snap.exists()) {
        try {
          await setDoc(userRef, {
            username: user.displayName || null,
            email: user.email,
            createdAt: Date.now()
          });
        } catch (err) {
          console.warn("Firestore write failed:", err);
        }
      }

      // 🔔 Register push notification token
      await registerUserToken(user.uid);

      navigate("/home");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------------------------------
     GOOGLE LOGIN
  -------------------------------------------------------- */
  async function handleGoogleLogin() {
    setError("");
    setBusy(true);
    playSound(CLICK_SOUND, 0.5);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      const userRef = doc(db, "users", user.uid);
      let snap = null;

      try {
        snap = await getDoc(userRef);
      } catch (err) {
        console.warn("Firestore read failed:", err);
      }

      if (!snap || !snap.exists() || !snap.data().username) {
        let finalUsername = user.displayName || "";

        if (!finalUsername) {
          while (!finalUsername) {
            const namePrompt = window.prompt("Choose a username:", "");
            if (namePrompt === null) throw new Error("Username required.");
            finalUsername = namePrompt.trim();
          }
        }

        const unameLower = finalUsername.toLowerCase();
        const unameRef = doc(db, "usernames", unameLower);

        try {
          const nameSnap = await getDoc(unameRef);
          if (nameSnap.exists()) {
            throw new Error("That username is already taken.");
          }

          await setDoc(userRef, {
            username: finalUsername,
            email: user.email,
            createdAt: Date.now()
          });

          await setDoc(unameRef, { uid: user.uid });
        } catch (err) {
          console.warn("Firestore username write failed:", err);
        }
      }

      // 🔔 Save notification token
      await registerUserToken(user.uid);

      navigate("/home");
    } catch (err) {
      setError(err.message || "Google login failed.");
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------------------------------
     JSX RETURN
  -------------------------------------------------------- */
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
