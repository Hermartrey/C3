import React, { useState } from 'react';
import { getApiBaseUrl, setApiBaseUrl } from '../api';
import axios from 'axios';
import { Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';

const ApiConfigModal = ({ isOpen, onClose, onSaved }) => {
  const currentUrl = getApiBaseUrl();
  const defaultEnvUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: bool, message: string }

  if (!isOpen) return null;

  const handleTest = async (testUrl = urlInput) => {
    const target = (testUrl || '').trim().replace(/\/+$/, '');
    if (!target) {
      setTestResult({ success: false, message: 'Please enter a valid backend URL.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Allow up to 60s for Render spin-up

    try {
      // Test the token endpoint with an empty POST or GET to fuel-types
      const response = await axios.get(`${target}/fuel-types/`, {
        signal: controller.signal,
        validateStatus: (status) => status < 500 // 200, 401, or 403 means backend is alive and responding!
      });
      clearTimeout(timeoutId);
      setTestResult({
        success: true,
        message: `Successfully connected! Server responded with status ${response.status}.`
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'CanceledError' || err.code === 'ECONNABORTED') {
        setTestResult({
          success: false,
          message: 'Connection timed out after 60s. The Render free-tier service might still be waking up. Please try again shortly.'
        });
      } else if (err.response?.status === 404) {
        setTestResult({
          success: false,
          message: `Endpoint returned 404 Not Found at "${target}/fuel-types/". Make sure the URL ends with "/api" (e.g. https://your-service.onrender.com/api).`
        });
      } else {
        setTestResult({
          success: false,
          message: `Cannot reach backend at "${target}". Please verify the URL or ensure Render service is deployed and active.`
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = urlInput.trim().replace(/\/+$/, '');
    setApiBaseUrl(cleanUrl);
    if (onSaved) onSaved(cleanUrl);
    onClose();
  };

  const handleReset = () => {
    setUrlInput(defaultEnvUrl);
    setApiBaseUrl('');
    setTestResult(null);
    if (onSaved) onSaved(defaultEnvUrl);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Server size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Backend Server Configuration</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Configure connection to the deployed API</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tip / explanation */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '8px',
          padding: '0.85rem',
          fontSize: '0.8rem',
          color: '#93c5fd',
          marginBottom: '1.25rem',
          lineHeight: '1.45'
        }}>
          <strong>Render Deployment Note:</strong> Render gives your backend service a unique URL (e.g. <code>https://fuelflow-backend-xxxx.onrender.com/api</code>). If you cannot sign in, paste your backend URL below and test the connection.
        </div>

        {/* URL Input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Backend API URL (must include <code>/api</code>)
          </label>
          <input 
            type="text" 
            className="input" 
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://fuelflow-backend-xxxx.onrender.com/api"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: testResult.success ? '#4ade80' : '#f87171',
            lineHeight: '1.4'
          }}>
            {testResult.success ? <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            Reset to Default
          </button>
          
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleTest()}
              disabled={testing}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', padding: '0.5rem 0.85rem' }}
            >
              {testing ? <RefreshCw size={14} className="spin" /> : null}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              style={{ fontSize: '0.825rem', padding: '0.5rem 1.1rem' }}
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigModal;
