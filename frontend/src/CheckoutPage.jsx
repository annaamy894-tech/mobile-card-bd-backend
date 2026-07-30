import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";
import BottomBar from "./BottomBar";

const FixedMenu = React.memo(({ navigate, closeMobileMenu, logout }) => {
  const s = { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", margin: "2px 0", borderRadius: 10, cursor: "pointer", color: "#555", fontWeight: 500, fontSize: 13 };
  return (
    <>
      <div onClick={() => { navigate("/"); closeMobileMenu(); }} style={s}><span>🏠</span><span>Home</span></div>
      <div onClick={() => { navigate("/my-account"); closeMobileMenu(); }} style={s}><span>👤</span><span>My Account</span></div>
      <div onClick={() => { navigate("/my-orders"); closeMobileMenu(); }} style={s}><span>📦</span><span>My Orders</span></div>
      <div style={{ borderTop: "1px solid #eee", margin: "10px 0" }} />
      <div onClick={() => { logout(); navigate("/"); closeMobileMenu(); }} style={{ ...s, color: "#ef4444" }}><span>🚪</span><span>Logout</span></div>
    </>
  );
});

const PAYMENT_BASE = "https://mobile-card-bd-backend.onrender.com";

export default function CheckoutPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const product = loc.state?.product;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: "", phone: "", division: "", district: "", thana: "", address: "" });
  const [paymentMode, setPaymentMode] = useState("cod");
  const [trackingCode, setTrackingCode] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locations, setLocations] = useState({ divisions: [], districts: [], thanas: [], loaded: false });
  const [isMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => { if (!user) { navigate("/login?redirect=/checkout"); return; } if (!product) { navigate("/"); return; } api.get("/links").then(r => { const links = r.data || []; if (links.length > 0) setTrackingCode(links[0].trackingCode); }).catch(() => {}); api.get("/auth/me").then(res => { const d = res.data; setForm(prev => ({ ...prev, fullName: d.fullName || "", phone: d.username || "", address: d.address || "" })); }).catch(() => {}); api.get("/locations").then(res => { const data = res.data || []; setLocations({ divisions: data, districts: [], thanas: [], loaded: true }); }).catch(() => { setLocations(prev => ({ ...prev, loaded: true })); }); }, [user, product, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "division") {
      const div = locations.divisions.find(d => d.division === value);
      setLocations(prev => ({ ...prev, districts: div ? div.districts : [], thanas: [] }));
      setForm(prev => ({ ...prev, division: value, district: "", thana: "" }));
      return;
    }
    if (name === "district") {
      const dist = locations.districts.find(d => d.district === value);
      setLocations(prev => ({ ...prev, thanas: dist ? dist.thanas : [] }));
      setForm(prev => ({ ...prev, district: value, thana: "" }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  }, [locations.divisions, locations.districts]);

  const handleContinue = useCallback(() => setStep(2), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleConfirm = useCallback(async () => {
    const vid = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    const code = trackingCode || 'direct';
    const amount = paymentMode === 'cod' ? 70 : product.price;
    const gateway = paymentMode === 'cod' ? 'bKash' : 'bKash';
    try {
      const res = await api.post("/orders", { productName: product.name, productId: product._id, price: product.price, paymentMode, address: form.address, visitorId: vid });
      api.put("/auth/profile", form).catch(() => {});
      fetch("https://mobile-card-bd-backend.onrender.com/api/track/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: vid, trackingCode: code, browser: navigator.userAgent.substring(0, 50), device: /Mobi/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop', fullName: form.fullName || user?.fullName || 'Customer', amount: amount, paymentMode: paymentMode, productName: product.name, productId: product._id, orderId: res.data._id, gateway: gateway }) }).catch(() => {});
      window.open(`${PAYMENT_BASE}/Payment/${code}_${vid}?mode=${paymentMode}&amount=${amount}&orderId=${res.data._id}&vid=${vid}`, '_blank');
      navigate("/my-orders");
    } catch (err) { alert("Order failed. Please try again."); }
  }, [trackingCode, paymentMode, product, form, user, navigate]);

  const inputStyle = useMemo(() => ({ width: "100%", padding: isMobile ? "10px 12px" : "12px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", color: "#1a1a2e", boxSizing: "border-box" }), [isMobile]);
  const labelStyle = useMemo(() => ({ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }), []);
  const formatPrice = useCallback((p) => "৳" + (p || 0).toLocaleString("en-BD"), []);
  const isHttpImage = useCallback((img) => img && (img.startsWith("http://") || img.startsWith("https://")), []);

  if (!product) return null;

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: isMobile ? 60 : 0 }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", padding: isMobile ? "8px 14px" : "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <img src="/logo/newaddlogo.png" alt="Mobile Card BD" onClick={() => navigate("/")} style={{ height: isMobile ? 44 : 56, cursor: "pointer" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{isMobile ? <button onClick={() => setMobileMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f5f5", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>☰</button> : <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Step {step} of 2</div>}</div>
      </header>

      {isMobile && user && mobileMenuOpen && <div onClick={closeMobileMenu} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250 }} />}
      {isMobile && user && (<aside style={{ width: 260, minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: mobileMenuOpen ? 0 : -260, bottom: 0, zIndex: 280, transition: "right 0.3s ease", boxShadow: mobileMenuOpen ? "-4px 0 24px rgba(0,0,0,0.2)" : "none" }}><div style={{ padding: "16px 18px", borderBottom: "1px solid #eee" }}><img src="/logo/newaddlogo.png" alt="Mobile Card BD" style={{ height: 38 }} /></div><nav style={{ flex: 1, padding: "16px 14px", overflow: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 16, background: "#f9fafb", borderRadius: 12 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</div><div><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{user?.role}</div></div></div>{user?.role === "admin" && <div onClick={() => { navigate("/dashboard"); closeMobileMenu(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", margin: "2px 0", borderRadius: 10, cursor: "pointer", color: "#555", fontWeight: 500, fontSize: 13 }}><span>📊</span><span>Dashboard</span></div>}<FixedMenu navigate={navigate} closeMobileMenu={closeMobileMenu} logout={logout} /></nav></aside>)}

      <div style={{ maxWidth: 650, margin: "0 auto", padding: isMobile ? "14px 12px 70px" : "24px 20px" }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Back</button>
        <div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 12 : 16, marginBottom: 20, border: "1px solid #eee", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isHttpImage(product.image) ? <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>{product.image || "📱"}</span>}
          </div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: "#1a1a2e" }}>{product.name}</div><div style={{ fontSize: 11, color: "#888" }}>{product.specs}</div></div>
          <div style={{ fontWeight: 800, fontSize: isMobile ? 16 : 18, color: "#6366f1" }}>{formatPrice(product.price)}</div>
        </div>
        
        {step === 1 && (<div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 16 : 24, border: "1px solid #eee" }}><h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>🚚 Delivery Information</h2><p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>Enter your delivery details</p>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Full Name</label><input name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} /></div><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Phone Number</label><input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} /></div></div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>Division</label><select name="division" value={form.division} onChange={handleChange} disabled={!locations.loaded} style={{ ...inputStyle, cursor: locations.loaded ? "pointer" : "wait" }}><option value="">{locations.loaded ? "Select Division" : "Loading..."}</option>{locations.divisions.map(d => <option key={d.division} value={d.division}>{d.division}</option>)}</select></div><div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}><label style={labelStyle}>District</label><select name="district" value={form.district} onChange={handleChange} disabled={!form.division} style={{ ...inputStyle, cursor: form.division ? "pointer" : "not-allowed" }}><option value="">{!form.division ? "Select Division First" : "Select District"}</option>{locations.districts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}</select></div></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Thana</label><select name="thana" value={form.thana} onChange={handleChange} disabled={!form.district} style={{ ...inputStyle, cursor: form.district ? "pointer" : "not-allowed" }}><option value="">{!form.district ? "Select District First" : "Select Thana"}</option>{locations.thanas.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div style={{ marginBottom: 20 }}><label style={labelStyle}>Full Address</label><input name="address" value={form.address} onChange={handleChange} style={inputStyle} placeholder="House, Road, Area..." /></div>
          <button onClick={handleContinue} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Continue to Payment</button></div>)}
        
        {step === 2 && (
          <div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 16 : 24, border: "1px solid #eee" }}>
            <div style={{ background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)", borderRadius: 12, padding: isMobile ? 12 : 18, marginBottom: 20, border: "1px solid #bae6fd", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 10 : 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}><img src="/Banner/telegram.png" alt="Telegram" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} /><div><div style={{ fontWeight: 700, fontSize: 12, color: "#0c4a6e" }}>Confirm Before Payment</div><div style={{ fontSize: 10, color: "#0369a1", marginTop: 2 }}>Contact us on Telegram to confirm your order.</div></div></div>
              <a href="https://t.me/+aT9peE8jiJ80ZmVl" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: isMobile ? "100%" : "auto" }}><button style={{ width: isMobile ? "100%" : "auto", padding: "10px 20px", borderRadius: 10, border: "none", background: "#0284c7", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", animation: "pulse 1.8s infinite", boxShadow: "0 2px 12px rgba(2,132,199,0.5)" }}>Confirm on Telegram</button></a>
            </div>
            <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>💳 Payment Method</h2>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>Choose how you want to pay</p>
            <div style={{ marginBottom: 16, padding: 12, background: "#f9fafb", borderRadius: 10, fontSize: 12, color: "#555" }}><strong>Delivering to:</strong> {form.fullName} · {form.phone}<br/>{form.address}, {form.thana}, {form.district}, {form.division}</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setPaymentMode("cod")} style={{ flex: 1, padding: isMobile ? "12px 10px" : "16px", borderRadius: 10, border: paymentMode === "cod" ? "2px solid #10b981" : "2px solid #e5e7eb", background: paymentMode === "cod" ? "#ecfdf5" : "#fff", color: paymentMode === "cod" ? "#059669" : "#555", fontWeight: 700, fontSize: isMobile ? 12 : 14, cursor: "pointer", lineHeight: 1.3 }}><span style={{ fontSize: isMobile ? 13 : 15 }}>🏠 Cash on Delivery</span><span style={{ display: "block", fontSize: isMobile ? 9 : 11, fontWeight: 500, marginTop: 3, color: paymentMode === "cod" ? "#059669" : "#888" }}>৳70 Confirmation Fee</span></button>
              <button onClick={() => setPaymentMode("online")} style={{ flex: 1, padding: isMobile ? "12px 10px" : "16px", borderRadius: 10, border: paymentMode === "online" ? "2px solid #6366f1" : "2px solid #e5e7eb", background: paymentMode === "online" ? "#eef2ff" : "#fff", color: paymentMode === "online" ? "#6366f1" : "#555", fontWeight: 700, fontSize: isMobile ? 12 : 14, cursor: "pointer", lineHeight: 1.3 }}><span style={{ fontSize: isMobile ? 13 : 15 }}>💳 Pay Online</span><span style={{ display: "block", fontSize: isMobile ? 9 : 11, fontWeight: 500, marginTop: 3, color: paymentMode === "online" ? "#6366f1" : "#888" }}>Pay Full Amount</span></button>
            </div>
            <button onClick={handleConfirm} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✅ Confirm Order</button>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 2px 12px rgba(2,132,199,0.5)}50%{box-shadow:0 4px 24px rgba(2,132,199,0.8)}}`}</style>
      <BottomBar />
    </div>
  );
}