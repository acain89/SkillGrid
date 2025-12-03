// src/components/ChatBox.jsx
import React, { useState, useRef, useEffect } from "react";
import "./chat.css";

const EMOJIS = ["😀", "😂", "😢", "😡", "😮", "😎", "👍", "👎"];

export default function ChatBox({ onSend }) {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const logRef = useRef(null);

  const sendEmoji = (emoji) => {
    const newMsg = { id: Date.now(), text: emoji };

    setMessages((prev) => {
      const updated = [...prev, newMsg];
      return updated.slice(-4); // ← Only keep last 4 messages
    });

    if (typeof onSend === "function") onSend(emoji);
    setOpen(true);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatbox-root">
      {/* MESSAGE LOG */}
      {open && (
        <div className="chatbox-log" ref={logRef}>
          {messages.map((m) => (
            <div key={m.id} className="chatbox-msg">
              {m.text}
            </div>
          ))}
        </div>
      )}

      {/* EMOJI BAR */}
      <div className="chatbox-bar">
        {EMOJIS.map((e) => (
          <button
            key={e}
            className="chatbox-emoji-btn"
            onClick={() => sendEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
