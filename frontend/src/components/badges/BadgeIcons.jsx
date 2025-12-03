// src/components/badges/BadgeIcons.jsx
import React from "react";

/* ==========================================================================
   GAMIFIED NEON BADGE ICONS (Style C — Shields, Wings, Stars, Crowns)
   ========================================================================== */

// Utility wrapper for consistent glow
function BadgeWrapper({ color = "#00eaff", children }) {
  return (
    <div
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}55`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: `0 0 12px ${color}55, inset 0 0 12px ${color}22`,
      }}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   9 BASE BADGES (Casual / Pro / Elite × Flattened / Competitive / WTA)
   ========================================================================== */

export const Badge_Casual_Flattened = () => (
  <BadgeWrapper color="#00f0ff">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#00eaff">
      <path d="M12 2l7 4v5c0 5-3 9-7 11-4-2-7-6-7-11V6l7-4z" />
      <circle cx="12" cy="12" r="3" fill="#00eaff" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Casual_Competitive = () => (
  <BadgeWrapper color="#00f0ff">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#00eaff">
      <path d="M5 3l7 2 7-2-2 7 2 7-7-2-7 2 2-7-2-7z" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Casual_WTA = () => (
  <BadgeWrapper color="#00f0ff">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#00eaff">
      <path d="M12 2l4 4h4l-2 6 2 6h-4l-4 4-4-4H4l2-6-2-6h4l4-4z" />
    </svg>
  </BadgeWrapper>
);

// PRO tier badges (orange neon)
export const Badge_Pro_Flattened = () => (
  <BadgeWrapper color="#ffb347">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#ffb347">
      <path d="M12 1l6 5v6c0 5-3 9-6 11-3-2-6-6-6-11V6l6-5z" />
      <path d="M12 10l3 6h-6l3-6z" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Pro_Competitive = () => (
  <BadgeWrapper color="#ffb347">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#ffb347">
      <path d="M12 2l7 4-2 7 2 7-7 4-7-4 2-7-2-7 7-4z" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Pro_WTA = () => (
  <BadgeWrapper color="#ffb347">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#ffb347">
      <path d="M12 2l5 3h4l-2 7 2 7h-4l-5 3-5-3H4l2-7-2-7h4l5-3z" />
      <circle cx="12" cy="12" r="2.2" fill="#ffb347" />
    </svg>
  </BadgeWrapper>
);

// ELITE tier badges (magenta neon)
export const Badge_Elite_Flattened = () => (
  <BadgeWrapper color="#ff3df7">
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#ff3df7">
      <path d="M12 1l6 4v6c0 6-3 10-6 12-3-2-6-6-6-12V5l6-4z" />
      <path d="M9 12h6l-3 5-3-5z" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Elite_Competitive = () => (
  <BadgeWrapper color="#ff3df7">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff3df7">
      <path d="M12 2l5 4 5 2-2 6 2 6-5 2-5 4-5-4-5-2 2-6-2-6 5-2 5-4z" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Elite_WTA = () => (
  <BadgeWrapper color="#ff3df7">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff3df7">
      <path d="M12 2l6 3h4l-2 7 2 7h-4l-6 3-6-3H4l2-7-2-7h4l6-3z" />
      <path d="M12 8l3 4-3 4-3-4 3-4z" />
    </svg>
  </BadgeWrapper>
);

/* ==========================================================================
   TRIAD BADGES (Earn all 3 formats in a tier)
   ========================================================================== */

export const Badge_Triad_Casual = () => (
  <BadgeWrapper color="#4dfff0">
    <svg width="34" height="34" viewBox="0 0 24 24" fill="#4dfff0">
      <path d="M12 2l6 3 4 6-4 6-6 3-6-3-4-6 4-6 6-3z" />
      <path d="M12 7l3 5-3 5-3-5 3-5z" fill="#4dfff0" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Triad_Pro = () => (
  <BadgeWrapper color="#ffc766">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="#ffc766">
      <path d="M12 1l7 4 4 7-4 7-7 4-7-4-4-7 4-7 7-4z" />
      <circle cx="12" cy="12" r="3" fill="#ffc766" />
    </svg>
  </BadgeWrapper>
);

export const Badge_Triad_Elite = () => (
  <BadgeWrapper color="#ff66ff">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="#ff66ff">
      <path d="M12 1l7 4 4 7-4 7-7 4-7-4-4-7 4-7 7-4z" />
      <path d="M12 6l4 6-4 6-4-6 4-6z" fill="#ff66ff" />
    </svg>
  </BadgeWrapper>
);

/* ==========================================================================
   ALL STAR BADGE (Earn Triad in all 3 tiers)
   ========================================================================== */

export const Badge_AllStar = () => (
  <BadgeWrapper color="#fff06b">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff06b">
      <path d="M12 2l4 6 7 1-5 5 1 7-7-3-7 3 1-7-5-5 7-1 4-6z" />
      <path
        d="M12 2l1.5 4.5L18 8l-4 3 1 4-3-2-3 2 1-4-4-3 4.5-1.5L12 2z"
        fill="#fff06b"
      />
    </svg>
  </BadgeWrapper>
);

/* ==========================================================================
   MAPPING FOR ID → COMPONENT
   ========================================================================== */

export const BADGE_ICON_MAP = {
  badge_casual_flattened: Badge_Casual_Flattened,
  badge_casual_competitive: Badge_Casual_Competitive,
  badge_casual_wta: Badge_Casual_WTA,

  badge_pro_flattened: Badge_Pro_Flattened,
  badge_pro_competitive: Badge_Pro_Competitive,
  badge_pro_wta: Badge_Pro_WTA,

  badge_elite_flattened: Badge_Elite_Flattened,
  badge_elite_competitive: Badge_Elite_Competitive,
  badge_elite_wta: Badge_Elite_WTA,

  badge_triad_casual: Badge_Triad_Casual,
  badge_triad_pro: Badge_Triad_Pro,
  badge_triad_elite: Badge_Triad_Elite,

  badge_allstar: Badge_AllStar,
};
