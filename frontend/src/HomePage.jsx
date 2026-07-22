import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";

const brands = ["All", "Apple", "Samsung", "Google", "OnePlus", "Xiaomi"];

const banners = [
  { desktop: "/Banner/banner-premium-d.png", mobile: "/Banner/banner-premium-m.png" },
  { desktop: "/Banner/banner-return-d.png", mobile: "/Banner/banner-return-m.png" },
  { desktop: "/Banner/banner-delivery-d.png", mobile: "/Banner/banner-delivery-m.png" },
];

const CARD_IMG = { width: "100%", height: "100%", objectFit: "cover" };

export default function HomePage() {
  const [phones, setPhones] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [filtered, setFiltered] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState("login");
  const [loginInput, setLoginInput] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginFullName, setLoginFullName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, login, signup } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => { api.get("/products").then(res => setPhones(res.data || [])).catch(() => {}); }, []);
  useEffect(() => { const t = setInterval(() => setActiveIndex(prev => (prev + 1) % banners.length), 4000); return () => clearInterval(t); }, []);
  useEffect(() => { const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  useEffect(() => { let result = [...phones]; if (selectedBrand !== "All") result = result.filter(p => p.brand === selectedBrand); if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())); setFiltered(result); }, [search, selectedBrand, phones]);

  const formatPrice = (p) => "৳" + p.toLocaleString("en-BD");
  const isAdmin = user?.role === "admin";
  const isHttpImage = (img) => img && (img.startsWith("http://") || img.startsWith("https://"));
  const handleLogin = async (e) => { e.preventDefault(); setLoginError(""); setLoginSuccess(""); const email = loginInput.includes("@") ? loginInput : loginInput + "@mobilecardbd.com"; try { await login(email, loginPassword); setShowLoginModal(false); resetLoginForm(); } catch (err) { setLoginError(err.response?.data?.message || "Login failed"); } };
  const handleSignup = async (e) => { e.preventDefault(); setLoginError(""); setLoginSuccess(""); if (loginPassword !== confirmPassword) return setLoginError("Passwords do not match"); try { await signup({ fullName: loginFullName, username: loginPhone, email: loginPhone + "@mobilecardbd.com", password: loginPassword }); setLoginSuccess("Account created! Please login."); setLoginMode("login"); } catch (err) { setLoginError(err.response?.data?.message || "Signup failed"); } };
  const resetLoginForm = () => { setLoginInput(""); setLoginPhone(""); setLoginPassword(""); setConfirmPassword(""); setLoginFullName(""); setLoginError(""); setLoginSuccess(""); setLoginMode("login"); };
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const inputS = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", color: "#1a1a2e" };
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
    <div style={{ background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#1a1a2e" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", padding: isMobile ? "8px 14px" : "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <img src="/logo/newaddlogo.png" alt="Mobile Card BD" onClick={() => navigate("/")} style={{ height: isMobile ? 44 : 56, cursor: "pointer" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isMobile ? (user ? <button onClick={() => setMobileMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f5f5", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>☰</button> : <button onClick={() => { resetLoginForm(); setShowLoginModal(true); }} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Sign In</button>) : (<>{user ? (
            <div style={{ position: "relative" }} ref={dropdownRef}><div onClick={() => setShowDropdown(!showDropdown)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px", borderRadius: 8, background: "#f5f5f5" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{user.fullName?.charAt(0)?.toUpperCase() || "U"}</div><span style={{ fontWeight: 600, fontSize: 12, color: "#1a1a2e" }}>{user.fullName?.split(" ")[0]}</span><span style={{ fontSize: 9, color: "#888" }}>▼</span></div>
              {showDropdown && (<div style={{ position: "absolute", top: 40, right: 0, background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "4px 0", minWidth: 190, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 200 }}><div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", cursor: "default" }}><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize", marginTop: 2 }}>{user.role || "user"}</div></div><div onClick={() => { navigate("/"); setShowDropdown(false); }} style={ddItem}>🏠 Home</div>{isAdmin && <div onClick={() => { navigate("/dashboard"); setShowDropdown(false); }} style={ddItem}>📊 Dashboard</div>}<div onClick={() => { navigate("/my-account"); setShowDropdown(false); }} style={ddItem}>👤 My Account</div><div onClick={() => { navigate("/my-orders"); setShowDropdown(false); }} style={ddItem}>📦 My Orders</div><div onClick={() => { logout(); navigate("/"); setShowDropdown(false); }} style={{ ...ddItem, color: "#ef4444" }}>🚪 Logout</div></div>)}
            </div>
          ) : <button onClick={() => { resetLoginForm(); setShowLoginModal(true); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Sign In</button>}</>)}
        </div>
      </header>

      {isMobile && user && mobileMenuOpen && <div onClick={closeMobileMenu} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250 }} />}
      {isMobile && user && (<aside style={{ width: 260, minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: mobileMenuOpen ? 0 : -260, bottom: 0, zIndex: 280, transition: "right 0.3s ease", boxShadow: mobileMenuOpen ? "-4px 0 24px rgba(0,0,0,0.2)" : "none" }}><div style={{ padding: "16px 18px", borderBottom: "1px solid #eee" }}><img src="/logo/newaddlogo.png" alt="Mobile Card BD" style={{ height: 38 }} /></div><nav style={{ flex: 1, padding: "16px 14px", overflow: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 16, background: "#f9fafb", borderRadius: 12 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{user.fullName?.charAt(0)?.toUpperCase() || "U"}</div><div><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{user.role}</div></div></div>{isAdmin && <div onClick={() => { navigate("/dashboard"); closeMobileMenu(); }} style={navItemStyle}><span>📊</span><span>Dashboard</span></div>}{fixedMenu}</nav></aside>)}

      {showLoginModal && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowLoginModal(false)}><div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? 20 : 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }} onClick={e => e.stopPropagation()}><button onClick={() => setShowLoginModal(false)} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button><div style={{ textAlign: "center", marginBottom: 20 }}><img src="/logo/newtopbarlogo.png" alt="Mobile Card BD" style={{ width: 180, height: "auto", marginBottom: 12 }} /><p style={{ color: "#888", fontSize: 13, margin: 0 }}>{loginMode === "login" ? "Sign in to your account" : "Join Mobile Card BD"}</p></div>{loginError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 12, textAlign: "center" }}>{loginError}</div>}{loginSuccess && <div style={{ background: "#ecfdf5", color: "#059669", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 12, textAlign: "center" }}>{loginSuccess}</div>}{loginMode === "login" ? (<form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}><input type="text" placeholder="Phone or Email" value={loginInput} onChange={e => setLoginInput(e.target.value)} required style={inputS} /><input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={inputS} /><button type="submit" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>Sign In</button></form>) : (<form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 10 }}><input type="text" placeholder="Full Name" value={loginFullName} onChange={e => setLoginFullName(e.target.value)} required style={inputS} /><input type="text" placeholder="Phone Number" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} required style={inputS} /><input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={inputS} /><input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputS} /><button type="submit" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>Create Account</button></form>)}<div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#888" }}>{loginMode === "login" ? (<>Don't have an account? <button onClick={() => { setLoginMode("signup"); setLoginError(""); setLoginSuccess(""); }} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 0 }}>Sign Up</button></>) : (<>Already have an account? <button onClick={() => { setLoginMode("login"); setLoginError(""); setLoginSuccess(""); }} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 0 }}>Sign In</button></>)}</div></div></div>)}

      <div style={{ width: "100%", maxWidth: 1300, margin: "0 auto", borderRadius: isMobile ? "0 0 20px 20px" : "0 0 32px 32px", overflow: "hidden", height: isMobile ? 200 : 360, position: "relative" }}>
        <img src={isMobile ? banners[activeIndex].mobile : banners[activeIndex].desktop} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
          {banners.map((_, i) => (<button key={i} onClick={() => setActiveIndex(i)} style={{ width: 7, height: 7, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: i === activeIndex ? "#fff" : "rgba(255,255,255,0.4)", boxShadow: i === activeIndex ? "0 0 8px rgba(255,255,255,0.7)" : "none", transition: "all 0.3s" }} />))}
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: isMobile ? "16px 12px" : "24px 20px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          <div style={{ flex: "1 1 200px", position: "relative" }}><span style={{ position: "absolute", left: 12, top: 11, fontSize: 14 }}>🔍</span><input type="text" placeholder="Search phones..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff" }} /></div>
          <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} style={{ padding: "10px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 13, background: "#fff", cursor: "pointer", outline: "none", fontWeight: 600, color: "#6366f1" }}>{brands.map(b => <option key={b} value={b}>{b === "All" ? "🔽 All Brands" : b}</option>)}</select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(160px, 1fr))" : "repeat(auto-fill, minmax(270px, 1fr))", gap: isMobile ? 12 : 20 }}>
          {filtered.map(p => (
            <div key={p._id} onClick={() => navigate(`/product/${p._id}`)} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", cursor: "pointer", transition: "transform 0.2s" }}>
              <div style={{ height: isMobile ? 140 : 180, background: `linear-gradient(135deg, ${p.color || '#6366f1'}22, ${p.color || '#6366f1'}44)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {isHttpImage(p.image) ? <img src={p.image} alt={p.name} loading="lazy" style={CARD_IMG} /> : <span style={{ fontSize: isMobile ? 44 : 68 }}>{p.image || "📱"}</span>}
              </div>
              <div style={{ padding: isMobile ? "12px 14px 14px" : "16px 18px 20px" }}>
                <div style={{ fontSize: 10, color: "#888", fontWeight: 600, textTransform: "uppercase" }}>{p.brand}</div>
                <h3 style={{ margin: "4px 0", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#1a1a2e" }}>{p.name}</h3>
                <p style={{ fontSize: 11, color: "#999", margin: "4px 0 8px" }}>{p.specs}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: "#6366f1" }}>{formatPrice(p.price)}</span>
                  <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>{formatPrice(p.originalPrice)}</span>
                  <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>Save {Math.round((1 - p.price / p.originalPrice) * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}><div style={{ fontSize: 36 }}>📭</div><p>No phones found</p></div>}
      </div>

      <footer style={{ background: "#1a1a2e", color: "#fff", padding: isMobile ? "32px 16px 24px" : "48px 24px 24px", marginTop: 40 }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 30 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <img src="/logo/taplogo.png" alt="Mobile Card BD" style={{ width: 28, height: 28, borderRadius: 6 }} />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Mobile Card BD</h4>
            </div>
            <p style={{ fontSize: 12, color: "#999", lineHeight: 1.7, marginBottom: 12 }}>Bangladesh's trusted marketplace for premium used phones. Save up to 40% on flagship devices.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#888" }}>📧 support@mobilecardbd.com</span>
            </div>
          </div>
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#ddd", textTransform: "uppercase", letterSpacing: 0.5 }}>Shop by Brand</h4>
            {["Apple iPhone", "Samsung Galaxy", "Google Pixel", "OnePlus", "Xiaomi", "All Brands"].map(b => (
              <p key={b} style={{ fontSize: 12, color: "#999", margin: "6px 0", cursor: "pointer" }}>{b}</p>
            ))}
          </div>
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#ddd", textTransform: "uppercase", letterSpacing: 0.5 }}>Customer Service</h4>
            {["My Account", "My Orders", "Track Order", "Return Policy", "Warranty Info", "Contact Us"].map(s => (
              <p key={s} style={{ fontSize: 12, color: "#999", margin: "6px 0", cursor: "pointer" }}>{s}</p>
            ))}
          </div>
          <div>
            <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#ddd", textTransform: "uppercase", letterSpacing: 0.5 }}>Quick Links</h4>
            {["Home", "All Products", "Premium Phones", "Budget Phones", "New Arrivals", "Special Offers"].map(q => (
              <p key={q} style={{ fontSize: 12, color: "#999", margin: "6px 0", cursor: "pointer" }}>{q}</p>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <span style={{ background: "#333", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>📱 App Store</span>
              <span style={{ background: "#333", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>▶ Google Play</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1300, margin: "24px auto 0", paddingTop: 16, borderTop: "1px solid #2a2a3e", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#666" }}>
          <span>© 2026 Mobile Card BD. All rights reserved.</span>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ cursor: "pointer" }}>Privacy Policy</span>
            <span style={{ cursor: "pointer" }}>Terms of Service</span>
            <span style={{ cursor: "pointer" }}>Sitemap</span>
          </div>
        </div>
      </footer>
    </div>
  );
}