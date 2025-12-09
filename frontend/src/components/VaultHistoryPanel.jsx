// src/components/VaultHistoryPanel.jsx

import React, { useState, useEffect } from "react";
import "./vaultHistory.css";
import { auth } from "../services/firebase";

export default function VaultHistoryPanel({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/vault/ledger/${user.uid}`
        );
        const json = await res.json();

        if (json.ok) {
          setItems(json.ledger || []);
        }
      } catch (err) {
        console.error("Ledger load error:", err);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="vh-backdrop">
      <div className="vh-panel">
        <h2>Vault History</h2>

        {loading && <p className="vh-loading">Loading...</p>}

        {!loading && items.length === 0 && (
          <p className="vh-empty">No transactions yet.</p>
        )}

        <ul className="vh-list">
          {items.map((item, index) => (
            <li key={index} className="vh-item">
              <div className="vh-row">
                <span className="vh-type">{item.type}</span>
                <span
                  className={`vh-amount ${item.amount > 0 ? "vh-green" : "vh-red"}`}
                >
                  {item.amount > 0 ? "+" : ""}
                  {item.amount}
                </span>
              </div>

              {item.note && <div className="vh-note">{item.note}</div>}

              <div className="vh-time">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>

        <button className="vh-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
