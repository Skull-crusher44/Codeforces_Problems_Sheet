import { useState } from 'react';
import './Auth.css';
import ForgotPassword from './ForgotPassword';
import { API_URL, ENDPOINTS } from '../api/config';

const Login = ({ onSwitch, onLoginSuccess, onOpenSheet }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="auth-container">
      <button 
        onClick={onOpenSheet} 
        className="auth-button secondary"
        style={{ marginBottom: '20px' }}
      >
        Open Codeforces Sheet
      </button>
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="auth-button">Login</button>
        <button 
          type="button" 
          className="auth-button secondary"
          onClick={() => setShowForgotPassword(true)}
        >
          Forgot Password?
        </button>
      </form>
      <p className="switch-text">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="switch-button">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
