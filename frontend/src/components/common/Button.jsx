import React from 'react';
import { SpecularButton } from './SpecularButton';

/**
 * Reusable Button Component powered by React Bits SpecularButton
 * Preserves all existing functionality, event handlers, and role-based actions
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  onClick,
  icon,
  className = '',
  style = {},
  radius = 12,
  ...props
}) => {
  return (
    <SpecularButton
      variant={variant}
      size={size}
      type={type}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      icon={icon}
      className={className}
      style={style}
      radius={radius}
      {...props}
    >
      {children}
    </SpecularButton>
  );
};

export default Button;
