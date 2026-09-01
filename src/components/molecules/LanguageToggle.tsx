import { useLanguage } from '..\..\engine\ui-loader\LanguageContext';
import React from 'react';
import { motion } from 'framer-motion';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

export const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage, dir } = useLanguage();

  return (
    <motion.button
      onClick={toggleLanguage}
      title={language === 'ar' ? 'Switch to English' : t('ui.auto_977', 'التبديل للعربية')}
      aria-label="Toggle Language"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        borderRadius: '50%',
        color: 'var(--text-main)',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 100,
        fontWeight: 'bold',
        fontSize: '14px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)'
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        key={language}
        initial={{ opacity: 0, y: dir === 'rtl' ? -20 : 20, rotateX: 90 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: dir === 'rtl' ? 20 : -20, rotateX: -90 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: language === 'en' ? '#00e5ff' : '#6366f1' // Nice gradient/color touch
        }}
      >
        {language === 'ar' ? 'EN' : t('ui.auto_978', 'ع')}
      </motion.div>
    </motion.button>
  );
};
