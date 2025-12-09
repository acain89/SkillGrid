// src/components/WithdrawPanel.jsx

import React, { useState } from "react";
import "./withdraw.css"; // optional styles
import { auth } from "../services/firebase";

export default function WithdrawPanel({ balance, onClose }) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null); // success / error message
  const [loading, setLoading] = useState(false);

  async function handleWithdraw() {
    setStatus(null);

    const amt = Number(amount);

    if (!amt || amt <= 0) {
      setStatus("Enter a valid amount.");
      return;
    }

    if (amt > balance) {
      setStatus("You cannot withdraw more than your vault balance.");
      return;
    }

    if (amt < 30) {
      setStatus("Minimum withdrawable amount is $30.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setStatus("You must be logged in.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${import.meta.env.VITE_API_BASE}/vault/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          amount: amt
        })
      });

      const json = await res.json();

      if (!json.ok) {
        setStatus(json.error || "Withdraw failed.");
        setLoading(false);
        return;
      }

      setStatus(`Success! $${amt} sent to your Stripe account.`);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setStatus("Withdraw failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="withdraw-panel-backdrop">
      <div className="withdraw-panel">
        <h2>Withdraw Funds</h2>
        <p className="withdraw-balance">Vault Balance: <strong>${balance}</strong></p>

        <input
          className="withdraw-input"
          type="number"
          min="1"
          placeholder="Amount to withdraw"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        {status && <div className="withdraw-status">{status}</div>}

        <div className="withdraw-buttons">
          <button
            className="withdraw-btn"
            onClick={handleWithdraw}
            disabled={loading}
          >
            {loading ? "Processing..." : "Withdraw"}
          </button>

          <button className="withdraw-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
