/**
 * LITC-TS v43.0 - BaseInput Component
 */
import React from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { SecurityUtils } from '../../utils/SecurityUtils';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  type?: 'text' | 'password' | 'email';
}

export const BaseInput: React.FC<InputProps> = ({ value, onChange, placeholder = '', label, type = 'text' }) => {
  const theme = useTheme();
  const sanitizedPlaceholder = SecurityUtils.sanitize(placeholder);
  const sanitizedLabel = label ? SecurityUtils.sanitize(label) : undefined;

  return (
    <div style={{ margin: `${theme.spacing.sm} 0` }}>
      {sanitizedLabel && (
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.xs,
            fontSize: '13px',
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily
          }}
        >
          {sanitizedLabel}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={sanitizedPlaceholder}
        style={{
          width: '100%',
          padding: theme.spacing.sm,
          border: `1px solid ${theme.colors.secondary}`,
          borderRadius: '4px',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};
