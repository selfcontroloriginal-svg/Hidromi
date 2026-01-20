import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LogoProvider } from './contexts/LogoContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Products from './pages/admin/Products';
import Services from './pages/admin/Services';
import Clients from './pages/admin/Clients';
import Vendors from './pages/admin/Vendors';
import Financial from './pages/admin/Financial';
import Reports from './pages/admin/Reports';
import Schedule from './pages/admin/Schedule';
import Quotations from './pages/admin/Quotations';
import Sales from './pages/admin/Sales';
import DatabaseCheck from './pages/admin/DatabaseCheck';
import Maintenance from './pages/admin/Maintenance';
import VendorQuotations from './pages/VendorQuotations';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LogoProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute role="admin">
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute role="admin">
                  <Services />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute role="admin">
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vendors"
              element={
                <ProtectedRoute role="admin">
                  <Vendors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/financial"
              element={
                <ProtectedRoute role="admin">
                  <Financial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute role="admin">
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedule"
              element={
                <ProtectedRoute role="admin">
                  <Schedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quotations"
              element={
                <ProtectedRoute role="admin">
                  <Quotations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sales"
              element={
                <ProtectedRoute role="admin">
                  <Sales />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/database-check"
              element={
                <ProtectedRoute role="admin">
                  <DatabaseCheck />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/maintenance"
              element={
                <ProtectedRoute role="admin">
                  <Maintenance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor"
              element={
                <ProtectedRoute role="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/quotations"
              element={
                <ProtectedRoute role="vendor">
                  <VendorQuotations />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login\" replace />} />
          </Routes>
        </LogoProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;