import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Users, 
  Landmark, 
  Trophy, 
  Moon, 
  Sun, 
  Globe,
  Languages,
  User as UserIcon, 
  Settings, 
  HeartPulse, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HeaderSearchBar } from './HeaderSearchBar';
import { LogoViewerModal } from './LogoViewerModal';
import nexusIconTransparent from '../assets/nexus_official_icon_transparent.png';
import { motion, AnimatePresence } from 'framer-motion';

export function TopNav({ isEmbedded = true }: { isEmbedded?: boolean }) {
  const { 
    user, 
    feedTab, 
    setFeedTab, 
    darkMode, 
    toggleDarkMode,
    language,
    toggleLanguage,
    setLanguage,
    t
  } = useHub();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const onFeed = location.pathname === '/';
  const isRtl = language === 'ar';

  // Smooth scroll listener for regular pages
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 70) {
            setIsScrolledDown(true);
          } else if (currentScrollY < lastScrollY - 5 || currentScrollY <= 20) {
            setIsScrolledDown(false);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    let isMounted = true;
    const fetchNotificationsCount = async () => {
      try {
        const response = await fetch('/api/v1/notifications/count');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) setUnreadCount(data.count || 0);
        } else {
          // Fallback mock if endpoint is missing
          if (isMounted) setUnreadCount(7);
        }
      } catch (err) {
        // Fallback mock
        if (isMounted) setUnreadCount(7);
      }
    };
    
    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const tabs = [
    { id: 'news' as const, label: t('tabOfficialNews'), icon: Landmark },
    { id: 'community' as const, label: t('tabCommunity'), icon: Users },
    { id: 'challenges' as const, label: t('tabChallenges'), icon: Trophy },
  ];

  const handleTabClick = (tabId: 'news' | 'community' | 'challenges') => {
    setFeedTab(tabId);
    if (!onFeed) {
      navigate('/');
    }
  };

  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
  const isDarkLook = darkMode;
  const isHidden = isScrolledDown;

  return (
    <>
      <header className={`sticky top-0 z-40 w-full px-2.5 sm:px-4 lg:px-6 pointer-events-none transition-transform duration-300 ease-out ${isHidden ? '-translate-y-24' : 'translate-y-0'}`}>
        <div 
          className={`
            relative pointer-events-auto mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-1.5 sm:gap-3 px-3 sm:px-4 lg:px-5 rounded-b-2xl sm:rounded-b-3xl backdrop-blur-2xl backdrop-saturate-150 border-x border-b border-t-0 transition-all duration-300
            ${isHidden ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
            ${isDarkLook 
              ? 'bg-slate-900/60 dark:bg-slate-900/60 border-white/10 text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)]' 
              : 'border-white/70 text-foreground bg-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)]'}
          `}
        >
          
          {/* RIGHT SIDE (START in RTL): Notifications Bell & Search Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            {/* Notifications Bell (Extreme Right / Start) */}
            {!isEmbedded && (
              <button 
                className={`
                  relative p-1.5 sm:p-2 rounded-2xl transition-colors active:scale-95 shrink-0
                  ${isDarkLook ? 'text-white hover:bg-white/15' : 'text-foreground hover:bg-slate-100/60 dark:hover:bg-slate-800/60'}
                `}
                aria-label={t('notifications')}
                title={t('notifications')}
              >
                <Bell className={`size-4 sm:size-5 ${isDarkLook ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`} />
                {unreadCount > 0 && (
                  <span className="absolute end-1 top-1 grid size-3.5 sm:size-4 place-items-center rounded-full bg-accent text-[8px] sm:text-[9px] font-bold text-white shadow-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Search Bar next to Notifications */}
            <div className="w-32 xs:w-40 sm:w-56 md:w-64 lg:w-72">
              <HeaderSearchBar />
            </div>

            {/* Desktop Navigation Tabs (Large screens 2xl only) */}
            <nav 
              className={`
                hidden 2xl:flex items-center gap-1 rounded-full p-1 backdrop-blur-xl shadow-inner shrink-0 border transition-all ms-1
                ${isDarkLook 
                  ? 'bg-slate-800/50 border-white/10' 
                  : 'bg-slate-100/50 dark:bg-slate-800/50 border-white/60 dark:border-white/10'}
              `}
            >
              {tabs.map((tItem) => {
                const active = onFeed && feedTab === tItem.id;
                return (
                  <button
                    key={tItem.id}
                    onClick={() => handleTabClick(tItem.id)}
                    className={`
                      flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all shrink-0
                      ${active 
                        ? 'bg-primary text-white shadow-xs scale-100 font-black' 
                        : isDarkLook 
                          ? 'text-slate-300 hover:text-white hover:bg-white/10' 
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}
                    `}
                  >
                    <tItem.icon className={`size-3.5 ${active && tItem.id === 'challenges' ? 'text-yellow-400' : ''}`} />
                    <span className="whitespace-nowrap">{tItem.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* EXACT CENTER: NEXUS SYSTEM LOGO (Image on top, Name directly underneath) */}
          {!isEmbedded && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 hover:scale-108 active:scale-95 group focus:outline-none cursor-pointer"
                title={isRtl ? 'عرض وتكبير وتنزيل شعار Nexus' : 'View, expand and download Nexus Logo'}
                aria-label="Nexus Intelligent Space Logo"
              >
                {/* Top: Logo Icon Image */}
                <div className="relative size-7 sm:size-8 rounded-xl p-0.5 flex items-center justify-center shadow-md shadow-orange-500/25 border border-orange-500/40 bg-slate-950 overflow-hidden ring-2 ring-orange-500/20 group-hover:ring-orange-500/60 transition-all">
                  <img 
                    src={nexusIconTransparent} 
                    alt="NEXUS TDS" 
                    className="size-full object-contain rounded-lg group-hover:scale-110 transition-transform duration-300" 
                  />
                </div>

                {/* Bottom: System Name directly underneath */}
                <span className="font-display font-black text-[10px] sm:text-[11px] tracking-wider text-orange-500 group-hover:text-orange-400 leading-none mt-1 uppercase">
                  NEXUS TDS
                </span>
              </button>
            </div>
          )}

          {/* LEFT SIDE (END in RTL): NEXUS TDS Badge & User Profile Menu OR Work Mode Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-10">
            {isEmbedded ? (
              <Link
                to="/"
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 font-bold text-xs sm:text-sm active:scale-95
                  ${isDarkLook 
                    ? 'bg-slate-800/80 text-slate-200 hover:text-white border border-white/10 hover:border-white/30 shadow-inner' 
                    : 'bg-white/80 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-sm'}
                `}
                title={language === 'ar' ? 'العودة لبيئة العمل' : 'Back to Workspace'}
              >
                <Globe className="size-4 text-blue-500" />
                <span>العودة لبيئة العمل</span>
              </Link>
            ) : (
              <>
                {/* NEXUS TDS Badge beside User Profile */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 text-orange-500 shadow-2xs">
                  <img src={nexusIconTransparent} alt="NEXUS TDS" className="size-3.5 object-contain" />
                  <span className="text-[11px] font-black tracking-wider leading-none">NEXUS TDS</span>
                </div>

                {/* User Profile Avatar with interactive Dropdown Menu */}
                <div ref={profileMenuRef} className="relative flex items-center shrink-0">
                  <button 
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className={`
                      flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl transition-all active:scale-95 group focus:outline-none
                      ${isDarkLook ? 'hover:bg-white/15' : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70'}
                    `}
                    aria-label="قائمة الملف الشخصي والإعدادات"
                    title="الملف الشخصي، المظهر، واللغة"
                  >
                    {/* Name and Points below it (Desktop) */}
                    <div className="hidden lg:flex flex-col items-start rtl:items-end leading-tight text-start rtl:text-end">
                      <span className={`text-xs font-black transition-colors ${isDarkLook ? 'text-white group-hover:text-accent' : 'text-slate-800 dark:text-slate-100 group-hover:text-accent'}`}>
                        {user.name.split(' ')[0]} {user.name.split(' ')[1] || ''}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                        <Trophy className="size-2.5 text-amber-500" />
                        <span>{user.points} {t('pointsBadge')}</span>
                      </span>
                    </div>

                    {/* Avatar with micro badge */}
                    <div className="relative">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="size-8 sm:size-9 rounded-full bg-primary border-2 border-white dark:border-slate-700 shadow-xs object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-800"></div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute top-[calc(100%+12px)] rtl:left-0 ltr:right-0 w-[300px] bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 origin-top-right"
                      >
                        {/* Interactive Header */}
                        <div className="p-4 bg-gradient-to-br from-slate-100/50 to-white/30 dark:from-slate-700/50 dark:to-slate-800/30 border-b border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} alt={user.name} className="size-12 rounded-2xl object-cover shadow-sm" />
                            <div>
                              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{user.name}</h4>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{(user as any).roleTitle || user.role || 'موظف'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 space-y-1">
                          {/* LANGUAGE TOGGLE */}
                          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center size-8 rounded-xl bg-blue-500/10 text-blue-500">
                                <Globe className="size-4" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {t('languageToggle')}
                                </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                              {language === 'ar' ? 'العربية (افتراضي)' : 'English (Active)'}
                            </p>
                          </div>
                        </div>

                        {/* Language Segmented Buttons */}
                        <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xl border border-slate-300/40 dark:border-slate-600/40 text-[10px] font-black">
                          <button
                            type="button"
                            onClick={() => setLanguage('ar')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                              language === 'ar'
                                ? 'bg-accent text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            عربي
                          </button>
                          <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={`px-2.5 py-1 rounded-lg transition-all ${
                              language === 'en'
                                ? 'bg-accent text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            EN
                          </button>
                        </div>
                      </div>

                      {/* THEME TOGGLE (DARK MODE / LIGHT MODE) */}
                      <div className="p-2.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`size-8 rounded-xl flex items-center justify-center transition-colors ${
                            darkMode 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : 'bg-indigo-500/15 text-indigo-600'
                          }`}>
                            {darkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                              {darkMode ? t('darkModeTitle') : t('lightModeTitle')}
                            </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                              {darkMode ? t('darkModeDesc') : t('lightModeDesc')}
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={toggleDarkMode}
                          className={`
                            relative w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center
                            ${darkMode ? 'bg-accent justify-start' : 'bg-slate-300 dark:bg-slate-700 justify-end'}
                          `}
                          aria-label="تبديل الوضع الداكن"
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

                    {/* Menu Action Links */}
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-accent transition-colors">
                            <UserIcon className="size-3.5" />
                          </div>
                          <span className="text-xs font-bold">{t('profileDocuments')}</span>
                        </div>
                        <ArrowIcon className="size-3.5 text-slate-400 group-hover:text-accent transition-colors" />
                      </Link>

                      <Link
                        to="/healthcare"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-accent transition-colors">
                            <HeartPulse className="size-3.5" />
                          </div>
                          <span className="text-xs font-bold">{t('medicalCare')}</span>
                        </div>
                        <ArrowIcon className="size-3.5 text-slate-400 group-hover:text-accent transition-colors" />
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-accent transition-colors">
                            <Settings className="size-3.5" />
                          </div>
                          <span className="text-xs font-bold">{t('systemSettings')}</span>
                        </div>
                        <ArrowIcon className="size-3.5 text-slate-400 group-hover:text-accent transition-colors" />
                      </Link>
                    </div>

                    {/* Footer / Logout */}
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors"
                      >
                        <LogOut className="size-3.5" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
    </header>

      {/* Global Brand Logo Lightbox / Viewer Modal */}
      <LogoViewerModal 
        isOpen={isLogoModalOpen} 
        onClose={() => setIsLogoModalOpen(false)} 
      />
    </>
  );
}


