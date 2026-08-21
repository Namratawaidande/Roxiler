import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Alert Component for Error, Success, Warning, and Info feedback
 */
export const Alert = ({
  type = 'error', // 'error' | 'success' | 'warning' | 'info'
  message,
  title,
  onClose,
  style = {}
}) => {
  if (!message && !title) return null;

  const typeConfig = {
    error: {
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.35)',
      color: '#fb7185',
      icon: AlertCircle
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      color: '#34d399',
      icon: CheckCircle
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      color: '#fbbf24',
      icon: AlertTriangle
    },
    info: {
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.35)',
      color: '#818cf8',
      icon: Info
    }
  };

  const config = typeConfig[type] || typeConfig.error;
  const Icon = config.icon;

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '10px',
        padding: '0.8rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
        color: config.color,
        fontSize: '0.875rem',
        position: 'relative',
        ...style
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        {title && <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#fff' }}>{title}</strong>}
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.8
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
