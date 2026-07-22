import React, { createContext, useState, useContext, useEffect } from "react";
import api from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = "Bearer " + token;
      api.get("/auth/me").then(res => setUser(res.data)).catch(() => { localStorage.removeItem("token"); delete api.defaults.headers.common["Authorization"]; setUser(null); }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.token;
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = "Bearer " + token;
      setUser(res.data.user);
    }
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post("/auth/signup", data);
    const token = res.data.token;
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = "Bearer " + token;
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);