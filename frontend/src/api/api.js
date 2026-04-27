import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically adds JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('loanguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AUTH
export const loginAdmin = (email, password) =>
  api.post('/auth/login', { email, password });

// LOAN APPLICATION
// Converts all string values from React form to correct types
// before sending to Spring Boot
export const submitLoanApplication = (formData) => {
  const convertedData = {
    applicantName: formData.applicantName,
    applicantEmail: formData.applicantEmail,
    age: formData.age ? parseInt(formData.age) : null,
    gender: formData.gender,
    annualIncome: formData.annualIncome ?
      parseFloat(formData.annualIncome) : null,
    loanAmount: formData.loanAmount ?
      parseFloat(formData.loanAmount) : null,
    loanTenureMonths: formData.loanTenureMonths ?
      parseInt(formData.loanTenureMonths) : null,
    creditScore: formData.creditScore ?
      parseInt(formData.creditScore) : null,
    existingDebt: formData.existingDebt ?
      parseFloat(formData.existingDebt) : 0,
    employmentType: formData.employmentType,
    loanPurpose: formData.loanPurpose
  };
  return api.post('/applications/submit', convertedData);
};

// DASHBOARD
export const getDashboardStats = () =>
  api.get('/dashboard/stats');

export const getAllApplications = () =>
  api.get('/applications/all');

export const overrideDecision = (id, decision, reason) =>
  api.put(`/applications/${id}/override`, { decision, reason });


// Delete an application completely
export const deleteApplication = (id) =>
  api.delete(`/applications/${id}`);

// Edit application fields and re-run fraud analysis
export const reAnalyzeApplication = (id, formData) => {
  const convertedData = {
    applicantName: formData.applicantName,
    applicantEmail: formData.applicantEmail,
    age: formData.age ? parseInt(formData.age) : null,
    gender: formData.gender,
    annualIncome: formData.annualIncome ?
      parseFloat(formData.annualIncome) : null,
    loanAmount: formData.loanAmount ?
      parseFloat(formData.loanAmount) : null,
    loanTenureMonths: formData.loanTenureMonths ?
      parseInt(formData.loanTenureMonths) : null,
    creditScore: formData.creditScore ?
      parseInt(formData.creditScore) : null,
    existingDebt: formData.existingDebt ?
      parseFloat(formData.existingDebt) : 0,
    employmentType: formData.employmentType,
    loanPurpose: formData.loanPurpose
  };
  return api.put(`/applications/${id}/reanalyze`, convertedData);
};

export default api;