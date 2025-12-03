// src/components/ProfilePanel.jsx
import React from "react";
import "./ProfilePanel.css";
import { playSound } from "../core/sound";
import { BADGE_ICON_MAP } from "../components/badges/BadgeIcons";   // ✅ NEW IMPORT

const CLICK_SOUND = "/sounds/ui-click.mp3";

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function ProfilePanel({
  profile,
  vaultBalance,
  joinedTournament,
  badges = [],
  equippedBadge,
  onEquipBadge = () => {},
  onCashout = () => {},
  onClose,
}) {
  const username = profile?.username || "Player";
  const email = profile?.email || "player@example.com";

  return (
    <div
      className="pp-backdrop"
      onClick={() => {
        playSound(CLICK_SOUND, 0.5);
        onClose();
      }}
    >
      <div
        className="pp-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="pp-header">
          <div className="pp-avatar">
            {username.charAt(0).toUpperCase()}
          </div>

          <div className="pp-header-info">
            <div className="pp-username">
              {username}
            </div>

            <div className="pp-email">{email}</div>
            <div className="pp-membersince">Member Since: Jan 2025</div>
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="pp-section">
          <h3 className="pp-section-title">ACCOUNT</h3>

          <div className="pp-row">
            <span className="pp-row-label">Vault Balance</span>
            <span className="pp-row-value">${vaultBalance.toFixed(2)}</span>
          </div>

          {/* CASHOUT BUTTON */}
          <button
            className={`pp-cashout-btn ${vaultBalance >= 30 ? "active" : ""}`}
            disabled={vaultBalance < 30}
            onClick={() => {
              if (vaultBalance >= 30) {
                playSound(CLICK_SOUND, 0.5);
                onCashout();
              }
            }}
          >
            Cash Out (Min $30)
          </button>

          <div className="pp-row">
            <span className="pp-row-label">Active Tournament</span>
            <span className="pp-row-value">
              {joinedTournament?.label || "None"}
            </span>
          </div>
        </div>

        {/* TOURNAMENT OVERVIEW */}
        <div className="pp-section">
          <h3 className="pp-section-title">TOURNAMENT OVERVIEW</h3>

          <div className="pp-row">
            <span className="pp-row-label">Tournaments Played</span>
            <span className="pp-row-value">{profile?.stats?.played ?? 0}</span>
          </div>

          <div className="pp-row">
            <span className="pp-row-label">Tournaments Won</span>
            <span className="pp-row-value">{profile?.stats?.wins ?? 0}</span>
          </div>

          <div className="pp-row">
            <span className="pp-row-label">Top-4 Finishes</span>
            <span className="pp-row-value">{profile?.stats?.top4 ?? 0}</span>
          </div>

          <div className="pp-row">
            <span className="pp-row-label">Win Rate</span>
            <span className="pp-row-value">{profile?.stats?.winRate ?? "0%"}</span>
          </div>

          <div className="pp-row">
            <span className="pp-row-label">Average Placement</span>
            <span className="pp-row-value">{profile?.stats?.avgPlace ?? "-"}</span>
          </div>

          <div className="pp-row">
            <span className="pp-row-label">Total Winnings</span>
            <span className="pp-row-value">${profile?.stats?.winnings ?? 0}</span>
          </div>

          <div className="pp-row">
            <span className="pp-row-label">Biggest Win</span>
            <span className="pp-row-value">${profile?.stats?.biggest ?? 0}</span>
          </div>

          <div className="pp-row">
            <span className="pp-row-label">Consecutive Wins</span>
            <span className="pp-row-value">{profile?.stats?.streak ?? 0}</span>
          </div>
        </div>

        {/* FORMATS */}
        <div className="pp-section">
          <h3 className="pp-section-title">FORMATS</h3>

          <div className="pp-grid-3">
            <div className="pp-card pp-cyan">
              <div className="pp-card-title">CASUAL</div>
              <div className="pp-row"><span>Played</span><span>{profile?.formats?.casual?.played ?? 0}</span></div>
              <div className="pp-row"><span>Wins</span><span>{profile?.formats?.casual?.wins ?? 0}</span></div>
              <div className="pp-row"><span>Avg Placement</span><span>{profile?.formats?.casual?.avg ?? "-"}</span></div>
            </div>

            <div className="pp-card pp-orange">
              <div className="pp-card-title">PRO</div>
              <div className="pp-row"><span>Played</span><span>{profile?.formats?.pro?.played ?? 0}</span></div>
              <div className="pp-row"><span>Wins</span><span>{profile?.formats?.pro?.wins ?? 0}</span></div>
              <div className="pp-row"><span>Avg Placement</span><span>{profile?.formats?.pro?.avg ?? "-"}</span></div>
            </div>

            <div className="pp-card pp-magenta">
              <div className="pp-card-title">ELITE</div>
              <div className="pp-row"><span>Played</span><span>{profile?.formats?.elite?.played ?? 0}</span></div>
              <div className="pp-row"><span>Wins</span><span>{profile?.formats?.elite?.wins ?? 0}</span></div>
              <div className="pp-row"><span>Avg Placement</span><span>{profile?.formats?.elite?.avg ?? "-"}</span></div>
            </div>
          </div>
        </div>

        {/* BADGES */}
        <div className="pp-section">
          <h3 className="pp-section-title">BADGES</h3>

          <div className="pp-badges-grid selectable">
            {badges.length > 0 ? (
              badges.map((badgeId) => {
                const Icon = BADGE_ICON_MAP[badgeId];      // ✅ USE NEW ICON MAP

                return (
                  <div
                    key={badgeId}
                    className={
                      "pp-badge " +
                      (equippedBadge === badgeId ? "selected" : "earned")
                    }
                    onClick={() => {
                      playSound(CLICK_SOUND, 0.5);
                      onEquipBadge(badgeId);
                    }}
                  >
                    {Icon ? <Icon /> : <div className="pp-badge empty">?</div>}
                  </div>
                );
              })
            ) : (
              <div className="pp-badge empty">—</div>
            )}
          </div>
        </div>

        {/* META */}
        <div className="pp-section">
          <h3 className="pp-section-title">ACCOUNT META</h3>

          <div className="pp-row"><span>Account ID</span><span>{profile?.accountId || "—"}</span></div>
          <div className="pp-row"><span>Last Login</span><span>{profile?.lastLogin || "Today"}</span></div>
          <div className="pp-row"><span>Device</span><span>Desktop</span></div>
          <div className="pp-row"><span>Verification</span><span>Verified ✓</span></div>
        </div>

        {/* CLOSE */}
        <button
          className="pp-close-btn"
          onClick={() => {
            playSound(CLICK_SOUND, 0.5);
            onClose();
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
