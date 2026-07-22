import React, { useState, useEffect } from "react";
import api from "./api";

const BASE_URL = "/Payment/";

function generateVisitorId() {
  return 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

export default function VisitorUrlPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [links, setLinks] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [linkType, setLinkType] = useState("cod");
  const [amount, setAmount] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  useEffect(() => {
    api.get("/links").then(r => { const list = r.data || []; if (list.length > 0) setTrackingCode(list[0].trackingCode); }).catch(() => {});
    api.get("/products").then(r => setProducts(r.data || [])).catch(() => {});
  }, []);

  const handleGenerate = () => {
    const code = trackingCode || 'direct';
    const visitorId = generateVisitorId();
    const origin = window.location.origin;
    let url = "", label = "";
    if (linkType === "product") {
      const prod = products.find(p => p._id === selectedProduct);
      if (!prod) return;
      url = origin + "/product/" + prod._id + "?ref=" + visitorId;
      label = prod.name;
    } else {
      const amt = linkType === "cod" ? 70 : (parseInt(amount) || 0);
      url = origin + BASE_URL + code + "_" + visitorId + "?mode=" + linkType + "&amount=" + amt;
      label = linkType === "cod" ? "COD ৳70" : "Online ৳" + amt;
    }
    setLinks(prev => [{ id: Date.now().toString(), url, visitorId, code, time: new Date().toLocaleTimeString(), type: linkType, label }, ...prev]);
  };

  const copyLink = (url, id) => { navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const deleteLink = (id) => setLinks(prev => prev.filter(l => l.id !== id));
  const deleteAll = () => { if (links.length === 0) return; if (!confirm("Delete all generated links?")) return; setLinks([]); };

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", color: "#1a1a2e" };

  const tabBtn = (type) => ({
    flex: 1, padding: "14px 12px", borderRadius: 10, border: linkType === type ? "2px solid #6366f1" : "2px solid #e5e7eb",
    background: linkType === type ? "#eef2ff" : "#fff", color: linkType === type ? "#6366f1" : "#555",
    fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "center", transition: "all 0.15s"
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setLinkType("cod")} style={tabBtn("cod")}>🏠 Cash on Delivery</button>
          <button onClick={() => setLinkType("online")} style={tabBtn("online")}>💳 Online Payment</button>
          <button onClick={() => setLinkType("product")} style={tabBtn("product")}>📱 Product Page</button>
        </div>

        {linkType === "online" && (
          <div style={{ marginBottom: 14 }}>
            <input type="number" placeholder="Enter amount (৳)" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
          </div>
        )}

        {linkType === "product" && (
          <div style={{ marginBottom: 14 }}>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Choose a product...</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} - ৳{p.price?.toLocaleString("en-BD")}</option>)}
            </select>
          </div>
        )}

        <button onClick={handleGenerate} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Generate Link
        </button>
      </div>

      {links.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
            <span style={{ color: "#1a1a2e", fontWeight: 700, fontSize: 14 }}>Generated Links ({links.length})</span>
            <button onClick={deleteAll} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Delete All</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={thStyle}>#</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Generated URL</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link, i) => (
                  <tr key={link.id} style={{ borderBottom: "1px solid #f5f5f5" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 14px", color: "#888", fontWeight: 600, textAlign: "center" }}>{i + 1}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <code style={{ color: "#6366f1", fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>{link.url}</code>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ padding:"3px 10px", borderRadius:6, fontSize:10, fontWeight:700, background: link.type==="product"?"#fdf2f8":"#ecfdf5", color: link.type==="product"?"#ec4899":"#059669", whiteSpace:"nowrap" }}>{link.label}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#888", textAlign: "center", whiteSpace: "nowrap", fontSize: 11 }}>{link.time}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button onClick={() => copyLink(link.url, link.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: copiedId === link.id ? "#10b981" : "#6366f1", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>{copiedId === link.id ? "Copied" : "Copy"}</button>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer", textDecoration: "none" }}>Open</a>
                        <button onClick={() => deleteLink(link.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "10px 14px", color: "#888", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, borderBottom: "2px solid #eee", textAlign: "center" };