import React, { useEffect } from 'react';
import { FaExclamationTriangle, FaTrash, FaSignOutAlt, FaInfoCircle, FaTimes } from 'react-icons/fa';

/**
 * @component ConfirmDialog
 * @description Modern, reusable confirmation modal for delete, logout, and critical actions.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Triggered on cancel, backdrop click, or Escape key
 * @param {function} onConfirm - Triggered on primary action confirm click
 * @param {string} title - Header title (e.g., "Confirm Delete", "Confirm Logout")
 * @param {React.ReactNode} message - Description message or JSX content
 * @param {string} confirmText - Primary button label (default: "Confirm")
 * @param {string} cancelText - Cancel button label (default: "Cancel")
 * @param {'danger' | 'warning' | 'info'} variant - Visual color scheme (default: 'danger')
 * @param {React.ReactNode} icon - Optional custom icon override
 * @param {boolean} loading - Displays loading spinner and disables buttons
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  loading = false,
}) => {
  // Handle ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Resolve color scheme & default icons based on variant
  let theme = {
    iconBg: '#fee2e2',
    iconColor: '#ef4444',
    confirmBg: '#ef4444',
    confirmHoverBg: '#dc2626',
    defaultIcon: <FaTrash />,
  };

  if (variant === 'warning') {
    theme = {
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      confirmBg: '#f59e0b',
      confirmHoverBg: '#d97706',
      defaultIcon: <FaExclamationTriangle />,
    };
  } else if (variant === 'info') {
    theme = {
      iconBg: '#dbeafe',
      iconColor: '#3b82f6',
      confirmBg: '#3b82f6',
      confirmHoverBg: '#2563eb',
      defaultIcon: <FaInfoCircle />,
    };
  }

  const selectedIcon = icon || theme.defaultIcon;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spinnerRotate {
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close button */}
        {!loading && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <FaTimes />
          </button>
        )}

        {/* Modal Header with Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: theme.iconBg,
              color: theme.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            {selectedIcon}
          </div>
          <div style={{ paddingRight: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {title}
            </h3>
          </div>
        </div>

        {/* Modal Body / Message */}
        <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55 }}>
          {typeof message === 'string' ? <p style={{ margin: 0 }}>{message}</p> : message}
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: theme.confirmBg,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: `0 4px 6px -1px ${theme.iconBg}`,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = theme.confirmHoverBg;
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = theme.confirmBg;
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spinnerRotate 0.6s linear infinite',
                  }}
                />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
