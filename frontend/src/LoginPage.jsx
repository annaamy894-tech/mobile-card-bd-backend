import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [mode, setMode] = useState("login");
  const [loginInput, setLoginInput] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => { e.preventDefault(); setError(""); setSuccess(""); const email = loginInput.includes("@") ? loginInput : loginInput + "@mobilecardbd.com"; try { await login(email, password); navigate(redirect); } catch (err) { setError(err.response?.data?.message || "Login failed"); } };
  const handleSignup = async (e) => { e.preventDefault(); setError(""); setSuccess(""); if (password !== confirmPassword) return setError("Passwords do not match"); try { await signup({ fullName, username: phone, email: phone + "@mobilecardbd.com", password }); setSuccess("Account created! Redirecting..."); setTimeout(() => navigate("/"), 800); } catch (err) { setError(err.response?.data?.message || "Signup failed"); } };

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", color: "#1a1a2e" };

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/logo/newtopbarlogo.png" alt="Mobile Card BD" style={{ width: 280, height: "auto", marginBottom: 16 }} />
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>{mode === "login" ? "Sign in to your account" : "Create a new account"}</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 500, textAlign: "center" }}>{error}</div>}
          {success && <div style={{ background: "#ecfdf5", color: "#059669", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 500, textAlign: "center" }}>{success}</div>}

          {mode === "login" ? (
            <>
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Phone or Email</label><input type="text" placeholder="01XXXXXXXXX or email" value={loginInput} onChange={e => setLoginInput(e.target.value)} required style={inputStyle} /></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Password</label><input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} /></div>
                <button type="submit" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>Sign In</button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>Don't have an account? <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>Sign Up</button></div>
            </>
          ) : (
            <>
              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Full Name</label><input type="text" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} /></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Phone Number</label><input type="tel" placeholder="01XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} /></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Password</label><input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} /></div>
                <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Confirm Password</label><input type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputStyle} /></div>
                <button type="submit" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>Create Account</button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>Already have an account? <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>Sign In</button></div>
            </>
          )}
          <div style={{ textAlign: "center", marginTop: 16 }}><button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#888", fontWeight: 500, fontSize: 13, cursor: "pointer" }}>← Back to Store</button></div>
        </div>
      </div>
    </div>
  );
}