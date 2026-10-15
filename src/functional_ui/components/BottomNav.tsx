import React, { useRef, useState } from 'react';
import { Home, Users, Trophy, ClipboardList, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHub } from '../context/HubContext';

interface BottomNavProps {
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
}

type NavTab = 'news' | 'community' | 'challenges' | 'requests';
const TABS: NavTab[] = ['news', 'community', 'challenges', 'requests'];

export function BottomNav({ onOpenMenu, isMenuOpen = false }: BottomNavProps) {
  const { feedTab, setFeedTab, activeModules, darkMode, language, t } = useHub();
  const location = useLocation();
  const navigate = useNavigate();

  const isRtl = language === 'ar';
  const isFeed = location.pathname === '/';

  const getActiveTab = (): NavTab => {
    if (location.pathname === '/requests') return 'requests';
    if (location.pathname === '/challenges') return 'challenges';
    if (isFeed) {
      if (feedTab === 'news' || feedTab === 'community' || feedTab === 'challenges') {
        return feedTab;
      }
    }
    return 'news';
  };

  const switchTabByIndex = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(TABS.length - 1, index));
    const targetTab = TABS[boundedIndex];
    handleNavClick(targetTab);
  };

  const handleNavClick = (tab: NavTab) => {
    if (tab === 'requests') {
      navigate('/requests');
      return;
    }
    setFeedTab(tab);
    if (!isFeed) {
      navigate('/');
    }
  };

  // Touch and Pointer Swipe Gesture Handling on Bottom Nav
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  const [lockedMsg, setLockedMsg] = useState<string | null>(null);

  const showLockedToast = () => {
    setLockedMsg(language === 'ar' ? 'تم قفل هذه الخاصية من قبل الإدارة' : 'Feature locked by administrator');
    setTimeout(() => setLockedMsg(null), 3000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current !== null ? Math.abs(touchStartY.current - e.changedTouches[0].clientY) : 0;

    // Horizontal swipe threshold: > 25px and horizontal > vertical
    if (Math.abs(deltaX) > 25 && Math.abs(deltaX) > deltaY) {
      const currentTab = getActiveTab();
      const currentIndex = TABS.indexOf(currentTab);
      const step = isRtl ? (deltaX < 0 ? 1 : -1) : (deltaX > 0 ? 1 : -1);
      const nextIndex = currentIndex + step;
      if (nextIndex >= 0 && nextIndex < TABS.length) {
        const targetTab = TABS[nextIndex];
        const moduleMap: Record<NavTab, string> = {
          news: 'functional_news',
          community: 'functional_community',
          challenges: 'functional_challenges',
          requests: 'ticket_inbox'
        };
        const modules = activeModules || {};
        if (modules[moduleMap[targetTab]] !== false) {
          switchTabByIndex(nextIndex);
        } else {
          showLockedToast();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-fab="true"]')) return;
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current || touchStartX.current === null) {
      isDragging.current = false;
      return;
    }
    const deltaX = touchStartX.current - e.clientX;
    const deltaY = touchStartY.current !== null ? Math.abs(touchStartY.current - e.clientY) : 0;

    if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > deltaY) {
      const currentTab = getActiveTab();
      const currentIndex = TABS.indexOf(currentTab);
      const step = isRtl ? (deltaX < 0 ? 1 : -1) : (deltaX > 0 ? 1 : -1);
      const nextIndex = currentIndex + step;
      if (nextIndex >= 0 && nextIndex < TABS.length) {
        const targetTab = TABS[nextIndex];
        const moduleMap: Record<NavTab, string> = {
          news: 'functional_news',
          community: 'functional_community',
          challenges: 'functional_challenges',
          requests: 'ticket_inbox'
        };
        const modules = activeModules || {};
        if (modules[moduleMap[targetTab]] !== false) {
          switchTabByIndex(nextIndex);
        } else {
          showLockedToast();
        }
      }
    }
    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const isHomeActive = isFeed && feedTab === 'news';
  const isCommunityActive = isFeed && feedTab === 'community';
  const isChallengesActive = (isFeed && feedTab === 'challenges') || location.pathname === '/challenges';
  const isRequestsActive = location.pathname === '/requests';

  const isDarkLook = darkMode;

  const modules = activeModules || {};
  const isNewsActive = modules.functional_news !== false;
  const isCommActive = modules.functional_community !== false;
  const isChallActive = modules.functional_challenges !== false;
  const isReqActive = modules.ticket_inbox !== false;
  const isMenuBtnActive = modules.ticket_create !== false;

  return (
    <div 
      className="fixed inset-x-0 bottom-0 z-[260] flex justify-center px-2.5 sm:px-4 lg:hidden pointer-events-none transition-all duration-200 ease-out select-none"
    >
      {lockedMsg && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-[9999] bg-slate-900/90 backdrop-blur-md text-white px-6 py-2 rounded-full shadow-2xl border border-white/10 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-5 whitespace-nowrap">
          {lockedMsg}
        </div>
      )}
      <nav 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={`
          w-full max-w-md sm:max-w-lg rounded-t-2xl sm:rounded-t-3xl pointer-events-auto shadow-2xl transition-all duration-300 cursor-grab active:cursor-grabbing touch-pan-y border-t border-x border-b-0 backdrop-blur-2xl backdrop-saturate-150
          ${isDarkLook 
            ? 'bg-slate-950/75 border-white/15 text-white shadow-[0_-12px_35px_rgba(0,0,0,0.6)]' 
            : 'bg-white/75 border-white/70 text-slate-800 shadow-[0_-12px_35px_rgba(0,0,0,0.08)]'}
        `}
      >
        <div className="flex h-14 sm:h-16 items-center justify-around px-2 sm:px-4">
          {/* 1: الأخبار الرسمية (الرئيسية) */}
          {isNewsActive ? (
            <button
              onClick={() => handleNavClick('news')}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200
                ${isHomeActive 
                  ? 'bg-primary text-white shadow-xs scale-105 font-black' 
                  : isDarkLook 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-500 hover:text-slate-900'}
              `}
              aria-label={t('navHome')}
            >
              <Home className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('navHome')}</span>
            </button>
          ) : (
            <button
              onClick={showLockedToast}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200 opacity-50 filter blur-[1px] cursor-not-allowed
                ${isDarkLook ? 'text-slate-500' : 'text-slate-400'}
              `}
              aria-label={t('navHome')}
            >
              <Home className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('navHome')}</span>
            </button>
          )}

          {/* 2: المجتمع */}
          {isCommActive ? (
            <button
              onClick={() => handleNavClick('community')}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200
                ${isCommunityActive 
                  ? 'bg-primary text-white shadow-xs scale-105 font-black' 
                  : isDarkLook 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-500 hover:text-slate-900'}
              `}
              aria-label={t('tabCommunity')}
            >
              <Users className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('tabCommunity')}</span>
            </button>
          ) : (
            <button
              onClick={showLockedToast}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200 opacity-50 filter blur-[1px] cursor-not-allowed
                ${isDarkLook ? 'text-slate-500' : 'text-slate-400'}
              `}
              aria-label={t('tabCommunity')}
            >
              <Users className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('tabCommunity')}</span>
            </button>
          )}

          {/* 3 (Center): الزر (+) */}
          <div className="px-1.5 shrink-0 -my-2.5" data-fab="true">
            {isMenuBtnActive ? (
              <button
                onClick={onOpenMenu}
                className={`
                  relative overflow-hidden grid size-12 sm:size-13 place-items-center rounded-full text-white transition-all duration-300 active:scale-90 hover:scale-105 shadow-md shadow-slate-900/20
                  border-[1.5px] border-[#387B9E]
                  before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/30 before:to-transparent before:rounded-t-full before:pointer-events-none
                  ${isMenuOpen 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 rotate-45' 
                    : 'bg-accent hover:brightness-105 rotate-0'}
                `}
                aria-label={t('menuAndServices')}
                title={t('menuAndServices')}
              >
                <Plus className="size-6 sm:size-7 text-white relative z-10" strokeWidth={2.8} />
              </button>
            ) : (
              <button
                onClick={showLockedToast}
                className="relative overflow-hidden grid size-12 sm:size-13 place-items-center rounded-full text-white/50 transition-all duration-300 border-[1.5px] border-slate-500/50 bg-slate-500/20 cursor-not-allowed opacity-50 filter blur-[1px]"
                aria-label={t('menuAndServices')}
                title={t('menuAndServices')}
              >
                <Plus className="size-6 sm:size-7 text-white/50 relative z-10" strokeWidth={2.8} />
              </button>
            )}
          </div>

          {/* 4: التحديات */}
          {isChallActive ? (
            <button
              onClick={() => handleNavClick('challenges')}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200
                ${isChallengesActive 
                  ? 'bg-primary text-white shadow-xs scale-105 font-black' 
                  : isDarkLook 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-500 hover:text-slate-900'}
              `}
              aria-label={t('navChallenges')}
            >
              <Trophy className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('navChallenges')}</span>
            </button>
          ) : (
            <button
              onClick={showLockedToast}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200 opacity-50 filter blur-[1px] cursor-not-allowed
                ${isDarkLook ? 'text-slate-500' : 'text-slate-400'}
              `}
              aria-label={t('navChallenges')}
            >
              <Trophy className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('navChallenges')}</span>
            </button>
          )}

          {/* 5: طلباتي */}
          {isReqActive ? (
            <button
              onClick={() => handleNavClick('requests')}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200
                ${isRequestsActive 
                  ? 'bg-primary text-white shadow-xs scale-105 font-black' 
                  : isDarkLook 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-500 hover:text-slate-900'}
              `}
              aria-label={t('navRequests')}
            >
              <ClipboardList className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('navRequests')}</span>
            </button>
          ) : (
            <button
              onClick={showLockedToast}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition-all duration-200 opacity-50 filter blur-[1px] cursor-not-allowed
                ${isDarkLook ? 'text-slate-500' : 'text-slate-400'}
              `}
              aria-label={t('navRequests')}
            >
              <ClipboardList className="size-4 sm:size-4.5" />
              <span className="truncate text-[10px]">{t('navRequests')}</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
