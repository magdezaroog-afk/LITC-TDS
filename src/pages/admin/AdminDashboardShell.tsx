import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';
import { useLanguage } from '../../engine/ui-loader/LanguageContext';
import { useThemeEngine } from '../../engine/ui-loader/ThemeProvider';
import { useMobileViewport } from '../../mobile/hooks/useMobileViewport';
import { UILayoutEngineTab } from './tabs/UILayoutEngine/UILayoutEngineTabCore';
import { OperationalStructureTab } from './tabs/OperationalStructureTab';

import { SecurityControlTab } from './tabs/SecurityControlTab';
import { NotificationPolicyConsole } from './NotificationPolicyConsole';
import { TicketRoutingTab } from './tabs/TicketRoutingTab';
import { ExternalSystemsTab } from './tabs/ExternalSystemsTab';
import { SystemOverviewTab } from './tabs/SystemOverviewTab';
import { InstitutionalStructureTab } from './tabs/InstitutionalStructureTab';
import { SystemAdminsTab } from './tabs/SystemAdminsTab';
import { DynamicFormAwareAnalytics } from '../../components/analytics/DynamicFormAwareAnalytics';
import { AnalyticsGovernanceSubTab } from './tabs/AnalyticsGovernanceSubTab';
import { OrgNode, initialOrgTree } from './tabs/orgStructureTypes';
import { AdminAPI } from '../../services/admin.api';
import { RoleSimulatorTab } from './tabs/RoleSimulatorTab';
import { InternalRequestsGovernanceTab } from './tabs/InternalRequestsGovernanceTab';
import { IdentityHubTab } from './tabs/IdentityHubTab';
import {
  Grid,
  Layers,
  X,
  ChevronUp,
  LayoutDashboard,
  Sliders,
  Shield,
  Bell,
  GitFork,
  Network,
  Key,
  Building2,
  Users,
  ArrowLeftRight,
  Sparkles,
  BarChart3,
  Cpu,
  Compass,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  font: "-apple-system, 'SF Pro Display', 'Cairo', 'Tajawal', sans-serif",
  spring: 'cubic-bezier(0.28, 0.11, 0.32, 1)',
  tabs: {
    overview: { color: '#3b82f6', bg: '#eff6ff', label: 'اللوحة المركزية', sublabel: 'System Telemetry', icon: '◱', iconComponent: LayoutDashboard, category: 'CORE' },
    analytics: { color: '#0284c7', bg: '#e0f2fe', label: 'التحليلات والمقارنة', sublabel: 'Smart Analytics & Governance', icon: '📊', iconComponent: BarChart3, category: 'CORE' },
    ui: { color: '#135d79', bg: '#eef6f9', label: 'حوكمة الواجهات والأنظمة', sublabel: 'Interface & Satellite Governance', icon: '✦', iconComponent: Sliders, category: 'SYSTEMS' },
    operations: { color: '#007AFF', bg: '#EBF5FF', label: 'الهيكل التشغيلي', sublabel: 'Operations & Structure', icon: '⬡', iconComponent: Network, category: 'CORE' },
    security: { color: '#FF3B30', bg: '#FFF0EF', label: 'الأمان والحوكمة', sublabel: 'Security Control Core', icon: '⬢', iconComponent: Shield, category: 'SECURITY' },
    policies: { color: '#AF52DE', bg: '#F7F0FF', label: 'سياسات التنبيهات', sublabel: 'Notification Policies', icon: '◈', iconComponent: Bell, category: 'POLICIES' },
    routing: { color: '#FF6B35', bg: '#FFF3ED', label: 'مسارات التذاكر', sublabel: 'Ticket Routing Engine', icon: '⟳', iconComponent: GitFork, category: 'SYSTEMS' },
    uecpHub: { color: '#8B5CF6', bg: '#F3E8FF', label: 'الأنظمة الخارجية', sublabel: 'External Integrations', icon: '🔌', iconComponent: Cpu, category: 'SYSTEMS' },
    identityHub: { color: '#10B981', bg: '#E6F4EA', label: 'إداراة الهوية والربط', sublabel: 'Identity Federation', icon: '🔑', iconComponent: Key, category: 'SECURITY' },
    institutional: { color: '#8B5CF6', bg: '#F3E8FF', label: 'المباني والمواقع', sublabel: 'Buildings & Locations', icon: '🏢', iconComponent: Building2, category: 'POLICIES' },
    admins: { color: '#FF3B30', bg: '#FFF0EF', label: 'حوض مدراء النظام', sublabel: 'System Admins', icon: '🛡️', iconComponent: Users, category: 'SECURITY' },
    internalRequests: { color: '#0ea5e9', bg: '#f0f9ff', label: 'الطلبات الداخلية والمستقلة', sublabel: 'Inter-Dept Requests', icon: '⇄', iconComponent: ArrowLeftRight, category: 'SYSTEMS' },
    simulator: { color: '#f59e0b', bg: '#fef3c7', label: 'محاكي بيئة العمل', sublabel: 'Impersonation Testing', icon: '🎭', iconComponent: Sparkles, category: 'POLICIES' }
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
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

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
  const { mode } = useThemeEngine();
  const isDark = mode === 'dark';
  const isMobile = useMobileViewport(840);

  const [orgTree, setOrgTree] = useState<OrgNode>(() => {
    try { const s = localStorage.getItem('litc_org_tree'); return s ? JSON.parse(s) : initialOrgTree; } catch { return initialOrgTree; }
  });

  const isServerLoaded = useRef(false);

  useEffect(() => {
    AdminAPI.getInstitutionalTree()
      .then(res => {
        const loadedTree = res?.tree || (res?.id ? res : null);
        if (loadedTree) {
          isServerLoaded.current = true;
          setOrgTree(loadedTree);
          localStorage.setItem('litc_org_tree', JSON.stringify(loadedTree));
        }
      })
      .catch(err => console.error('Failed to load server institutional tree:', err));
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ui' | 'operations' | 'security' | 'policies' | 'routing' | 'uecpHub' | 'identityHub' | 'institutional' | 'admins' | 'simulator' | 'internalRequests'>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const tabParam = p.get('tab') as any;
      if (tabParam && ['overview', 'analytics', 'ui', 'operations', 'security', 'policies', 'routing', 'uecpHub', 'identityHub', 'institutional', 'admins', 'simulator', 'internalRequests'].includes(tabParam)) {
        return tabParam;
      }
    } catch {}
    return 'overview';
  });

  const [analyticsSubView, setAnalyticsSubView] = useState<'analytics' | 'governance'>('analytics');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const mobileTabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectStyles(); }, []);

  // Auto-scroll active tab into view in the mobile bottom bar
  useEffect(() => {
    if (mobileTabsScrollRef.current) {
      const activeBtn = mobileTabsScrollRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const isAdmin = user && (
    ['system_director', 'super_admin', 'co_admin', 'System_Admin', 'SYSTEM_ADMIN'].includes((user as any).role?.name || user.role) ||
    (user as any).roleId === 1 || 
    (user as any).roleId === 22 || user.email === 'admin@litc.ly' || user.email === 'majdi.alzarrouk@litc.ly'
  );

  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', padding: '24px', fontFamily: APPLE.font, direction: dir
      }}>
        <div style={{
          background: isDark ? 'rgba(18, 22, 29, 0.95)' : APPLE.surface,
          borderRadius: APPLE.radiusXl,
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : `1px solid ${APPLE.separator}`,
          boxShadow: APPLE.shadow,
          padding: '48px', textAlign: 'center', maxWidth: '480px', width: '100%',
          color: isDark ? '#f8fafc' : APPLE.text
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>
            {t('access.denied.title')}
          </h2>
          <p style={{ fontSize: '14px', color: isDark ? '#94a3b8' : APPLE.textSecondary, margin: 0, lineHeight: '1.6' }}>
            {t('access.denied.msg')}
          </p>
        </div>
      </div>
    );
  }

  const TAB_KEYS: Array<'overview' | 'analytics' | 'ui' | 'operations' | 'security' | 'policies' | 'routing' | 'uecpHub' | 'identityHub' | 'institutional' | 'admins' | 'simulator' | 'internalRequests'> = [
    'overview', 'analytics',
    'ui', 'operations', 'security', 'policies', 'routing',
    'uecpHub', 'identityHub', 'institutional', 'admins', 'simulator', 'internalRequests'
  ];

  const handleTabSwitch = (tabId: typeof activeTab) => {
    if (tabId === activeTab) {
      setIsMobileDrawerOpen(false);
      return;
    }
    setIsTransitioning(true);
    setIsMobileDrawerOpen(false);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
    }, 180);
  };

  const currentBg = isDark
    ? 'radial-gradient(circle at 50% 0%, #161920 0%, #0c0e12 60%, #07080a 100%)'
    : 'radial-gradient(ellipse at 50% -10%, #ffffff 0%, #f5f7fa 50%, #eaedf3 100%)';

  return (
    <div style={{
      background: currentBg,
      minHeight: '100vh',
      fontFamily: APPLE.font,
      direction: dir,
      position: 'relative',
      overflow: 'hidden',
      color: isDark ? '#f8fafc' : APPLE.text
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
          background: 'transparent'
        }}>

          {/* Content Area */}
          <div
            className="admin-main-content admin-scroll"
            style={{
              flex: 1,
              padding: isMobile ? '14px 12px 90px 12px' : '28px 28px 110px',
              overflowY: 'auto',
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(6px)' : undefined,
              transition: 'opacity 0.18s ease, transform 0.18s ease',
              animation: !isTransitioning ? 'appleReveal 0.25s cubic-bezier(0.28, 0.11, 0.32, 1)' : 'none',
              maxWidth: '1440px',
              margin: '0 auto',
              width: '100%'
            }}
          >
            {activeTab === 'overview' && <SystemOverviewTab />}
            {activeTab === 'analytics' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                  padding: '4px',
                  borderRadius: '14px',
                  width: 'fit-content',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={() => setAnalyticsSubView('analytics')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: analyticsSubView === 'analytics' ? (isDark ? '#0284c7' : '#fff') : 'transparent',
                      color: analyticsSubView === 'analytics' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                      boxShadow: analyticsSubView === 'analytics' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    محرك التحليلات والمقارنة الذكي
                  </button>
                  <button
                    onClick={() => setAnalyticsSubView('governance')}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: analyticsSubView === 'governance' ? (isDark ? '#0284c7' : '#fff') : 'transparent',
                      color: analyticsSubView === 'governance' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                      boxShadow: analyticsSubView === 'governance' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    حوكمة الصلاحيات العابرة للإدارات
                  </button>
                </div>
                {analyticsSubView === 'analytics' ? <DynamicFormAwareAnalytics /> : <AnalyticsGovernanceSubTab />}
              </div>
            )}
            {activeTab === 'ui' && <UILayoutEngineTab onNavigateToTab={handleTabSwitch} />}
            {activeTab === 'operations' && <OperationalStructureTab orgTree={orgTree} />}
            
            {activeTab === 'security' && <SecurityControlTab />}
            {activeTab === 'policies' && <NotificationPolicyConsole />}
            {activeTab === 'routing' && <TicketRoutingTab />}
            {activeTab === 'uecpHub' && <ExternalSystemsTab />}
            {activeTab === 'identityHub' && <IdentityHubTab />}
            {activeTab === 'institutional' && <InstitutionalStructureTab orgTree={orgTree} setOrgTree={setOrgTree} />}
            {activeTab === 'admins' && <SystemAdminsTab />}
            {activeTab === 'simulator' && <RoleSimulatorTab />}
            {activeTab === 'internalRequests' && <InternalRequestsGovernanceTab />}
          </div>
        </main>
      </div>

      {/* ── 💻 1. DESKTOP FLOATING DOCK TASKBAR (macOS-inspired, Center Dock) ── */}
      {!isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: isDark ? 'rgba(14, 18, 25, 0.88)' : 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            borderRadius: '24px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: isDark
              ? '0 16px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
            zIndex: 8000,
            animation: 'appleReveal 0.4s cubic-bezier(0.28, 0.11, 0.32, 1)',
            direction: 'rtl'
          }}
        >
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
                  color: isActive ? '#fff' : (isDark ? '#cbd5e1' : cfg.color),
                  fontSize: '18px',
                  fontWeight: '700',
                  transition: 'all 0.22s cubic-bezier(0.28, 0.11, 0.32, 1)',
                  transform: isActive ? 'translateY(-4px) scale(1.08)' : 'translateY(0) scale(1)',
                  boxShadow: isActive ? `0 6px 20px ${cfg.color}50` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : `${cfg.color}15`;
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
                <span style={{ fontSize: '8px', fontWeight: '700', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '48px' }}>
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
      )}

      {/* ── 📱 2. MOBILE THUMB-ZONE BOTTOM NAVIGATION BAR (شريط أقسام الإدارة السفلي) ── */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '58px',
            background: isDark ? 'rgba(12, 16, 23, 0.95)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(30px) saturate(200%)',
            WebkitBackdropFilter: 'blur(30px) saturate(200%)',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.18)',
            zIndex: 92000,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px calc(env(safe-area-inset-bottom, 0px) + 2px)',
            gap: '6px',
            direction: 'rtl',
            boxSizing: 'border-box'
          }}
        >
          {/* Quick Drawer Button (أقسام الإدارة) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(prev => !prev)}
            title="الأقسام الإدارية الشاملة"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '6px 10px',
              borderRadius: '12px',
              border: isMobileDrawerOpen 
                ? '1.5px solid #f36c21' 
                : (isDark ? '1px solid rgba(243, 108, 33, 0.35)' : '1px solid rgba(243, 108, 33, 0.3)'),
              background: isMobileDrawerOpen 
                ? 'linear-gradient(135deg, #f36c21 0%, #ea580c 100%)' 
                : (isDark ? 'rgba(243, 108, 33, 0.14)' : 'rgba(243, 108, 33, 0.1)'),
              color: isMobileDrawerOpen ? '#ffffff' : (isDark ? '#fb923c' : '#ea580c'),
              cursor: 'pointer',
              flexShrink: 0,
              height: '46px',
              transition: 'all 0.2s ease',
              boxShadow: isMobileDrawerOpen ? '0 3px 12px rgba(243, 108, 33, 0.35)' : 'none'
            }}
          >
            <Grid size={16} strokeWidth={2.4} />
            <span style={{ fontSize: '9.5px', fontWeight: 800, whiteSpace: 'nowrap' }}>الأقسام</span>
          </button>

          {/* Separator Line */}
          <div style={{ width: '1px', height: '28px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

          {/* Horizontal Momentum Scrollable Tabs Strip with edge fading */}
          <div
            ref={mobileTabsScrollRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              flex: 1,
              padding: '2px 4px',
              maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)'
            }}
          >
            {TAB_KEYS.map((tabId) => {
              const cfg = APPLE.tabs[tabId];
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => handleTabSwitch(tabId)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    border: isActive 
                      ? `1.5px solid ${cfg.color}` 
                      : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'),
                    background: isActive 
                      ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)` 
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                    color: isActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                    fontSize: '11.5px',
                    fontWeight: isActive ? 800 : 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    height: '38px',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 3px 12px ${cfg.color}35` : 'none',
                    transition: 'all 0.18s cubic-bezier(0.28, 0.11, 0.32, 1)'
                  }}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── 📱 3. MOBILE CATEGORIZED ADMIN LAUNCHER DRAWER (لوحة الأقسام الشاملة) ── */}
      <AnimatePresence>
        {isMobileDrawerOpen && isMobile && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99998,
              background: isDark ? 'rgba(7, 9, 12, 0.75)' : 'rgba(15, 23, 42, 0.38)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              direction: 'rtl'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileDrawerOpen(false);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                width: '100%',
                maxHeight: '84vh',
                background: isDark ? 'rgba(16, 20, 28, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -12px 50px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Drag Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                <div style={{ width: '42px', height: '4px', borderRadius: '999px', background: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.15)' }} />
              </div>

              {/* Drawer Header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f36c21 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}>
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                      أقسام إدارة وحوكمة النظام
                    </h3>
                    <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      اختر القسم المطلوب للانتقال الفوري
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                    color: isDark ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content (Categorized Cards Grid) */}
              <div style={{ padding: '16px 18px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  {
                    title: 'العمليات والتحكم المركزي',
                    color: '#007AFF',
                    tabs: ['overview', 'analytics', 'operations'] as const
                  },
                  {
                    title: 'الأنظمة والواجهات والتكامل',
                    color: '#135d79',
                    tabs: ['ui', 'routing', 'uecpHub', 'internalRequests'] as const
                  },
                  {
                    title: 'الأمان وحوكمة الهوية',
                    color: '#FF3B30',
                    tabs: ['security', 'identityHub', 'admins'] as const
                  },
                  {
                    title: 'البيئة المؤسسية والتجربة',
                    color: '#8B5CF6',
                    tabs: ['institutional', 'policies', 'simulator'] as const
                  }
                ].map((cat, catIdx) => (
                  <div key={catIdx}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '12px', borderRadius: '2px', background: cat.color }} />
                      <span>{cat.title}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                      {cat.tabs.map((tabId) => {
                        const cfg = APPLE.tabs[tabId];
                        const isCurrent = activeTab === tabId;
                        return (
                          <div
                            key={tabId}
                            onClick={() => handleTabSwitch(tabId)}
                            style={{
                              padding: '12px',
                              borderRadius: '14px',
                              background: isCurrent
                                ? (isDark ? `${cfg.color}25` : `${cfg.color}15`)
                                : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                              border: isCurrent
                                ? `1.5px solid ${cfg.color}`
                                : (isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(0, 0, 0, 0.06)'),
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'all 0.18s ease'
                            }}
                          >
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              background: isCurrent ? cfg.color : (isDark ? 'rgba(255,255,255,0.06)' : `${cfg.color}12`),
                              color: isCurrent ? '#ffffff' : cfg.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '15px',
                              flexShrink: 0
                            }}>
                              {cfg.icon}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{
                                fontSize: '12.5px',
                                fontWeight: 800,
                                color: isCurrent ? cfg.color : (isDark ? '#f8fafc' : '#0f172a'),
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {cfg.label}
                              </div>
                              <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cfg.sublabel}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
