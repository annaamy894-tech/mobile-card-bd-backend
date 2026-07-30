import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";
import BottomBar from "./BottomBar";

const PAYMENT_BASE = "https://mobile-card-bd-backend.onrender.com";

export default function MyOrders() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const dropdownRef = useRef(null);
  const isMobile = window.innerWidth <= 768;
  const isAdmin = user?.role === "admin";

  useEffect(() => { api.get("/orders/my").then(res => setOrders(res.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { api.get("/links").then(r => { const links = r.data || []; if (links.length > 0) setTrackingCode(links[0].trackingCode); }).catch(() => {}); }, []);
  useEffect(() => { const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const handleDelete = (id) => { if (!confirm("Delete this order?")) return; api.delete(`/orders/${id}`).then(() => setOrders(prev => prev.filter(o => o._id !== id))).catch(() => {}); };
  const getPaymentStatus = (o) => { if (o.paymentStatus === "success") return "success"; if (o.paymentStatus === "failed") return "failed"; return "pending"; };
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const formatPrice = (p) => "৳" + (p || 0).toLocaleString("en-BD");
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const isHttpImage = (img) => img && (img.startsWith("http://") || img.startsWith("https://"));
  const cardStyle = { background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" };
  const statusConfig = { success: { bg: "#ecfdf5", color: "#059669", icon: "✅", label: "Payment Successful" }, failed: { bg: "#fef2f2", color: "#dc2626", icon: "❌", label: "Payment Failed" }, pending: { bg: "#fffbeb", color: "#d97706", icon: "⏳", label: "Payment Pending" } };
  const navItemStyle = { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", margin: "2px 0", borderRadius: 10, cursor: "pointer", color: "#555", fontWeight: 500, fontSize: 13 };
  const ddItem = { padding: "9px 16px", cursor: "pointer", fontSize: 12, color: "#374151" };

  const handleRetryPayment = async (order, mode) => { const vid = 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10); const code = trackingCode || 'direct'; const amount = mode === 'cod' ? 70 : order.price; const gateway = mode === 'cod' ? 'bKash' : 'bKash'; try { await api.patch(`/orders/${order._id}/status`, { paymentStatus: "pending" }); fetch("https://mobile-card-bd-backend.onrender.com/api/track/visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: vid, trackingCode: code, browser: navigator.userAgent.substring(0, 50), device: /Mobi/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop', fullName: user?.fullName || 'Customer', amount: amount, paymentMode: mode, productName: order.productName, productId: order.productId, orderId: order._id, gateway: gateway }) }).catch(() => {}); window.open(`${PAYMENT_BASE}/Payment/${code}_${vid}?mode=${mode}&amount=${amount}&orderId=${order._id}&vid=${vid}`, '_blank'); } catch (err) { alert("Payment failed. Please try again."); } };

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
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", padding: isMobile ? "8px 14px" : "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <img src="/logo/newaddlogo.png" alt="Mobile Card BD" onClick={() => navigate("/")} style={{ height: isMobile ? 44 : 56, cursor: "pointer" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{isMobile ? <button onClick={() => setMobileMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f5f5", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>☰</button> : (
          <div style={{ position: "relative" }} ref={dropdownRef}><div onClick={() => setShowDropdown(!showDropdown)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px", borderRadius: 8, background: "#f5f5f5" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</div><span style={{ fontWeight: 600, fontSize: 12, color: "#1a1a2e" }}>{user?.fullName?.split(" ")[0]}</span><span style={{ fontSize: 9, color: "#888" }}>▼</span></div>
            {showDropdown && (<div style={{ position: "absolute", top: 40, right: 0, background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "4px 0", minWidth: 190, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 200 }}><div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", cursor: "default" }}><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize", marginTop: 2 }}>{user?.role || "user"}</div></div><div onClick={() => { navigate("/"); setShowDropdown(false); }} style={ddItem}>🏠 Home</div>{isAdmin && <div onClick={() => { navigate("/dashboard"); setShowDropdown(false); }} style={ddItem}>📊 Dashboard</div>}<div onClick={() => { navigate("/my-account"); setShowDropdown(false); }} style={ddItem}>👤 My Account</div><div onClick={() => { navigate("/my-orders"); setShowDropdown(false); }} style={ddItem}>📦 My Orders</div><div onClick={() => { logout(); navigate("/"); setShowDropdown(false); }} style={{ ...ddItem, color: "#ef4444" }}>🚪 Logout</div></div>)}
          </div>
        )}</div>
      </header>

      {isMobile && user && mobileMenuOpen && <div onClick={closeMobileMenu} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250 }} />}
      {isMobile && user && (<aside style={{ width: 260, minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: mobileMenuOpen ? 0 : -260, bottom: 0, zIndex: 280, transition: "right 0.3s ease", boxShadow: mobileMenuOpen ? "-4px 0 24px rgba(0,0,0,0.2)" : "none" }}><div style={{ padding: "16px 18px", borderBottom: "1px solid #eee" }}><img src="/logo/newaddlogo.png" alt="Mobile Card BD" style={{ height: 38 }} /></div><nav style={{ flex: 1, padding: "16px 14px", overflow: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 16, background: "#f9fafb", borderRadius: 12 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</div><div><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{user?.role}</div></div></div>{isAdmin && <div onClick={() => { navigate("/dashboard"); closeMobileMenu(); }} style={navItemStyle}><span>📊</span><span>Dashboard</span></div>}{fixedMenu}</nav></aside>)}

      <div style={{ maxWidth: 560, margin: "0 auto", padding: isMobile ? "16px 14px 70px" : "16px 14px" }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Back</button>
        <div style={{ marginBottom: 16 }}><h2 style={{ color: "#1a1a2e", fontSize: 18, fontWeight: 700, margin: 0 }}>📦 My Orders</h2><p style={{ color: "#888", fontSize: 11, margin: "2px 0 0" }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p></div>
        {loading ? <div style={{ textAlign: "center", padding: 50, color: "#888" }}>Loading...</div> : orders.length === 0 ? (<div style={{ ...cardStyle, padding: 50, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 10, opacity: 0.3 }}>📭</div><p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>No orders yet</p><button onClick={() => navigate("/")} style={{ marginTop: 14, padding: "10px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Start Shopping</button></div>) : (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{orders.map((o, i) => { const ps = getPaymentStatus(o); const sc = statusConfig[ps]; return (<div key={o._id || i} style={cardStyle}><div style={{ background: sc.bg, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e5e7eb" }}><span style={{ fontSize: 16 }}>{sc.icon}</span><span style={{ fontWeight: 700, fontSize: 12, color: sc.color }}>{sc.label}</span><span style={{ marginLeft: "auto", fontSize: 11, color: "#888", fontFamily: "monospace" }}>#{o._id?.slice(-8)}</span></div><div style={{ padding: "14px 16px" }}><div style={{ display: "flex", gap: 14, marginBottom: 12 }}><div style={{ width: 64, height: 64, borderRadius: 12, background: `linear-gradient(135deg, ${o.productColor || '#6366f1'}11, ${o.productColor || '#6366f1'}33)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, overflow: "hidden" }}>{isHttpImage(o.productImage) ? <img src={o.productImage} alt={o.productName || "Product"} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{o.productImage || "📱"}</span>}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>{o.productName || "Phone"}</div><div style={{ fontSize: 11, color: "#9ca3af" }}>{o.productSpecs || ""}</div><div style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(o.created_at)}</div></div><div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontWeight: 800, fontSize: 18, color: "#6366f1" }}>{formatPrice(o.price)}</div><div style={{ marginTop: 4 }}><span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: o.paymentMode === "cod" ? "#ecfdf5" : "#eef2ff", color: o.paymentMode === "cod" ? "#059669" : "#6366f1" }}>{o.paymentMode === "cod" ? "🏠 COD" : "💳 Online"}</span></div></div></div><div style={{ height: 1, background: "#f3f4f6", margin: "10px 0" }} /><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{ps === "success" && <button onClick={() => navigate(`/tracking/${o._id}`)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", boxShadow: "0 2px 6px rgba(99,102,241,0.3)" }}>📍 Track Order</button>}{ps !== "success" && <><button onClick={() => handleRetryPayment(o, "online")} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>💳 Pay Online</button><button onClick={() => handleRetryPayment(o, "cod")} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🏠 Cash on Delivery</button></>}<button onClick={() => navigate(`/product/${o.productId}`)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>View Product</button>{ps !== "success" && <button onClick={() => handleDelete(o._id)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>🗑 Delete</button>}</div></div></div>); })}</div>)}
      </div>
      <BottomBar />
    </div>
  );
}