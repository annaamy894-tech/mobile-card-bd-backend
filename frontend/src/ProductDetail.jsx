import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import api from "./api";
import BottomBar from "./BottomBar";

const RELATED_IMG = { width: "100%", height: "100%", objectFit: "cover" };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, login, signup } = useAuth();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [cName, setCName] = useState("");
  const [cText, setCText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewFullImage, setViewFullImage] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMessenger, setShowMessenger] = useState(false);
  const [loginMode, setLoginMode] = useState("login");
  const [loginInput, setLoginInput] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginFullName, setLoginFullName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [msgText, setMsgText] = useState("");
  const scrollRef = useRef(null);
  const dropdownRef = useRef(null);
  const isMobile = window.innerWidth <= 768;
  const isAdmin = user?.role === "admin";

  useEffect(() => { const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const loadProduct = () => { api.get(`/products/${id}`).then(res => { setProduct(res.data); loadRelated(); setActiveIndex(0); }).catch(() => navigate("/")).finally(() => setLoading(false)); };
  const loadComments = () => { api.get(`/products/${id}/comments`).then(res => setComments(res.data || [])).catch(() => {}); };
  const loadRelated = () => { api.get('/products').then(res => { const all = res.data || []; setRelatedProducts(all.filter(x => x._id !== id).sort(() => 0.5 - Math.random()).slice(0, 6)); }).catch(() => {}); };
  useEffect(() => { loadProduct(); loadComments(); }, [id]);
  const submitComment = (e) => { e.preventDefault(); if (!cName.trim() || !cText.trim()) return; api.post(`/products/${id}/comments`, { name: cName, text: cText }).then(() => { setCName(""); setCText(""); loadComments(); }).catch(() => {}); };

  const handleBuyNow = () => { if (!user) { setShowLoginModal(true); return; } navigate("/checkout", { state: { product } }); };

  const handleLoginSubmit = async (e) => { e.preventDefault(); setLoginError(""); const email = loginInput.includes("@") ? loginInput : loginInput + "@mobilecardbd.com"; try { await login(email, loginPassword); setShowLoginModal(false); resetLoginForm(); } catch (err) { setLoginError(err.response?.data?.message || "Login failed"); } };
  const handleSignupSubmit = async (e) => { e.preventDefault(); setLoginError(""); if (loginPassword !== confirmPassword) { setLoginError("Passwords do not match"); return; } try { await signup({ fullName: loginFullName, username: loginPhone, email: loginPhone + "@mobilecardbd.com", password: loginPassword }); setLoginSuccess("Account created! Please login."); setLoginMode("login"); } catch (err) { setLoginError(err.response?.data?.message || "Signup failed"); } };
  const resetLoginForm = () => { setLoginInput(""); setLoginPassword(""); setConfirmPassword(""); setLoginFullName(""); setLoginPhone(""); setLoginError(""); setLoginSuccess(""); setLoginMode("login"); };

  const formatPrice = (p) => "৳" + (p || 0).toLocaleString("en-BD");
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 13, outline: "none", background: "#f9fafb", color: "#1a1a2e" };
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const navItemStyle = { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", margin: "2px 0", borderRadius: 10, cursor: "pointer", color: "#555", fontWeight: 500, fontSize: 13 };
  const ddItem = { padding: "9px 16px", cursor: "pointer", fontSize: 12, color: "#374151" };

  const isHttpImage = (img) => img && (img.startsWith("http://") || img.startsWith("https://"));
  const getAllImages = () => {
    if (!product) return [];
    const imgs = product.images || [];
    if (imgs.length === 0 && product.image && isHttpImage(product.image)) return [product.image];
    return imgs.filter(isHttpImage);
  };
  const images = getAllImages();
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  const prevImage = () => { setActiveIndex(prev => (prev - 1 + images.length) % images.length); };
  const nextImage = () => { setActiveIndex(prev => (prev + 1) % images.length); };
  const goToImage = (idx) => { setActiveIndex(idx); if (scrollRef.current) { const el = scrollRef.current.children[idx]; if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); } };

  const arrowBtn = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 22, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" };

  const fixedMenu = (
    <>
      <div onClick={() => { navigate("/"); closeMobileMenu(); }} style={navItemStyle}><span>🏠</span><span>Home</span></div>
      <div onClick={() => { navigate("/my-account"); closeMobileMenu(); }} style={navItemStyle}><span>👤</span><span>My Account</span></div>
      <div onClick={() => { navigate("/my-orders"); closeMobileMenu(); }} style={navItemStyle}><span>📦</span><span>My Orders</span></div>
      <div style={{ borderTop: "1px solid #eee", margin: "10px 0" }} />
      <div onClick={() => { logout(); navigate("/"); closeMobileMenu(); }} style={{ ...navItemStyle, color: "#ef4444" }}><span>🚪</span><span>Logout</span></div>
    </>
  );

  if (loading) return <div style={{ textAlign: "center", padding: 60, background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>Loading...</div>;
  if (!product) return null;

  const savePercent = product.originalPrice > 0 ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#1a1a2e", paddingBottom: isMobile ? 60 : 0 }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", padding: isMobile ? "8px 14px" : "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <img src="/logo/newaddlogo.png" alt="Mobile Card BD" onClick={() => navigate("/")} style={{ height: isMobile ? 44 : 56, cursor: "pointer" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isMobile ? (user ? <button onClick={() => setMobileMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, background: "#f5f5f5", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>☰</button> : <button onClick={() => setShowLoginModal(true)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Sign In</button>) : (<>{user ? (
            <div style={{ position: "relative" }} ref={dropdownRef}><div onClick={() => setShowDropdown(!showDropdown)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px", borderRadius: 8, background: "#f5f5f5" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{user.fullName?.charAt(0)?.toUpperCase() || "U"}</div><span style={{ fontWeight: 600, fontSize: 12 }}>{user.fullName?.split(" ")[0]}</span><span style={{ fontSize: 9, color: "#888" }}>▼</span></div>
              {showDropdown && (<div style={{ position: "absolute", top: 40, right: 0, background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "4px 0", minWidth: 190, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 200 }}><div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", cursor: "default" }}><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize", marginTop: 2 }}>{user.role || "user"}</div></div><div onClick={() => { navigate("/"); setShowDropdown(false); }} style={ddItem}>🏠 Home</div>{isAdmin && <div onClick={() => { navigate("/dashboard"); setShowDropdown(false); }} style={ddItem}>📊 Dashboard</div>}<div onClick={() => { navigate("/my-account"); setShowDropdown(false); }} style={ddItem}>👤 My Account</div><div onClick={() => { navigate("/my-orders"); setShowDropdown(false); }} style={ddItem}>📦 My Orders</div><div onClick={() => { logout(); navigate("/"); setShowDropdown(false); }} style={{ ...ddItem, color: "#ef4444" }}>🚪 Logout</div></div>)}
            </div>
          ) : <button onClick={() => setShowLoginModal(true)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Sign In</button>}</>)}
        </div>
      </header>

      {isMobile && user && mobileMenuOpen && <div onClick={closeMobileMenu} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 250 }} />}
      {isMobile && user && (<aside style={{ width: 260, minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, right: mobileMenuOpen ? 0 : -260, bottom: 0, zIndex: 280, transition: "right 0.3s ease", boxShadow: mobileMenuOpen ? "-4px 0 24px rgba(0,0,0,0.2)" : "none" }}><div style={{ padding: "16px 18px", borderBottom: "1px solid #eee" }}><img src="/logo/newaddlogo.png" alt="Mobile Card BD" style={{ height: 38 }} /></div><nav style={{ flex: 1, padding: "16px 14px", overflow: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 16, background: "#f9fafb", borderRadius: 12 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>{user.fullName?.charAt(0)?.toUpperCase() || "U"}</div><div><div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{user.fullName || "User"}</div><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>{user.role}</div></div></div>{isAdmin && <div onClick={() => { navigate("/dashboard"); closeMobileMenu(); }} style={navItemStyle}><span>📊</span><span>Dashboard</span></div>}{fixedMenu}</nav></aside>)}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "0 0 70px 0" : "0 0" }}>
        <div style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: 12 }}>

          {/* GALLERY - White Background */}
          <div style={{ position: "relative", background: "#fff", overflow: "hidden" }}>
            <button onClick={() => navigate(-1)} style={{ position: "absolute", top: 10, left: 10, padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", zIndex: 20 }}>← Back</button>
            {savePercent > 0 && (<div style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: isMobile ? 10 : 11, fontWeight: 800, zIndex: 20 }}>-{savePercent}%</div>)}

            {hasImages ? (
              <div ref={scrollRef} style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ flex: "0 0 100%", scrollSnapAlign: "start", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", cursor: "pointer" }} onClick={() => { setActiveIndex(idx); setViewFullImage(true); }}>
                    <img src={img} alt={`${product.name} ${idx+1}`} style={{ width: "100%", height: isMobile ? "75vw" : "500px", objectFit: "contain" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ width: "100%", height: isMobile ? "75vw" : "500px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", fontSize: isMobile ? 80 : 120 }}>📱</div>
            )}

            {hasMultiple && <button onClick={(e) => { e.stopPropagation(); prevImage(); goToImage((activeIndex - 1 + images.length) % images.length); }} style={{ ...arrowBtn, left: 8 }}>◀</button>}
            {hasMultiple && <button onClick={(e) => { e.stopPropagation(); nextImage(); goToImage((activeIndex + 1) % images.length); }} style={{ ...arrowBtn, right: 8 }}>▶</button>}

            {hasMultiple && (
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 20 }}>
                {images.map((_, idx) => (
                  <div key={idx} onClick={() => goToImage(idx)} style={{ width: 8, height: 8, borderRadius: "50%", background: idx === activeIndex ? "#333" : "rgba(0,0,0,0.25)", cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            )}

            <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "3px 10px", borderRadius: 10, fontSize: 11, zIndex: 20 }}>{activeIndex + 1} / {images.length}</div>
          </div>

          <div style={{ padding: isMobile ? "14px 14px 18px" : "20px 24px 28px" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}><Badge bg="#ecfdf5" color="#059669">{product.condition || "Like New"}</Badge><Badge bg="#fff7ed" color="#ea580c">★ {product.rating}</Badge>{product.ram && <Badge bg="#eef2ff" color="#6366f1">{product.ram}</Badge>}{product.storage && <Badge bg="#fdf2f8" color="#ec4899">{product.storage}</Badge>}{product.deviceColor && <Badge bg="#f5f3ff" color="#8b5cf6">{product.deviceColor}</Badge>}</div>
            <h1 style={{ margin: "4px 0", fontSize: isMobile ? 18 : 22, fontWeight: 800 }}>{product.name}</h1>
            <p style={{ color: "#888", fontSize: isMobile ? 11 : 13, margin: "0 0 12px" }}>{product.brand} · {product.specs}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 14 }}><span style={{ fontSize: isMobile ? 24 : 30, fontWeight: 900, color: "#059669" }}>{formatPrice(product.price)}</span><span style={{ fontSize: isMobile ? 13 : 15, color: "#bbb", textDecoration: "line-through" }}>{formatPrice(product.originalPrice)}</span>{savePercent > 0 && <Badge bg="#fef2f2" color="#ef4444">Save {savePercent}%</Badge>}</div>
            <button onClick={handleBuyNow} style={{ width: "100%", padding: isMobile ? "13px" : "15px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, fontSize: isMobile ? 15 : 16, cursor: "pointer", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>🚀 Buy Now</button>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 14px" : "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", margin: "0 12px 12px" }}><h3 style={{ margin: "0 0 12px", fontSize: isMobile ? 14 : 16, fontWeight: 700 }}>📋 Specifications</h3>{[["Brand", product.brand],["Condition", product.condition],["Color", product.deviceColor],["Screen Size", product.screenSize],["RAM", product.ram],["Storage", product.storage],["Battery Health", product.batteryHealth],["Specs", product.specs],["Warranty", product.warranty && product.warranty !== "No Warranty" ? product.warranty : null],["Return Policy", product.returnPolicy && product.returnPolicy !== "No Return" ? product.returnPolicy : null]].filter(([,v]) => v).map(([k, v], i) => (<div key={i} style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}><span style={{ color: "#888", minWidth: isMobile ? 100 : 130, flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 600, color: "#1a1a2e" }}>{v}</span></div>))}</div>
        <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "12px 14px" : "16px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", margin: "0 12px 12px" }}><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><Info icon="🚚" title="Free Delivery" sub="Across Bangladesh" /><Info icon="🔄" title="7-Day Return" sub="No questions asked" /><Info icon="🛡" title={`${product.warranty || "1 Year"} Warranty`} sub="Official warranty" /></div></div>
        {product.description && (<div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 14px" : "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", margin: "0 12px 12px" }}><h3 style={{ margin: "0 0 10px", fontSize: isMobile ? 14 : 16, fontWeight: 700 }}>📝 Product Details</h3><p style={{ color: "#555", fontSize: isMobile ? 12 : 14, lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>{product.description}</p></div>)}
        <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 14px" : "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", margin: "0 12px 12px" }}><h3 style={{ margin: "0 0 12px", fontSize: isMobile ? 14 : 16, fontWeight: 700 }}>💬 Comments ({comments.length})</h3>{comments.length === 0 && <p style={{ color: "#aaa", textAlign: "center", padding: 20 }}>No comments yet.</p>}{comments.map(c => (<div key={c._id} style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div><div style={{ fontSize: 9, color: "#aaa" }}>{new Date(c.created_at).toLocaleString()}</div></div></div><p style={{ margin: 0, fontSize: 13, color: "#555", paddingLeft: 40 }}>{c.text}</p></div>))}<form onSubmit={submitComment} style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}><input type="text" placeholder="Your name" value={cName} onChange={e => setCName(e.target.value)} required style={inputStyle} /><textarea placeholder="Write a comment..." value={cText} onChange={e => setCText(e.target.value)} required rows={3} style={{ ...inputStyle, resize: "vertical" }} /><button type="submit" style={{ padding: isMobile ? "10px" : "12px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Post Comment</button></form></div>
        {relatedProducts.length > 0 && (<div style={{ margin: "8px 12px" }}><h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>📱 You May Also Like</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>{relatedProducts.map(rp => { const rpImg = (rp.images && rp.images[0]) || rp.image || ""; return (<div key={rp._id} onClick={() => navigate(`/product/${rp._id}`)} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", cursor: "pointer" }}><div style={{ height: isMobile ? 100 : 120, background: `linear-gradient(135deg, ${rp.color || '#6366f1'}15, ${rp.color || '#6366f1'}30)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{isHttpImage(rpImg) ? <img src={rpImg} alt={rp.name} loading="lazy" style={RELATED_IMG} /> : <span style={{ fontSize: isMobile ? 26 : 30 }}>📱</span>}</div><div style={{ padding: "8px 10px 10px" }}><div style={{ fontWeight: 700, fontSize: isMobile ? 10 : 12, color: "#1a1a2e", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rp.name}</div><div style={{ fontSize: isMobile ? 9 : 10, color: "#888", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rp.specs}</div><div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}><span style={{ fontWeight: 800, fontSize: isMobile ? 11 : 13, color: "#059669" }}>{formatPrice(rp.price)}</span><span style={{ fontSize: isMobile ? 9 : 10, color: "#bbb", textDecoration: "line-through" }}>{formatPrice(rp.originalPrice)}</span></div></div></div>); })}</div></div>)}
      </div>

      {showLoginModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => { setShowLoginModal(false); resetLoginForm(); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? 20 : 28, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowLoginModal(false); resetLoginForm(); }} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
            <div style={{ textAlign: "center", marginBottom: 20 }}><img src="/logo/newtopbarlogo.png" alt="Mobile Card BD" style={{ width: 150, height: "auto", marginBottom: 8 }} /><p style={{ color: "#888", fontSize: 13, margin: 0 }}>{loginMode === "login" ? "Sign in to your account" : "Create a new account"}</p></div>
            {loginError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 12, textAlign: "center" }}>{loginError}</div>}
            {loginSuccess && <div style={{ background: "#ecfdf5", color: "#059669", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 12, textAlign: "center" }}>{loginSuccess}</div>}
            {loginMode === "login" ? (<form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}><input type="text" placeholder="Phone or Email" value={loginInput} onChange={e => setLoginInput(e.target.value)} required style={inputStyle} /><input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={inputStyle} /><button type="submit" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>Sign In</button></form>) : (<form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}><input type="text" placeholder="Full Name" value={loginFullName} onChange={e => setLoginFullName(e.target.value)} required style={inputStyle} /><input type="text" placeholder="Phone Number" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} required style={inputStyle} /><input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={inputStyle} /><input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputStyle} /><button type="submit" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>Create Account</button></form>)}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#888" }}>{loginMode === "login" ? (<>Don't have an account? <button onClick={() => { setLoginMode("signup"); setLoginError(""); setLoginSuccess(""); }} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 0 }}>Sign Up</button></>) : (<>Already have an account? <button onClick={() => { setLoginMode("login"); setLoginError(""); setLoginSuccess(""); }} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 0 }}>Sign In</button></>)}</div>
          </div>
        </div>
      )}

      {showMessenger && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500, background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, boxShadow: "0 -4px 20px rgba(0,0,0,0.15)", height: "70vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700, fontSize: 15 }}>💬 Message</span><button onClick={() => setShowMessenger(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button></div>
          <div style={{ flex: 1, padding: 16, overflow: "auto", color: "#888", fontSize: 13, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user ? (<div style={{ width: "100%" }}><p style={{ marginBottom: 12 }}>Send a message to the seller</p><textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type your message..." rows={3} style={{ width: "100%", padding: 10, borderRadius: 8, border: "2px solid #e5e7eb", fontSize: 13, resize: "vertical", fontFamily: "inherit" }} /><button onClick={() => { alert("Message sent!"); setMsgText(""); }} style={{ marginTop: 8, padding: "10px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Send</button></div>) : (<div><p style={{ marginBottom: 8 }}>Please login to send a message</p><button onClick={() => { setShowLoginModal(true); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Login to Message</button></div>)}
          </div>
        </div>
      )}

      {viewFullImage && hasImages && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setViewFullImage(false)} style={{ position: "absolute", top: 16, left: 16, padding: "6px 14px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", zIndex: 30 }}>✕ Close</button>
          <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 12px", borderRadius: 10, fontSize: 12, zIndex: 30 }}>{activeIndex + 1} / {images.length}</div>
          {hasMultiple && <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ ...arrowBtn, left: 8, zIndex: 30 }}>◀</button>}
          <img src={images[activeIndex]} alt={product.name} style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 4 }} onClick={e => e.stopPropagation()} />
          {hasMultiple && <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ ...arrowBtn, right: 8, zIndex: 30 }}>▶</button>}
        </div>
      )}

      <BottomBar />
    </div>
  );
}

function Info({ icon, title, sub }) { return <div style={{ flex: "1 1 110px", display: "flex", gap: 8 }}><span style={{ fontSize: 20 }}>{icon}</span><div><div style={{ fontWeight: 700, fontSize: 11 }}>{title}</div><div style={{ fontSize: 10, color: "#888" }}>{sub}</div></div></div>; }
function Badge({ bg, color, children }) { return <span style={{ background: bg, color, color: color, padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{children}</span>; }