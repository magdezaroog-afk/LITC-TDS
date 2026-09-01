import { useLanguage } from '..\..\engine\ui-loader\LanguageContext';
import React, { useState } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';
import { useThemeEngine } from '../../engine/ui-loader/ThemeProvider';
import { NotificationBell } from '../infrastructure/NotificationBell';
import { UnifiedProfileDropdown } from '../infrastructure/UnifiedProfileDropdown';
import { SystemModeToggle } from '../molecules/SystemModeToggle';
import { LanguageToggle } from '../molecules/LanguageToggle';
import { useBreakpoint } from '../../hooks/useBreakpoint';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

/* ─────────────────────────────────────────────────────────────
   Unified Smart TopBar — World-Class 2026
   Adapts automatically to Desktop / Tablet / Mobile
   ───────────────────────────────────────────────────────────── */

const STYLES_ID = 'litc-topbar-styles-v1';
const injectStyles = () => {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    @keyframes litcTopbarReveal {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .litc-topbar {
      animation: litcTopbarReveal 0.3s cubic-bezier(0.28, 0.11, 0.32, 1) both;
    }
    .litc-topbar-btn {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      transition: background 0.2s ease, transform 0.15s ease;
      outline: none;
    }
    .litc-topbar-btn:hover {
      transform: scale(1.05);
    }
    .litc-topbar-btn:active {
      transform: scale(0.97);
    }
    .litc-mobile-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 94000;
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(4px);
      animation: litcFadeIn 0.2s ease both;
    }
    .litc-mobile-menu {
      position: fixed;
      top: 56px;
      left: 0; right: 0;
      z-index: 94500;
      margin: 0 12px;
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.16);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: litcTopbarReveal 0.25s cubic-bezier(0.28,0.11,0.32,1) both;
    }
    .litc-mobile-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #1d1d1f;
      transition: background 0.2s;
      text-align: right;
      width: 100%;
    }
    .litc-mobile-menu-item:hover { background: rgba(99,102,241,0.07); }
    @keyframes litcFadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
};

export const UnifiedTopBar: React.FC = () => {

  injectStyles();

  const bp = useBreakpoint();
  const { user } = useAuth();
  const { t, toggleLanguage, dir } = useLanguage();
  const { mode, toggleMode } = useThemeEngine();

  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = mode === 'dark';
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';

  /* ── Token palette (adapts to light / dark) ── */
  const tok = isDark
    ? {
        bar: 'rgba(255, 255, 255, 0.02)', /* Pure glass: almost fully transparent */
        border: 'rgba(255, 255, 255, 0.08)',
        text: '#f8fafc',
        textSub: '#94a3b8',
        btnHover: 'rgba(255, 255, 255, 0.1)',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
      }
    : {
        bar: 'rgba(255, 255, 255, 0.15)', /* Pure glass: highly transparent */
        border: 'rgba(255, 255, 255, 0.4)',
        text: '#111827',
        textSub: '#6b7280',
        btnHover: 'rgba(99, 102, 241, 0.08)',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
      };

  const primary = isDark ? '#6366f1' : '#4f46e5';
  const height = isMobile ? '56px' : '60px'; /* Slightly smaller height */

  /* ── Icon Buttons helper ── */
  const Btn: React.FC<{ icon: string; label: string; onClick?: () => void; badge?: number }> = ({
    icon, label, onClick, badge
  }) => (
    <button
      className="litc-topbar-btn"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        color: tok.text,
        padding: isMobile ? '8px' : '8px 10px',
        gap: '6px',
        fontSize: '18px',
        position: 'relative',
      }}
    >
      <span>{icon}</span>
      {!isMobile && !isTablet && (
        <span style={{ fontSize: '13px', fontWeight: '500', color: tok.textSub }}>{label}</span>
      )}
      {badge != null && badge > 0 && (
        <span style={{
          position: 'absolute', top: '4px', right: '4px',
          background: '#ef4444', color: '#fff', borderRadius: '999px',
          fontSize: '10px', fontWeight: '700',
          minWidth: '16px', height: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', lineHeight: 1,
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* ── Main Bar ── */}
      <div style={{ position: 'relative', zIndex: 95000 }}>
        <header
          className="litc-topbar"
          style={{
            position: 'fixed',
            top: isMobile ? '10px' : '15px', 
            left: isMobile ? '10px' : '3%', 
            right: isMobile ? '10px' : '3%',
            height,
            display: 'flex',
            alignItems: 'center',
            padding: isMobile ? '0 12px' : '0 24px',
            gap: '8px',
            background: tok.bar,
            backdropFilter: 'blur(35px) saturate(180%)',
            WebkitBackdropFilter: 'blur(35px) saturate(180%)',
            border: `1px solid ${tok.border}`,
            borderRadius: '24px',
            boxShadow: tok.shadow,
            direction: dir,
            boxSizing: 'border-box',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
        {/* ── Brand / Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              background: `linear-gradient(135deg, ${primary}, ${primary}99)`,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '800',
              color: '#fff',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${primary}44`,
            }}>
              L
            </div>

          {!isMobile && (
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '14px', fontWeight: '700',
                color: tok.text, letterSpacing: '-0.2px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                LITC
              </div>
              {!isTablet && (
                <div style={{ fontSize: '11px', color: tok.textSub, fontWeight: '500' }}>
                  v43.5 — {user?.role ?? '—'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '2px' : '4px', flexShrink: 0 }}>

          {/* Language Toggle */}
          {!isMobile && (
            <LanguageToggle />
          )}

          {/* Dark / Light Mode Toggle */}
          <Btn
            icon={isDark ? '☀️' : '🌙'}
            label={isDark ? t('ui.auto_1255', 'فاتح') : t('ui.auto_1256', 'غامق')}
            onClick={toggleMode}
          />

          {/* System Mode Toggle */}
          {!isMobile && (
            <div style={{ padding: '0 4px' }}>
              <SystemModeToggle />
            </div>
          )}

          {/* Notifications */}
          <div style={{ padding: '0 4px', position: 'relative' }}>
            <NotificationBell />
          </div>

          {/* Profile Dropdown */}
          <div style={{ padding: '0 4px' }}>
            <UnifiedProfileDropdown currentUserRole={user?.role ?? 'EMPLOYEE'} />
          </div>

          {/* Mobile hamburger — shows extra items */}
          {isMobile && (
            <button
              className="litc-topbar-btn"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={t('ui.menu')}
              style={{ color: tok.text, padding: '8px', fontSize: '20px' }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
        </header>
      </div>

      {/* ── Mobile Menu Overlay ── */}
      {isMobile && menuOpen && (
        <>
          <div className="litc-mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
          <div className="litc-mobile-menu">
            <button className="litc-mobile-menu-item" onClick={() => { toggleLanguage(); setMenuOpen(false); }}>
              <span>🌐</span> <span>{t('nav.language') ?? t('ui.auto_1257', 'اللغة')}</span>
            </button>
            <div style={{ padding: '8px 16px' }}>
              <SystemModeToggle />
            </div>
          </div>
        </>
      )}

      {/* ── Spacer removed so content flows under the glassy bar ── */}
    </>
  );
};
