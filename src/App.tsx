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
import { Sun, Moon } from 'lucide-react';
import litcLogo from './functional_ui/assets/litc_palm_transparent.png';
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

// A simple navigation bar
const Navigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, toggleLanguage, language, dir } = useLanguage();
  
  const [branding, setBranding] = React.useState<{ orgName: string; orgLogo: string | null }>({
    orgName: 'TdS',
    orgLogo: null
  });
  const [hasOpsInterface, setHasOpsInterface] = React.useState<boolean>(false);
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
      fetch(`/api/v1/org/users/${user.id}/interface`, { credentials: 'include' })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.interface && res.interface.meta) {
            const type = res.interface.meta.interfaceType;
            // Only show Work Mode if they have an OPERATIONAL or LEADERSHIP interface assigned
            if (type === 'OPERATIONAL' || type === 'LEADERSHIP') {
              setHasOpsInterface(true);
            }
          }
        })
        .catch(() => {});
    }
    fetch('/api/v1/branding', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data) {
          const payload = data.branding || data.config || data;
          if (payload.orgName || payload.orgLogo) {
            setBranding({
              orgName: payload.orgName || 'TdS',
              orgLogo: payload.orgLogo || null
            });
          }
        }
      })
      .catch(() => {});

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setBranding({
          orgName: e.detail.orgName || 'TdS',
          orgLogo: e.detail.orgLogo || null
        });
      }
    };
    window.addEventListener('litc_branding_updated', handleUpdate);
    return () => window.removeEventListener('litc_branding_updated', handleUpdate);
  }, []);

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '14px 32px',
    background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
    direction: dir,
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    boxSizing: 'border-box',
    height: '64px',
    zIndex: 95000,
    transition: 'background 0.25s ease, border-color 0.25s ease',
  };

  return (
    <nav style={navStyle}>
      {/* 1. الشعار والهوية (Logo & Brand Title) */}
      <div style={{ fontWeight: '800', [dir === 'rtl' ? 'marginRight' : 'marginLeft']: 'auto', color: isDark ? '#ffffff' : '#0f172a', fontSize: '16px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(30, 58, 82, 0.05)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(30, 58, 82, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          flexShrink: 0
        }}>
          <img 
            src={branding.orgLogo || litcLogo} 
            alt={branding.orgName} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ 
            background: isDark ? 'linear-gradient(135deg, #ffffff, #93c5fd)' : 'linear-gradient(135deg, #0f172a, #1e3a8a)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            fontSize: '17px', 
            fontWeight: '900', 
            letterSpacing: '-0.02em',
            fontFamily: "'Tajawal', 'Cairo', sans-serif"
          }}>
            TdS
          </span>
          <span style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '600', fontFamily: "'Cairo', sans-serif" }}>شركة الاتصالات الدولية الليبية • LITC</span>
        </div>
      </div>
      
      {/* 2. حاوية التبديل السلس بين المودات (Segmented Mode Switcher) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(15, 23, 42, 0.06)',
          padding: '4px',
          borderRadius: '10px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
        }}>
          {/* رابط بوابة الموظف */}
          <Link 
            to="/hub"
            style={{
              background: (location.pathname.startsWith('/hub') || location.pathname === '/' || ['/requests', '/challenges', '/directory', '/healthcare', '/profile', '/settings'].some(p => location.pathname.startsWith(p)))
                ? (isDark ? 'linear-gradient(135deg, #1e40af, #2563eb)' : '#ffffff') 
                : 'transparent',
              color: (location.pathname.startsWith('/hub') || location.pathname === '/' || ['/requests', '/challenges', '/directory', '/healthcare', '/profile', '/settings'].some(p => location.pathname.startsWith(p)))
                ? (isDark ? '#ffffff' : '#1e40af') 
                : (isDark ? '#94a3b8' : '#64748b'),
              textDecoration: 'none',
              padding: '6px 13px',
              borderRadius: '7px',
              fontSize: '12.5px',
              fontWeight: (location.pathname.startsWith('/hub') || location.pathname === '/' || ['/requests', '/challenges', '/directory', '/healthcare', '/profile', '/settings'].some(p => location.pathname.startsWith(p))) ? 800 : 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: (location.pathname.startsWith('/hub') || location.pathname === '/' || ['/requests', '/challenges', '/directory', '/healthcare', '/profile', '/settings'].some(p => location.pathname.startsWith(p)))
                ? (isDark ? '0 2px 8px rgba(37,99,235,0.4)' : '0 2px 6px rgba(0,0,0,0.06)')
                : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: "'Cairo', sans-serif"
            }}
          >
            <span>🏢 بوابة الموظف</span>
          </Link>

          {/* رابط مود العمل التشغيلي */}
          {(['super_admin', 'system_director', 'co_admin', 'tech_director', 'dept_head', 'team_leader'].includes(user?.role || '') || user?.email === 'admin@litc.ly' || hasOpsInterface) && (
            <Link 
              to="/ops"
              style={{
                background: location.pathname.startsWith('/ops') 
                  ? (isDark ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : '#ffffff') 
                  : 'transparent',
                color: location.pathname.startsWith('/ops') 
                  ? (isDark ? '#ffffff' : '#2563eb') 
                  : (isDark ? '#94a3b8' : '#64748b'),
                textDecoration: 'none',
                padding: '6px 13px',
                borderRadius: '7px',
                fontSize: '12.5px',
                fontWeight: location.pathname.startsWith('/ops') ? 800 : 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: location.pathname.startsWith('/ops') 
                  ? (isDark ? '0 2px 8px rgba(79,70,229,0.4)' : '0 2px 6px rgba(0,0,0,0.06)') 
                  : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              <span>🚀 مود العمل (العمليات)</span>
            </Link>
          )}

          {/* رابط لوحة تحكم النظام (Admin) */}
          {(['super_admin', 'system_director', 'co_admin'].includes(user?.role || '') || user?.email === 'admin@litc.ly') && (
            <Link 
              to="/admin"
              style={{
                background: location.pathname.startsWith('/admin') 
                  ? (isDark ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#ffffff') 
                  : 'transparent',
                color: location.pathname.startsWith('/admin') 
                  ? (isDark ? '#ffffff' : '#4f46e5') 
                  : (isDark ? '#94a3b8' : '#64748b'),
                textDecoration: 'none',
                padding: '6px 13px',
                borderRadius: '7px',
                fontSize: '12.5px',
                fontWeight: location.pathname.startsWith('/admin') ? 800 : 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: location.pathname.startsWith('/admin') 
                  ? (isDark ? '0 2px 8px rgba(124,58,237,0.4)' : '0 2px 6px rgba(0,0,0,0.06)') 
                  : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              <span>🛡️ لوحة تحكم النظام</span>
            </Link>
          )}
        </div>

        {/* زر تبديل اللغة */}
        <button 
          onClick={toggleLanguage}
          title="تغيير لغة العرض"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 82, 0.06)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(30, 58, 82, 0.15)',
            color: isDark ? '#c7d2fe' : '#1e3a52',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.18s ease',
            fontFamily: "'Cairo', sans-serif"
          }}
        >
          🌐 {language === 'ar' ? 'English' : 'عربي'}
        </button>

        {/* زر التبديل بين الوضع الفاتح والداكن (أيقونة فقط موحدة بجانب زر الإشعارات) */}
        <button 
          onClick={() => {
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
          }}
          title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 82, 0.06)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(30, 58, 82, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isDark ? '#e08a26' : '#1e3a52',
            transition: 'all 0.18s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDark ? 'rgba(224, 138, 38, 0.15)' : 'rgba(30, 58, 82, 0.12)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? '#e08a26' : '#1e3a52';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 82, 0.06)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 58, 82, 0.15)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'none';
          }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* زر الإشعارات */}
        <NotificationBell />

        {/* القائمة المنسدلة لملف المستخدم */}
        <UnifiedProfileDropdown currentUserRole={user?.role || 'EMPLOYEE'} />
      </div>
    </nav>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <NeonSignalToast />
      
      <div 
        className="app-content-layer"
        style={{ 
          flex: 1, 
          padding: 0, 
          minHeight: 'calc(100vh - 64px)', 
          paddingTop: '64px' 
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
