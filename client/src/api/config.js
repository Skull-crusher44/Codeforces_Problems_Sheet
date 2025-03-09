// API configuration
export const API_URL = import.meta.env.VITE_API_URL;

// Helper function to construct API URLs
export const getApiUrl = (endpoint) => `${API_URL}${endpoint}`;

// API endpoints
export const ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  ME: '/api/auth/me',
  SOLVED_PROBLEMS: '/api/auth/getSolvedProblems',
  UPDATE_SOLVED_PROBLEM: '/api/auth/updateSolvedProblem',
  SEND_OTP: '/api/forgot-password/send-otp',
  VERIFY_OTP: '/api/forgot-password/verify-otp',
  RESET_PASSWORD: '/api/forgot-password/reset-password'
};
