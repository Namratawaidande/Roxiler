import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Component with loading state and styling variants
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  onClick,
  icon: Icon,
  className = '',
  style = {},
  ...props
}) => {
  const sizeStyles = {
    sm: { padding: '0.4rem 0.8rem', fontSize: '0.8rem' },
    md: { padding: '0.65rem 1.25rem', fontSize: '0.9rem' },
    lg: { padding: '0.85rem 1.75rem', fontSize: '1rem' }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      style={{
        ...sizeStyles[size],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        opacity: disabled || loading ? 0.65 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...style
      }}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
