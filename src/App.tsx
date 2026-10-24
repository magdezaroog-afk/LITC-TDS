/**
 * LITC-TS v43.5 - Main Entry Point
 * نقطة الدخول المركزية المحدثة لتدعم نظام التوجيه والواجهات.
 */

import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './engine/ui-loader/ThemeProvider';
import { AuthProvider, useAuth } from './engine/auth/AuthContext';
import { UnifiedSmartAnalytics } from './components/analytics/UnifiedSmartAnalytics';
import { AdminGovernanceConsole } from './pages/admin/AdminGovernanceConsole';
import { AdminDashboardShell } from './pages/admin/AdminDashboardShell';
import FunctionalWorkspace from './functional_ui/App';
import { WorkModeShell } from './functional_ui/pages/ops/WorkModeShell';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

import { NeonSignalToast } from './components/notifications/NeonSignalToast';
import { UnifiedProfileDropdown } from './components/infrastructure/UnifiedProfileDropdown';
import { Login } from './pages/auth/Login';
import { NotificationBell } from './components/infrastructure/NotificationBell';
import { useMobileViewport } from './mobile/hooks/useMobileViewport';
import { MobileShell } from './mobile/MobileShell';
import { LanguageProvider, useLanguage } from './engine/ui-loader/LanguageContext';
import { Sun, Moon, Search, Plus, Menu, X, Building2, Shield, Zap, ChevronLeft, LogOut, Layers } from 'lucide-react';
import { NexusTdsBrand } from './components/brand/NexusTdsBrand';
import { OperationalEntitiesConsole } from './pages/admin/OperationalEntitiesConsole';
import { NotificationPolicyConsole } from './pages/admin/NotificationPolicyConsole';
import { SecurityControlTab } from './pages/admin/tabs/SecurityControlTab';



// Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>جاري التحقق من الهوية...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role) && !allowedRoles.includes('ANY')) {
    // Redirect if they have insufficient permissions
    if (['super_admin', 'co_admin'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    } else if (['dept_head', 'tech_director', 'team_leader'].includes(user.role)) {
      return <Navigate to="/head" replace />;
    } else {
      return <Navigate to="/employee" replace />;
    }
  }

  return <>{children}</>;
};

// Workspace Wrapper Component (incorporates ProtectedRoute & Mode Isolation)
const WorkspaceWrapper: React.FC<{ children: React.ReactNode; allowedRoles: string[]; isEmployeeRoute?: boolean }> = ({ children, allowedRoles, isEmployeeRoute }) => {
  const { user, loading, systemMode } = useAuth();

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>جاري التحقق من الهوية...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (systemMode === 'employee') {
    return <FunctionalWorkspace />;
  }

  if (isEmployeeRoute) {
    return <WorkModeShell />;
  }

  if (!allowedRoles.includes(user.role) && !allowedRoles.includes('ANY')) {
    if (['super_admin', 'co_admin'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/employee" replace />;
    }
  }

  return <>{children}</>;
};

// 404 Glassmorphism Page
const NotFoundPage: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      textAlign: 'center' 
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '50px',
        boxShadow: '0 8px 32px rgba(0, 229, 255, 0.1)'
      }}>
        <h1 style={{ fontSize: '80px', margin: '0', color: '#00e5ff', textShadow: '0 0 20px rgba(0, 229, 255, 0.5)' }}>404</h1>
        <h2 style={{ color: '#fff', marginBottom: '20px' }}>الصفحة غير موجودة</h2>
        <p style={{ color: '#aaa', marginBottom: '30px' }}>المسار الذي تحاول الوصول إليه غير متوفر أو ليس لديك صلاحية.</p>
        <Link to="/" style={{
          padding: '12px 24px',
          background: 'linear-gradient(90deg, #00e5ff 0%, #0077ff 100%)',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          transition: 'all 0.3s'
        }}>العودة للرئيسية</Link>
      </div>
    </div>
  );
};

