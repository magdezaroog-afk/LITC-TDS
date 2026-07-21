import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';
import { useLanguage } from '../../engine/ui-loader/LanguageContext';
import { UILayoutEngineTab } from './tabs/UILayoutEngineTab';
import { OperationalStructureTab } from './tabs/OperationalStructureTab';

import { SecurityControlTab } from './tabs/SecurityControlTab';
import { NotificationPolicyConsole } from './NotificationPolicyConsole';
import { TicketRoutingTab } from './tabs/TicketRoutingTab';
import { ExternalSystemsTab } from './tabs/ExternalSystemsTab';
import { IdentityHubTab } from './tabs/IdentityHubTab';
import { SystemOverviewTab } from './tabs/SystemOverviewTab';
import { InstitutionalStructureTab } from './tabs/InstitutionalStructureTab';
import { OrgNode, initialOrgTree } from './tabs/orgStructureTypes';

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
    overview: { color: '#3b82f6', bg: '#eff6ff', label: 'اللوحة المركزية', sublabel: 'System Telemetry', icon: '◱' },
    ui: { color: '#5856D6', bg: '#F0F0FF', label: 'هندسة الواجهات', sublabel: 'UI Layout Engine', icon: '✦' },
    operations: { color: '#007AFF', bg: '#EBF5FF', label: 'الهيكل التشغيلي', sublabel: 'Operations & Structure', icon: '⬡' },
    security: { color: '#FF3B30', bg: '#FFF0EF', label: 'الأمان والحوكمة', sublabel: 'Security Control Core', icon: '⬢' },
    policies: { color: '#AF52DE', bg: '#F7F0FF', label: 'سياسات التنبيهات', sublabel: 'Notification Policies', icon: '◈' },
    routing: { color: '#FF6B35', bg: '#FFF3ED', label: 'مسارات التذاكر', sublabel: 'Ticket Routing Engine', icon: '⟳' },
    uecpHub: { color: '#8B5CF6', bg: '#F3E8FF', label: 'الأنظمة الخارجية', sublabel: 'External Integrations', icon: '🔌' },
    identityHub: { color: '#10B981', bg: '#E6F4EA', label: 'إداراة الهوية والربط', sublabel: 'Identity Federation', icon: '🔑' },
    institutional: { color: '#8B5CF6', bg: '#F3E8FF', label: 'المباني والمواقع', sublabel: 'Buildings & Locations', icon: '🏢' }
  }
};

/* ─────────────────────────────────────────────────────────────
   Inject Global Styles (once)
   ───────────────────────────────────────────────────────────── */
const STYLES_ID = 'admin-apple-styles-v3';
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
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
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

  const [orgTree, setOrgTree] = useState<OrgNode>(() => {
    try { const s = localStorage.getItem('litc_org_tree'); return s ? JSON.parse(s) : initialOrgTree; } catch { return initialOrgTree; }
  });
  useEffect(() => { localStorage.setItem('litc_org_tree', JSON.stringify(orgTree)); }, [orgTree]);
  const [activeTab, setActiveTab] = useState<'overview' | 'ui' | 'operations' | 'security' | 'policies' | 'routing' | 'uecpHub' | 'institutional'>('overview');
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

  const isAdmin = user && ['system_director', 'super_admin'].includes(user.role);

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

  const TAB_KEYS: Array<'overview' | 'ui' | 'operations' | 'security' | 'policies' | 'routing' | 'uecpHub' | 'institutional'> = [
    'overview',
    'ui', 'operations', 'security', 'policies', 'routing'
  , 'uecpHub', 'institutional'];

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
            {activeTab === 'overview' && <SystemOverviewTab />}
            {activeTab === 'ui' && <UILayoutEngineTab />}
            {activeTab === 'operations' && <OperationalStructureTab orgTree={orgTree} />}
            
            {activeTab === 'security' && <SecurityControlTab />}
            {activeTab === 'policies' && <NotificationPolicyConsole />}
            {activeTab === 'routing' && <TicketRoutingTab />}
            {activeTab === 'uecpHub' && <ExternalSystemsTab />}
            {activeTab === 'institutional' && <InstitutionalStructureTab orgTree={orgTree} setOrgTree={setOrgTree} />}
          </div>
        </main>
      </div>

      {/* ── Floating Dock Taskbar (macOS-inspired) ── */}
      <nav style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderRadius: '22px',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        zIndex: 90000,
        animation: 'appleReveal 0.5s cubic-bezier(0.28, 0.11, 0.32, 1)',
      }}>
        {TAB_KEYS.map((tabId) => {
          const cfg = APPLE.tabs[tabId];
          const isActive = activeTab === tabId;

          return (
            <button
              key={tabId}
              title={`${cfg.label} — ${cfg.sublabel}`}
              onClick={() => handleTabSwitch(tabId)}
              style={{
                position: 'relative',
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                background: isActive
                  ? `linear-gradient(145deg, ${cfg.color}, ${cfg.color}dd)`
                  : 'transparent',
                color: isActive ? '#fff' : cfg.color,
                fontSize: '18px',
                fontWeight: '700',
                transition: 'all 0.25s cubic-bezier(0.28, 0.11, 0.32, 1)',
                transform: isActive ? 'translateY(-4px) scale(1.08)' : 'translateY(0) scale(1)',
                boxShadow: isActive
                  ? `0 6px 20px ${cfg.color}50`
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${cfg.color}15`;
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: '1' }}>{cfg.icon}</span>
              <span style={{ fontSize: '8px', fontWeight: '600', opacity: 0.85, letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '48px' }}>
                {cfg.label.length > 6 ? cfg.label.substring(0, 6) + '..' : cfg.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: cfg.color,
                  boxShadow: `0 0 6px ${cfg.color}`,
                }} />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
};
