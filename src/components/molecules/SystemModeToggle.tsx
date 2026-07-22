import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../engine/auth/AuthContext';
import { Fingerprint, Power } from 'lucide-react';

interface Props {
  isLocked?: boolean;
}

export const SystemModeToggle: React.FC<Props> = ({ isLocked }) => {
  const { systemMode, setSystemMode, user } = useAuth();

  const handleToggle = () => {
    if (isLocked) {
      alert("وضع العمل غير متاح لك حالياً. يرجى مراجعة مسؤول النظام لتخصيص واجهة تشغيلية.");
      return;
    }
    
    // Allow any user that has a layout to toggle work mode
    setSystemMode(systemMode === 'employee' ? 'work' : 'employee');
  };

  const isWorkMode = systemMode === 'work';

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: isWorkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        border: 'none',
        color: isWorkMode ? '#ef4444' : '#10b981',
        padding: '6px 12px',
        borderRadius: '8px',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        fontSize: '13px',
        opacity: isLocked ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        boxShadow: isWorkMode ? 'inset 0 0 8px rgba(239, 68, 68, 0.2)' : 'none'
      }}
    >
      {isWorkMode ? <Power size={16} /> : <Fingerprint size={16} />}
      <span>{isWorkMode ? 'إيقاف وضع العمل' : 'تفعيل وضع العمل'}</span>
    </motion.button>
  );
};
