import React from "react";

export default function LayoutShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #08111f 0, #02040a 40%, #000 100%)",
        color: "#e2fdfb",
        fontFamily: "'Rajdhani', system-ui, sans-serif",
        padding: "24px 16px"
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          borderRadius: 24,
          padding: 16,
          border: "1px solid rgba(0,255,200,0.15)",
          boxShadow: "0 0 40px rgba(0,255,200,0.12), 0 0 80px #000 inset"
        }}
      >
        {children}
      </div>
    </div>
  );
}
