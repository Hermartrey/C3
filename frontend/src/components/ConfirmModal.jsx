import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';

/**
 * Reusable Confirmation Modal with sleek glassmorphism styling,
 * responsive design, danger/warning visual queues, and accessibility.
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  subtitle,
  message,
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  details = null,
  warningMessage = null,
  icon: Icon = AlertTriangle,
  idPrefix = 'confirm-modal'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';
  const accentColor = isDanger ? 'var(--error, #ef4444)' : 'var(--primary, #3b82f6)';
  const accentBg = isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)';
  const accentBorder = isDanger ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.35)';

  return (
    <div
      id={`${idPrefix}-overlay`}
      onClick={(e) => {
        if (e.target.id === `${idPrefix}-overlay` && !loading) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        padding: '1rem',
        animation: 'fadeIn 0.18s ease-out'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          backgroundColor: 'var(--bg-card, #1e293b)',
          border: `1px solid ${accentBorder}`,
          boxShadow: isDanger
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 20px rgba(239, 68, 68, 0.15)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          borderRadius: '16px',
          padding: '1.25rem',
          transform: 'scale(1)',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Header with Icon and Close Button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              color: accentColor,
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            id={`${idPrefix}-close-btn`}
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.35rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s'
            }}
            title="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Primary Message */}
        {message && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {message}
          </p>
        )}

        {/* Custom Details Card (e.g. manager username, email, branch) */}
        {details && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0.75rem 0.9rem',
            marginBottom: '0.85rem'
          }}>
            {details}
          </div>
        )}

        {/* Warning Callout Box */}
        {warningMessage && (
          <div style={{
            background: accentBg,
            border: `1px solid ${accentBorder}`,
            borderRadius: '8px',
            padding: '0.65rem 0.8rem',
            color: isDanger ? '#f87171' : 'var(--text-main)',
            fontSize: '0.76rem',
            lineHeight: 1.45,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.45rem'
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px', color: accentColor }} />
            <div>{warningMessage}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
          <button
            id={`${idPrefix}-cancel-btn`}
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {cancelText}
          </button>

          <button
            id={`${idPrefix}-confirm-btn`}
            type="button"
            className="btn"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.82rem',
              borderRadius: '8px',
              color: '#ffffff',
              backgroundColor: isDanger ? 'var(--error, #ef4444)' : 'var(--primary, #3b82f6)',
              border: 'none',
              boxShadow: isDanger ? '0 4px 12px rgba(239, 68, 68, 0.35)' : '0 4px 12px rgba(59, 130, 246, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: loading ? 0.8 : 1
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
