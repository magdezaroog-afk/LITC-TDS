import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Smartphone, 
  Eye, 
  Check 
} from 'lucide-react';
import { useHub } from '../context/HubContext';

export default function SettingsPage() {
  const { 
    darkMode, 
    toggleDarkMode, 
    language, 
    setLanguage, 
    t 
  } = useHub();

  const isRtl = language === 'ar';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-start rtl:text-right">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t('settingsTitle')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
          {t('settingsDesc')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance & Preferences Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
            {t('appearanceAndNotifications')}
          </h2>
          <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
            
            {/* Dark Mode Toggle */}
            <div 
              onClick={toggleDarkMode}
              className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className={`size-10 rounded-2xl flex items-center justify-center transition-colors ${
                  darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {darkMode ? <Moon className="size-5" /> : <Sun className="size-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">
                      {darkMode ? t('darkModeTitle') : t('lightModeTitle')}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">
                    {darkMode ? t('darkModeDesc') : t('lightModeDesc')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`
                    relative w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-hidden flex items-center
                    ${darkMode ? 'bg-accent justify-start' : 'bg-slate-300 dark:bg-slate-700 justify-end'}
                  `}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="size-5 rounded-full bg-white shadow-md flex items-center justify-center"
                  >
                    {darkMode ? (
                      <Moon className="size-3 text-accent fill-accent" />
                    ) : (
                      <Sun className="size-3 text-amber-500 fill-amber-500" />
                    )}
                  </motion.div>
                </button>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="size-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Globe className="size-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">
                      {t('interfaceLanguage')}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">
                      {t('currentLangDesc')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Language selection pills */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => setLanguage('ar')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-between ${
                    language === 'ar'
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <span>العربية (Arabic)</span>
                  {language === 'ar' && <Check className="size-4" />}
                </button>

                <button
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-between ${
                    language === 'en'
                      ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <span>English (الإنجليزية)</span>
                  {language === 'en' && <Check className="size-4" />}
                </button>
              </div>
            </div>

            {/* Notifications Toggle */}
            <div 
              onClick={() => setNotificationsEnabled((prev) => !prev)}
              className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="size-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-accent transition-colors">
                  <Bell className="size-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">
                    {t('systemNotifications')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">
                    {t('systemNotificationsDesc')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`
                    relative w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-hidden flex items-center
                    ${notificationsEnabled ? 'bg-primary dark:bg-accent justify-start' : 'bg-slate-300 dark:bg-slate-700 justify-end'}
                  `}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="size-5 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Security & Privacy Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
            {t('securityAndPrivacy')}
          </h2>
          <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
            
            <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="size-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-accent transition-colors">
                  <Lock className="size-5" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{t('changePassword')}</span>
              </div>
              {isRtl ? <ChevronLeft className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
            </div>

            <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="size-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-accent transition-colors">
                  <Smartphone className="size-5" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{t('connectedDevices')}</span>
              </div>
              {isRtl ? <ChevronLeft className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
            </div>

            <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="size-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-accent transition-colors">
                  <Eye className="size-5" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{t('directoryVisibility')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-400">{t('directoryVisibilityDesc')}</span>
                {isRtl ? <ChevronLeft className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
              </div>
            </div>

          </div>
        </div>

        {/* Logout Button */}
        <button className="w-full p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 rounded-2xl flex items-center justify-center gap-2.5 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors border border-rose-100 dark:border-rose-900/40 shadow-xs active:scale-[0.99] text-xs sm:text-sm">
          <LogOut className="size-4.5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
