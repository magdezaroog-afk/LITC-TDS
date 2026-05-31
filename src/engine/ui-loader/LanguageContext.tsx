import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'app.title': 'نظام LITC',
    'dashboard.tickets': 'التذاكر',
    'admin.console': 'قمرة القيادة'
    // Add more as needed
  },
  en: {
    'app.title': 'LITC System',
    'dashboard.tickets': 'Tickets',
    'admin.console': 'Command Console'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  toggleLanguage: () => {},
  t: (k) => k
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    // Read from localStorage if available
    const saved = localStorage.getItem('litc_lang') as Language;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    // Update body direction
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('litc_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
