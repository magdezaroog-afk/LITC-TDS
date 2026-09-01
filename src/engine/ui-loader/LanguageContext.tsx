import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Supported Languages ───────────────────────────────────────────────────
export type Language = 'ar' | 'en';

// ─── Context Type ──────────────────────────────────────────────────────────
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  /** Translate a key. Returns translated string, or key itself as fallback. */
  t: (key: string, fallback?: string) => string;
  /** 'rtl' for Arabic, 'ltr' for English */
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

// ─── Load locale files ─────────────────────────────────────────────────────
// Single Source of Truth for all translations.
// Adding a new language = add a new JSON file + entry here.
import arRaw from '../../locales/ar.json';
import enRaw from '../../locales/en.json';

const DICTIONARIES: Record<Language, Record<string, string>> = {
  ar: arRaw as Record<string, string>,
  en: enRaw as Record<string, string>,
};

// ─── Default Context ───────────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (k, fb) => fb ?? k,
  dir: 'rtl',
  isRTL: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

  // Restore saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('litc_lang') as Language | null;
    if (saved === 'ar' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  // Sync document direction and lang attribute whenever language changes
  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    document.body.dir = dir;
    document.body.style.textAlign = 'start';
    localStorage.setItem('litc_lang', language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  /**
   * Translate a key using the current language dictionary.
   * Fallback chain: current lang → explicit fallback → key itself
   */
  const t = useCallback((key: string, fallback?: string): string => {
    const dict = DICTIONARIES[language];
    if (dict[key] !== undefined && dict[key] !== '') {
      return dict[key];
    }
    return fallback ?? DICTIONARIES['ar'][key] ?? key;
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────
export const useLanguage = (): LanguageContextType => useContext(LanguageContext);
