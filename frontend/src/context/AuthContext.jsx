// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// 🔥 Added FCM helpers
import {
  requestFcmToken,
  saveFcmTokenToUser,
} from "../services/firebase";  // <-- IMPORTANT

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = getAuth();
  const db = getFirestore();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // ----------------------------------------------------------
        // Load Firestore profile (does NOT block login)
        // ----------------------------------------------------------
        let data = null;

        try {
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);
          data = snap.exists() ? snap.data() : null;
        } catch (err) {
          console.warn(
            "AuthContext: Firestore profile load failed (ignored):",
            err.message
          );
        }

        setProfile(data);

        // ----------------------------------------------------------
        // 🔥 NEW: Request & save device push token
        // ----------------------------------------------------------
        try {
          const token = await requestFcmToken();

          if (token) {
            await saveFcmTokenToUser(firebaseUser.uid, token);
            console.log(
              "AuthContext: FCM token saved for user:",
              firebaseUser.uid
            );
          } else {
            console.log("AuthContext: No FCM token available.");
          }
        } catch (err) {
          console.warn("AuthContext: FCM token save failed:", err.message);
        }

      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = { user, profile, loading };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
