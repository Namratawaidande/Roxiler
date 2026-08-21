import React from 'react';
import { Database, Layers, ShieldCheck, Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{
      background: 'rgba(11, 15, 25, 0.95)',
      borderTop: '1px solid var(--border-color)',
      padding: '2rem 1.5rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.925rem' }}>
            Store Rating Platform Foundation
          </div>
          <div style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            React.js + Express.js + PostgreSQL + JWT + RBAC
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            <Zap size={11} /> React (Vite)
          </span>
          <span className="badge badge-cyan">
            <Layers size={11} /> Express API
          </span>
          <span className="badge badge-success">
            <Database size={11} /> PostgreSQL Pool
          </span>
          <span className="badge badge-warning">
            <ShieldCheck size={11} /> JWT & Bcrypt
          </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          Environment: <span style={{ color: '#818cf8', fontWeight: 600 }}>{import.meta.env.MODE}</span>
        </div>
      </div>
    </footer>
  );
};
