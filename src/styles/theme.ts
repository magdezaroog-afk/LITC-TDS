/**
 * LITC-TS v43.0 - Central Theme System
 * نظام الثيمات الموحد للتحكم في الألوان والخطوط والأبعاد ديناميكياً.
 */

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  error: string;
  success: string;
};

export type ThemeSpacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

export type ThemeTypography = {
  fontFamily: string;
  fontSize: string; // حجم الخط الافتراضي كـ string
  titleSize: string; // حجم خط العنوان كـ string
  sizes: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
  fontWeight: {
    normal: number;
    bold: number;
  };
};

export type Theme = {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
};

export const theme: Theme = {
  colors: {
    primary: '#0052cc',
    secondary: '#e6f0ff',
    background: '#f4f5f7',
    surface: '#ffffff',
    text: '#172b4d',
    error: '#de350b',
    success: '#00875a',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    fontSize: '14px',
    titleSize: '18px',
    sizes: {
      small: '12px',
      medium: '14px',
      large: '18px',
      xlarge: '24px',
    },
    fontWeight: {
      normal: 400,
      bold: 700,
    },
  },
};
