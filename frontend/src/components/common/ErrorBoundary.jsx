import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

/**
 * Production-Grade React Error Boundary
 * Catches JavaScript rendering errors anywhere in the child component tree,
 * logs the error details, and displays a friendly fallback recovery UI.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[React ErrorBoundary Intercepted Error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#0F172A',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#1E293B',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#EF4444'
            }}>
              <AlertCircle size={36} />
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F8FAFC', marginBottom: '8px' }}>
              Something Went Wrong
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px', lineHeight: '1.6' }}>
              An unexpected application error occurred while rendering this page. You can refresh or return home.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="outline" onClick={this.handleGoHome} icon={<Home size={16} />}>
                Go to Home
              </Button>
              <Button variant="primary" onClick={this.handleReload} icon={<RefreshCw size={16} />}>
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
