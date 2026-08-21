import React from 'react';

/**
 * Reusable Form Input Field Component
 */
export const InputField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
  icon: Icon,
  minLength,
  maxLength,
  showCharCount = false,
  disabled = false,
  autoComplete
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
            {charCount}/{maxLength} chars {minLength && charCount > 0 && charCount < minLength && `(min ${minLength})`}
          </span>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          autoComplete={autoComplete}
          className="form-input"
          style={{
            borderColor: isInvalid ? '#ef4444' : undefined,
            boxShadow: isInvalid ? '0 0 0 1px #ef4444' : undefined,
            width: '100%'
          }}
        />
      </div>

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
