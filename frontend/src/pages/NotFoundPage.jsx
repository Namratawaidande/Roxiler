import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div className="glass-card" style={{ maxWidth: '460px', margin: '0 auto' }}>
        <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>404 - Not Found</h1>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          The requested page route does not exist in the Store Rating Platform.
        </p>
        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Return to Foundation Home
        </Link>
      </div>
    </div>
  );
};
