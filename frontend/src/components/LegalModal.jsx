// src/components/LegalModal.jsx
import React from "react";
import { LEGAL_DOCS } from "./legalContent";
import "./legalModal.css";

export default function LegalModal({ variant, isOpen, onClose }) {
  if (!isOpen || !variant) return null;

  const doc = LEGAL_DOCS[variant];
  if (!doc) return null;

  const handleBackdrop = (e) => {
    if (e.target.classList.contains("legal-modal-backdrop")) {
      onClose();
    }
  };

  return (
    <div className="legal-modal-backdrop" onMouseDown={handleBackdrop}>
      <div className="legal-modal">
        <header className="legal-modal-header">
          <div className="legal-modal-title-block">
            <h2 className="legal-modal-title">{doc.title}</h2>
            <p className="legal-modal-updated">{doc.updated}</p>
          </div>
          <button className="legal-modal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="legal-modal-body">
          {doc.sections.map((section, idx) => (
            <section key={idx} className="legal-section">
              <h3 className="legal-section-heading">{section.heading}</h3>

              {Array.isArray(section.body) ? (
                section.body.map((paragraph, pIdx) => (
                  <p key={pIdx} className="legal-section-body">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="legal-section-body">{section.body}</p>
              )}
            </section>
          ))}
        </div>

        <footer className="legal-modal-footer">
          <button className="legal-modal-done-btn" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
