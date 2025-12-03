// src/components/WinnerBanner.jsx
import React, { useEffect, useState } from "react";
import "../pages/connect4Neon.css"; // shared styles

export default function WinnerBanner({ text, duration = 5000, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDone) setTimeout(onDone, 400); // allow fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDone]);

  return (
    <div className={`winner-banner-overlay ${visible ? "show" : "hide"}`}>
      <div className="winner-banner-box">
        {text}
      </div>
    </div>
  );
}
