import React, { useState, useEffect } from "react";
import api from "./api";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    api.get("/admin/users").then(res => {
      const userList = res.data.users || res.data || [];
      setUsers(userList);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = (id, name) => {
    if (!confirm(`Delete user "${name}" permanently?`)) return;
    api.delete(`/admin/users/${id}/reject`).then(() => loadUsers()).catch(() => {});
  };

  const handleDeleteAll = () => {
    const nonAdminUsers = users.filter(u => u.role !== "admin");
    if (nonAdminUsers.length === 0) return alert("No users to delete.");
    if (!confirm(`Delete ALL ${nonAdminUsers.length} non-admin users permanently? This cannot be undone.`)) return;
    
    const deletePromises = nonAdminUsers.map(u => 
      api.delete(`/admin/users/${u._id}/reject`).catch(() => {})
    );
    Promise.all(deletePromises).then(() => loadUsers());
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading...</div>;

  const nonAdminCount = users.filter(u => u.role !== "admin").length;

  return (
    <div style={{ maxWidth: "100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color: "#1a1a2e", fontSize: 20, fontWeight: 700, margin:0 }}>👥 Users</h2>
          <p style={{ color:"#888", fontSize:12, margin:"4px 0 0" }}>{users.length} registered users</p>
        </div>
        {nonAdminCount > 0 && (
          <button 
            onClick={handleDeleteAll}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontWeight: 600, fontSize: 12, cursor: "pointer", transition:"all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            🗑 Delete All ({nonAdminCount})
          </button>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "14px 18px", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, textAlign: "center", width: 60 }}>#</th>
                <th style={{ padding: "14px 18px", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, textAlign: "left" }}>Name</th>
                <th style={{ padding: "14px 18px", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, textAlign: "left" }}>Phone</th>
                <th style={{ padding: "14px 18px", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, textAlign: "left" }}>Sign Up</th>
                <th style={{ padding: "14px 18px", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, textAlign: "center", width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 60, textAlign: "center", color: "#aaa" }}>
                  <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.3 }}>👥</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No users found</div>
                </td></tr>
              )}
              {users.map((u, i) => (
                <tr key={u._id} style={{ borderBottom: "1px solid #f3f4f6", transition:"background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 18px", color: "#9ca3af", fontWeight: 700, fontSize: 13, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: "#111827", fontSize: 13 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background: u.role==="admin" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "linear-gradient(135deg, #10b981, #059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0 }}>
                        {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div style={{ fontWeight:600 }}>{u.fullName}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", textTransform:"capitalize" }}>{u.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12, color: "#4b5563" }}>{u.username || "—"}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ 
                      padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600,
                      background: "#ecfdf5", color: "#059669"
                    }}>
                      ● Signed Up
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "center" }}>
                    {u.role !== "admin" ? (
                      <button onClick={() => handleDelete(u._id, u.fullName)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", transition:"all 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
                      >Delete</button>
                    ) : (
                      <span style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }}>Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}