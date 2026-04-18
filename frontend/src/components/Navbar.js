import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Navbar appears on all pages
// Shows different options based on whether admin is logged in or not
const Navbar = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('loanguard_token');
  const adminName = localStorage.getItem('loanguard_admin_name');

  const handleLogout = () => {
    localStorage.removeItem('loanguard_token');
    localStorage.removeItem('loanguard_admin_name');
    navigate('/admin/login');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #334155',
      padding: '0 40px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #e94560, #c62a47)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '18px'
          }}>🛡️</div>
          <span style={{
            color: '#e2e8f0', fontWeight: '800',
            fontSize: '1.2rem', letterSpacing: '0.5px'
          }}>
            Loan<span style={{ color: '#e94560' }}>Guard</span>
          </span>
        </div>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/" style={{
          color: '#94a3b8', textDecoration: 'none',
          fontSize: '0.9rem', fontWeight: '500'
        }}>
          Apply for Loan
        </Link>

        {isAdmin ? (
          <>
            <Link to="/admin/dashboard" style={{
              color: '#94a3b8', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: '500'
            }}>
              Dashboard
            </Link>
            <Link to="/admin/applications" style={{
              color: '#94a3b8', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: '500'
            }}>
              Applications
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                color: '#e94560', fontSize: '0.85rem', fontWeight: '600'
              }}>
                👤 {adminName}
              </span>
              <button onClick={handleLogout} style={{
                background: 'transparent',
                border: '1px solid #e94560',
                color: '#e94560', borderRadius: '8px',
                padding: '6px 16px', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: '600'
              }}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <Link to="/admin/login" style={{
            background: 'linear-gradient(135deg, #e94560, #c62a47)',
            color: 'white', textDecoration: 'none',
            padding: '8px 20px', borderRadius: '8px',
            fontSize: '0.875rem', fontWeight: '600'
          }}>
            Admin Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;