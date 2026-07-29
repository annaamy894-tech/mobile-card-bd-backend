import React, { useState, useEffect } from "react";
import api from "./api";

const BRANDS = ["All", "Apple", "Samsung", "Google", "OnePlus", "Xiaomi"];
const PAGE_SIZE = 10;
const MAX_IMAGE_SIZE = 32 * 1024 * 1024; // 32MB

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff", color: "#1a1a2e", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 3 };
const selectStyle = { ...inputStyle, cursor: "pointer" };
const SQUARE_IMG = { width: "100%", height: "100%", aspectRatio: "1/1", objectFit: "cover" };

const defaultForm = {
  name: "", brand: "Apple", price: "", originalPrice: "", specs: "",
  rating: "4.5", images: [], color: "#6366f1", warranty: "No Warranty", returnPolicy: "No Return",
  description: "", condition: "Used", batteryHealth: "", ram: "", storage: "",
  deviceColor: "", screenSize: ""
};

export default function AddProduct() {
  const [form, setForm] = useState(defaultForm);
  const [msg, setMsg] = useState("");
  const [products, setProducts] = useState([]);
  const [filterBrand, setFilterBrand] = useState("All");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewImage, setViewImage] = useState(null);

  const loadProducts = () => { api.get("/products").then(res => setProducts(res.data || [])).catch(() => {}); };
  useEffect(() => { loadProducts(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const isImageUrl = (img) => img && (img.startsWith("http://") || img.startsWith("https://"));

  // Upload single image to API
  const uploadSingleImage = async (base64) => {
    const res = await api.post("/upload/image", { image: base64 });
    if (res.data && res.data.success) return res.data.url;
    throw new Error("Upload failed");
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const newImages = [...form.images];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_IMAGE_SIZE) { setMsg(`"${file.name}" is over 32MB, skipped`); continue; }
      setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}...`);
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const full = ev.target.result;
            resolve(full.includes("base64,") ? full.split("base64,")[1] : full);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const url = await uploadSingleImage(base64);
        newImages.push(url);
        setForm({ ...form, images: [...newImages] });
      } catch (err) {
        setMsg(`Failed: ${file.name} - ${err.message}`);
      }
    }
    setUploading(false);
    setUploadProgress("");
    if (newImages.length > form.images.length) setMsg(`${newImages.length - form.images.length} image(s) uploaded!`);
    setTimeout(() => setMsg(""), 2500);
    e.target.value = "";
  };

  const removeImageByIndex = (idx) => {
    const updated = form.images.filter((_, i) => i !== idx);
    setForm({ ...form, images: updated });
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    const imgs = p.images || (p.image ? [p.image] : []);
    setForm({
      name: p.name || "", brand: p.brand || "Apple", price: p.price || "", originalPrice: p.originalPrice || "",
      specs: p.specs || "", rating: p.rating || "4.5", images: imgs, color: p.color || "#6366f1",
      warranty: p.warranty || "No Warranty", returnPolicy: p.returnPolicy || "No Return",
      description: p.description || "", condition: p.condition || "Used",
      batteryHealth: p.batteryHealth || "", ram: p.ram || "", storage: p.storage || "",
      deviceColor: p.deviceColor || "", screenSize: p.screenSize || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm(defaultForm); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.price || !form.originalPrice) { setMsg("Price and Original Price are required"); return; }
    const payload = {
      ...form,
      views: editingId ? undefined : 0
    };
    const apiCall = editingId ? api.put(`/admin/products/${editingId}`, payload) : api.post("/admin/products", payload);
    apiCall.then(() => {
      setMsg(editingId ? "Product updated!" : "Product added!");
      setForm(defaultForm); setEditingId(null);
      loadProducts(); setTimeout(() => setMsg(""), 2500);
    }).catch(() => setMsg("Error saving product."));
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this product?")) return;
    api.delete(`/admin/products/${id}`).then(() => { loadProducts(); if (filtered.length <= (page-1)*PAGE_SIZE && page > 1) setPage(page-1); }).catch(() => {});
  };

  let filtered = filterBrand === "All" ? products : products.filter(p => p.brand === filterBrand);
  if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.specs || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const formatPrice = (p) => "৳" + (p || 0).toLocaleString("en-BD");
  useEffect(() => { setPage(1); }, [filterBrand, searchTerm]);

  const getFirstImage = (p) => {
    if (p.images && p.images.length > 0) return p.images[0];
    if (p.image && isImageUrl(p.image)) return p.image;
    return null;
  };

  return (
    <div style={{ maxWidth: "100%" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <StatCard label="Total" value={products.length} color="#6366f1" />
        <StatCard label="Apple" value={products.filter(p => p.brand === "Apple").length} color="#1d1d1f" />
        <StatCard label="Samsung" value={products.filter(p => p.brand === "Samsung").length} color="#1428a0" />
        <StatCard label="Others" value={products.filter(p => !["Apple", "Samsung"].includes(p.brand)).length} color="#10b981" />
      </div>

      <h2 style={{ color: "#1a1a2e", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
      </h2>

      {msg && (<div style={{ padding: "8px 14px", borderRadius: 8, marginBottom: 12, background: msg.includes("success") || msg.includes("updated") || msg.includes("uploaded") ? "#ecfdf5" : "#fef2f2", color: msg.includes("success") || msg.includes("updated") || msg.includes("uploaded") ? "#059669" : "#dc2626", fontSize: 12, fontWeight: 600 }}>{msg}</div>)}

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: isMobile() ? 14 : 20, marginBottom: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* IMAGE UPLOAD - Multiple */}
          <div>
            <label style={labelStyle}>Product Images ({form.images.length} uploaded)</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
              {form.images.map((img, idx) => (
                <div key={idx} style={{ position: "relative", width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}>
                  <img src={img} alt="" style={SQUARE_IMG} onClick={() => setViewImage(img)} />
                  <button type="button" onClick={() => removeImageByIndex(idx)} style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(239,68,68,0.9)", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                </div>
              ))}
              <label htmlFor="productImageUpload" style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed #d1d5db", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb", cursor: uploading ? "not-allowed" : "pointer", flexShrink: 0, opacity: uploading ? 0.6 : 1, gap: 4 }}>
                <span style={{ fontSize: 22 }}>{uploading ? "⏳" : "📁"}</span>
                <span style={{ fontSize: 9, color: "#888" }}>Add</span>
              </label>
              <input id="productImageUpload" type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} />
            </div>
            {uploadProgress && <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 500 }}>{uploadProgress}</div>}
            <div style={{ fontSize: 10, color: "#aaa" }}>Select multiple images. Max 32MB each. Click ✕ to delete.</div>
          </div>

          <Row>
            <Field label="Product Name *"><input name="name" placeholder="iPhone 15 Pro Max" value={form.name} onChange={handleChange} required style={inputStyle} /></Field>
            <Field label="Brand"><select name="brand" value={form.brand} onChange={handleChange} style={selectStyle}>{BRANDS.filter(b => b !== "All").map(b => <option key={b}>{b}</option>)}</select></Field>
            <Field label="Rating" w={90}><input name="rating" type="number" step="0.1" min="1" max="5" value={form.rating} onChange={handleChange} style={inputStyle} /></Field>
          </Row>

          <Row>
            <Field label="Price (৳) *"><input name="price" type="number" placeholder="50000" value={form.price} onChange={handleChange} required style={inputStyle} /></Field>
            <Field label="Original Price *"><input name="originalPrice" type="number" placeholder="70000" value={form.originalPrice} onChange={handleChange} required style={inputStyle} /></Field>
            <Field label="Specs"><input name="specs" placeholder="256GB | Titanium" value={form.specs} onChange={handleChange} style={inputStyle} /></Field>
          </Row>

          <Row>
            <Field label="Condition"><select name="condition" value={form.condition} onChange={handleChange} style={selectStyle}><option>New</option><option>Used</option><option>Like New</option><option>Refurbished</option></select></Field>
            <Field label="Battery"><input name="batteryHealth" placeholder="85% / New" value={form.batteryHealth} onChange={handleChange} style={inputStyle} /></Field>
            <Field label="RAM" w={110}><select name="ram" value={form.ram} onChange={handleChange} style={selectStyle}><option value="">--</option><option>4GB</option><option>6GB</option><option>8GB</option><option>12GB</option><option>16GB</option></select></Field>
          </Row>

          <Row>
            <Field label="Storage" w={120}><select name="storage" value={form.storage} onChange={handleChange} style={selectStyle}><option value="">--</option><option>64GB</option><option>128GB</option><option>256GB</option><option>512GB</option><option>1TB</option></select></Field>
            <Field label="Color"><input name="deviceColor" placeholder="Titanium Gray" value={form.deviceColor} onChange={handleChange} style={inputStyle} /></Field>
            <Field label="Screen" w={120}><input name="screenSize" placeholder='6.7"' value={form.screenSize} onChange={handleChange} style={inputStyle} /></Field>
          </Row>

          <Row>
            <Field label="Warranty"><select name="warranty" value={form.warranty} onChange={handleChange} style={selectStyle}><option>No Warranty</option><option>1 Month</option><option>6 Months</option><option>1 Year</option><option>2 Years</option></select></Field>
            <Field label="Return Policy"><select name="returnPolicy" value={form.returnPolicy} onChange={handleChange} style={selectStyle}><option>No Return</option><option>3 Days</option><option>7 Days</option><option>15 Days</option></select></Field>
          </Row>

          <Field label="Product Details / Description">
            <textarea name="description" placeholder="Enter full product details..." value={form.description} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </Field>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={uploading} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: uploading ? "#9ca3af" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer" }}>{uploading ? "Uploading..." : editingId ? "💾 Update Product" : "➕ Add Product"}</button>
            {editingId && <button type="button" onClick={cancelEdit} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#555", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input type="text" placeholder="🔍 Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: "1 1 200px", padding: "9px 14px", borderRadius: 8, border: "2px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff" }} />
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={{ padding: "9px 14px", borderRadius: 8, border: "2px solid #e5e7eb", background: "#fff", fontSize: 12, outline: "none", cursor: "pointer", fontWeight: 600 }}>{BRANDS.map(b => <option key={b} value={b}>{b === "All" ? "All Brands" : b}</option>)}</select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {paged.map(p => {
          const firstImg = getFirstImage(p);
          return (
            <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fff", borderRadius: 10, border: "1px solid #eee" }}>
              <div onClick={() => { if (firstImg) setViewImage(firstImg); }} style={{ width: 48, height: 48, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, overflow: "hidden", flexShrink: 0, cursor: firstImg ? "pointer" : "default", aspectRatio: "1/1" }}>
                {firstImg ? <img src={firstImg} alt="" loading="lazy" style={SQUARE_IMG} /> : <span>📱</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{p.brand} · {formatPrice(p.price)} · ★ {p.rating} · 🖼 {p.images?.length || 0}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleEdit(p)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#eef2ff", color: "#6366f1", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Edit</button>
                <button onClick={() => handleDelete(p._id)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Del</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p style={{ color: "#aaa", textAlign: "center", padding: 30, background: "#fff", borderRadius: 10, border: "1px solid #eee" }}>No products found</p>}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {Array.from({ length: totalPages }, (_, i) => (<button key={i} onClick={() => setPage(i + 1)} style={{ padding: "6px 14px", borderRadius: 6, border: page === i + 1 ? "2px solid #6366f1" : "1px solid #e5e7eb", background: page === i + 1 ? "#eef2ff" : "#fff", color: page === i + 1 ? "#6366f1" : "#555", fontWeight: 700, fontSize: 12, cursor: "pointer", minWidth: 36 }}>{i + 1}</button>))}
        </div>
      )}

      {viewImage && (
        <div onClick={() => setViewImage(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <button onClick={() => setViewImage(null)} style={{ position: "absolute", top: 16, left: 20, padding: "8px 16px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>👈 Back</button>
          <img src={viewImage} alt="" style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function Row({ children }) { return <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{children}</div>; }
function Field({ label, children, w }) { return <div style={{ flex: w ? `0 0 ${w}px` : "1 1 130px", minWidth: 100 }}><label style={labelStyle}>{label}</label>{children}</div>; }
function StatCard({ label, value, color }) { return <div style={{ flex: "1 1 70px", minWidth: 70, background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: "10px 14px", textAlign: "center", borderTop: `3px solid ${color}` }}><div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div><div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{label}</div></div>; }
function isMobile() { return window.innerWidth <= 768; }