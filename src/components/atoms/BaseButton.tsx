/**
 * LITC-TS v43.0 - BaseButton Component
 */
import React from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { SecurityUtils } from '../../utils/SecurityUtils';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const BaseButton: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary', disabled = false }) => {
  const theme = useTheme();
  const sanitizedLabel = SecurityUtils.sanitize(label);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        backgroundColor: disabled 
          ? theme.colors.secondary 
          : (variant === 'primary' ? theme.colors.primary : theme.colors.secondary),
        color: disabled ? '#888' : theme.colors.text,
        borderRadius: '4px',
        border: `1px solid ${theme.colors.secondary}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: theme.typography.fontSize,
        fontFamily: theme.typography.fontFamily,
        transition: 'all 0.2s ease',
        fontWeight: theme.typography.fontWeight.bold
      }}
    >
      {sanitizedLabel}
    </button>
  );
};
