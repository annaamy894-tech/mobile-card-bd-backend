import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";
import BottomBar from "./BottomBar";

export default function MyAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", building: "", locality: "", region: "", city: "", area: "", address: "" });
  const [msg, setMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isMobile = window.innerWidth <= 768;
  const isAdmin = user?.role === "admin";

  useEffect(() => { if (user) setForm({ fullName: user.fullName || "", phone: user.username || "", building: user.building || "", locality: user.locality || "", region: user.region || "", city: user.city || "", area: user.area || "", address: user.address || "" }); }, [user]);
  useEffect(() => { const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const handleUpdate = (e) => { e.preventDefault(); api.put("/auth/profile", form).then(() => { setMsg("Profile updated!"); setTimeout(() => setMsg(""), 2000); }).catch(() => setMsg("Update failed")); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff", color: "#1a1a2e" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 3 };
  const regions = ["Dhaka", "Chattogram", "Khulna", "Rajshahi", "Sylhet", "Barishal", "Rangpur", "Mymensingh"];
  const navItemStyle = { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", margin: "2px 0", borderRadius: 10, cursor: "pointer", color: "#555", fontWeight: 500, fontSize: 13 };
  const ddItem = { padding: "9px 16px", cursor: "pointer", fontSize: 12, color: "#374151" };

  const fixedMenu = (
    <>
      <div onClick={() => { navigate("/"); closeMobileMenu(); }} style={navItemStyle}><span>🏠</span><span>Home</span></div>
      <div onClick={() => { navigate("/my-account"); closeMobileMenu(); }} style={navItemStyle}><span>👤</span><span>My Account</span></div>
      <div onClick={() => { navigate("/my-orders"); closeMobileMenu(); }} style={navItemStyle}><span>📦</span><span>My Orders</span></div>
      <div style={{ borderTop: "1px solid #eee", margin: "10px 0" }} />
      <div onClick={() => { logout(); navigate("/"); closeMobileMenu(); }} style={{ ...navItemStyle, color: "#ef4444" }}><span>🚪</span><span>Logout</span></div>
    </>
  );

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: isMobile ? 60 : 0 }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", padding: isMobile ? "8px 14px" : "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <img src="/logo/newaddlogo.png" alt="Mobile Card BD" onClick={() => navigate("/")} style={{ height: isMobile ? 44 : 56, cursor: "pointer" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{isMobile ? <button onClick={() => setMobileMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f5f5", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>☰</button> : (
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px", borderRadius: 8, background: "#f5f5f5" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</div><span style={{ fontWeight: 600, fontSize: 12, color: "#1a1a2e" }}>{user?.fullName?.split(" ")[0]}</span><span style={{ fontSize: 9, color: "#888" }}>▼</span></div>
            {showDropdown && (<div style={{ position: "absolute", top: 40, right: 0, background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "4px 0", minWidth: 190, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 200 }}><div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", cursor: "default" }}><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize", marginTop: 2 }}>{user?.role || "user"}</div></div><div onClick={() => { navigate("/"); setShowDropdown(false); }} style={ddItem}>🏠 Home</div>{isAdmin && <div onClick={() => { navigate("/dashboard"); setShowDropdown(false); }} style={ddItem}>📊 Dashboard</div>}<div onClick={() => { navigate("/my-account"); setShowDropdown(false); }} style={ddItem}>👤 My Account</div><div onClick={() => { navigate("/my-orders"); setShowDropdown(false); }} style={ddItem}>📦 My Orders</div><div onClick={() => { logout(); navigate("/"); setShowDropdown(false); }} style={{ ...ddItem, color: "#ef4444" }}>🚪 Logout</div></div>)}
          </div>
        )}</div>
      </header>

      {isMobile && user && mobileMenuOpen && <div onClick={closeMobileMenu} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250 }} />}
      {isMobile && user && (<aside style={{ width: 260, minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: mobileMenuOpen ? 0 : -260, bottom: 0, zIndex: 280, transition: "right 0.3s ease", boxShadow: mobileMenuOpen ? "-4px 0 24px rgba(0,0,0,0.2)" : "none" }}><div style={{ padding: "16px 18px", borderBottom: "1px solid #eee" }}><img src="/logo/newaddlogo.png" alt="Mobile Card BD" style={{ height: 38 }} /></div><nav style={{ flex: 1, padding: "16px 14px", overflow: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 16, background: "#f9fafb", borderRadius: 12 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</div><div><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{user?.role}</div></div></div>{isAdmin && <div onClick={() => { navigate("/dashboard"); closeMobileMenu(); }} style={navItemStyle}><span>📊</span><span>Dashboard</span></div>}{fixedMenu}</nav></aside>)}

      <div style={{ maxWidth: 700, margin: "0 auto", padding: isMobile ? "14px 12px 70px" : "24px 20px" }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Back</button>
        <h2 style={{ color: "#1a1a2e", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>👤 Delivery Information</h2>
        {msg && <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: msg.includes("success") ? "#ecfdf5" : "#fef2f2", color: msg.includes("success") ? "#059669" : "#dc2626", fontSize: 13, fontWeight: 600 }}>{msg}</div>}
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: isMobile ? 14 : 24 }}><form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 12 }}><div style={{ display: "flex", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Full Name</label><input name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} /></div><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Phone Number</label><input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} /></div></div><div style={{ display: "flex", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Building / House / Street</label><input name="building" value={form.building} onChange={handleChange} style={inputStyle} /></div><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Locality / Landmark</label><input name="locality" value={form.locality} onChange={handleChange} style={inputStyle} /></div></div><div style={{ display: "flex", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Region</label><select name="region" value={form.region} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}><option value="">Choose region</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select></div><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>City</label><input name="city" value={form.city} onChange={handleChange} style={inputStyle} /></div></div><div style={{ display: "flex", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Area</label><input name="area" value={form.area} onChange={handleChange} style={inputStyle} /></div><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Address</label><input name="address" value={form.address} onChange={handleChange} style={inputStyle} /></div></div><button type="submit" style={{ padding: "12px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}>💾 Save</button></form></div>
      </div>
      <BottomBar />
    </div>
  );
}