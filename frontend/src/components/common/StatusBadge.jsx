import React from 'react';
import { Activity, Database, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const StatusBadge = ({ isOnline, latency, dbConnected, isChecking }) => {
  if (isChecking) {
    return (
      <div className="badge badge-warning" style={{ gap: '0.4rem' }}>
        <span className="status-dot connecting"></span>
        <span>Checking API...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="badge badge-error" style={{ gap: '0.4rem' }}>
        <span className="status-dot offline"></span>
        <span>Express Offline</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <div className="badge badge-success" style={{ gap: '0.4rem' }}>
        <span className="status-dot online"></span>
        <span>Express API Online</span>
        {latency !== null && (
          <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>({latency}ms)</span>
        )}
      </div>
      <div className={`badge ${dbConnected ? 'badge-cyan' : 'badge-warning'}`} style={{ gap: '0.35rem' }}>
        <Database size={11} />
        <span>{dbConnected ? 'Postgres Live' : 'Postgres Pending'}</span>
      </div>
    </div>
  );
};
