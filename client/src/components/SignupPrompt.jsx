import React from 'react';
import './SignupPrompt.css';

const SignupPrompt = ({ onSignup, onCancel }) => {
  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <h3>Sign Up Required</h3>
        <p>To track your solved problems, you need to create an account.</p>
        <div className="auth-modal-buttons">
          <button 
            className="auth-button"
            onClick={onSignup}
          >
            Sign Up Now
          </button>
          <button 
            className="auth-button secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPrompt;
