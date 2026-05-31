/**
 * LITC-TS v43.0 - BaseText Component
 */
import React from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { SecurityUtils } from '../../utils/SecurityUtils';

interface TextProps {
  content: string;
  variant?: 'body' | 'title' | 'caption';
}

export const BaseText: React.FC<TextProps> = ({ content, variant = 'body' }) => {
  const theme = useTheme();
  const sanitizedContent = SecurityUtils.sanitize(content);

  const getStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'title':
        return {
          fontSize: theme.typography.titleSize,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary,
          margin: `${theme.spacing.sm} 0`
        };
      case 'caption':
        return {
          fontSize: theme.typography.sizes.small,
          color: '#888',
          margin: `${theme.spacing.xs} 0`
        };
      case 'body':
      default:
        return {
          fontSize: theme.typography.fontSize,
          color: theme.colors.text,
          margin: `${theme.spacing.xs} 0`
        };
    }
  };

  return (
    <p
      style={{
        fontFamily: theme.typography.fontFamily,
        lineHeight: '1.5',
        ...getStyle()
      }}
    >
      {sanitizedContent}
    </p>
  );
};
