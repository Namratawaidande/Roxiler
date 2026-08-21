import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Reusable Password Requirements Checklist / Strength Meter Component
 */
export const PasswordStrengthMeter = ({ password = '' }) => {
  const lengthValid = password.length >= 8 && password.length <= 16;
  const uppercaseValid = /[A-Z]/.test(password);
  const specialCharValid = /[!@#$%^&*(),.?":{}|<>_]/.test(password);

  const rules = [
    { label: `8 to 16 characters (${password.length}/16)`, valid: lengthValid },
    { label: 'At least 1 uppercase letter (A-Z)', valid: uppercaseValid },
    { label: 'At least 1 special character (!@#$%^&*...)', valid: specialCharValid }
  ];

  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '0.65rem 0.85rem',
        borderRadius: '8px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        fontSize: '0.75rem'
      }}
    >
      {rules.map((rule, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: rule.valid ? '#34d399' : 'var(--text-subtle)',
            transition: 'color 0.2s ease'
          }}
        >
          {rule.valid ? (
            <Check size={13} color="#34d399" style={{ flexShrink: 0 }} />
          ) : (
            <X size={13} color="#64748b" style={{ flexShrink: 0 }} />
          )}
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
};
