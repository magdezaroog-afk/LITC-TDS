import React, { useEffect, useState } from 'react';
import { useMobileViewport } from '../../mobile/hooks/useMobileViewport';

export interface SignalEvent {
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER';
  message: string;
}

export const NeonSignalToast: React.FC = () => {
  const [signals, setSignals] = useState<(SignalEvent & { id: number })[]>([]);
  const isMobile = useMobileViewport();

  useEffect(() => {
    // Open SSE connection
    const token = localStorage.getItem('token') || 'system_token_123';
    const eventSource = new EventSource('/api/v1/notifications/stream?token=' + token);

    eventSource.onmessage = (event) => {
      try {
        const data: SignalEvent = JSON.parse(event.data);
        const newSignal = { ...data, id: Date.now() };
        
        setSignals((prev) => [...prev, newSignal]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
          setSignals((prev) => prev.filter(s => s.id !== newSignal.id));
        }, 5000);
      } catch (err) {
        console.error('Failed to parse SSE signal:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (signals.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '20px' : 'auto',
      bottom: isMobile ? 'auto' : '30px',
      right: isMobile ? '10px' : '30px',
      left: isMobile ? '10px' : 'auto',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      {signals.map((signal) => {
        let color = '#00ffcc'; // Default / SUCCESS
        if (signal.type === 'INFO') color = '#0052cc';
        if (signal.type === 'WARNING') color = '#ff8c00';
        if (signal.type === 'DANGER') color = '#ff3d57';

        return (
          <div key={signal.id} style={{
            background: `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(15,20,35,0.9))`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${color}`,
            borderRadius: '16px',
            padding: '20px',
            width: isMobile ? 'auto' : '300px',
            maxWidth: '400px',
            boxShadow: `0 0 20px rgba(0,0,0,0.5), inset 0 0 10px ${color}33`,
            color: '#fff',
            direction: 'rtl',
            animation: isMobile ? 'slideDown 0.3s ease-out forwards' : 'slideIn 0.3s ease-out forwards',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '10px',
              height: '100%',
              borderRadius: '5px',
              backgroundColor: color,
              boxShadow: `0 0 15px ${color}`
            }} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: color, display: 'block', marginBottom: '5px', fontSize: '18px' }}>
                {signal.type === 'DANGER' ? '⚠️ تنبيه أمني' : signal.type === 'SUCCESS' ? '✔️ نجاح' : 'ℹ️ إشعار نظام'}
              </strong>
              <div style={{ fontSize: '15px', lineHeight: '1.5' }}>
                {signal.message}
              </div>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
