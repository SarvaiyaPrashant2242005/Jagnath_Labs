import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import landingVideo from '../../../assets/video/jagnath Landing page.mp4';
import '../../../assets/styles/login.css';
import { loginUser } from '../services/authService';

const Login = ({ onLoginSuccess, onNavigate }) => {
  // Form fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' }); // 'success' | 'error' | ''
  const [errors, setErrors] = useState({ email: '', password: '' });

  // Email validation regex
  const validateEmail = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  // Handle Input Changes & Clear Errors
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    // Validate fields
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    // Call the real login API
    setIsLoading(true);

    try {
      const response = await loginUser({ email, password });

      setIsLoading(false);
      setAlert({
        type: 'success',
        message: response.messageToShow || 'Successfully authenticated. Access granted!',
      });

      // Navigate to dashboard after a brief delay for visual feedback
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(response.data?.user || { email, rememberMe });
        }
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setAlert({
        type: 'error',
        message: err.messageToShow || err.message || 'Login failed. Please try again.',
      });
    }
  };

  return (
    <div className="login-container">
      {/* Left Column - Video Section with Emerald Green Overlay */}
      <div className="login-video-section">
        <video
          className="login-bg-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={landingVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="login-video-overlay"></div>

        <div className="login-video-content">
          <div
            className="login-logo"
            onClick={() => onNavigate && onNavigate('landing')}
            style={{ cursor: 'pointer' }}
            title="Go to landing page"
          >
            <img src="/Images/Navbar_Logo.png" alt="Jaganath Lab" className="login-logo-img" />
          </div>

          <div className="login-heading-area">
            <h1 className="login-heading">
              Advanced<br />
              Laboratory,<br />
              Simplified<span>.</span>
            </h1>
            <p className="login-subheading">
              The premium cloud-based portal built exclusively for pathology diagnostic laboratories and medical testing.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form Section */}
      <div className="login-form-section">
        <div className="login-form-card">
          <div
            className="mobile-logo-wrapper"
            onClick={() => onNavigate && onNavigate('landing')}
            style={{ cursor: 'pointer' }}
            title="Go to landing page"
          >
            <img src="/Images/Navbar_Logo.png" alt="Jaganath Lab" className="mobile-logo-img" />
          </div>
          <div className="login-header-group">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Please enter your details to sign in.</p>
          </div>

          {/* Form Alert Notifications */}
          {alert.message && (
            <div className={`form-alert form-alert-${alert.type}`}>
              {alert.type === 'success' ? (
                <FaCheckCircle className="alert-icon" />
              ) : (
                <FaExclamationCircle className="alert-icon" />
              )}
              <span>{alert.message}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  className="login-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && (
                <span className="error-message">
                  <FaExclamationCircle /> {errors.email}
                </span>
              )}
            </div>

            {/* Password field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">
                  <FaExclamationCircle /> {errors.password}
                </span>
              )}
            </div>

            {/* Checkbox and Forgot Password link */}
            <div className="form-helpers">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                Remember me
              </label>
              <a
                href="#forgot"
                className="forgot-password-link"
                onClick={(e) => {
                  e.preventDefault();
                  setAlert({ type: 'error', message: 'Password recovery feature is under development.' });
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  Login In...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer details */}
          <footer className="login-footer">
            Jagnath Lab Version 1.0.0
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
