import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle, FaFlask, FaAward, FaMicroscope, FaChevronRight } from 'react-icons/fa';
import landingVideo from '../../../assets/video/jagnath Landing page.mp4';
import '../../../assets/styles/login.css';
import { loginUser } from '../services/authService';
import { apiService } from '../../../shared/services/apiService';
import { AUTH_ENDPOINTS } from '../../../shared/services/apiEndpoints';

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

  // Login Type Selection Modal State
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [authenticatedUserData, setAuthenticatedUserData] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [underDevModal, setUnderDevModal] = useState({ open: false, title: '' });

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Email validation regex
  const validateEmail = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError('');
      const res = await apiService.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email: forgotEmail });
      setForgotSuccess(res?.message || 'OTP code sent to your email address.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err?.messageToShow || err?.message || 'Failed to send OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length < 4) {
      setForgotError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError('');
      const res = await apiService.post(AUTH_ENDPOINTS.VERIFY_OTP, { email: forgotEmail, otp: forgotOtp });
      setForgotSuccess(res?.message || 'OTP verified successfully.');
      setForgotStep(3);
    } catch (err) {
      setForgotError(err?.messageToShow || err?.message || 'Invalid or expired OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Confirm password does not match new password.');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError('');
      const res = await apiService.post(AUTH_ENDPOINTS.RESET_PASSWORD, { email: forgotEmail, otp: forgotOtp, newPassword });
      setIsForgotModalOpen(false);
      setAlert({ type: 'success', message: res?.message || 'Password reset successfully! You can now log in with your new password.' });
      setEmail(forgotEmail);
    } catch (err) {
      setForgotError(err?.messageToShow || err?.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
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

      const userData = response.data?.user || { email, rememberMe };
      setAuthenticatedUserData(userData);

      // Immediately display the "Which way would you like to login?" popup modal
      setTimeout(() => {
        setShowTypeModal(true);
      }, 500);
    } catch (err) {
      setIsLoading(false);
      setAlert({
        type: 'error',
        message: err.messageToShow || err.message || 'Login failed. Please try again.',
      });
    }
  };

  // Handle workspace/login-type selection
  const handleSelectLoginType = (typeKey) => {
    if (typeKey === 'nabl') {
      setUnderDevModal({ open: true, title: 'NABL Workspace' });
      return;
    }
    if (typeKey === 'non-nabl') {
      setUnderDevModal({ open: true, title: 'NON NABL Workspace' });
      return;
    }

    setSelectedType(typeKey);
    try {
      localStorage.setItem('selectedWorkspace', typeKey);
      sessionStorage.setItem('selectedWorkspace', typeKey);
    } catch (e) {
      console.warn('Could not store selectedWorkspace', e);
    }

    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess(authenticatedUserData, typeKey);
      } else {
        window.location.hash = '#/dashboard';
      }
    }, 250);
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
                  setForgotEmail(email);
                  setForgotOtp('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                  setIsForgotModalOpen(true);
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

      {/* Forgot Password OTP Modal */}
      {isForgotModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              {forgotStep === 1 && 'Reset Your Password'}
              {forgotStep === 2 && 'Enter Verification Code'}
              {forgotStep === 3 && 'Create New Password'}
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
              {forgotStep === 1 && 'Enter your registered email address and we will send a 6-digit OTP verification code.'}
              {forgotStep === 2 && `We sent a 6-digit OTP code to ${forgotEmail}. Please check your inbox.`}
              {forgotStep === 3 && 'Your OTP is verified! Enter and confirm your new password below.'}
            </p>

            {forgotError && (
              <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.825rem', marginBottom: '1rem' }}>
                ⚠️ {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{ padding: '0.65rem 0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.825rem', marginBottom: '1rem' }}>
                ✓ {forgotSuccess}
              </div>
            )}

            {/* STEP 1: Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email Address *</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{ padding: '0.7rem', border: 'none', borderRadius: '8px', background: '#22c55e', color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', opacity: forgotLoading ? 0.7 : 1 }}
                >
                  {forgotLoading ? 'Sending OTP Code...' : 'Send OTP Code'}
                </button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>6-Digit OTP Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 700, outline: 'none' }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{ padding: '0.7rem', border: 'none', borderRadius: '8px', background: '#22c55e', color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', opacity: forgotLoading ? 0.7 : 1 }}
                >
                  {forgotLoading ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.825rem', cursor: 'pointer', textAlign: 'center' }}
                >
                  Change Email Address
                </button>
              </form>
            )}

            {/* STEP 3: New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ padding: '0.65rem 2.5rem 0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Confirm New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ padding: '0.65rem 2.5rem 0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {showConfirmNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{ padding: '0.7rem', border: 'none', borderRadius: '8px', background: '#22c55e', color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', opacity: forgotLoading ? 0.7 : 1 }}
                >
                  {forgotLoading ? 'Updating Password...' : 'Reset & Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Login Type Selection Modal - Centered, Clean & Minimal */}
      {showTypeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              padding: '2.35rem 2.1rem',
              width: '100%',
              maxWidth: '490px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  color: '#047857',
                  marginBottom: '1rem'
                }}
              >
                <FaFlask size={22} />
              </div>
              <h3
                style={{
                  margin: '0 0 0.45rem 0',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.015em'
                }}
              >
                Choose Login Type
              </h3>
              <p
                style={{
                  margin: '0 0 0.3rem 0',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  color: '#047857'
                }}
              >
                Which way would you like to login?
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#64748b'
                }}
              >
                Please select how you want to continue.
              </p>
            </div>

            {/* Three Selectable Options Vertically Arranged */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Option 1: General */}
              <button
                type="button"
                onClick={() => handleSelectLoginType('general')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.15rem',
                  padding: '1.15rem 1.3rem',
                  borderRadius: '14px',
                  border: selectedType === 'general' ? '2px solid #047857' : '1px solid #e2e8f0',
                  background: selectedType === 'general' ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  if (selectedType !== 'general') {
                    e.currentTarget.style.borderColor = '#a7f3d0';
                    e.currentTarget.style.background = '#f0fdf4';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedType !== 'general') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '11px',
                    background: '#ecfdf5',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FaFlask size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>General</span>
                  </div>
                  <span style={{ fontSize: '0.825rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    For general users and standard laboratory management.
                  </span>
                </div>
                <FaChevronRight style={{ color: '#94a3b8', fontSize: '0.85rem', flexShrink: 0 }} />
              </button>

              {/* Option 2: NABL */}
              <button
                type="button"
                onClick={() => handleSelectLoginType('nabl')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.15rem',
                  padding: '1.15rem 1.3rem',
                  borderRadius: '14px',
                  border: selectedType === 'nabl' ? '2px solid #0d9488' : '1px solid #e2e8f0',
                  background: selectedType === 'nabl' ? '#f0fdfa' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  if (selectedType !== 'nabl') {
                    e.currentTarget.style.borderColor = '#99f6e4';
                    e.currentTarget.style.background = '#f0fdfa';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedType !== 'nabl') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '11px',
                    background: '#f0fdfa',
                    color: '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FaAward size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>NABL</span>
                  </div>
                  <span style={{ fontSize: '0.825rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    For NABL-related users and accredited operations.
                  </span>
                </div>
                <FaChevronRight style={{ color: '#94a3b8', fontSize: '0.85rem', flexShrink: 0 }} />
              </button>

              {/* Option 3: NON NABL */}
              <button
                type="button"
                onClick={() => handleSelectLoginType('non-nabl')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.15rem',
                  padding: '1.15rem 1.3rem',
                  borderRadius: '14px',
                  border: selectedType === 'non-nabl' ? '2px solid #334155' : '1px solid #e2e8f0',
                  background: selectedType === 'non-nabl' ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => {
                  if (selectedType !== 'non-nabl') {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedType !== 'non-nabl') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '11px',
                    background: '#f1f5f9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FaMicroscope size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>NON NABL</span>
                  </div>
                  <span style={{ fontSize: '0.825rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    For non-NABL-related users and routine operations.
                  </span>
                </div>
                <FaChevronRight style={{ color: '#94a3b8', fontSize: '0.85rem', flexShrink: 0 }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Under Development / Feature Not Ready Popup */}
      {underDevModal.open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setUnderDevModal({ open: false, title: '' })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              width: '100%',
              maxWidth: '430px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                fontSize: '1.75rem'
              }}
            >
              ⚠️
            </div>

            <h3
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#0f172a'
              }}
            >
              Under Development
            </h3>

            <p
              style={{
                margin: '0 0 1.75rem 0',
                fontSize: '0.925rem',
                color: '#64748b',
                lineHeight: 1.55
              }}
            >
              The <strong>{underDevModal.title}</strong> module is currently not done and under active development. Please select <strong>General</strong> to continue.
            </p>

            <button
              type="button"
              onClick={() => setUnderDevModal({ open: false, title: '' })}
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: '#047857',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#065f46'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#047857'; }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
