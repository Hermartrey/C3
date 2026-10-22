import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getApiBaseUrl } from '../api';
import { Lock, User, Store, AlertCircle, ArrowRight, Shield, Settings, Server, RefreshCw } from 'lucide-react';
import C3FuelsLogo from '../components/C3FuelsLogo';
import ApiConfigModal from '../components/ApiConfigModal';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingNote, setSubmittingNote] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState(getApiBaseUrl());
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'MANAGER') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setSubmittingNote('Connecting to server...');

    const timer = setTimeout(() => {
      setSubmittingNote('Waking up server (Render free tier can take ~50s)...');
    }, 3000);

    try {
      await login(username, password);
      // Verify user role after login - only Branch Managers allowed
      const res = await api.get('/me/');
      if (res.data.role !== 'MANAGER') {
        logout();
        setError('Access Denied: This account is an Administrator. Please use the Administrator Portal below.');
        return;
      }
      navigate('/');
    } catch (err) {
      const activeUrl = getApiBaseUrl();
      if (!err.response) {
        setError(`Unable to connect to backend server at "${activeUrl}". If using Render free tier, the server may be sleeping (~50s cold start). Or the backend URL may need to be updated.`);
      } else if (err.response.status === 404) {
        setError(`API endpoint not found (404) at "${activeUrl}". Please verify your backend API URL in Server Settings.`);
      } else if (err.response.status === 401) {
        setError(err.response?.data?.detail || 'Invalid username or password.');
      } else {
        setError(err.response?.data?.detail || err.response?.data?.error || `Server error (${err.response.status}). Please check server logs or settings.`);
      }
    } finally {
      clearTimeout(timer);
      setSubmitting(false);
      setSubmittingNote('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: 'radial-gradient(circle at top left, #1e293b, #0f172a)',
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: 'clamp(1.5rem, 4vw, 2.25rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <C3FuelsLogo height={52} variant="full" />
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: 'var(--primary)',
            padding: '0.3rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            <Store size={14} /> Branch Manager Portal
          </div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: '700' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fuel Management System</p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.825rem',
            lineHeight: '1.45'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>

            {(!error.includes('Invalid username') && !error.includes('Administrator')) && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fee2e2',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginTop: '0.25rem'
                }}
              >
                <Settings size={13} /> Configure Backend Server URL
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Manager Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-username-input"
                type="text"
                className="input"
                style={{ paddingLeft: '2.75rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="manager"
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password-input"
                type="password"
                className="input"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontWeight: '600' }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <RefreshCw size={16} className="spin" /> {submittingNote || 'Authenticating...'}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Sign In <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Portal Switching & Credentials Hint */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          textAlign: 'center'
        }}>
          {/* <Link 
            to="/admin" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.45rem',
              color: '#818cf8',
              fontSize: '0.825rem',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            <Shield size={14} /> Are you an Administrator? Sign in to Admin Portal &rarr;
          </Link> */}

          {/* Server Config & Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            {/* <Server size={12} /> */}
            {/* <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentApiUrl}>
              {currentApiUrl}
            </span> */}
            {/* <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                textDecoration: 'underline'
              }}
            >
              <Settings size={12} /> Server Settings
            </button> */}
          </div>
        </div>
      </div>

      <ApiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={(newUrl) => setCurrentApiUrl(newUrl)}
      />
    </div>
  );
};

export default Login;
