// src/components/AuthGuard.jsx
import React, { useEffect, useState } from "react";
import { onAuth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

export default function AuthGuard({ children }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuth((user) => {
      if (!user) navigate("/login");
      else setReady(true);
    });
    return () => unsub();
  }, [navigate]);

  if (!ready) return null; // prevents flicker
  return children;
}
