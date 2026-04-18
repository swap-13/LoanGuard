import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import { getDashboardStats } from '../api/api';

// Register Chart.js components
// Why: Chart.js requires you to register components before using them
ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
);

// Dashboard shows admin overview statistics and charts
// All numbers come from Spring Boot /api/dashboard/stats endpoint
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="page-container"
          style={{ display: 'flex', justifyContent: 'center', paddingTop: '150px' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // Doughnut chart data for decision breakdown
  const doughnutData = {
    labels: ['Auto Approved', 'Manual Review', 'Auto Rejected'],
    datasets: [{
      data: [
        stats?.autoApproved || 0,
        stats?.manualReview || 0,
        stats?.autoRejected || 0
      ],
      backgroundColor: ['#6ee7b7', '#fcd34d', '#f87171'],
      borderColor: ['#064e3b', '#451a03', '#450a0a'],
      borderWidth: 2
    }]
  };

  // Bar chart data for risk levels
  // Each bar represents how many applications fall in that risk category
  const barData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
    datasets: [{
      label: 'Applications',
      data: [
        stats?.lowRisk || 0,
        stats?.mediumRisk || 0,
        stats?.highRisk || 0,
        stats?.criticalRisk || 0
      ],
      backgroundColor: ['#6ee7b7', '#fcd34d', '#fb923c', '#f87171'],
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  // Chart options - controls how the bar chart looks
  // stepSize:1 ensures Y axis shows whole numbers like 1,2,3 not 0.5,1.5
  // beginAtZero ensures chart always starts from 0
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#94a3b8' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#1e293b' }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          stepSize: 1,
          precision: 0
        },
        grid: { color: '#1e293b' },
        beginAtZero: true
      }
    }
  };

  // Stat cards data - 6 cards shown at top of dashboard
  const statCards = [
    {
      label: 'Total Applications',
      value: stats?.totalApplications || 0,
      icon: '📋', color: '#60a5fa'
    },
    {
      label: 'Auto Approved',
      value: stats?.autoApproved || 0,
      icon: '✅', color: '#6ee7b7'
    },
    {
      label: 'Manual Review',
      value: stats?.manualReview || 0,
      icon: '⏳', color: '#fcd34d'
    },
    {
      label: 'Auto Rejected',
      value: stats?.autoRejected || 0,
      icon: '❌', color: '#f87171'
    },
    {
      label: 'Fraud Rate',
      value: `${stats?.fraudPercentage || 0}%`,
      icon: '🚨', color: '#fb923c'
    },
    {
      label: 'Approval Rate',
      value: `${stats?.approvalRate || 0}%`,
      icon: '📈', color: '#a78bfa'
    }
  ];

  return (
    <div>
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2rem', fontWeight: '800', color: '#e2e8f0'
          }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px' }}>
            Real-time fraud detection analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px', marginBottom: '32px'
        }}>
          {statCards.map((card, index) => (
            <div key={index} className="card" style={{
              textAlign: 'center', padding: '20px'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                {card.icon}
              </div>
              <div style={{
                fontSize: '2rem', fontWeight: '800',
                color: card.color, marginBottom: '4px'
              }}>
                {card.value}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr',
          gap: '24px', marginBottom: '32px'
        }}>
          {/* Doughnut Chart - shows approved vs review vs rejected */}
          <div className="card">
            <h3 style={{
              color: '#e2e8f0', fontWeight: '700',
              marginBottom: '24px', fontSize: '1rem'
            }}>
              Decision Breakdown
            </h3>
            <div style={{ maxWidth: '280px', margin: '0 auto' }}>
              <Doughnut data={doughnutData} />
            </div>
          </div>

          {/* Bar Chart - shows applications per risk level */}
          <div className="card">
            <h3 style={{
              color: '#e2e8f0', fontWeight: '700',
              marginBottom: '24px', fontSize: '1rem'
            }}>
              Applications by Risk Level
            </h3>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            className="btn-primary"
            style={{ maxWidth: '220px' }}
            onClick={() => navigate('/admin/applications')}
          >
            View All Applications →
          </button>
          <button
            onClick={fetchStats}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8', borderRadius: '10px',
              padding: '12px 24px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem'
            }}
          >
            🔄 Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;