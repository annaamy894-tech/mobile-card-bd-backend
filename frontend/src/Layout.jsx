import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";

const SIDEBAR_WIDTH = 240;

const navItems = [
  { label: "Live Inbox", path: "/dashboard/live-inbox", icon: "📥", roles: ["admin", "user"] },
  { label: "Add Product", path: "/dashboard/add-product", icon: "📱", roles: ["admin"] },
  { label: "Users", path: "/dashboard/users", icon: "👥", roles: ["admin"] },
  { label: "Visitor URL", path: "/dashboard/visitor-url", icon: "🌐", roles: ["admin", "user"] },
];

const ddItem = { padding: "9px 16px", cursor: "pointer", fontSize: 12, color: "#374151" };
const navItemStyle = { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", margin: "2px 0", borderRadius: 10, cursor: "pointer", color: "#555", fontWeight: 500, fontSize: 13 };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuItems, setMenuItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dropdownRef = useRef(null);
  const closeTimerRef = useRef(null);
  const isAdmin = user?.role === "admin";

  useEffect(() => { const h = () => setIsMobile(window.innerWidth <= 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  useEffect(() => { api.get("/admin/menu-items").then(res => setMenuItems(res.data || [])).catch(() => {}); }, []);
  useEffect(() => { const h = (e) => { if (!dropdownRef.current) return; if (!dropdownRef.current.contains(e.target)) setShowDropdown(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [showDropdown]);
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);
  useEffect(() => { return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }; }, []);

  const handleNav = useCallback((path) => { setShowDropdown(false); if (closeTimerRef.current) clearTimeout(closeTimerRef.current); closeTimerRef.current = setTimeout(() => navigate(path), 100); }, [navigate]);
  const handleLogout = useCallback(() => { setShowDropdown(false); if (closeTimerRef.current) clearTimeout(closeTimerRef.current); closeTimerRef.current = setTimeout(() => { logout(); navigate("/login"); }, 100); }, [logout, navigate]);

  const currentLabel = navItems.find(n => location.pathname === n.path || (n.path !== "/" && location.pathname.startsWith(n.path)))?.label || "Dashboard";
  const filteredNavItems = navItems.filter(n => n.roles.includes(user?.role));

  const sidebarContent = (
    <>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => navigate("/")}>
        <img src="/logo/topbarlogo.png" alt="Mobile Card BD" style={{ height: 28 }} />
      </div>
      <nav style={{ flex: 1, padding: "12px 12px", overflow: "auto" }}>
        <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1.5, padding: "8px 10px 6px", fontWeight: 600 }}>Main Menu</div>
        {filteredNavItems.map(item => (
          <div key={item.path} onClick={() => navigate(item.path)} style={navItemStyle}><span style={{ fontSize: 16 }}>{item.icon}</span><span>{item.label}</span></div>
        ))}
        {menuItems.length > 0 && (<><div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1.5, padding: "16px 10px 6px", fontWeight: 600, marginTop: 4 }}>External</div>{menuItems.map(m => (<a key={m._id} href={m.pageUrl} target={m.location === "topbar" ? "_blank" : "_self"} rel="noopener noreferrer" style={{ ...navItemStyle, textDecoration: "none" }}><span style={{ fontSize: 16 }}>🔗</span><span>{m.buttonName}</span></a>))}</>)}
      </nav>
    </>
  );

  const desktopUserDropdown = (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <div onClick={(e) => { e.stopPropagation(); setShowDropdown(prev => !prev); }} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb", userSelect: "none" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</div>
        <span style={{ fontWeight: 500, fontSize: 12, color: "#374151" }}>{user?.fullName?.split(" ")[0]}</span><span style={{ fontSize: 9, color: "#9ca3af" }}>▼</span>
      </div>
      {showDropdown && (<div style={{ position: "absolute", top: 42, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 0", minWidth: 190, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200 }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", cursor: "default" }}><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize", marginTop: 2 }}>{user?.role || "user"}</div></div>
        <div onClick={(e) => { e.stopPropagation(); handleNav("/"); }} style={ddItem}>🏠 Home</div>
        {isAdmin && <div onClick={(e) => { e.stopPropagation(); handleNav("/dashboard"); }} style={ddItem}>📊 Dashboard</div>}
        <div onClick={(e) => { e.stopPropagation(); handleNav("/my-account"); }} style={ddItem}>👤 My Account</div>
        <div onClick={(e) => { e.stopPropagation(); handleNav("/my-orders"); }} style={ddItem}>📦 My Orders</div>
        <div onClick={(e) => { e.stopPropagation(); handleLogout(); }} style={{ ...ddItem, color: "#ef4444" }}>🚪 Logout</div>
      </div>)}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {isMobile && (
        <div style={{ width: "100%" }}>
          <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 48, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <img src="/logo/topbarlogo.png" alt="Mobile Card BD" onClick={() => navigate("/")} style={{ height: 28, cursor: "pointer" }} />
            {isAdmin && <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f5f5", border: "none", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>☰</button>}
          </header>
          {isAdmin && mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 250 }} />}
          {isAdmin && (<aside style={{ width: SIDEBAR_WIDTH, minHeight: "100vh", background: "#fff", borderLeft: "1px solid #eee", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: mobileMenuOpen ? 0 : -SIDEBAR_WIDTH, bottom: 0, zIndex: 280, transition: "right 0.25s ease", boxShadow: mobileMenuOpen ? "-4px 0 20px rgba(0,0,0,0.15)" : "none" }}>{sidebarContent}</aside>)}
          <div style={{ marginTop: 48, minHeight: "calc(100vh - 48px)" }}><main style={{ padding: 14, background: "#f5f6fa" }}><Outlet /></main></div>
        </div>
      )}
      {!isMobile && (
        <div style={{ display: "flex", width: "100%" }}>
          {isAdmin && (<aside style={{ width: SIDEBAR_WIDTH, minHeight: "100vh", background: "#fff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>{sidebarContent}</aside>)}
          <div style={{ flex: 1, marginLeft: isAdmin ? SIDEBAR_WIDTH : 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}><span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{currentLabel}</span>{desktopUserDropdown}</header>
            <main style={{ flex: 1, padding: 20, overflow: "auto", background: "#f5f6fa" }}><Outlet /></main>
          </div>
        </div>
      )}
    </div>
  );
}