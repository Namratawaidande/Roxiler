import React from 'react';
import { Star } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{
      background: 'rgba(11, 15, 25, 0.95)',
      borderTop: '1px solid var(--border-color)',
      padding: '1.5rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Star size={14} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
            Store<span style={{ color: '#818cf8' }}>Rating</span>
          </span>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--text-subtle)' }}>
          © {new Date().getFullYear()} Store Rating Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
