import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Layout from "./Layout";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import ProductDetail from "./ProductDetail";
import CheckoutPage from "./CheckoutPage";
import MyAccount from "./MyAccount";
import MyOrders from "./MyOrders";
import OrderTracking from "./OrderTracking";
import AddProduct from "./AddProduct";
import LiveInboxPage from "./LiveInboxPage";
import VisitorUrlPage from "./VisitorUrlPage";
import UserManagementPage from "./UserManagementPage";
import SettingsPage from "./SettingsPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: "center", padding: 50, color: "#1a1a2e", background: "#f5f6fa", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/dashboard" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/my-account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/tracking/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<LiveInboxPage />} />
        <Route path="live-inbox" element={<LiveInboxPage />} />
        <Route path="add-product" element={<AdminRoute><AddProduct /></AdminRoute>} />
        <Route path="visitor-url" element={<VisitorUrlPage />} />
        <Route path="users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}