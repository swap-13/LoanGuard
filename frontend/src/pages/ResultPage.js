import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// ResultPage shows the fraud analysis result after form submission
// Receives result data via React Router navigation state
// Shows: Risk Score, Risk Level, Decision, and Reasons (Explainability)
const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  // If someone directly visits /result without submitting form
  if (!result) {
    return (
      <div>
        <Navbar />
        <div className="page-container" style={{ textAlign: 'center' }}>
          <h2>No result found</h2>
          <button
            className="btn-primary"
            style={{ maxWidth: '200px', margin: '20px auto' }}
            onClick={() => navigate('/')}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Color config based on risk level
  const riskConfig = {
    LOW: {
      color: '#6ee7b7', bg: '#064e3b',
      icon: '✅', label: 'LOW RISK'
    },
    MEDIUM: {
      color: '#fcd34d', bg: '#451a03',
      icon: '⚠️', label: 'MEDIUM RISK'
    },
    HIGH: {
      color: '#fb923c', bg: '#431407',
      icon: '🚩', label: 'HIGH RISK'
    },
    CRITICAL: {
      color: '#f87171', bg: '#450a0a',
      icon: '❌', label: 'CRITICAL RISK'
    }
  };

  const decisionConfig = {
    AUTO_APPROVED: { color: '#6ee7b7', label: 'Auto Approved', icon: '✅' },
    MANUAL_REVIEW: { color: '#fcd34d', label: 'Under Manual Review', icon: '⏳' },
    AUTO_REJECTED: { color: '#f87171', label: 'Auto Rejected', icon: '❌' }
  };

  const risk = riskConfig[result.riskLevel] || riskConfig.MEDIUM;
  const decision = decisionConfig[result.decision] || decisionConfig.MANUAL_REVIEW;

  return (
    <div>
      <Navbar />
      <div className="page-container" style={{ maxWidth: '800px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2rem', fontWeight: '800', color: '#e2e8f0'
          }}>
            Analysis Complete
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>
            Application ID: #{result.applicationId} •{' '}
            {result.submittedAt}
          </p>
        </div>

        {/* Risk Score Card - Main highlight */}
        <div className="card" style={{
          textAlign: 'center', marginBottom: '24px',
          border: `1px solid ${risk.color}40`,
          background: `linear-gradient(135deg, #1e293b, ${risk.bg}40)`
        }}>
          <p style={{
            color: '#94a3b8', fontSize: '0.875rem',
            fontWeight: '600', marginBottom: '16px',
            textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            FRAUD RISK SCORE
          </p>

          {/* Big risk score number */}
          <div style={{
            fontSize: '5rem', fontWeight: '800',
            color: risk.color, lineHeight: 1,
            marginBottom: '16px'
          }}>
            {result.riskScore}%
          </div>

          {/* Risk level badge */}
          <div style={{
            display: 'inline-block',
            background: risk.bg,
            color: risk.color,
            padding: '8px 24px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '0.9rem',
            marginBottom: '16px'
          }}>
            {risk.icon} {risk.label}
          </div>

          {/* Progress bar showing risk score visually */}
          <div style={{
            background: '#0f172a',
            borderRadius: '10px',
            height: '10px',
            margin: '16px 0',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${result.riskScore}%`,
              background: `linear-gradient(90deg, #6ee7b7, ${risk.color})`,
              borderRadius: '10px',
              transition: 'width 1s ease'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: '#64748b', fontSize: '0.75rem'
          }}>
            <span>0% — Safe</span>
            <span>100% — Critical</span>
          </div>
        </div>

        {/* Decision Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{
            color: '#94a3b8', fontSize: '0.8rem',
            fontWeight: '600', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: '12px'
          }}>
            FINAL DECISION
          </h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{ fontSize: '2rem' }}>{decision.icon}</span>
            <div>
              <p style={{
                color: decision.color, fontWeight: '700',
                fontSize: '1.3rem'
              }}>
                {decision.label}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {result.decision === 'AUTO_APPROVED' &&
                  'Your application meets all criteria and has been approved.'}
                {result.decision === 'MANUAL_REVIEW' &&
                  'Your application has been flagged for manual review by our team.'}
                {result.decision === 'AUTO_REJECTED' &&
                  'Your application did not meet the required criteria.'}
              </p>
            </div>
          </div>
        </div>

        {/* Explainability Card - Why was it flagged */}
        {result.reasons && result.reasons.length > 0 && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: '#94a3b8', fontSize: '0.8rem',
              fontWeight: '600', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '16px'
            }}>
              🔍 WHY THIS RESULT? (AI Explanation)
            </h3>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              {result.reasons.map((reason, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'flex-start',
                  gap: '10px', padding: '12px',
                  background: '#0f172a', borderRadius: '8px',
                  border: '1px solid #334155'
                }}>
                  <span style={{ color: '#e94560', marginTop: '2px' }}>
                    →
                  </span>
                  <span style={{
                    color: '#cbd5e1', fontSize: '0.9rem'
                  }}>
                    {reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applicant Summary */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 style={{
            color: '#94a3b8', fontSize: '0.8rem',
            fontWeight: '600', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: '16px'
          }}>
            APPLICANT SUMMARY
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {[
              { label: 'Applicant Name', value: result.applicantName },
              { label: 'Application ID', value: `#${result.applicationId}` },
              { label: 'Submitted At', value: result.submittedAt },
              { label: 'Risk Level', value: result.riskLevel }
            ].map((item, i) => (
              <div key={i} style={{
                background: '#0f172a', borderRadius: '8px',
                padding: '12px 16px'
              }}>
                <p style={{
                  color: '#64748b', fontSize: '0.75rem',
                  marginBottom: '4px'
                }}>
                  {item.label}
                </p>
                <p style={{
                  color: '#e2e8f0', fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Back button */}
        <button
          className="btn-primary"
          onClick={() => navigate('/')}
        >
          Submit Another Application
        </button>
      </div>
    </div>
  );
};

export default ResultPage;