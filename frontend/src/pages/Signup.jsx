// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import { playSound } from "../core/sound";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { auth, db, googleProvider } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CLICK_SOUND = "/sounds/ui-click.mp3";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ensureUsernameAvailable(usernameRaw) {
    const clean = usernameRaw.trim();
    if (!clean) throw new Error("Please choose a username.");

    const lower = clean.toLowerCase();
    const nameDocRef = doc(db, "usernames", lower);
    const snap = await getDoc(nameDocRef);

    if (snap.exists()) {
      throw new Error("That username is already taken.");
    }

    return { clean, lower, nameDocRef };
  }

  /* -------------------------------------------------------
     EMAIL/PASSWORD SIGNUP
  ------------------------------------------------------- */
  async function handleEmailSignup(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    playSound(CLICK_SOUND, 0.5);

    try {
      if (!email || !password || !username) {
        throw new Error("Please fill in all fields.");
      }

      const { clean, lower, nameDocRef } =
        await ensureUsernameAvailable(username);

      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = cred.user;

      await setDoc(doc(db, "users", user.uid), {
        username: clean,
        email: user.email,
        createdAt: Date.now(),
      });

      await setDoc(nameDocRef, { uid: user.uid });

      navigate("/home");
    } catch (err) {
      setError(err.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------------------------------
     GOOGLE SIGNUP WITH USERNAME PROMPT
  ------------------------------------------------------- */
  async function handleGoogleSignup() {
    setBusy(true);
    setError("");
    playSound(CLICK_SOUND, 0.5);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      const userDoc = doc(db, "users", user.uid);
      const snap = await getDoc(userDoc);

      let finalUsername = ""; // IMPORTANT FIX (forces prompt if blank)

      if (!snap.exists() || !snap.data().username) {
        while (!finalUsername) {
          const a = window.prompt("Choose a username:", "");
          if (a === null) throw new Error("Username required.");
          finalUsername = a.trim();
        }

        const { clean, lower, nameDocRef } =
          await ensureUsernameAvailable(finalUsername);

        await setDoc(userDoc, {
          username: clean,
          email: user.email,
          createdAt: Date.now(),
        });

        await setDoc(nameDocRef, { uid: user.uid });
      }

      navigate("/home");
    } catch (err) {
      setError(err.message || "Google signup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-triangle"></div>

      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>

        <form className="auth-form" onSubmit={handleEmailSignup}>
          <input
            className="auth-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

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
            {busy ? "Signing up…" : "Sign Up"}
          </button>
        </form>

        <button
          className="auth-btn auth-btn-google"
          onClick={handleGoogleSignup}
          disabled={busy}
        >
          <span className="auth-google-icon">G</span>
          Sign up with Google
        </button>

        <div className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-switch-link">
            Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
