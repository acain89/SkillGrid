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

  async function loadProfile() {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No user logged in");
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    // ⛔ FIRST LOGIN — create default profile
    if (!snap.exists()) {
      const newProfile = {
        username: user.email.split("@")[0],
        email: user.email,
        createdAt: Date.now(),

        // Vault
        vaultBalance: 0,

        // Stats (start zero)
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

        // Formats
        formats: {
          casual: { played: 0, wins: 0, avg: "0" },
          pro: { played: 0, wins: 0, avg: "0" },
          elite: { played: 0, wins: 0, avg: "0" },
        },

        // Badges
        badges: [],
        equippedBadge: null,

        // Misc
        lastLogin: Date.now(),
      };

      await setDoc(ref, newProfile);
      setProfile(newProfile);
      setBadges([]);
      setEquippedBadge(null);
      setLoading(false);
      return;
    }

    // ⬇ Existing profile
    const data = snap.data();

    setProfile(data);
    setBadges(data.badges || []);
    setEquippedBadge(data.equippedBadge || null);
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

  // 🔧 Handlers
  async function equipBadge(badgeId) {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid), {
      equippedBadge: badgeId,
    });

    setEquippedBadge(badgeId);
    playSound(CLICK_SOUND, 0.5);
  }

  async function requestCashout() {
    if (profile.vaultBalance < 30) {
      playSound(CLICK_SOUND, 0.5);
      return;
    }

    alert("Cash-out triggered — Stripe integration coming next.");
  }

  return (
    <ProfilePanel
      profile={profile}
      vaultBalance={profile.vaultBalance}
      joinedTournament={profile.activeTournament || null}
      badges={badges}
      equippedBadge={equippedBadge}
      onEquipBadge={equipBadge}
      onCashout={requestCashout}
      onClose={() => window.history.back()}
    />
  );
}
