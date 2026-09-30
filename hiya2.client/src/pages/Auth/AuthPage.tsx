import React, { useState, useEffect } from 'react';
import { CustomerAuthService } from '../../services/customerAuthService';
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
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a17.7 17.7 0 0 1-3.16 4.4M6.61 6.61C3.87 8.36 2 12 2 12s4 8 11 8a9.1 9.1 0 0 0 4.24-1.02" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onNavigateHome,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Form Fields - Login (Blank by default)
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

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

  // Status & Validation States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Forgot Password Modal State (3-step: email -> otp -> new password)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    window.scrollTo(0, 0);
  }, [initialMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Smooth Side Switch Transition Handler
  const handleSwitchMode = (targetMode: 'login' | 'signup') => {
    if (mode === targetMode || isAnimating) return;
    setIsAnimating(true);
    setErrorMessage(null);

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

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    if (!loginPassword || loginPassword.length < 4) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await CustomerAuthService.loginApi(loginEmail.trim(), loginPassword);
      setIsLoading(false);

      if (res.success && res.customer) {
        showToast(`Welcome back, ${res.customer.firstName}!`);
        setTimeout(() => {
          onNavigateHome();
        }, 800);
      } else {
        setErrorMessage(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Network error. Please try again.');
    }
  };

  // Signup Submit Handler
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim()) {
      setErrorMessage('Please enter your first name.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Please enter your last name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signupMobile.trim() || signupMobile.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (signupPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

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
        showToast('🎉 Account created successfully! Welcome to HIYA.');
        setTimeout(() => {
          onNavigateHome();
        }, 1000);
      } else {
        setErrorMessage(res.message || 'Signup failed. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Network error. Please try again.');
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
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    const res = await CustomerAuthService.generateForgotPasswordOtp(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      showToast(res.message || 'OTP sent to your email.');
      setForgotStep('otp');
    } else {
      setForgotError(res.message || 'Failed to send OTP. Please try again.');
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
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    setForgotLoading(true);
    const res = await CustomerAuthService.verifyForgotPasswordOtp(forgotEmail.trim(), forgotOtp.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotStep('reset');
    } else {
      setForgotError(res.message || 'Invalid or expired OTP.');
    }
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setForgotError('Password must be at least 4 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    const res = await CustomerAuthService.resetPasswordWithOtp(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
    setForgotLoading(false);

    if (res.success) {
      closeForgotModal();
      showToast('✅ Password reset successfully! Please sign in with your new password.');
    } else {
      setForgotError(res.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <div className={`hiyaghar-auth-split-wrapper ${mode === 'signup' ? 'is-signup-layout' : ''} ${isAnimating ? 'is-animating' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="hiyaghar-auth-toast-banner" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

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
              ⚠️ {errorMessage}
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {mode === 'login' && (
            <div className="hiyaghar-auth-form-block animate-fade-in">
              <div className="hiyaghar-form-header">
                <h1 className="hiyaghar-form-title">Welcome Back</h1>
                <p className="hiyaghar-form-subtitle">Sign in to continue your HIYA journey.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="hiyaghar-auth-inputs-form">
                <div className="hiyaghar-input-group">
                  <label htmlFor="login-email">Email Address *</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="hiyaghar-input-group">
                  <div className="label-row">
                    <label htmlFor="login-pass">Password *</label>
                    <button
                      type="button"
                      className="forgot-pass-link"
                      onClick={() => setIsForgotModalOpen(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      id="login-pass"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
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

              <form onSubmit={handleSignupSubmit} className="hiyaghar-auth-inputs-form">
                <div className="hiyaghar-input-row-2col">
                  <div className="hiyaghar-input-group">
                    <label htmlFor="signup-firstname">First Name *</label>
                    <input
                      id="signup-firstname"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="hiyaghar-input-group">
                    <label htmlFor="signup-lastname">Last Name *</label>
                    <input
                      id="signup-lastname"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
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
                    placeholder="Enter your email address"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-mobile">Mobile Number *</label>
                  <input
                    id="signup-mobile"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter your mobile number"
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value)}
                    required
                  />
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-pass">Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      id="signup-pass"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Create a password (min 6 chars)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
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
                </div>

                <div className="hiyaghar-input-group">
                  <label htmlFor="signup-confirm-pass">Confirm Password *</label>
                  <input
                    id="signup-confirm-pass"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
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
                ⚠️ {forgotError}
              </div>
            )}

            {forgotStep === 'email' && (
              <>
                <p className="forgot-modal-sub">
                  Enter the email address associated with your HIYA account and we'll send you a one-time password (OTP) to reset it.
                </p>
                <form onSubmit={handleForgotEmailSubmit} className="hiyaghar-auth-inputs-form">
                  <div className="hiyaghar-input-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      placeholder="Enter your registered email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
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
                <form onSubmit={handleForgotOtpSubmit} className="hiyaghar-auth-inputs-form">
                  <div className="hiyaghar-input-group">
                    <label>OTP *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      required
                    />
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
                <form onSubmit={handleForgotResetSubmit} className="hiyaghar-auth-inputs-form">
                  <div className="hiyaghar-input-group">
                    <label>New Password *</label>
                    <input
                      type="password"
                      placeholder="Enter a new password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="hiyaghar-input-group">
                    <label>Confirm New Password *</label>
                    <input
                      type="password"
                      placeholder="Confirm your new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                    />
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
    </div>
  );
};
