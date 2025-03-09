import { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import CodeforcesSheet from './components/CodeforcesSheet';
import { API_URL, ENDPOINTS } from './api/config';
import './App.css';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  
  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.ME}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data) {
        setUser(data);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (token) => {
    localStorage.setItem('token', token);
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.ME}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data) {
        setUser(data);
        setIsAuthenticated(true);
        setShowSheet(true); // Open sheet after successful login
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setShowSheet(false);
  };

  const handleOpenSheet = () => {
    setShowSheet(true);
  };

  const handleRedirectToSignup = () => {
    setShowSheet(false);
    setShowLogin(false);
  };

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (showSheet) {
    return (
      <div className="app-container">
        {isAuthenticated && (
          <nav className="navbar">
            {user && <span className="user-email">{user.email}</span>}
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </nav>
        )}
        {!isAuthenticated && (
          <button 
            onClick={() => setShowSheet(false)} 
            className="auth-button"
            style={{ 
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: 'auto',
              padding: '8px 16px'
            }}
          >
            Back to Login
          </button>
        )}
        <CodeforcesSheet 
          isAuthenticated={isAuthenticated}
          onRedirectToSignup={handleRedirectToSignup}
        />
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      {showLogin ? (
        <Login 
          onSwitch={() => setShowLogin(false)}
          onLoginSuccess={handleAuthSuccess}
          onOpenSheet={handleOpenSheet}
        />
      ) : (
        <Signup 
          onSwitch={() => setShowLogin(true)}
          onSignupSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;
