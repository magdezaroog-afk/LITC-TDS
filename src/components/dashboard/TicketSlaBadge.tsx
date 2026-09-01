import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

export interface TicketSlaBadgeProps {
  dueDate: string; // ISO string
  status: 'NEW' | 'OPEN' | 'RESOLVED' | 'CLOSED' | 'TRANSFERRED' | 'PENDING' | 'REJECTED';
}

export const TicketSlaBadge: React.FC<TicketSlaBadgeProps> = ({ dueDate, status }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; isOverdue: boolean }>({ hours: 0, minutes: 0, isOverdue: false });

  useEffect(() => {
    if (status === 'RESOLVED' || status === 'CLOSED') return;

    const calculateTime = () => {
      const now = new Date();
      const due = new Date(dueDate);
      const diffMs = due.getTime() - now.getTime();
      
      const isOverdue = diffMs < 0;
      const absDiff = Math.abs(diffMs);
      
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ hours, minutes, isOverdue });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // update every minute
    return () => clearInterval(timer);
  }, [dueDate, status]);

  if (status === 'RESOLVED' || status === 'CLOSED') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#10b981', background: '#d1fae5', padding: '4px 8px', borderRadius: '12px' }}>
        <CheckCircle2 size={14} />{t('ui.auto_909') || t('ui.auto_909', 'مكتملة')}</div>
    );
  }

  const { hours, minutes, isOverdue } = timeLeft;
  
  let color = '#3b82f6';
  let bg = '#dbeafe';
  let pulse = false;

  if (isOverdue) {
    color = '#e11d48';
    bg = '#ffe4e6';
    pulse = true;
  } else if (hours < 4) {
    color = '#f59e0b';
    bg = '#fef3c7';
    pulse = true;
  }

  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' } : {}}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 800,
        color: color,
        background: bg,
        padding: '4px 10px',
        borderRadius: '20px',
        border: `1px solid ${color}40`,
        boxShadow: pulse ? `0 0 10px ${color}30` : 'none',
      }}
    >
      {isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
      <span dir="ltr">{isOverdue ? '-' : ''}{hours}h {minutes}m</span>
    </motion.div>
  );
};
