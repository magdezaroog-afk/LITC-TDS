import React, { createContext, useContext, useState, useEffect } from 'react';
import { theme as defaultTheme } from '../../styles/theme';

interface ThemeContextType {
  theme: any;
  mode: 'dark' | 'light';
  neonColor: string;
  toggleMode: () => void;
  setNeonColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  mode: 'dark',
  neonColor: '#00a3ff',
  toggleMode: () => {},
  setNeonColor: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [neonColor, setNeonColorState] = useState('#00a3ff');

  useEffect(() => {
    const savedMode = (localStorage.getItem('litc_theme_mode') || localStorage.getItem('litc_theme')) as 'dark' | 'light';
    const savedColor = localStorage.getItem('litc_neon_color');
    if (savedMode) setMode(savedMode);
    if (savedColor) setNeonColorState(savedColor);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(mode);
      document.documentElement.setAttribute('data-theme', mode);
      document.documentElement.style.colorScheme = mode;
      localStorage.setItem('litc_theme_mode', mode);
      localStorage.setItem('litc_theme', mode);
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setNeonColor = (color: string) => {
    setNeonColorState(color);
    localStorage.setItem('litc_neon_color', color);
  };

  // Merge the selected neon color and mode into the provided theme object
  const activeTheme = {
    ...defaultTheme,
    mode,
    colors: {
      ...defaultTheme.colors,
      primary: neonColor,
      background: mode === 'dark' ? '#0c0e12' : '#f6f8fb',
      text: mode === 'dark' ? '#f8fafc' : '#0f172a'
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, mode, neonColor, toggleMode, setNeonColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext).theme;
export const useThemeEngine = () => useContext(ThemeContext);
