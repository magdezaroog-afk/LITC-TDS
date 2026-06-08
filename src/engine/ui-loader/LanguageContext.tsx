import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'app.title': 'نظام LITC',
    'app.version': 'الإصدار 43.5',
    'nav.profile': 'الملف الشخصي',
    'nav.language': 'English',
    'admin.console': 'قمرة القيادة المركزية',
    'admin.console.sub': 'مركز التحكم الشامل لإدارة وتخصيص جميع مكونات النظام',
    'admin.status': 'نشط',
    'admin.role': 'مسؤول النظام',
    'sidebar.ui_engine': 'هندسة وتخصيص الواجهات',
    'sidebar.ui_engine.sub': 'تصميم وبناء واجهات النظام',
    'sidebar.operations': 'إدارة الهيكل التشغيلي',
    'sidebar.operations.sub': 'الإدارات والأقسام والفرق',
    'sidebar.dynamic_fields': 'الحقول الديناميكية',
    'sidebar.dynamic_fields.sub': 'النماذج والحقول المخصصة',
    'sidebar.security': 'الأمان وقاعدة البيانات',
    'sidebar.security.sub': 'الحماية والسجلات',
    'sidebar.policies': 'سياسات الإشعارات',
    'sidebar.policies.sub': 'إعدادات التنبيهات',
    'footer.brand': 'LITC-TDS',
    'footer.year': '2026',
    'access.denied.title': 'حظر أمني - واجهة مغلقة',
    'access.denied.msg': 'هذه الشاشة مخصصة حصرياً للمسؤول الأعلى للتطبيق. حسابك الحالي لا يمتلك الصلاحيات الكافية.'
  },
  en: {
    'app.title': 'LITC System',
    'app.version': 'Version 43.5',
    'nav.profile': 'Profile',
    'nav.language': 'العربية',
    'admin.console': 'Central Command Center',
    'admin.console.sub': 'Comprehensive control center for managing and customizing all system components',
    'admin.status': 'Active',
    'admin.role': 'System Admin',
    'sidebar.ui_engine': 'UI Layout Engine',
    'sidebar.ui_engine.sub': 'Design and build system interfaces',
    'sidebar.operations': 'Operational Structure',
    'sidebar.operations.sub': 'Departments, divisions & teams',
    'sidebar.dynamic_fields': 'Dynamic Fields',
    'sidebar.dynamic_fields.sub': 'Custom forms & fields',
    'sidebar.security': 'Security & Database',
    'sidebar.security.sub': 'Protection & audit logs',
    'sidebar.policies': 'Notification Policies',
    'sidebar.policies.sub': 'Alert settings',
    'footer.brand': 'LITC-TDS',
    'footer.year': '2026',
    'access.denied.title': 'Access Denied - Restricted Interface',
    'access.denied.msg': 'This screen is exclusively for the system\'s top administrator (IT_Admin). Your current account lacks sufficient permissions.'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (k) => k,
  dir: 'rtl'
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('litc_lang') as Language;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('litc_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