// Floating Island Top Navigation Bar
const Navigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, toggleLanguage, language, dir } = useLanguage();
  
  const [hasOpsInterface, setHasOpsInterface] = React.useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('litc_theme') === 'dark' ||
        localStorage.getItem('litc_theme_mode') === 'dark'
      );
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => {
      const dark =
        document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') && localStorage.getItem('litc_theme') === 'dark');
      setIsDark(dark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (user?.id) {
      const token = localStorage.getItem('litc_token') || localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(`/api/v1/org/users/${user.id}/interface`, { 
        credentials: 'include',
        headers
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.interface) {
            const type = res.interface.interfaceType || res.interface.meta?.interfaceType;
            if (type === 'OPERATIONAL' || type === 'LEADERSHIP') {
              setHasOpsInterface(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('litc_theme', next ? 'dark' : 'light');
    localStorage.setItem('litc_theme_mode', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const isEmployeeActive = location.pathname.startsWith('/hub') || 
    location.pathname === '/' || 
    ['/requests', '/challenges', '/directory', '/healthcare', '/profile', '/settings'].some(p => location.pathname.startsWith(p));
  const isOpsActive = location.pathname.startsWith('/ops');
  const isAdminActive = location.pathname.startsWith('/admin');

  // Dynamic mobile viewport detection
  const [isMobileScreen, setIsMobileScreen] = React.useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 840 : false
  );
  const [isDrawerOpen, setIsDrawerOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 840);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close drawer on route change
  React.useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const canAccessOps = ['super_admin', 'system_director', 'co_admin', 'tech_director', 'dept_head', 'team_leader', 'operational_user', 'OPERATIONAL_USER'].includes(user?.role || '') || user?.email === 'admin@litc.ly' || hasOpsInterface;
  const canAccessAdmin = ['super_admin', 'system_director', 'co_admin'].includes(user?.role || '') || user?.email === 'admin@litc.ly';

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          1. TOP APP BAR (DESKTOP FLOATING ISLAND / MOBILE SLIM BAR)
          ══════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: 'fixed',
          top: isMobileScreen ? '0' : '12px',
          left: 0,
          right: 0,
          zIndex: 95000,
          display: 'flex',
          justifyContent: 'center',
          padding: isMobileScreen ? '0' : '0 20px',
          pointerEvents: 'none',
        }}
      >
        <nav
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '1440px',
            height: isMobileScreen ? '54px' : '56px',
            borderRadius: isMobileScreen ? '0 0 16px 16px' : '16px',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            backgroundColor: isDark ? 'rgba(11, 20, 31, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(19, 93, 121, 0.15)',
            borderLeft: isMobileScreen ? 'none' : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.14)'),
            borderRight: isMobileScreen ? 'none' : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.14)'),
            borderTop: isMobileScreen ? 'none' : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.14)'),
            boxShadow: isDark
              ? '0 16px 36px -8px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              : '0 12px 30px -8px rgba(19, 93, 121, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobileScreen ? '0 12px' : '0 16px',
            direction: dir,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}
        >
          {/* ── ZONE 1: Brand & Search ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobileScreen ? '8px' : '14px', flexShrink: 0 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <NexusTdsBrand
                variant="horizontal"
                theme={isDark ? 'dark' : 'light'}
                size="sm"
                showSubtitle={!isMobileScreen}
              />
            </Link>

            {/* Desktop Search Bar */}
            {!isMobileScreen && (
              <>
                <div style={{ width: '1px', height: '22px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 93, 121, 0.12)' }} />
                <div 
                  style={{ 
                    position: 'relative', 
                    display: 'flex', 
                    alignItems: 'center',
                    width: isSearchFocused ? '240px' : '180px',
                    transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder={language === 'ar' ? 'بحث سريع عن تذكرة...' : 'Quick search...'}
                    style={{
                      width: '100%',
                      padding: dir === 'rtl' ? '6px 32px 6px 12px' : '6px 12px 6px 32px',
                      borderRadius: '12px',
                      border: isSearchFocused 
                        ? '1px solid #f36c21' 
                        : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.12)'),
                      backgroundColor: isSearchFocused
                        ? (isDark ? 'rgba(11, 20, 31, 0.95)' : '#ffffff')
                        : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 93, 121, 0.03)'),
                      boxShadow: isSearchFocused ? '0 0 0 3px rgba(243, 108, 33, 0.15)' : 'none',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '12px',
                      fontFamily: "'Cairo', sans-serif",
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Search 
                    size={14} 
                    style={{ 
                      position: 'absolute', 
                      [dir === 'rtl' ? 'right' : 'left']: '10px', 
                      color: isSearchFocused ? '#f36c21' : (isDark ? '#94a3b8' : '#135d79'), 
                      pointerEvents: 'none',
                      transition: 'color 0.2s ease'
                    }} 
                  />
                </div>
              </>
            )}
          </div>

          {/* ── ZONE 2: Central Mode Capsule (Desktop only) ── */}
          {!isMobileScreen && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px',
                borderRadius: '12px',
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(19, 93, 121, 0.04)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(19, 93, 121, 0.08)',
              }}
            >
              <Link
                to="/hub"
                style={{
                  background: isEmployeeActive
                    ? (isDark ? 'linear-gradient(135deg, #135d79 0%, #1a7597 100%)' : '#ffffff')
                    : 'transparent',
                  color: isEmployeeActive
                    ? (isDark ? '#ffffff' : '#135d79')
                    : (isDark ? '#94a3b8' : '#64748b'),
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: isEmployeeActive ? 800 : 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isEmployeeActive
                    ? (isDark ? '0 2px 10px rgba(19, 93, 121, 0.4)' : '0 2px 6px rgba(19, 93, 121, 0.12)')
                    : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                <span>🏢 بوابة الموظف</span>
              </Link>

              {canAccessOps && (
                <Link
                  to="/ops"
                  style={{
                    background: isOpsActive
                      ? (isDark ? 'linear-gradient(135deg, #f36c21 0%, #ea580c 100%)' : '#ffffff')
                      : 'transparent',
                    color: isOpsActive
                      ? (isDark ? '#ffffff' : '#f36c21')
                      : (isDark ? '#94a3b8' : '#64748b'),
                    textDecoration: 'none',
                    padding: '6px 14px',
                    borderRadius: '9px',
                    fontSize: '12px',
                    fontWeight: isOpsActive ? 800 : 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isOpsActive
                      ? (isDark ? '0 2px 10px rgba(243, 108, 33, 0.4)' : '0 2px 6px rgba(243, 108, 33, 0.15)')
                      : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontFamily: "'Cairo', sans-serif"
                  }}
                >
                  <span>🚀 مود العمل (العمليات)</span>
                </Link>
              )}

              {canAccessAdmin && (
                <Link
                  to="/admin"
                  style={{
                    background: isAdminActive
                      ? (isDark ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff')
                      : 'transparent',
                    color: isAdminActive
                      ? (isDark ? '#ffffff' : '#0284c7')
                      : (isDark ? '#94a3b8' : '#64748b'),
                    textDecoration: 'none',
                    padding: '6px 14px',
                    borderRadius: '9px',
                    fontSize: '12px',
                    fontWeight: isAdminActive ? 800 : 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isAdminActive
                      ? (isDark ? '0 2px 10px rgba(2, 132, 199, 0.4)' : '0 2px 6px rgba(2, 132, 199, 0.12)')
                      : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontFamily: "'Cairo', sans-serif"
                  }}
                >
                  <span>🛡️ لوحة تحكم النظام</span>
                </Link>
              )}
            </div>
          )}

          {/* ── ZONE 3: Utility Controls & Profile / Hamburger ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobileScreen ? '6px' : '8px', flexShrink: 0 }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(19, 93, 121, 0.05)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isDark ? '#f36c21' : '#135d79',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0,
              }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Desktop Full Controls */}
            {!isMobileScreen ? (
              <>
                <button
                  onClick={toggleLanguage}
                  title="تغيير لغة العرض"
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(19, 93, 121, 0.05)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.12)',
                    color: isDark ? '#e2e8f0' : '#135d79',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.18s ease',
                    fontFamily: "'Cairo', sans-serif"
                  }}
                >
                  <span>🌐</span>
                  <span>{language === 'ar' ? 'English' : 'عربي'}</span>
                </button>
                <div style={{ width: '1px', height: '22px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 93, 121, 0.12)', margin: '0 2px' }} />
                <UnifiedProfileDropdown currentUserRole={user?.role || 'EMPLOYEE'} />
              </>
            ) : (
              /* Mobile Hamburger Menu Button */
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  backgroundColor: isDrawerOpen ? '#f36c21' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 93, 121, 0.08)'),
                  border: `1px solid ${isDrawerOpen ? '#f36c21' : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(19, 93, 121, 0.18)')}`,
                  color: isDrawerOpen ? '#ffffff' : (isDark ? '#f8fafc' : '#135d79'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                {isDrawerOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════════════
          2. SLIDE-OVER EXECUTIVE DRAWER FOR MOBILE (درج التنقل القيادي)
          ══════════════════════════════════════════════════════════ */}
      {isMobileScreen && isDrawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
          <aside className="mobile-drawer-panel" dir={dir}>
            {/* Header: User Info & Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #135d79 0%, #f36c21 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '15px'
                }}>
                  {((user as any)?.fullName || (user as any)?.name || user?.email || 'U').charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{(user as any)?.fullName || (user as any)?.name || user?.email || 'المستخدم'}</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{user?.role || 'EMPLOYEE'}</div>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                بيئات ومودات العمل
              </div>

              {/* 1. Employee Portal (الواجهة الوظيفية) */}
              <Link
                to="/hub"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isEmployeeActive
                    ? (isDark ? 'linear-gradient(135deg, rgba(19, 93, 121, 0.4) 0%, rgba(56, 189, 248, 0.15) 100%)' : 'rgba(19, 93, 121, 0.08)')
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1.5px solid ${isEmployeeActive ? '#135d79' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: isEmployeeActive ? (isDark ? '#38bdf8' : '#135d79') : '#e2e8f0',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🏢</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>بوابة الموظف (الواجهة الوظيفية)</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>تقديم ومتابعة كافة الطلبات والخدمات</div>
                  </div>
                </div>
                {isEmployeeActive ? (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#135d79', color: '#ffffff', fontWeight: 700 }}>
                    الحالية
                  </span>
                ) : (
                  <ChevronLeft size={16} />
                )}
              </Link>

              {/* 2. Ops Mode (إدارة العمليات) */}
              {canAccessOps && (
                <Link
                  to="/ops"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isOpsActive
                      ? (isDark ? 'linear-gradient(135deg, rgba(243, 108, 33, 0.35) 0%, rgba(234, 88, 12, 0.15) 100%)' : 'rgba(243, 108, 33, 0.08)')
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1.5px solid ${isOpsActive ? '#f36c21' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: isOpsActive ? '#fb923c' : '#e2e8f0',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(243, 108, 33, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f36c21'
                    }}>
                      <Layers size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800 }}>طابور وإدارة العمليات</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>معالجة التذاكر وتعيين المهام التشغيلية</div>
                    </div>
                  </div>
                  {isOpsActive ? (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#f36c21', color: '#ffffff', fontWeight: 700 }}>
                      الحالية
                    </span>
                  ) : (
                    <ChevronLeft size={16} />
                  )}
                </Link>
              )}

              {/* 3. Admin Mode (لوحة الإدارة) */}
              {canAccessAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isAdminActive
                      ? (isDark ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(3, 105, 161, 0.15) 100%)' : 'rgba(2, 132, 199, 0.08)')
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1.5px solid ${isAdminActive ? '#0284c7' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: isAdminActive ? '#38bdf8' : '#e2e8f0',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🛡️</span>
                    <div>
                      <div style={{ fontWeight: 800 }}>لوحة إدارة النظام والحوكمة</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>إعدادات المسارات، الهياكل، والمستدلات</div>
                    </div>
                  </div>
                  {isAdminActive ? (
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 700 }}>
                      الحالية
                    </span>
                  ) : (
                    <ChevronLeft size={16} />
                  )}
                </Link>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={toggleLanguage}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <span>🌐 لغة الواجهة</span>
                <span style={{ fontWeight: 800, color: '#38bdf8' }}>{language === 'ar' ? 'العربية' : 'English'}</span>
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('litc_token');
                  sessionStorage.removeItem('litc_token');
                  window.location.href = '/login';
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          3. PURE FLOATING EXECUTIVE MENU PILL (زر القائمة المميز بثلاث شرطات أسفل يمين الشاشة)
          ══════════════════════════════════════════════════════════ */}
      {isMobileScreen && (
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          title="القائمة وبيئات العمل"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '16px',
            zIndex: 94000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px 8px 12px',
            borderRadius: '9999px',
            backgroundColor: isDark ? 'rgba(11, 20, 31, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: isDark ? '1.5px solid rgba(56, 189, 248, 0.35)' : '1.5px solid rgba(19, 93, 121, 0.25)',
            boxShadow: isDark
              ? '0 10px 30px -4px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.18)'
              : '0 8px 24px -4px rgba(19, 93, 121, 0.18), 0 2px 6px rgba(0, 0, 0, 0.05)',
            color: isDark ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            fontFamily: "'Cairo', sans-serif",
            fontSize: '12.5px',
            fontWeight: 800,
            outline: 'none',
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Animated 3 Stripes (المميز بثلاث شرطات) */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(19, 93, 121, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#38bdf8' : '#135d79',
            }}
          >
            <Menu size={18} strokeWidth={2.4} />
          </div>
          <span>المزيد</span>
        </button>
      )}
    </>
  );
};

