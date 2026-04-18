import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api/api';

// AdminLogin page - only for admin
// On successful login → saves JWT token to localStorage
// → navigates to dashboard
const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginAdmin(email, password);
      const { token, name } = response.data;

      // Save token and admin name to localStorage
      // Token is used for all future protected API calls
      localStorage.setItem('loanguard_token', token);
      localStorage.setItem('loanguard_admin_name', name);

      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #e94560, #c62a47)',
            borderRadius: '18px', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '28px'
          }}>
            🛡️
          </div>
          <h1 style={{
            color: '#e2e8f0', fontWeight: '800', fontSize: '1.8rem'
          }}>
            LoanGuard Admin
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.9rem' }}>
            Sign in to access the dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="card">
          {error && (
            <div style={{
              background: '#450a0a', border: '1px solid #f87171',
              borderRadius: '10px', padding: '12px',
              color: '#f87171', marginBottom: '20px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="admin@loanGuard.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', marginTop: '20px',
            color: '#64748b', fontSize: '0.8rem'
          }}>
            Default: admin@loanGuard.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;