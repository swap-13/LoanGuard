import React from 'react';
import { Navigate } from 'react-router-dom';

// ProtectedRoute wraps admin pages
// If admin is not logged in (no token in localStorage)
// it redirects to login page automatically
// Why: Without this anyone could type /admin/dashboard
// in browser and access admin panel without logging in
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('loanguard_token');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;