const UniversalWorkspaceRouter: React.FC<{ user: any, systemMode: string }> = ({ user, systemMode }) => {
  const role = user?.role;
  
  if (!user) return <Navigate to="/login" replace />;

  if (systemMode === 'employee' && !['system_director', 'super_admin', 'co_admin'].includes(role)) {
    return <Navigate to="/hub" replace />;
  }

  const wrapperStyle = {
    animation: 'fadeIn 0.4s ease-in-out',
    width: '100%',
    height: '100%'
  };

  switch (role) {
    case 'system_director':
      return <div key={role} style={wrapperStyle}><AdminDashboardShell /></div>;
    case 'super_admin':
    case 'co_admin':
      return <div key={role} style={wrapperStyle}><AdminGovernanceConsole /></div>;
    case 'tech_director':
    case 'dept_head':
    case 'team_leader':
    case 'operational_user':
    case 'employee':
    default:
      // Operational Roles -> Load WorkModeShell!
      return <div key={role} style={wrapperStyle}><WorkModeShell /></div>;
  }
};

const AppContent: React.FC = () => {
  const { user, systemMode } = useAuth();
  const location = useLocation();

  const [isDark, setIsDark] = React.useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('litc_theme') === 'dark' ||
        localStorage.getItem('litc_theme_mode') === 'dark'
      );
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => {
      const dark =
        document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') && localStorage.getItem('litc_theme') === 'dark');
      setIsDark(dark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [isMobileScreen, setIsMobileScreen] = React.useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 840 : false
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobileScreen(window.innerWidth < 840);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLoginPage = location.pathname === '/login';

  // If we are on the login page or not logged in, render ONLY login page
  if (isLoginPage || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <NeonSignalToast />
      </div>
    );
  }

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: isDark ? '#080e18' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        transition: 'background-color 0.25s ease'
      }}
    >
      <Navigation />
      <NeonSignalToast />
      
      <div 
        className="app-content-layer"
        style={{ 
          flex: 1, 
          padding: 0, 
          minHeight: isMobileScreen ? 'calc(100vh - 58px)' : 'calc(100vh - 74px)', 
          paddingTop: isMobileScreen ? '58px' : '74px' 
        }}>
        <Routes>
          <Route path="/hub/*" element={<FunctionalWorkspace />} />
          <Route path="/requests/*" element={<FunctionalWorkspace />} />
          <Route path="/challenges/*" element={<FunctionalWorkspace />} />
          <Route path="/directory/*" element={<FunctionalWorkspace />} />
          <Route path="/healthcare/*" element={<FunctionalWorkspace />} />
          <Route path="/profile/*" element={<FunctionalWorkspace />} />
          <Route path="/settings/*" element={<FunctionalWorkspace />} />
          <Route path="/admin/*" element={<AdminDashboardShell />} />
          <Route path="/ops/*" element={<WorkModeShell />} />
          <Route path="/" element={<UniversalWorkspaceRouter user={user} systemMode={systemMode} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
