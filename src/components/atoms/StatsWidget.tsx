/**
 * LITC-TS v43.0 - StatsWidget Atom
 */
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { EventBus } from '../../engine/events/EventBus'; // استيراد ناقل الأحداث

interface StatsProps {
  title: string;
  value: string | number;
}

export const StatsWidget: React.FC<StatsProps> = ({ title, value }) => {
  const theme = useTheme(); // الوصول للثيم المركزي
  const [currentValue, setCurrentValue] = useState<string | number>(value);

  useEffect(() => {
    const handleRefresh = (data: any) => {
      console.log('StatsWidget received update at:', data.timestamp);
      // تحديث الحالة المحلية ديناميكياً لمحاكاة التحديث الحي للبيانات
      if (typeof currentValue === 'number') {
        setCurrentValue(prev => (prev as number) + 1);
      }
    };
    
    EventBus.on('REFRESH_STATS', handleRefresh);
    return () => EventBus.off('REFRESH_STATS', handleRefresh);
  }, [currentValue]);

  return (
    <div 
      style={{ 
        border: `1px solid ${theme.colors.secondary}`, 
        padding: theme.spacing.md, 
        margin: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        borderRadius: '4px'
      }}
    >
      <h3 style={{ fontSize: theme.typography.titleSize, margin: 0 }}>{title}</h3>
      <p style={{ fontSize: '24px', fontWeight: theme.typography.fontWeight.bold, margin: '8px 0 0 0' }}>{currentValue}</p>
    </div>
  );
};
