import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getApiBaseUrl } from '../api';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Store, Server, Settings, RefreshCw } from 'lucide-react';
import C3FuelsLogo from '../components/C3FuelsLogo';
import ApiConfigModal from '../components/ApiConfigModal';

const AdminLogin = () => {
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
    if (user && user.role === 'ADMIN') {
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
      // Verify user role after login
      const res = await api.get('/me/');
      if (res.data.role !== 'ADMIN') {
        logout();
        setError('Access Denied: This account is a Branch Manager. Please use the Branch Manager Portal below.');
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
        setError(err.response?.data?.detail || 'Invalid administrator credentials.');
      } else {
        setError(err.response?.data?.detail || err.response?.data?.error || `Server error (${err.response.status}). Please check server logs.`);
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
      minHeight: '100vh',
      background: 'radial-gradient(circle at top center, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Overlay */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        borderRadius: '50%'
      }} />

      <div className="glass-card" style={{ 
        width: '100%', 
        maxWidth: '430px', 
        padding: '2.5rem 2rem',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Admin Badge Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <C3FuelsLogo height={48} variant="full" />
          </div>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '600',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={15} color="#818cf8" /> Administrator Portal
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.35rem' }}>
            System Access
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Sign in with your administrator credentials
          </p>
        </div>
        
        {/* Error Alert */}
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

            {(!error.includes('credentials') && !error.includes('Manager')) && (
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

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-muted)' }}>
              Admin Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                id="admin-username-input"
                type="text" 
                className="input" 
                style={{ paddingLeft: '2.75rem', background: 'rgba(15, 23, 42, 0.6)' }}
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.825rem', fontWeight: '500', color: 'var(--text-muted)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                id="admin-password-input"
                type="password" 
                className="input" 
                style={{ paddingLeft: '2.75rem', background: 'rgba(15, 23, 42, 0.6)' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            id="admin-login-submit"
            type="submit" 
            className="btn btn-primary" 
            disabled={submitting}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '0.85rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
            }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <RefreshCw size={16} className="spin" /> {submittingNote || 'Authenticating...'}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Sign In to Admin Portal <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Portal Switch & Server Config */}
        <div style={{ 
          marginTop: '1.75rem', 
          paddingTop: '1.25rem', 
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          textAlign: 'center'
        }}>
          <Link 
            to="/login" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.45rem',
              color: '#38bdf8',
              fontSize: '0.825rem',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            <Store size={14} /> Are you a Branch Manager? Sign in to Manager Portal &rarr;
          </Link>

          {/* Server Config & Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <Server size={12} />
            <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentApiUrl}>
              {currentApiUrl}
            </span>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#818cf8',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                textDecoration: 'underline'
              }}
            >
              <Settings size={12} /> Server Settings
            </button>
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

export default AdminLogin;
