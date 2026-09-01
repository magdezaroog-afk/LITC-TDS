import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeEngine } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';



/* ─────────────────────────────────────────────────────────────
   Mobile Bottom Navigation Bar — Premium Floating Island 2026
   بيل فلوتينج آيلاند — أسلوب ديناميكي مع أنيميشن ناعم
   ───────────────────────────────────────────────────────────── */

const STYLES_ID = 'litc-bottomnav-v2';

const injectStyles = () => {
  if (document.getElementById(STYLES_ID)) return;
  const s = document.createElement('style');
  s.id = STYLES_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap');

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

    @keyframes litcNavIslandIn {
      from { opacity: 0; transform: translateY(40px) scale(0.92); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }
    @keyframes litcNavBlobPop {
      0%   { transform: scale(1);    }
      30%  { transform: scale(1.22); }
      60%  { transform: scale(0.95); }
      100% { transform: scale(1);    }
    }
    @keyframes litcNavRipple {
      from { transform: scale(0); opacity: 0.5; }
      to   { transform: scale(2.8); opacity: 0; }
    }
    @keyframes litcNavLabelSlide {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
    @keyframes litcNavGlow {
      0%, 100% { box-shadow: 0 0 12px var(--litc-primary, #6366f1)55; }
      50%       { box-shadow: 0 0 24px var(--litc-primary, #6366f1)99; }
    }

    .litc-bnav-wrap {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 95000;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      padding: 0 16px;
      padding-bottom: max(env(safe-area-inset-bottom, 10px), 10px);
      pointer-events: none;
      background: linear-gradient(to top, var(--bg-main, rgba(5,5,7,0.9)) 0%, rgba(5,5,7,0) 100%);
      padding-top: 40px; /* Give space for gradient fade */
    }

    [data-theme='light'] .litc-bnav-wrap {
      background: linear-gradient(to top, rgba(248,250,252,0.9) 0%, rgba(248,250,252,0) 100%);
    }

    .litc-bnav-island {
      pointer-events: all;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 10px;
      border-radius: 28px;
      animation: litcNavIslandIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
      position: relative;
      overflow: hidden;
    }

    .litc-bnav-btn {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      border-radius: 20px;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      width: 64px;
      height: 56px;
      overflow: hidden;
    }

    .litc-bnav-btn:active {
      transform: scale(0.90);
    }

    .litc-bnav-pill {
      position: absolute;
      inset: 4px;
      border-radius: 16px;
      transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      transform: scale(0.7);
    }
    .litc-bnav-btn.active .litc-bnav-pill {
      opacity: 1;
      transform: scale(1);
    }

    .litc-bnav-icon-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 12px;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1;
    }
    .litc-bnav-btn.active .litc-bnav-icon-wrap {
      transform: translateY(-2px);
      animation: litcNavBlobPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .litc-bnav-icon {
      font-size: 20px;
      line-height: 1;
      display: block;
      transition: filter 0.3s ease, transform 0.3s ease;
    }
    .litc-bnav-btn.active .litc-bnav-icon {
      transform: scale(1.1);
    }

    .litc-bnav-label {
      font-size: 10px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.3px;
      line-height: 1;
      transition: opacity 0.25s ease, transform 0.25s ease, color 0.25s;
      opacity: 0;
      transform: translateY(2px);
      z-index: 1;
    }
    .litc-bnav-btn.active .litc-bnav-label {
      opacity: 1;
      transform: translateY(0);
      animation: litcNavLabelSlide 0.3s ease 0.05s both;
    }

    /* Active dot indicator */
    .litc-bnav-dot {
      position: absolute;
      bottom: 5px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: scale(0);
    }
    .litc-bnav-btn.active .litc-bnav-dot {
      opacity: 1;
      transform: scale(1);
      animation: litcNavGlow 2s ease-in-out infinite;
    }

    /* Ripple on tap */
    .litc-bnav-ripple {
      position: absolute;
      width: 40px; height: 40px;
      border-radius: 50%;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      animation: litcNavRipple 0.5s ease-out forwards;
    }
  `;
  document.head.appendChild(s);
};

interface NavItem {
  icon: string;
  label: string;
  path: string;
  roles?: string[];
}

export const MobileBottomNav: React.FC = () => {

  const ALL_NAV_ITEMS: NavItem[] = [
    { icon: '🏠', label: t('ui.home'),  path: '/' },
    { icon: '📊', label: t('ui.auto_1252', 'التحليلات'), path: '/mobile/analytics' },
    { icon: '🔔', label: t('notifications.title'), path: '/notifications' },
    { icon: '🛡️', label: t('ui.auto_1253', 'الحوكمة'),   path: '/admin', roles: ['super_admin', 'co_admin', 'system_director'] },
  ];

  injectStyles();

  const navigate  = useNavigate();
  const location  = useLocation();
  const { mode }  = useThemeEngine();
  const { user }  = useAuth();

  const isDark  = mode === 'dark';
  const primary = `var(--litc-primary, ${isDark ? '#00a3ff' : '#6366f1'})`;

  /* ── Design tokens per mode ── */
  const tok = isDark
    ? {
        island:   'rgba(18, 18, 30, 0.92)',
        border:   'rgba(255,255,255,0.10)',
        shadow:   '0 -2px 40px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)',
        textMute: 'rgba(255,255,255,0.4)',
        pillBg:   'rgba(255,255,255,0.10)',
      }
    : {
        island:   'rgba(255,255,255,0.94)',
        border:   'rgba(0,0,0,0.07)',
        shadow:   '0 -2px 20px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.10)',
        textMute: 'rgba(0,0,0,0.35)',
        pillBg:   'rgba(99,102,241,0.08)',
      };

  /* Filter by role */
  const items = ALL_NAV_ITEMS.filter(item =>
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  /* Ripple effect */
  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'litc-bnav-ripple';
    ripple.style.background = `${primary.replace('var(--litc-primary, ', '').replace(')', '')}33`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  };

  return (
    <div className="litc-bnav-wrap">
      <nav
        className="litc-bnav-island"
        role="navigation"
        aria-label={t('ui.auto_1254') || 'القائمة الرئيسية'}
        style={{
          background: tok.island,
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: `1px solid ${tok.border}`,
          boxShadow: tok.shadow,
          width: '100%',
          maxWidth: '420px',
        }}
      >
        {items.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              className={`litc-bnav-btn${active ? ' active' : ''}`}
              onClick={(e) => { addRipple(e); navigate(item.path); }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{ flex: 1 }}
            >
              {/* Active pill background */}
              <span
                className="litc-bnav-pill"
                style={{ background: active ? tok.pillBg : 'transparent' }}
              />

              {/* Icon container */}
              <span className="litc-bnav-icon-wrap">
                <span
                  className="litc-bnav-icon"
                  style={{
                    filter: active
                      ? 'none'
                      : 'grayscale(60%) opacity(0.55)',
                  }}
                >
                  {item.icon}
                </span>
              </span>

              {/* Label — only shows when active */}
              <span
                className="litc-bnav-label"
                style={{ color: active ? primary : tok.textMute }}
              >
                {item.label}
              </span>

              {/* Glowing dot */}
              <span
                className="litc-bnav-dot"
                style={{ background: primary }}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};
