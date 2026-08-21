import React from 'react';
import './GlassIcons.css';

const gradientMapping = {
  blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
  purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
  red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
  indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
  orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
  green: 'linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))',
  amber: 'linear-gradient(hsl(38, 92%, 50%), hsl(25, 90%, 48%))',
  cyan: 'linear-gradient(hsl(190, 95%, 45%), hsl(175, 90%, 42%))',
  emerald: 'linear-gradient(hsl(155, 90%, 42%), hsl(140, 88%, 38%))',
  violet: 'linear-gradient(hsl(270, 92%, 55%), hsl(255, 90%, 50%))',
  rose: 'linear-gradient(hsl(340, 90%, 52%), hsl(325, 88%, 48%))',
  teal: 'linear-gradient(hsl(175, 90%, 42%), hsl(160, 85%, 38%))'
};

export const getBackgroundStyle = (color) => {
  if (!color) return { background: gradientMapping.indigo };
  if (gradientMapping[color]) {
    return { background: gradientMapping[color] };
  }
  return { background: color };
};

/**
 * Single GlassIcon Component
 */
export const GlassIcon = ({
  icon,
  color = 'indigo',
  label,
  size = 'md',
  onClick,
  className = '',
  style = {},
  type = 'button'
}) => {
  return (
    <button
      className={`icon-btn icon-btn--${size} ${className}`}
      aria-label={label || 'icon'}
      type={type}
      onClick={onClick}
      style={style}
    >
      <span className="icon-btn__back" style={getBackgroundStyle(color)} />
      <span className="icon-btn__front">
        <span className="icon-btn__icon" aria-hidden="true">
          {icon}
        </span>
      </span>
      {label && <span className="icon-btn__label">{label}</span>}
    </button>
  );
};

/**
 * Multi-Item GlassIcons Component from React Bits
 */
export const GlassIcons = ({ items = [], className = '', size = 'md' }) => {
  return (
    <div className={`icon-btns ${className}`}>
      {items.map((item, index) => (
        <button
          key={index}
          className={`icon-btn icon-btn--${size} ${item.customClass || ''}`}
          aria-label={item.label}
          type="button"
          onClick={item.onClick}
        >
          <span className="icon-btn__back" style={getBackgroundStyle(item.color)} />
          <span className="icon-btn__front">
            <span className="icon-btn__icon" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          {item.label && <span className="icon-btn__label">{item.label}</span>}
        </button>
      ))}
    </div>
  );
};

export default GlassIcons;
