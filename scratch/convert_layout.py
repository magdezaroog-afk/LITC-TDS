import sys

filepath = r"src\components\admin\AdminDashboardShell.tsx"

new_content = """import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';
import { useLanguage } from '../../engine/ui-loader/LanguageContext';
import { UILayoutEngineTab } from './tabs/UILayoutEngineTab';
import { OperationalStructureTab } from './tabs/OperationalStructureTab';
import { DynamicFieldsTab } from './tabs/DynamicFieldsTab';
import { SecurityControlTab } from './tabs/SecurityControlTab';
import { NotificationPolicyConsole } from './NotificationPolicyConsole';

/* ─────────────────────────────────────────────────────────────
   Apple-Inspired Design System Tokens
   ───────────────────────────────────────────────────────────── */
const APPLE = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: 'rgba(255, 255, 255, 0.8)',
  text: '#1D1D1F',
  textSecondary: '#6E6E73',
  textTertiary: '#AEAEB2',
  separator: 'rgba(0,0,0,0.08)',
  separatorStrong: 'rgba(0,0,0,0.14)',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  shadowHover: '0 4px 20px rgba(0,0,0,0.1)',
  shadowCard: '0 2px 8px rgba(0,0,0,0.06)',
  radius: '14px',
  radiusLg: '20px',
  radiusXl: '28px',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
  spring: 'cubic-bezier(0.28, 0.11, 0.32, 1)',
  tabs: {
    ui: { color: '#5856D6', bg: '#F0F0FF', label: 'هندسة الواجهات', sublabel: 'UI Layout Engine', icon: '✦' },
    operations: { color: '#007AFF', bg: '#EBF5FF', label: 'الهيكل التشغيلي', sublabel: 'Operations & Structure', icon: '⬡' },
    dynamic_fields: { color: '#FF9500', bg: '#FFF7EB', label: 'المستدلات الديناميكية', sublabel: 'Dynamic Fields Builder', icon: '⬟' },
    security: { color: '#FF3B30', bg: '#FFF0EF', label: 'الأمان والحوكمة', sublabel: 'Security Control Core', icon: '⬢' },
    policies: { color: '#AF52DE', bg: '#F7F0FF', label: 'سياسات التنبيهات', sublabel: 'Notification Policies', icon: '◈' },
  }
};

/* ─────────────────────────────────────────────────────────────
   Inject Global Styles (once)
   ───────────────────────────────────────────────────────────── */
const STYLES_ID = 'admin-apple-styles-v2';
const injectStyles = () => {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { box-sizing: border-box; }

    @keyframes appleReveal {
      from { opacity: 0; transform: translateY(8px) scale(0.995); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    @keyframes startMenuReveal {
      from { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
      to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }
    @keyframes appleFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes applePulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }

    .admin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .admin-scroll::-webkit-scrollbar-track { background: transparent; }
    .admin-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
    .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

    .apple-tab-item {
      transition: all 0.25s cubic-bezier(0.28, 0.11, 0.32, 1);
      cursor: pointer;
      position: relative;
      border-radius: 12px;
      user-select: none;
    }
    .apple-tab-item:hover { transform: none; }
    .apple-tab-item:active { transform: scale(0.98); }

    .apple-btn {
      transition: all 0.2s cubic-bezier(0.28, 0.11, 0.32, 1);
      cursor: pointer;
    }
    .apple-btn:hover { opacity: 0.85; }
    .apple-btn:active { transform: scale(0.97); opacity: 0.7; }
  `;
  document.head.appendChild(style);
};

/* ─────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────── */
export const AdminDashboardShell: React.FC = () => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();

  const [activeTab, setActiveTab] = useState<'ui' | 'operations' | 'dynamic_fields' | 'security' | 'policies'>('ui');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const startMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectStyles(); }, []);

  // Close Start Menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startMenuRef.current && !startMenuRef.current.contains(event.target as Node)) {
        setIsStartMenuOpen(false);
      }
    };
    if (isStartMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStartMenuOpen]);

  const isAdmin = user && user.role === 'IT_Admin';

  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', padding: '24px', fontFamily: APPLE.font
      }}>
        <div style={{
          background: APPLE.surface, borderRadius: APPLE.radiusXl,
          border: `1px solid ${APPLE.separator}`, boxShadow: APPLE.shadow,
          padding: '48px', textAlign: 'center', maxWidth: '480px', width: '100%'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: APPLE.text, margin: '0 0 8px' }}>
            {t('access.denied.title')}
          </h2>
          <p style={{ fontSize: '14px', color: APPLE.textSecondary, margin: 0, lineHeight: '1.6' }}>
            {t('access.denied.msg')}
          </p>
        </div>
      </div>
    );
  }

  const TAB_KEYS: Array<'ui' | 'operations' | 'dynamic_fields' | 'security' | 'policies'> = [
    'ui', 'operations', 'dynamic_fields', 'security', 'policies'
  ];

  const handleTabSwitch = (tabId: typeof activeTab) => {
    if (tabId === activeTab) {
      setIsStartMenuOpen(false);
      return;
    }
    setIsTransitioning(true);
    setIsStartMenuOpen(false);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
    }, 200);
  };

  const activeConfig = APPLE.tabs[activeTab];

  return (
    <div style={{
      background: APPLE.bg,
      minHeight: '100vh',
      fontFamily: APPLE.font,
      direction: dir,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ── Main Layout ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '0',
      }}>

        {/* ── Main Content ── */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: APPLE.bg,
          paddingBottom: '80px', // Space for taskbar
        }}>
          {/* Top Bar */}
          <header style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${APPLE.separator}`,
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Color dot */}
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: activeConfig.color,
                boxShadow: `0 0 8px ${activeConfig.color}60`,
                transition: 'background 0.3s ease, box-shadow 0.3s ease'
              }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: APPLE.text }}>
                  {activeConfig.label}
                </div>
                <div style={{ fontSize: '12px', color: APPLE.textTertiary, marginTop: '1px' }}>
                  {activeConfig.sublabel}
                </div>
              </div>
            </div>

            {/* User Badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: APPLE.surface, borderRadius: '20px',
              padding: '6px 14px 6px 8px',
              border: `1px solid ${APPLE.separator}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${APPLE.tabs.ui.color}, ${APPLE.tabs.policies.color})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: '#fff', fontWeight: '700',
              }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: APPLE.text }}>
                {user?.name || 'Admin'}
              </span>
            </div>
          </header>

          {/* Content Area */}
          <div
            className="admin-main-content admin-scroll"
            style={{
              flex: 1,
              padding: '28px',
              overflowY: 'auto',
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(6px)' : 'translateY(0)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              animation: !isTransitioning ? 'appleReveal 0.3s cubic-bezier(0.28, 0.11, 0.32, 1)' : 'none',
              maxWidth: '1440px',
              margin: '0 auto',
              width: '100%'
            }}
          >
            {activeTab === 'ui' && <UILayoutEngineTab />}
            {activeTab === 'operations' && <OperationalStructureTab />}
            {activeTab === 'dynamic_fields' && <DynamicFieldsTab />}
            {activeTab === 'security' && <SecurityControlTab />}
            {activeTab === 'policies' && <NotificationPolicyConsole />}
          </div>
        </main>
      </div>

      {/* ── Windows 11 / Mac Dock Style Start Menu ── */}
      {isStartMenuOpen && (
        <div ref={startMenuRef} style={{
          position: 'fixed',
          bottom: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '380px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          padding: '24px',
          zIndex: 1000,
          animation: 'startMenuReveal 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          {/* Menu Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${APPLE.separator}` }}>
             <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: `linear-gradient(135deg, ${APPLE.tabs.ui.color}, ${APPLE.tabs.policies.color})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: '#fff', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>⚡</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: APPLE.text, lineHeight: '1.2' }}>
                  {t('admin.console')}
                </div>
                <div style={{ fontSize: '12px', color: APPLE.textSecondary, marginTop: '2px' }}>
                  جميع أدوات التحكم التشغيلية
                </div>
              </div>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {TAB_KEYS.map((tabId) => {
              const cfg = APPLE.tabs[tabId];
              const isActive = activeTab === tabId;

              return (
                <div
                  key={tabId}
                  className="apple-tab-item"
                  onClick={() => handleTabSwitch(tabId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: isActive ? cfg.bg : 'transparent',
                    border: `1px solid ${isActive ? cfg.color + '30' : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', flexShrink: 0,
                    borderRadius: '10px',
                    background: isActive ? cfg.color : `${cfg.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                    color: isActive ? '#fff' : cfg.color,
                    fontWeight: '700',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 4px 12px ${cfg.color}40` : 'none',
                  }}>
                    {cfg.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? cfg.color : APPLE.text,
                      lineHeight: '1.2',
                    }}>
                      {cfg.label}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: APPLE.textTertiary,
                      marginTop: '2px',
                    }}>
                      {cfg.sublabel}
                    </div>
                  </div>
                  
                  {isActive && (
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: cfg.color, flexShrink: 0,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Unified Bottom Taskbar ── */}
      <nav style={{
        position: 'fixed',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        height: '64px',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.5)',
        borderRadius: '32px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
        gap: '6px'
      }}>
        {/* Start Button */}
        <button
          className="apple-btn"
          onClick={(e) => { e.stopPropagation(); setIsStartMenuOpen(!isStartMenuOpen); }}
          style={{
            width: '48px', height: '48px',
            borderRadius: '50%',
            background: isStartMenuOpen ? 'rgba(0,0,0,0.05)' : 'transparent',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
            transition: 'all 0.2s cubic-bezier(0.28, 0.11, 0.32, 1)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
          onMouseLeave={(e) => { if (!isStartMenuOpen) e.currentTarget.style.background = 'transparent'; }}
        >
           <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${APPLE.tabs.ui.color}, ${APPLE.tabs.operations.color})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '18px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              transform: isStartMenuOpen ? 'scale(0.95)' : 'scale(1)',
              transition: 'transform 0.2s ease'
           }}>⚡</div>
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '32px', background: APPLE.separator, margin: '0 4px' }} />

        {/* Pinned active items (Mac Dock Style) */}
        {TAB_KEYS.map((tabId) => {
          const cfg = APPLE.tabs[tabId];
          const isActive = activeTab === tabId;
          
          return (
            <div key={tabId} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                className="apple-btn"
                onClick={() => handleTabSwitch(tabId)}
                title={cfg.label}
                style={{
                  width: '48px', height: '48px',
                  borderRadius: '14px',
                  background: isActive ? 'rgba(0,0,0,0.04)' : 'transparent',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', color: isActive ? cfg.color : APPLE.textSecondary,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {cfg.icon}
              </button>
              {/* Dot indicator below active item */}
              {isActive && (
                <div style={{
                  width: '4px', height: '4px', borderRadius: '50%', background: cfg.color,
                  position: 'absolute', bottom: '2px',
                }} />
              )}
            </div>
          );
        })}
      </nav>

    </div>
  );
};
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done")
