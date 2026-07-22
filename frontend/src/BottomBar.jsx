import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = window.innerWidth <= 768;

  if (!isMobile) return null;

  const isHome = location.pathname === "/";
  if (isHome) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
      height: 56, background: "#fff", borderTop: "1px solid #e5e7eb",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      boxShadow: "0 -1px 6px rgba(0,0,0,0.06)", paddingBottom: "env(safe-area-inset-bottom)"
    }}>
      {/* Home Button */}
      <button onClick={() => navigate("/")} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        background: "none", border: "none", cursor: "pointer", padding: "6px 16px",
        color: "#555", fontSize: 10, fontWeight: 600
      }}>
        <span style={{ fontSize: 20 }}>🏠</span>
        <span>Home</span>
      </button>

      {/* Telegram Support Button */}
      <a href="https://t.me/+aT9peE8jiJ80ZmVl" target="_blank" rel="noopener noreferrer" style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        textDecoration: "none", cursor: "pointer", padding: "6px 16px",
        color: "#555", fontSize: 10, fontWeight: 600
      }}>
        <img src="/Banner/telegram.png" alt="Telegram" style={{ width: 22, height: 22, objectFit: "contain" }} />
        <span>Support</span>
      </a>
    </div>
  );
}