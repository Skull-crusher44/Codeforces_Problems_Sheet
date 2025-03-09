import { useState } from 'react';
import './Auth.css';
import { API_URL, ENDPOINTS } from '../api/config';

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.SEND_OTP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setSuccess('OTP sent successfully to your email');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.VERIFY_OTP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      setSuccess('OTP verified successfully');
      setStep('newPassword');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.RESET_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess('Password reset successful. Please login with your new password.');
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderEmailForm = () => (
    <form onSubmit={handleSendOtp}>
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="auth-button">Send OTP</button>
      <button type="button" className="auth-button secondary" onClick={onBack}>
        Back to Login
      </button>
    </form>
  );

  const renderOtpForm = () => (
    <form onSubmit={handleVerifyOtp}>
      <div className="form-group">
        <label htmlFor="otp">Enter OTP:</label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="auth-button">Verify OTP</button>
      <button type="button" className="auth-button secondary" onClick={onBack}>
        Back to Login
      </button>
    </form>
  );

  const renderNewPasswordForm = () => (
    <form onSubmit={handleResetPassword}>
      <div className="form-group">
        <label htmlFor="newPassword">New Password:</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="auth-button">Reset Password</button>
      <button type="button" className="auth-button secondary" onClick={onBack}>
        Back to Login
      </button>
    </form>
  );

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {step === 'email' && renderEmailForm()}
      {step === 'otp' && renderOtpForm()}
      {step === 'newPassword' && renderNewPasswordForm()}
    </div>
  );
};

export default ForgotPassword;
