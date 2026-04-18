import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {
  getAllApplications,
  overrideDecision,
  deleteApplication,
  reAnalyzeApplication
} from '../api/api';

// ApplicationsTable shows all loan applications
// Admin can: Override decision, Edit + Re-analyze, Delete
const ApplicationsTable = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Override modal state
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [newDecision, setNewDecision] = useState('');

  // Edit modal state
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await getAllApplications();
      setApplications(response.data);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter applications by decision
  const filtered = filter === 'ALL'
    ? applications
    : applications.filter(a => a.decision === filter);

  // -------------------------------------------------------
  // OVERRIDE DECISION HANDLER
  // -------------------------------------------------------
  const handleOverride = async () => {
    if (!newDecision || !overrideReason) return;
    try {
      await overrideDecision(
        overrideModal.id, newDecision, overrideReason);
      setOverrideModal(null);
      setOverrideReason('');
      setNewDecision('');
      fetchApplications();
    } catch (err) {
      alert('Failed to override decision');
    }
  };

  // -------------------------------------------------------
  // DELETE HANDLER
  // Asks for confirmation before deleting
  // After delete refreshes the table and dashboard updates
  // -------------------------------------------------------
  const handleDelete = async (app) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete application #${app.id} 
for ${app.applicantName}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteApplication(app.id);
      // Remove from local state immediately for instant UI update
      setApplications(prev =>
        prev.filter(a => a.id !== app.id));
      alert(`Application #${app.id} deleted successfully`);
    } catch (err) {
      alert('Failed to delete application: ' + 
        err.response?.data?.error || err.message);
    }
  };

  // -------------------------------------------------------
  // OPEN EDIT MODAL
  // Pre-fills form with existing application data
  // -------------------------------------------------------
  const openEditModal = (app) => {
    setEditResult(null);
    setEditModal(app);
    // Pre-fill form with existing values
    setEditForm({
      applicantName: app.applicantName || '',
      age: app.age || '',
      gender: app.gender || '',
      annualIncome: app.annualIncome || '',
      loanAmount: app.loanAmount || '',
      loanTenureMonths: app.loanTenureMonths || '',
      creditScore: app.creditScore || '',
      existingDebt: app.existingDebt || 0,
      employmentType: app.employmentType || '',
      loanPurpose: app.loanPurpose || ''
    });
  };

  // -------------------------------------------------------
  // EDIT AND RE-ANALYZE HANDLER
  // Sends updated fields to Spring Boot
  // Spring Boot re-runs rule engine + ML model
  // Returns new risk score and decision
  // -------------------------------------------------------
  const handleReAnalyze = async () => {
    setEditLoading(true);
    try {
      const response = await reAnalyzeApplication(
        editModal.id, editForm);
      setEditResult(response.data);
      fetchApplications(); // Refresh table with new values
    } catch (err) {
      alert('Failed to re-analyze: ' +
        (err.response?.data?.error || err.message));
    } finally {
      setEditLoading(false);
    }
  };

  // Color helpers
  const getRiskColor = (level) => ({
    LOW: '#6ee7b7',
    MEDIUM: '#fcd34d',
    HIGH: '#fb923c',
    CRITICAL: '#f87171'
  })[level] || '#94a3b8';

  const getDecisionColor = (decision) => ({
    AUTO_APPROVED: '#6ee7b7',
    MANUAL_REVIEW: '#fcd34d',
    AUTO_REJECTED: '#f87171'
  })[decision] || '#94a3b8';

  const getDecisionLabel = (decision) => ({
    AUTO_APPROVED: '✅ Approved',
    MANUAL_REVIEW: '⏳ Review',
    AUTO_REJECTED: '❌ Rejected'
  })[decision] || decision;

  // Input style helper
  const inputStyle = {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#e2e8f0',
    fontSize: '0.88rem',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    color: '#94a3b8',
    fontSize: '0.78rem',
    marginBottom: '5px',
    fontWeight: '500'
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem', fontWeight: '800',
              color: '#e2e8f0'
            }}>
              All Applications
            </h1>
            <p style={{ color: '#64748b', marginTop: '6px' }}>
              {filtered.length} applications found
            </p>
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'AUTO_APPROVED',
              'MANUAL_REVIEW', 'AUTO_REJECTED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f
                    ? '#e94560' : 'transparent',
                  border: '1px solid',
                  borderColor: filter === f
                    ? '#e94560' : '#334155',
                  color: filter === f ? 'white' : '#94a3b8',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
              >
                {f === 'ALL' ? 'All' :
                  f === 'AUTO_APPROVED' ? '✅ Approved' :
                  f === 'MANUAL_REVIEW' ? '⏳ Review'
                    : '❌ Rejected'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center', paddingTop: '60px'
          }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="card"
            style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['ID', 'Applicant', 'Loan Amount',
                    'Credit Score', 'Risk Score',
                    'Risk Level', 'Decision',
                    'Submitted', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      color: '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #334155'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, index) => (
                  <tr key={app.id} style={{
                    borderBottom: '1px solid #1e293b',
                    background: index % 2 === 0
                      ? 'transparent' : '#0f172a20'
                  }}>
                    <td style={{
                      padding: '14px 16px',
                      color: '#64748b',
                      fontSize: '0.85rem'
                    }}>
                      #{app.id}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#e2e8f0',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}>
                      {app.applicantName}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#94a3b8',
                      fontSize: '0.85rem'
                    }}>
                      ₹{Number(app.loanAmount)
                        .toLocaleString('en-IN')}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#94a3b8',
                      fontSize: '0.85rem'
                    }}>
                      {app.creditScore || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        color: getRiskColor(app.riskLevel),
                        fontWeight: '700',
                        fontSize: '0.95rem'
                      }}>
                        {app.riskScore}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: `${getRiskColor(
                          app.riskLevel)}20`,
                        color: getRiskColor(app.riskLevel),
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {app.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        color: getDecisionColor(app.decision),
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {getDecisionLabel(app.decision)}
                      </span>
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#64748b',
                      fontSize: '0.8rem'
                    }}>
                      {app.submittedAt}
                    </td>

                    {/* Action Buttons */}
                    <td style={{
                      padding: '14px 16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        {/* Override Button */}
                        <button
                          onClick={() => setOverrideModal(app)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #e94560',
                            color: '#e94560',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          Override
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(app)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #60a5fa',
                            color: '#60a5fa',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(app)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #f87171',
                            color: '#f87171',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px',
                color: '#64748b'
              }}>
                No applications found for this filter
              </div>
            )}
          </div>
        )}

        {/* -----------------------------------------------
            OVERRIDE MODAL
        ----------------------------------------------- */}
        {overrideModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}>
            <div className="card" style={{
              width: '480px',
              border: '1px solid #334155'
            }}>
              <h3 style={{
                color: '#e2e8f0', fontWeight: '700',
                marginBottom: '8px'
              }}>
                Override Decision
              </h3>
              <p style={{
                color: '#64748b', fontSize: '0.875rem',
                marginBottom: '24px'
              }}>
                Application #{overrideModal.id} —{' '}
                {overrideModal.applicantName}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>New Decision</label>
                <select
                  style={inputStyle}
                  value={newDecision}
                  onChange={(e) =>
                    setNewDecision(e.target.value)}
                >
                  <option value="">Select decision</option>
                  <option value="AUTO_APPROVED">
                    ✅ Approve
                  </option>
                  <option value="MANUAL_REVIEW">
                    ⏳ Keep in Review
                  </option>
                  <option value="AUTO_REJECTED">
                    ❌ Reject
                  </option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>
                  Reason for Override *
                </label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical' }}
                  rows={3}
                  placeholder="Explain why..."
                  value={overrideReason}
                  onChange={(e) =>
                    setOverrideReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn-primary"
                  onClick={handleOverride}
                  disabled={!newDecision || !overrideReason}
                >
                  Confirm Override
                </button>
                <button
                  onClick={() => {
                    setOverrideModal(null);
                    setOverrideReason('');
                    setNewDecision('');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8', borderRadius: '10px',
                    padding: '12px 24px', cursor: 'pointer',
                    fontWeight: '600', width: '100%'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------
            EDIT AND RE-ANALYZE MODAL
            Shows full form pre-filled with existing data
            Admin edits any fields and clicks Re-Analyze
            Spring Boot updates DB and runs ML again
        ----------------------------------------------- */}
        {editModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '20px'
          }}>
            <div className="card" style={{
              width: '700px',
              border: '1px solid #334155',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                color: '#e2e8f0', fontWeight: '700',
                marginBottom: '6px'
              }}>
                ✏️ Edit & Re-Analyze Application
              </h3>
              <p style={{
                color: '#64748b', fontSize: '0.875rem',
                marginBottom: '24px'
              }}>
                Application #{editModal.id} — Edit any field
                and click Re-Analyze to get updated risk score
              </p>

              {/* Show new result after re-analysis */}
              {editResult && (
                <div style={{
                  background: '#064e3b',
                  border: '1px solid #6ee7b7',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <p style={{
                    color: '#6ee7b7',
                    fontWeight: '700',
                    marginBottom: '8px'
                  }}>
                    ✅ Re-Analysis Complete
                  </p>
                  <p style={{
                    color: '#a7f3d0',
                    fontSize: '0.9rem'
                  }}>
                    New Risk Score: <strong>
                      {editResult.riskScore}%
                    </strong> |
                    Risk Level: <strong>
                      {editResult.riskLevel}
                    </strong> |
                    Decision: <strong>
                      {editResult.decision}
                    </strong>
                  </p>
                </div>
              )}

              {/* Edit Form - 2 column grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={editForm.applicantName || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      applicantName: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Age (21-65) *</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={editForm.age || ''}
                    onChange={(e) => setEditForm({
                      ...editForm, age: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select
                    style={inputStyle}
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({
                      ...editForm, gender: e.target.value
                    })}
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    Employment Type *
                  </label>
                  <select
                    style={inputStyle}
                    value={editForm.employmentType || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      employmentType: e.target.value
                    })}
                  >
                    <option value="">Select</option>
                    <option value="SALARIED">Salaried</option>
                    <option value="SELF_EMPLOYED">
                      Self Employed
                    </option>
                    <option value="BUSINESS">Business</option>
                    <option value="UNEMPLOYED">Unemployed</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    Annual Income (₹) *
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={editForm.annualIncome || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      annualIncome: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Loan Amount (₹) *
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={editForm.loanAmount || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      loanAmount: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Tenure (months) *
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={editForm.loanTenureMonths || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      loanTenureMonths: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Credit Score (300-900) *
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={editForm.creditScore || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      creditScore: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Existing Debt (₹)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={editForm.existingDebt || 0}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      existingDebt: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Loan Purpose *
                  </label>
                  <select
                    style={inputStyle}
                    value={editForm.loanPurpose || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      loanPurpose: e.target.value
                    })}
                  >
                    <option value="">Select</option>
                    <option value="HOME">Home Purchase</option>
                    <option value="EDUCATION">Education</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex', gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  className="btn-primary"
                  onClick={handleReAnalyze}
                  disabled={editLoading}
                >
                  {editLoading
                    ? '🔄 Analyzing...'
                    : '🔍 Re-Analyze Application'}
                </button>
                <button
                  onClick={() => {
                    setEditModal(null);
                    setEditResult(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    width: '100%'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsTable;