import React from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { EventBus } from '../../engine/events/EventBus'; // استيراد ناقل الأحداث

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const ActionButton: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  const theme = useTheme(); // الوصول للثيم المركزي

  const handleButtonClick = () => {
    // تشغيل الدالة الأصلية الممررة
    onClick();
    // بث إشارة التحديث
    EventBus.emit('REFRESH_STATS', { timestamp: Date.now() });
  };

  return (
    <button 
      onClick={handleButtonClick}
      style={{ 
        padding: `${theme.spacing.md}`,
        backgroundColor: variant === 'primary' ? theme.colors.primary : theme.colors.secondary,
        color: theme.colors.text,
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: theme.typography.fontSize
      }}
    >
      {label}
    </button>
  );
};
