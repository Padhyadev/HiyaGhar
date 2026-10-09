import React, { useState, useEffect } from 'react';
import { CustomerAuthService } from '../../services/customerAuthService';
import { showToast } from '../../utils/alertService';
import './AuthPage.css';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onNavigateHome: () => void;
}

// Inline SVG (not emoji) so the icon renders identically on every PC/browser,
// instead of depending on the OS's installed emoji font.
const EyeIcon: React.FC<{ open: boolean }> = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a17.7 17.7 0 0 1-3.16 4.4M6.61 6.61C3.87 8.36 2 12 2 12s4 8 11 8a9.1 9.1 0 0 0 4.24-1.02" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onNavigateHome,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Form Fields - Login
  const [loginEmail, setLoginEmail] = useState<string>(() => localStorage.getItem('hiyaghar_remember_email') || '');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => localStorage.getItem('hiyaghar_remember_me') === 'true');

  // Form Fields - Signup
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [signupUsername, setSignupUsername] = useState<string>('');
  const [signupReferralCode, setSignupReferralCode] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupMobile, setSignupMobile] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState<boolean>(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState<boolean>(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState<boolean>(false);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Field-level inline validation errors (displayed below input, no native browser popup)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMode(initialMode);
    window.scrollTo(0, 0);
  }, [initialMode]);

  // Smooth Side Switch Transition Handler
  const handleSwitchMode = (targetMode: 'login' | 'signup') => {
    if (mode === targetMode || isAnimating) return;
    setIsAnimating(true);
    setErrorMessage(null);
    setFormErrors({});

    // Trigger smooth 700ms horizontal swap
    setTimeout(() => {
      setMode(targetMode);
    }, 350);

    setTimeout(() => {
      setIsAnimating(false);
    }, 750);
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    if (!loginEmail.trim()) {
      errors.loginEmail = 'Please enter email';
    } else if (!loginEmail.includes('@')) {
      errors.loginEmail = 'Please enter valid email';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Please enter password';
    } else if (loginPassword.length < 8) {
      errors.loginPassword = 'Please enter at least 8 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    if (rememberMe) {
      localStorage.setItem('hiyaghar_remember_email', loginEmail.trim());
      localStorage.setItem('hiyaghar_remember_me', 'true');
    } else {
      localStorage.removeItem('hiyaghar_remember_email');
      localStorage.removeItem('hiyaghar_remember_me');
    }

    setIsLoading(true);
    try {
      const res = await CustomerAuthService.loginApi(loginEmail.trim(), loginPassword);

      if (res.success && res.customer) {
        setIsLoading(false);
        showToast('Login successfully', 'success');
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTarget = urlParams.get('redirect');
        setTimeout(() => {
          if (redirectTarget) {
            window.location.href = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`;
          } else {
            onNavigateHome();
          }
        }, 800);
        return;
      }

      // Customer login failed — show error.
      // NOTE: Admin/Staff login must be done via the dedicated Admin Portal (/admin/login).
      // Do NOT call AdminAuthService.loginApi() here as it would create a new server session
      // and invalidate any existing admin session token.
      setIsLoading(false);
      setErrorMessage(res.message || 'Invalid email or password');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Network error occurred');
    }
  };

  // Signup Submit Handler
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    if (!firstName || !firstName.trim()) {
      errors.firstName = 'Please enter first name';
    }
    if (!lastName || !lastName.trim()) {
      errors.lastName = 'Please enter last name';
    }
    if (!signupEmail || !signupEmail.trim()) {
      errors.signupEmail = 'Please enter email';
    } else if (!signupEmail.includes('@')) {
      errors.signupEmail = 'Please enter valid email';
    }
    const cleanMobile = signupMobile ? signupMobile.trim() : '';
    if (!cleanMobile) {
      errors.signupMobile = 'Please enter mobile number';
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.signupMobile = 'Please enter a valid 10-digit Indian mobile number';
    }
    if (!signupPassword || !signupPassword.trim()) {
      errors.signupPassword = 'Please enter password';
    } else if (signupPassword.length < 8) {
      errors.signupPassword = 'Please enter at least 8 characters';
    }
    if (!confirmPassword || !confirmPassword.trim()) {
      errors.confirmPassword = 'Please enter confirm password';
    } else if (signupPassword !== confirmPassword) {
      errors.confirmPassword = 'Please enter matching confirm password';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setIsLoading(true);

    try {
      const res = await CustomerAuthService.registerApi({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: signupEmail.trim(),
        mobileNo: signupMobile.trim(),
        password: signupPassword,
        username: signupUsername.trim() || undefined,
        referralCode: signupReferralCode.trim() || undefined,
      });

      setIsLoading(false);

      if (res.success && res.customer) {
        showToast('Account created successfully! Welcome to HIYA.', 'success');
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTarget = urlParams.get('redirect');
        setTimeout(() => {
          if (redirectTarget) {
            window.location.href = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`;
          } else {
            onNavigateHome();
          }
        }, 1000);
      } else {
        setErrorMessage(res.message || 'Signup failed');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Network error occurred');
    }
  };

  // Forgot Password Modal Handlers (3-step OTP flow)
  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError(null);
    setFormErrors({});
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const errors: Record<string, string> = {};

    if (!forgotEmail.trim()) {
      errors.forgotEmail = 'Please enter email';
    } else if (!forgotEmail.includes('@')) {
      errors.forgotEmail = 'Please enter valid email';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setForgotLoading(true);
    const res = await CustomerAuthService.generateForgotPasswordOtp(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      showToast(res.message || 'OTP sent to your email.');
      setForgotStep('otp');
    } else {
      setForgotError(res.message || 'Failed to send OTP');
    }
  };

  const handleResendOtp = async () => {
    setForgotError(null);
    setForgotLoading(true);
    const res = await CustomerAuthService.generateForgotPasswordOtp(forgotEmail.trim());
    setForgotLoading(false);
    showToast(res.success ? 'OTP resent to your email.' : (res.message || 'Failed to resend OTP.'));
  };

  const handleForgotOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const errors: Record<string, string> = {};

    if (!forgotOtp.trim()) {
      errors.forgotOtp = 'Please enter OTP';
    } else if (forgotOtp.trim().length !== 6) {
      errors.forgotOtp = 'Please enter 6 digit OTP';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setForgotLoading(true);
    const res = await CustomerAuthService.verifyForgotPasswordOtp(forgotEmail.trim(), forgotOtp.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotStep('reset');
    } else {
      setForgotError(res.message || 'Invalid or expired OTP');
    }
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const errors: Record<string, string> = {};

    if (!forgotNewPassword) {
      errors.forgotNewPassword = 'Please enter new password';
    } else if (forgotNewPassword.length < 8) {
      errors.forgotNewPassword = 'Please enter at least 8 characters';
    }

    if (!forgotConfirmPassword) {
      errors.forgotConfirmPassword = 'Please enter confirm password';
    } else if (forgotNewPassword !== forgotConfirmPassword) {
      errors.forgotConfirmPassword = 'Please enter matching confirm password';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setForgotLoading(true);
    const res = await CustomerAuthService.resetPasswordWithOtp(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
    setForgotLoading(false);

    if (res.success) {
      closeForgotModal();
      showToast('Password reset successfully! Please sign in with your new password.', 'success');
    } else {
      setForgotError(res.message || 'Failed to reset password');
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className={`hiyaghar-auth-split-wrapper ${mode === 'signup' ? 'is-signup-layout' : ''} ${isAnimating ? 'is-animating' : ''}`}>
      {/* Back to Store Top Button */}
      <button
        type="button"
        className="hiyaghar-back-home-floating-btn"
        onClick={onNavigateHome}
        aria-label="Back to Store"
      >
        ← Back to Store
      </button>

      {/* PANEL A: VISUAL MUKHWAS IMAGE PANEL */}
      <div className="hiyaghar-auth-image-panel">
        <div
          className="hiyaghar-auth-image-bg"
          style={{ backgroundImage: `url('/image/hiya_mukhwas_auth_lifestyle.webp')` }}
        />
        <div className="hiyaghar-auth-image-overlay-gradient" />

        {/* Ambient Floating Botanical Particles */}
        <div className="hiyaghar-botanical-particles">
          <span className="particle p1" />
          <span className="particle p2" />
          <span className="particle p3" />
        </div>

        {/* Left Side Branding Content */}
        <div className="hiyaghar-auth-image-content">
          <div className="hiyaghar-image-logo-placeholder" />

          <div className="hiyaghar-image-text-block">
            <h2 className="hiyaghar-image-headline">A little tradition in every bite.</h2>
            <p className="hiyaghar-image-subline">
              Authentic flavours. Thoughtfully crafted. Made for every day.
            </p>
          </div>
        </div>
      </div>

      {/* PANEL B: AUTHENTICATION FORM PANEL */}
      <div className="hiyaghar-auth-form-panel">
        <div className="hiyaghar-form-container">
          {/* Top Logo */}
          <div className="hiyaghar-form-logo-row">
            <a href="#/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
              <img
                src="/image/HIYA LOGO (1).png"
                alt="HIYA"
                className="hiyaghar-form-panel-logo"
              />
            </a>
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="hiyaghar-auth-error-alert" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'login' && (
            <div className="hiyaghar-auth-form-block animate-fade-in">
              <div className="hiyaghar-form-header">
                <h1 className="hiyaghar-form-title">Welcome Back</h1>
                <p className="hiyaghar-form-subtitle">Sign in to continue your HIYA journey.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="hiyaghar-auth-inputs-form" noValidate>
                <div className="hiyaghar-input-group">
                  <label htmlFor="login-email">Email Address *</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={loginEmail}
                    className={formErrors.loginEmail ? 'input-error' : ''}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (formErrors.loginEmail) setFormErrors((prev) => ({ ...prev, loginEmail: '' }));
                    }}
                  />
                  {formErrors.loginEmail && <span className="hiyaghar-field-error">{formErrors.loginEmail}</span>}
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="login-pass">Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      id="login-pass"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      className={formErrors.loginPassword ? 'input-error' : ''}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (formErrors.loginPassword) setFormErrors((prev) => ({ ...prev, loginPassword: '' }));
                      }}
                    />
                    <button
                      type="button"
                      className="pass-toggle-btn"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon open={showLoginPassword} />
                    </button>
                  </div>
                  {formErrors.loginPassword && <span className="hiyaghar-field-error">{formErrors.loginPassword}</span>}
                </div>

                {/* Remember Me Checkbox & Forgot Password Row */}
                <div className="hiyaghar-login-options-row">
                  <label className="hiyaghar-remember-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="hiyaghar-remember-checkbox"
                      aria-label="Remember me"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-pass-link"
                    onClick={() => setIsForgotModalOpen(true)}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="hiyaghar-primary-auth-btn"
                >
                  {isLoading ? 'Signing In...' : 'Sign In →'}
                </button>
              </form>

              {/* Switch to Signup */}
              <div className="hiyaghar-switch-auth-footer">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => handleSwitchMode('signup')}
                >
                  Create Account →
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: SIGNUP FORM */}
          {mode === 'signup' && (
            <div className="hiyaghar-auth-form-block animate-fade-in">
              <div className="hiyaghar-form-header">
                <h1 className="hiyaghar-form-title">Create Your Account</h1>
                <p className="hiyaghar-form-subtitle">
                  Join HIYA and discover natural flavours made for everyday moments.
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="hiyaghar-auth-inputs-form" noValidate>
                <div className="hiyaghar-input-row-2col">
                  <div className="hiyaghar-input-group">
                    <label htmlFor="signup-firstname">First Name *</label>
                    <input
                      id="signup-firstname"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      className={formErrors.firstName ? 'input-error' : ''}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: '' }));
                      }}
                    />
                    {formErrors.firstName && <span className="hiyaghar-field-error">{formErrors.firstName}</span>}
                  </div>
                  <div className="hiyaghar-input-group">
                    <label htmlFor="signup-lastname">Last Name *</label>
                    <input
                      id="signup-lastname"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      className={formErrors.lastName ? 'input-error' : ''}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: '' }));
                      }}
                    />
                    {formErrors.lastName && <span className="hiyaghar-field-error">{formErrors.lastName}</span>}
                  </div>
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-username">Username</label>
                  <input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username (optional)"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                  />
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-referral-code">Referral Code</label>
                  <input
                    id="signup-referral-code"
                    type="text"
                    placeholder="Have a friend's referral code? Enter it here (optional)"
                    value={signupReferralCode}
                    onChange={(e) => setSignupReferralCode(e.target.value)}
                  />
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-email">Email Address *</label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={signupEmail}
                    className={formErrors.signupEmail ? 'input-error' : ''}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      if (formErrors.signupEmail) setFormErrors((prev) => ({ ...prev, signupEmail: '' }));
                    }}
                  />
                  {formErrors.signupEmail && <span className="hiyaghar-field-error">{formErrors.signupEmail}</span>}
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-mobile">Mobile Number *</label>
                  <input
                    id="signup-mobile"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter your mobile number"
                    value={signupMobile}
                    className={formErrors.signupMobile ? 'input-error' : ''}
                    onChange={(e) => {
                      setSignupMobile(e.target.value.replace(/\D/g, ''));
                      if (formErrors.signupMobile) setFormErrors((prev) => ({ ...prev, signupMobile: '' }));
                    }}
                  />
                  {formErrors.signupMobile && <span className="hiyaghar-field-error">{formErrors.signupMobile}</span>}
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-pass">Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      id="signup-pass"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Create a password (min 8 chars)"
                      value={signupPassword}
                      className={formErrors.signupPassword ? 'input-error' : ''}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        if (formErrors.signupPassword) setFormErrors((prev) => ({ ...prev, signupPassword: '' }));
                      }}
                    />
                    <button
                      type="button"
                      className="pass-toggle-btn"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon open={showSignupPassword} />
                    </button>
                  </div>
                  {formErrors.signupPassword && <span className="hiyaghar-field-error">{formErrors.signupPassword}</span>}
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-confirm-pass">Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      id="signup-confirm-pass"
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      className={formErrors.confirmPassword ? 'input-error' : ''}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                    />
                    <button
                      type="button"
                      className="pass-toggle-btn"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <EyeIcon open={showSignupConfirmPassword} />
                    </button>
                  </div>
                  {formErrors.confirmPassword && <span className="hiyaghar-field-error">{formErrors.confirmPassword}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="hiyaghar-primary-auth-btn"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account →'}
                </button>
              </form>

              {/* Switch to Login */}
              <div className="hiyaghar-switch-auth-footer">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => handleSwitchMode('login')}
                >
                  ← Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL (3-step: email -> otp -> new password) */}
      {isForgotModalOpen && (
        <div className="hiyaghar-modal-overlay" onClick={closeForgotModal}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>Reset Your Password</h3>
              <button type="button" className="close-btn" onClick={closeForgotModal}>
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="hiyaghar-auth-error-alert" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'email' && (
              <>
                <p className="forgot-modal-sub">
                  Enter the email address associated with your HIYA account and we'll send you a one-time password (OTP) to reset it.
                </p>
                <form onSubmit={handleForgotEmailSubmit} className="hiyaghar-auth-inputs-form" noValidate>
                  <div className="hiyaghar-input-group">
                    <label>Email Address *</label>
                    <input
                      type="text"
                      placeholder="Enter your registered email"
                      value={forgotEmail}
                      className={formErrors.forgotEmail ? 'input-error' : ''}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (formErrors.forgotEmail) setFormErrors((prev) => ({ ...prev, forgotEmail: '' }));
                      }}
                    />
                    {formErrors.forgotEmail && <span className="hiyaghar-field-error">{formErrors.forgotEmail}</span>}
                  </div>
                  <button type="submit" disabled={forgotLoading} className="hiyaghar-primary-auth-btn">
                    {forgotLoading ? 'Sending OTP...' : 'Send OTP →'}
                  </button>
                </form>
              </>
            )}

            {forgotStep === 'otp' && (
              <>
                <p className="forgot-modal-sub">
                  Enter the 6-digit OTP sent to <strong>{forgotEmail}</strong>. It's valid for 10 minutes.
                </p>
                <form onSubmit={handleForgotOtpSubmit} className="hiyaghar-auth-inputs-form" noValidate>
                  <div className="hiyaghar-input-group">
                    <label>OTP *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={forgotOtp}
                      className={formErrors.forgotOtp ? 'input-error' : ''}
                      onChange={(e) => {
                        setForgotOtp(e.target.value.replace(/\D/g, ''));
                        if (formErrors.forgotOtp) setFormErrors((prev) => ({ ...prev, forgotOtp: '' }));
                      }}
                    />
                    {formErrors.forgotOtp && <span className="hiyaghar-field-error">{formErrors.forgotOtp}</span>}
                  </div>
                  <button type="submit" disabled={forgotLoading} className="hiyaghar-primary-auth-btn">
                    {forgotLoading ? 'Verifying...' : 'Verify OTP →'}
                  </button>
                  <div className="hiyaghar-switch-auth-footer">
                    <span>Didn't get the code?</span>
                    <button type="button" className="switch-link-btn" onClick={handleResendOtp} disabled={forgotLoading}>
                      Resend OTP
                    </button>
                  </div>
                </form>
              </>
            )}

            {forgotStep === 'reset' && (
              <>
                <p className="forgot-modal-sub">
                  OTP verified. Set a new password for <strong>{forgotEmail}</strong>.
                </p>
                <form onSubmit={handleForgotResetSubmit} className="hiyaghar-auth-inputs-form" noValidate>
                  <div className="hiyaghar-input-group">
                    <label>New Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        placeholder="Enter a new password"
                        value={forgotNewPassword}
                        className={formErrors.forgotNewPassword ? 'input-error' : ''}
                        onChange={(e) => {
                          setForgotNewPassword(e.target.value);
                          if (formErrors.forgotNewPassword) setFormErrors((prev) => ({ ...prev, forgotNewPassword: '' }));
                        }}
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        aria-label={showForgotNewPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={showForgotNewPassword} />
                      </button>
                    </div>
                    {formErrors.forgotNewPassword && <span className="hiyaghar-field-error">{formErrors.forgotNewPassword}</span>}
                  </div>
                  <div className="hiyaghar-input-group">
                    <label>Confirm New Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        value={forgotConfirmPassword}
                        className={formErrors.forgotConfirmPassword ? 'input-error' : ''}
                        onChange={(e) => {
                          setForgotConfirmPassword(e.target.value);
                          if (formErrors.forgotConfirmPassword) setFormErrors((prev) => ({ ...prev, forgotConfirmPassword: '' }));
                        }}
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        aria-label={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={showForgotConfirmPassword} />
                      </button>
                    </div>
                    {formErrors.forgotConfirmPassword && <span className="hiyaghar-field-error">{formErrors.forgotConfirmPassword}</span>}
                  </div>
                  <button type="submit" disabled={forgotLoading} className="hiyaghar-primary-auth-btn">
                    {forgotLoading ? 'Resetting...' : 'Reset Password →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
