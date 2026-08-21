import React from 'react';

/**
 * Reusable Form Textarea Field Component
 */
export const TextareaField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
  icon: Icon,
  maxLength = 400,
  rows = 3,
  showCharCount = true,
  disabled = false
}) => {
  const charCount = typeof value === 'string' ? value.length : 0;
  const isInvalid = Boolean(error);

  return (
    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        {label && (
          <label className="form-label" htmlFor={name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
            {Icon && <Icon size={14} />}
            <span>{label}</span>
            {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
        )}
        {showCharCount && maxLength && (
          <span style={{ fontSize: '0.75rem', color: isInvalid ? '#fb7185' : 'var(--text-subtle)' }}>
            {charCount}/{maxLength} chars
          </span>
        )}
      </div>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className="form-input"
        style={{
          borderColor: isInvalid ? '#ef4444' : undefined,
          boxShadow: isInvalid ? '0 0 0 1px #ef4444' : undefined,
          resize: 'vertical',
          width: '100%'
        }}
      />

      {error && (
        <small style={{ color: '#fb7185', fontSize: '0.75rem', marginTop: '0.3rem', display: 'block' }}>
          {error}
        </small>
      )}

      {hint && !error && (
        <small style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
          {hint}
        </small>
      )}
    </div>
  );
};
