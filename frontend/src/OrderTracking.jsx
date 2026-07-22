import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";
import BottomBar from "./BottomBar";

const ORDER_STAGES = [
  { id: 1, label: "Order Placed", icon: "📦", desc: "Your order has been confirmed", day: "Day 1" },
  { id: 2, label: "Packaging", icon: "📋", desc: "Your product is being packed securely", day: "Day 1" },
  { id: 3, label: "Loaded on Vehicle", icon: "🚛", desc: "Your order has been loaded for delivery", day: "Day 2" },
  { id: 4, label: "On the Road", icon: "🛣️", desc: "Your order is on the way to your address", day: "Day 2-3" },
  { id: 5, label: "Delivered", icon: "✅", desc: "Order delivered successfully. Enjoy!", day: "Day 3" },
];

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [order, setOrder] = useState(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => { api.get(`/orders/${id}`).then(res => { setOrder(res.data); const orderDate = new Date(res.data.created_at); const now = Date.now(); const diffDays = Math.floor((now - orderDate.getTime()) / (1000 * 60 * 60 * 24)); if (diffDays < 1) setCurrentStage(2); else if (diffDays === 1) setCurrentStage(3); else if (diffDays === 2) setCurrentStage(4); else setCurrentStage(5); setLoading(false); }).catch(() => setLoading(false)); }, [id]);

  const getExpectedDate = (daysToAdd) => { if (!order) return ""; const d = new Date(order.created_at); d.setDate(d.getDate() + daysToAdd); return d.toLocaleDateString("en-BD", { weekday: "short", month: "short", day: "numeric" }); };
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const navItemStyle = { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", margin: "2px 0", borderRadius: 10, cursor: "pointer", color: "#555", fontWeight: 500, fontSize: 13 };

  const fixedMenu = (
    <>
      <div onClick={() => { navigate("/"); closeMobileMenu(); }} style={navItemStyle}><span>🏠</span><span>Home</span></div>
      <div onClick={() => { navigate("/my-account"); closeMobileMenu(); }} style={navItemStyle}><span>👤</span><span>My Account</span></div>
      <div onClick={() => { navigate("/my-orders"); closeMobileMenu(); }} style={navItemStyle}><span>📦</span><span>My Orders</span></div>
      <div style={{ borderTop: "1px solid #eee", margin: "10px 0" }} />
      <div onClick={() => { logout(); navigate("/"); closeMobileMenu(); }} style={{ ...navItemStyle, color: "#ef4444" }}><span>🚪</span><span>Logout</span></div>
    </>
  );

  if (loading) return (<div style={{ background: "#f5f6fa", minHeight: "100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif" }}><div style={{ textAlign:"center", color:"#888" }}>Loading...</div></div>);
  if (!order) return (<div style={{ background: "#f5f6fa", minHeight: "100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', system-ui, sans-serif" }}><div style={{ textAlign:"center" }}><p style={{ color:"#888" }}>Order not found</p><button onClick={() => navigate("/my-orders")} style={{ marginTop:12, padding:"8px 16px", borderRadius:6, border:"none", background:"#6366f1", color:"#fff", fontWeight:600, cursor:"pointer" }}>Back to Orders</button></div></div>);

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: isMobile ? 60 : 0 }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", padding: isMobile ? "8px 14px" : "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <img src="/logo/newaddlogo.png" alt="Mobile Card BD" onClick={() => navigate("/")} style={{ height: isMobile ? 44 : 56, cursor: "pointer" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{isMobile ? <button onClick={() => setMobileMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f5f5", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>☰</button> : <button onClick={() => navigate("/my-orders")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#f5f5f5", color: "#555", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>← My Orders</button>}</div>
      </header>

      {isMobile && user && mobileMenuOpen && <div onClick={closeMobileMenu} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250 }} />}
      {isMobile && user && (
        <aside style={{ width: 260, minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: mobileMenuOpen ? 0 : -260, bottom: 0, zIndex: 280, transition: "right 0.3s ease", boxShadow: mobileMenuOpen ? "-4px 0 24px rgba(0,0,0,0.2)" : "none" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #eee" }}><img src="/logo/newaddlogo.png" alt="Mobile Card BD" style={{ height: 38 }} /></div>
          <nav style={{ flex: 1, padding: "16px 14px", overflow: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 16, background: "#f9fafb", borderRadius: 12 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</div><div><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{user?.role}</div></div></div>
            {user?.role === "admin" && <div onClick={() => { navigate("/dashboard"); closeMobileMenu(); }} style={navItemStyle}><span>📊</span><span>Dashboard</span></div>}
            {fixedMenu}
          </nav>
        </aside>
      )}

      <div style={{ maxWidth: 700, margin: "0 auto", padding: isMobile ? "14px 12px 70px" : "24px 20px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 14 : 20, marginBottom: 20, border: "1px solid #eee" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}><div><h2 style={{ margin:0, fontSize:isMobile ? 16 : 18, fontWeight:700, color:"#1a1a2e" }}>{order.productName}</h2><p style={{ margin:"4px 0 0", fontSize:11, color:"#888" }}>Order #{order._id?.slice(-8)}</p></div><div style={{ textAlign:"right" }}><div style={{ fontSize:isMobile ? 16 : 18, fontWeight:800, color:"#6366f1" }}>৳{(order.price || 0).toLocaleString("en-BD")}</div><div style={{ fontSize:10, color:"#888", marginTop:2 }}>{order.paymentMode === "cod" ? "Cash on Delivery" : "Paid Online"}</div></div></div><div style={{ background:"#f0f9ff", borderRadius:10, padding:"12px 16px", border:"1px solid #dbeafe" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:20 }}>🚚</span><div><div style={{ fontWeight:700, fontSize:12, color:"#1e40af" }}>{currentStage === 5 ? "Delivered!" : `Expected Delivery: ${getExpectedDate(3)}`}</div><div style={{ fontSize:10, color:"#3b82f6", marginTop:2 }}>{currentStage === 2 && "Today — Packaging in progress"}{currentStage === 3 && "Tomorrow — Out for delivery"}{currentStage === 4 && "Today/Tomorrow — On the road"}{currentStage === 5 && "Delivered successfully"}</div></div></div></div></div>
        <div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 16 : 24, border: "1px solid #eee", marginBottom: 20 }}><h3 style={{ margin:"0 0 20px", fontSize:14, fontWeight:700, color:"#1a1a2e" }}>📋 Tracking Timeline</h3><div style={{ display:"flex", flexDirection:"column", gap:0 }}>{ORDER_STAGES.map((stage, idx) => { const done = stage.id <= currentStage; const active = stage.id === currentStage; return (<div key={stage.id} style={{ display:"flex", gap:12, position:"relative" }}><div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:36, flexShrink:0 }}><div style={{ width:34, height:34, borderRadius:"50%", background: done ? (active ? "#6366f1" : "#10b981") : "#e5e7eb", color: done ? "#fff" : "#aaa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700 }}>{done ? stage.icon : stage.id}</div>{idx < ORDER_STAGES.length - 1 && <div style={{ width:2, flex:1, minHeight:30, background: done ? "#10b981" : "#e5e7eb", margin:"4px 0" }}></div>}</div><div style={{ flex:1, paddingBottom:20 }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ fontWeight:700, fontSize:13, color: done ? "#1a1a2e" : "#aaa" }}>{stage.label}</span><span style={{ fontSize:9, color: done ? "#888" : "#ccc", background:"#f5f5f5", padding:"2px 6px", borderRadius:4 }}>{stage.day}</span></div><div style={{ fontSize:11, color: done ? "#666" : "#bbb", marginTop:2 }}>{stage.desc}</div>{active && currentStage < 5 && <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6 }}><span style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", animation:"pulse 1.5s infinite" }}></span><span style={{ fontSize:10, color:"#6366f1", fontWeight:600 }}>In Progress</span></div>}{done && stage.id === 5 && <div style={{ marginTop:6 }}><span style={{ fontSize:10, color:"#10b981", fontWeight:700, background:"#ecfdf5", padding:"3px 8px", borderRadius:4 }}>✅ Completed on {getExpectedDate(3)}</span></div>}</div></div>); })}</div><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style></div>
        <div style={{ background: "#fff", borderRadius: 14, padding: isMobile ? 14 : 20, border: "1px solid #eee" }}><h3 style={{ margin:"0 0 10px", fontSize:13, fontWeight:700, color:"#1a1a2e" }}>📝 Order Details</h3><div style={{ display:"grid", gap:6, fontSize:12 }}><div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#888" }}>Order ID</span><span style={{ fontFamily:"monospace", fontWeight:600, fontSize:11 }}>{order._id?.slice(-12)}</span></div><div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#888" }}>Placed On</span><span>{new Date(order.created_at).toLocaleString("en-BD", { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" })}</span></div><div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#888" }}>Payment</span><span style={{ fontWeight:600 }}>{order.paymentMode === "cod" ? "Cash on Delivery" : "Paid Online"}</span></div><div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#888" }}>Expected Delivery</span><span style={{ fontWeight:600, color:"#10b981" }}>{getExpectedDate(3)}</span></div></div></div>
      </div>
      <BottomBar />
    </div>
  );
}