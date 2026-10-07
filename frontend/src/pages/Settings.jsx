import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  Send, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();

  // Email & Verification Code state
  const [email, setEmail] = useState(user?.email || '');
  const [codeRequested, setCodeRequested] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Request Verification Code Handler
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setInfoMessage('');
    setErrorMessage('');
    setSendingCode(true);

    try {
      const response = await api.post('/settings/request-password-code/', { email });
      setCodeRequested(true);
      setInfoMessage(response.data.message || `Verification code sent to ${email}`);
      if (response.data.code) {
        // Helpful dev notification
        console.log(`[Dev Helper] Verification Code: ${response.data.code}`);
      }
    } catch (err) {
      const errText = err.response?.data?.error || 'Failed to send verification code. Please check your email address.';
      setErrorMessage(errText);
    } finally {
      setSendingCode(false);
    }
  };

  // Submit Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/settings/change-password/', {
        current_password: currentPassword,
        code: verificationCode,
        new_password: newPassword
      });

      setSuccessMessage(response.data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setCodeRequested(false);
    } catch (err) {
      const errText = err.response?.data?.error || 'Failed to update password. Please verify your code and current password.';
      setErrorMessage(errText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, minHeight: 0, width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <SettingsIcon size={22} style={{ color: 'var(--primary)' }} /> Settings & Preferences
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, marginTop: '0.1rem' }}>
            {user?.role === 'ADMIN'
              ? 'Manage your account security, admin credentials, and display themes.'
              : 'Manage your visual display themes and app preferences.'}
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: user?.role === 'ADMIN' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', 
        gap: '0.85rem', 
        alignItems: 'start'
      }}>
        
        {/* Left Column: Appearance & Account info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Section 1: Appearance & Theme */}
          <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.5rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Appearance Theme
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 0.65rem 0' }}>
              Select your preferred visual mode for the C3 Fuels portal.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
              {/* Dark Mode Card */}
              <div 
                onClick={() => setTheme('dark')}
                style={{
                  background: '#0f172a',
                  border: `2px solid ${theme === 'dark' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '0.75rem 0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: '#f8fafc',
                  boxShadow: theme === 'dark' ? '0 0 10px rgba(59, 130, 246, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Moon size={24} color="#60a5fa" style={{ marginBottom: '0.25rem' }} />
                <div style={{ fontWeight: '600', fontSize: '0.82rem' }}>Dark Mode</div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sleek & Low Light</span>
              </div>

              {/* Light Mode Card */}
              <div 
                onClick={() => setTheme('light')}
                style={{
                  background: '#ffffff',
                  border: `2px solid ${theme === 'light' ? 'var(--primary)' : '#cbd5e1'}`,
                  borderRadius: '10px',
                  padding: '0.75rem 0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: '#0f172a',
                  boxShadow: theme === 'light' ? '0 0 10px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sun size={24} color="#f59e0b" style={{ marginBottom: '0.25rem' }} />
                <div style={{ fontWeight: '600', fontSize: '0.82rem' }}>Light Mode</div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>High Contrast</span>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'var(--bg-main)',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '500' }}>Active: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              <button 
                onClick={toggleTheme}
                className="btn btn-outline"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', height: '28px' }}
              >
                {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#60a5fa" />}
                Switch
              </button>
            </div>
          </div>

          {/* Section: Admin Info Card */}
          {user?.role === 'ADMIN' && (
            <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.5rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary)' }} /> Account & Security
              </h2>

              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.18)',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account</span>
                  <span style={{ fontWeight: '600', fontSize: '0.82rem' }}>{user?.username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role</span>
                  <span style={{ fontWeight: '600', fontSize: '0.82rem', color: '#a78bfa' }}>👑 {user?.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                  <Lock size={13} /> Email-Verified Password Reset Enabled
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Password & Security (Admin Only) */}
        {user?.role === 'ADMIN' && (
          <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.6rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
              <KeyRound size={18} style={{ color: 'var(--primary)' }} /> Password & Credentials
            </h2>

            {/* Feedback Messages */}
            {errorMessage && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--error)', 
                padding: '0.45rem 0.75rem', 
                borderRadius: '6px', 
                marginBottom: '0.65rem',
                fontSize: '0.75rem',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <AlertCircle size={15} /> {errorMessage}
              </div>
            )}

            {successMessage && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                background: 'rgba(34, 197, 94, 0.1)', 
                color: 'var(--success)', 
                padding: '0.45rem 0.75rem', 
                borderRadius: '6px', 
                marginBottom: '0.65rem',
                fontSize: '0.75rem',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <CheckCircle2 size={15} /> {successMessage}
              </div>
            )}

            {infoMessage && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: 'var(--primary)', 
                padding: '0.45rem 0.75rem', 
                borderRadius: '6px', 
                marginBottom: '0.65rem',
                fontSize: '0.75rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <Mail size={15} /> {infoMessage}
              </div>
            )}

            {/* Step 1: Verification Code Request */}
            <div style={{ marginBottom: '0.75rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '600', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={15} style={{ color: 'var(--primary)' }} /> Step 1: Request Verification Code
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.73rem', margin: '0 0 0.5rem 0' }}>
                Send a 6-digit security verification code to your email before updating password.
              </p>

              <form onSubmit={handleRequestCode} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                    Email Address
                  </label>
                  <input 
                    type="email"
                    className="input"
                    placeholder="admin@c3fuels.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: '32px' }}
                  />
                </div>

                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={sendingCode}
                  style={{ gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: '32px', flexShrink: 0 }}
                >
                  <Send size={14} />
                  {sendingCode ? 'Sending...' : (codeRequested ? 'Resend Code' : 'Send Code')}
                </button>
              </form>
            </div>

            {/* Step 2: Password Change Form */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '600', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <KeyRound size={15} style={{ color: 'var(--primary)' }} /> Step 2: Update Password
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.73rem', margin: '0 0 0.55rem 0' }}>
                Enter current password, 6-digit verification code, and new password.
              </p>

              <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                    Current Password *
                  </label>
                  <input 
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: '32px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                    Verification Code *
                  </label>
                  <input 
                    type="text"
                    className="input"
                    placeholder="e.g. 849201"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.trim())}
                    maxLength={6}
                    required
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: '32px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                    New Password *
                  </label>
                  <input 
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: '32px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                    Confirm New Password *
                  </label>
                  <input 
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: '32px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '0.35rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.78rem', height: '34px', gap: '0.4rem' }}
                  >
                    <KeyRound size={15} />
                    {submitting ? 'Updating...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

