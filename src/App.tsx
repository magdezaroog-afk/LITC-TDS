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
import { Sun, Moon, Search, Plus } from 'lucide-react';
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

  return (
    <header
      style={{
        position: 'fixed',
        top: '12px',
        left: 0,
        right: 0,
        zIndex: 95000,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 20px',
        pointerEvents: 'none',
      }}
    >
      <nav
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '1440px',
          height: '56px',
          borderRadius: '16px',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          backgroundColor: isDark ? 'rgba(11, 20, 31, 0.78)' : 'rgba(255, 255, 255, 0.86)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.14)',
          boxShadow: isDark
            ? '0 16px 36px -8px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            : '0 12px 30px -8px rgba(19, 93, 121, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          direction: dir,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        {/* ── ZONE 1: Institutional Brand & Compact Search ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <NexusTdsBrand
              variant="horizontal"
              theme={isDark ? 'dark' : 'light'}
              size="sm"
              showSubtitle={true}
            />
          </Link>

          {/* Micro Divider */}
          <div style={{ width: '1px', height: '22px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 93, 121, 0.12)' }} />

          {/* Sleek Compact Search Bar */}
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
        </div>

        {/* ── ZONE 2: Central Mode Capsule ── */}
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
          {/* رابط بوابة الموظف */}
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

          {/* رابط مود العمل التشغيلي */}
          {(['super_admin', 'system_director', 'co_admin', 'tech_director', 'dept_head', 'team_leader', 'operational_user', 'OPERATIONAL_USER'].includes(user?.role || '') || user?.email === 'admin@litc.ly' || hasOpsInterface) && (
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

          {/* رابط لوحة تحكم النظام */}
          {(['super_admin', 'system_director', 'co_admin'].includes(user?.role || '') || user?.email === 'admin@litc.ly') && (
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

        {/* ── ZONE 3: Utility Controls & Profile Dropdown ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* تبديل اللغة */}
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
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 93, 121, 0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(19, 93, 121, 0.05)';
            }}
          >
            <span>🌐</span>
            <span>{language === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* تبديل الثيم الداكن / الفاتح */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(19, 93, 121, 0.05)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(19, 93, 121, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDark ? '#f36c21' : '#135d79',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(243, 108, 33, 0.15)' : 'rgba(19, 93, 121, 0.12)';
              e.currentTarget.style.transform = 'scale(1.05) rotate(15deg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(19, 93, 121, 0.05)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* الإشعارات */}
          <NotificationBell />

          {/* Micro Divider */}
          <div style={{ width: '1px', height: '22px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(19, 93, 121, 0.12)', margin: '0 2px' }} />

          {/* الملف الشخصي المؤسسي */}
          <UnifiedProfileDropdown currentUserRole={user?.role || 'EMPLOYEE'} />
        </div>
      </nav>
    </header>
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
  const isMobile = useMobileViewport();
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

  const isFunctionalWorkspaceRoute = location.pathname.startsWith('/hub') || 
    ['/requests', '/challenges', '/directory', '/healthcare', '/profile', '/settings', '/employee'].some(p => location.pathname.startsWith(p));

  if (isMobile && !isFunctionalWorkspaceRoute && systemMode !== 'employee') {
    return (
      <>
        <MobileShell />
        <NeonSignalToast />
      </>
    );
  }

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
          minHeight: 'calc(100vh - 94px)', 
          paddingTop: '94px' 
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
