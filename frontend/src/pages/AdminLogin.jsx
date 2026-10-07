import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import C3FuelsLogo from '../components/C3FuelsLogo';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

    try {
      await login(username, password);
      // Verify user role after login
      const res = await api.get('/me/');
      if (res.data.role !== 'ADMIN') {
        logout();
        setError('Access Denied: Only System Administrators can sign in through the Admin Portal.');
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid administrator credentials');
    } finally {
      setSubmitting(false);
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
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(239, 68, 68, 0.12)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444', 
            padding: '0.85rem 1rem', 
            borderRadius: '10px', 
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
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
                placeholder="admin_username"
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
            {submitting ? 'Authenticating...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Sign In to Admin Portal <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
