import React, { useState, useEffect } from 'react';

interface Props {
  deadline: string; // ISO String
}

export const SlaCountdownTimer: React.FC<Props> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [status, setStatus] = useState<'SAFE' | 'WARNING' | 'BREACH'>('SAFE');

  useEffect(() => {
    const deadlineTime = new Date(deadline).getTime();

    const calculateTime = () => {
      const now = Date.now();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setStatus('BREACH');
      } else {
        setTimeLeft(diff);
        // Assuming original SLA was 60 mins. Let's warn if less than 15 mins (900000 ms)
        if (diff < 900000) {
          setStatus('WARNING');
        } else {
          setStatus('SAFE');
        }
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let color = '#00ffcc'; // SAFE (Green/Cyan)
  let glow = 'rgba(0,255,204,0.5)';
  
  if (status === 'WARNING') {
    color = '#ffaa00'; // Warning (Orange)
    glow = 'rgba(255,170,0,0.8)';
  } else if (status === 'BREACH') {
    color = '#ff3d57'; // Breach (Red)
    glow = 'rgba(255,61,87,1)';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '5px 10px',
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${color}`,
      boxShadow: `0 0 10px ${glow}`,
      color: color,
      fontWeight: 'bold',
      fontSize: '14px',
      animation: status === 'BREACH' ? 'pulseRed 1s infinite' : 'none'
    }}>
      <span>⏱️</span>
      <span dir="ltr">{status === 'BREACH' ? '00:00:00 (متأخر)' : formatTime(timeLeft)}</span>
      
      <style>{`
        @keyframes pulseRed {
          0% { box-shadow: 0 0 10px rgba(255,61,87,0.5); }
          50% { box-shadow: 0 0 20px rgba(255,61,87,1); }
          100% { box-shadow: 0 0 10px rgba(255,61,87,0.5); }
        }
      `}</style>
    </div>
  );
};
