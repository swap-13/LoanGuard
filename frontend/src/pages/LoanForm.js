import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { submitLoanApplication } from '../api/api';

// LoanForm is the PUBLIC page - anyone can access
// User fills loan details and submits
// Now includes validation error display from Spring Boot
const LoanForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // validationErrors stores field specific errors from Spring Boot
  // Example: { age: "Minimum age is 21 years", creditScore: "..." }
  const [validationErrors, setValidationErrors] = useState({});

  const [form, setForm] = useState({
    applicantName: '',
    age: '',
    gender: '',
    annualIncome: '',
    loanAmount: '',
    loanTenureMonths: '',
    creditScore: '',
    existingDebt: '',
    employmentType: '',
    loanPurpose: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear validation error for this field when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      const response = await submitLoanApplication(form);
      // Navigate to result page and pass the result data
      navigate('/result', { state: { result: response.data } });
    } catch (err) {
      // Check if it is a validation error (400) from Spring Boot
      // Spring Boot sends back field name and error message
      if (err.response?.status === 400 && err.response?.data?.fields) {
        setValidationErrors(err.response.data.fields);
        setError('Please fix the errors below before submitting.');
      } else {
        setError('Failed to submit application. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper component to show error below each field
  // Reused for every input field
  const FieldError = ({ field }) => {
    if (!validationErrors[field]) return null;
    return (
      <p style={{
        color: '#f87171',
        fontSize: '0.78rem',
        marginTop: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        ⚠ {validationErrors[field]}
      </p>
    );
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(233, 69, 96, 0.1)',
            border: '1px solid rgba(233, 69, 96, 0.3)',
            borderRadius: '20px', padding: '6px 16px',
            color: '#e94560', fontSize: '0.8rem',
            fontWeight: '600', marginBottom: '16px'
          }}>
            AI-POWERED FRAUD DETECTION
          </div>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: '800',
            color: '#e2e8f0', marginBottom: '12px'
          }}>
            Loan Application
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Fill in your details below. Our AI system will analyze
            your application instantly.
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* General error message */}
          {error && (
            <div style={{
              background: '#450a0a',
              border: '1px solid #f87171',
              borderRadius: '10px', padding: '12px 16px',
              color: '#f87171', marginBottom: '24px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Row 1 - Name and Age */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px', marginBottom: '20px'
            }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  type="text"
                  name="applicantName"
                  placeholder="Enter your full name"
                  value={form.applicantName}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.applicantName
                      ? '#f87171' : undefined
                  }}
                />
                <FieldError field="applicantName" />
              </div>
              <div>
                <label className="form-label">Age * (21-65)</label>
                <input
                  className="form-input"
                  type="number"
                  name="age"
                  placeholder="Your age"
                  value={form.age}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.age
                      ? '#f87171' : undefined
                  }}
                />
                <FieldError field="age" />
              </div>
            </div>

            {/* Row 2 - Gender and Employment */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px', marginBottom: '20px'
            }}>
              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <FieldError field="gender" />
              </div>
              <div>
                <label className="form-label">Employment Type *</label>
                <select
                  className="form-input"
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.employmentType
                      ? '#f87171' : undefined
                  }}
                >
                  <option value="">Select employment</option>
                  <option value="SALARIED">Salaried</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="BUSINESS">Business Owner</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                </select>
                <FieldError field="employmentType" />
              </div>
            </div>

            {/* Row 3 - Income and Loan Amount */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px', marginBottom: '20px'
            }}>
              <div>
                <label className="form-label">Annual Income (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  name="annualIncome"
                  placeholder="e.g. 600000"
                  value={form.annualIncome}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.annualIncome
                      ? '#f87171' : undefined
                  }}
                />
                <FieldError field="annualIncome" />
              </div>
              <div>
                <label className="form-label">Loan Amount (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  name="loanAmount"
                  placeholder="e.g. 500000"
                  value={form.loanAmount}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.loanAmount
                      ? '#f87171' : undefined
                  }}
                />
                <FieldError field="loanAmount" />
              </div>
            </div>

            {/* Row 4 - Tenure and Credit Score */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px', marginBottom: '20px'
            }}>
              <div>
                <label className="form-label">
                  Loan Tenure (months) * (6-360)
                </label>
                <input
                  className="form-input"
                  type="number"
                  name="loanTenureMonths"
                  placeholder="e.g. 60"
                  value={form.loanTenureMonths}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.loanTenureMonths
                      ? '#f87171' : undefined
                  }}
                />
                <FieldError field="loanTenureMonths" />
              </div>
              <div>
                <label className="form-label">
                  Credit Score * (300-900)
                </label>
                <input
                  className="form-input"
                  type="number"
                  name="creditScore"
                  placeholder="300 - 900"
                  value={form.creditScore}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.creditScore
                      ? '#f87171' : undefined
                  }}
                />
                <FieldError field="creditScore" />
              </div>
            </div>

            {/* Row 5 - Existing Debt and Purpose */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px', marginBottom: '32px'
            }}>
              <div>
                <label className="form-label">Existing Debt (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  name="existingDebt"
                  placeholder="0 if none"
                  value={form.existingDebt}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.existingDebt
                      ? '#f87171' : undefined
                  }}
                />
                <FieldError field="existingDebt" />
              </div>
              <div>
                <label className="form-label">Loan Purpose *</label>
                <select
                  className="form-input"
                  name="loanPurpose"
                  value={form.loanPurpose}
                  onChange={handleChange}
                  style={{
                    borderColor: validationErrors.loanPurpose
                      ? '#f87171' : undefined
                  }}
                >
                  <option value="">Select purpose</option>
                  <option value="HOME">Home Purchase</option>
                  <option value="EDUCATION">Education</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="BUSINESS">Business</option>
                </select>
                <FieldError field="loanPurpose" />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}>
                  <div className="spinner"
                    style={{ width: '20px', height: '20px' }}
                  />
                  Analyzing Application...
                </span>
              ) : (
                '🔍 Analyze My Application'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoanForm;