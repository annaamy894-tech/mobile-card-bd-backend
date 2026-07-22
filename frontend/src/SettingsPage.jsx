import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import api from "./api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [message, setMessage] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      setMessage("Password updated!");
      setCurrent(""); setNew("");
    } catch (err) { setMessage(err.response?.data?.message || "Failed"); }
  };

  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", marginBottom: 12 };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ color: "#1a1a2e", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Account Settings</h2>

      <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #eee" }}>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            { label: "Name", value: user?.fullName },
            { label: "Email", value: user?.email },
            { label: "Role", value: user?.role, capitalize: true },
            { label: "Tracking Code", value: user?.trackingCode || "N/A", mono: true },
            { label: "Member Since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f5f5f5" : "none" }}>
              <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", textTransform: item.capitalize ? "capitalize" : "none", fontFamily: item.mono ? "monospace" : "inherit" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #eee" }}>
        <h3 style={{ color: "#1a1a2e", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Change Password</h3>
        {message && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, background: message.includes("updated") ? "#ecfdf5" : "#fef2f2", color: message.includes("updated") ? "#059669" : "#dc2626", fontSize: 13, fontWeight: 600 }}>
            {message}
          </div>
        )}
        <form onSubmit={handlePasswordChange}>
          <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrent(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNew(e.target.value)} required style={inputStyle} />
          <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}