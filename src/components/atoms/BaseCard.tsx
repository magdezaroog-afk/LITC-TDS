/**
 * LITC-TS v43.0 - BaseCard Component
 */
import React from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { SecurityUtils } from '../../utils/SecurityUtils';

interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export const BaseCard: React.FC<CardProps> = ({ title, children }) => {
  const theme = useTheme();
  const sanitizedTitle = title ? SecurityUtils.sanitize(title) : undefined;

  return (
    <div
      style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.secondary}`,
        borderRadius: '6px',
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        margin: theme.spacing.md
      }}
    >
      {sanitizedTitle && (
        <h3
          style={{
            fontSize: theme.typography.titleSize,
            color: theme.colors.primary,
            margin: `0 0 ${theme.spacing.md} 0`,
            borderBottom: `1px solid ${theme.colors.secondary}`,
            paddingBottom: theme.spacing.xs
          }}
        >
          {sanitizedTitle}
        </h3>
      )}
      <div style={{ fontSize: theme.typography.fontSize }}>{children}</div>
    </div>
  );
};
