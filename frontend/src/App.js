import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import LoanForm from './pages/LoanForm';
import ResultPage from './pages/ResultPage';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import ApplicationsTable from './pages/ApplicationsTable';
import ProtectedRoute from './components/ProtectedRoute';

// App.js is the routing brain of React
// Defines which URL shows which page
// ProtectedRoute wraps admin pages so only logged in admin can see them
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes - anyone can access */}
        <Route path="/" element={<LoanForm />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Routes - only admin after login */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/applications" element={
          <ProtectedRoute>
            <ApplicationsTable />
          </ProtectedRoute>
        } />

        {/* Redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;