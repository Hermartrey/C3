import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import BranchManagement from './pages/BranchManagement';
import SalesTracking from './pages/SalesTracking';
import InventoryTracking from './pages/InventoryTracking';
import BranchReport from './pages/BranchReport';
import Expenses from './pages/Expenses';
import Financials from './pages/Financials';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/branches" element={
            <ProtectedRoute role="ADMIN">
              <Layout>
                <BranchManagement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sales" element={
            <ProtectedRoute>
              <Layout>
                <SalesTracking />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute>
              <Layout>
                <InventoryTracking />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/branches/:branchId" element={
            <ProtectedRoute role="ADMIN">
              <Layout>
                <BranchReport />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/branches/:branchId/reports" element={
            <ProtectedRoute role="ADMIN">
              <Layout>
                <BranchReport />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/financials" element={
            <ProtectedRoute>
              <Layout>
                <Financials />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <Layout>
                <Messages />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
