import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading ClassConnectAI...', size = 32 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '16px' }}>
      <Loader2 size={size} className="spin-animation" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--slate-500)', fontSize: '14px', fontWeight: 600 }}>{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
