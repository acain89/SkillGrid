// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import ProfilePanel from "../components/ProfilePanel";
import { playSound } from "../core/sound";

const CLICK_SOUND = "/sounds/ui-click.mp3";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [equippedBadge, setEquippedBadge] = useState(null);
  const [vaultBalance, setVaultBalance] = useState(0); // ⭐ REAL VAULT

  async function loadProfile() {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No user logged in");
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    /* ---------------------------------------------------------
       FIRST LOGIN → create minimal profile (vault = 0)
    --------------------------------------------------------- */
    if (!snap.exists()) {
      const newProfile = {
        username: user.email.split("@")[0],
        email: user.email,
        createdAt: Date.now(),

        // Vault controlled by backend — client cannot modify
        vault: 0,

        stats: {
          played: 0,
          wins: 0,
          top4: 0,
          winRate: "0%",
          avgPlace: 0,
          winnings: 0,
          biggest: 0,
          streak: 0,
        },

        formats: {
          casual: { played: 0, wins: 0, avg: "0" },
          pro: { played: 0, wins: 0, avg: "0" },
          elite: { played: 0, wins: 0, avg: "0" },
        },

        badges: [],
        equippedBadge: null,

        lastLogin: Date.now(),
      };

      await setDoc(ref, newProfile);
      setProfile(newProfile);
      setVaultBalance(0);
      setBadges([]);
      setEquippedBadge(null);
      setLoading(false);
      return;
    }

    /* ---------------------------------------------------------
       EXISTING PROFILE
    --------------------------------------------------------- */
    const data = snap.data();

    setProfile(data);
    setBadges(data.badges || []);
    setEquippedBadge(data.equippedBadge || null);

    // ⭐ REAL VAULT — pulled from server
    setVaultBalance(typeof data.vault === "number" ? data.vault : 0);

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return <div style={{ color: "white", padding: 40 }}>Loading…</div>;
  }

  if (!profile) {
    return <div style={{ color: "white", padding: 40 }}>No profile found.</div>;
  }

  /* ---------------------------------------------------------
     BADGE EQUIP HANDLER
  --------------------------------------------------------- */
  async function equipBadge(badgeId) {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid), {
      equippedBadge: badgeId,
    });

    setEquippedBadge(badgeId);
    playSound(CLICK_SOUND, 0.5);
  }

  /* ---------------------------------------------------------
     CASH-OUT HANDLER (UI ONLY — backend already ready)
  --------------------------------------------------------- */
  async function requestCashout() {
    if (vaultBalance < 30) {
      playSound(CLICK_SOUND, 0.5);
      alert("You need at least $30 to cash out.");
      return;
    }

    alert("Cash-out request submitted — Stripe integration coming next.");
  }

  return (
    <ProfilePanel
      profile={profile}
      vaultBalance={vaultBalance}   // ⭐ REAL BALANCE
      joinedTournament={profile.activeTournament || null}
      badges={badges}
      equippedBadge={equippedBadge}
      onEquipBadge={equipBadge}
      onCashout={requestCashout}
      onClose={() => window.history.back()}
    />
  );
}
