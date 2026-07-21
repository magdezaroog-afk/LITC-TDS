/**
 * LITC-TS v43.5 - Main Entry Point
 * نقطة الدخول المركزية المحدثة لتدعم نظام التوجيه والواجهات.
 */

import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './engine/ui-loader/ThemeProvider';
import { AuthProvider, useAuth } from './engine/auth/AuthContext';
import { OperationalDashboard } from './pages/console/OperationalDashboard';
import { UnifiedSmartAnalytics } from './components/analytics/UnifiedSmartAnalytics';
import { AdminGovernanceConsole } from './pages/admin/AdminGovernanceConsole';
import { AdminDashboardShell } from './pages/admin/AdminDashboardShell';

import { NeonSignalToast } from './components/notifications/NeonSignalToast';
import { UnifiedProfileDropdown } from './components/infrastructure/UnifiedProfileDropdown';
import { Login } from './pages/auth/Login';
import { PersonaSwitcher } from './components/molecules/PersonaSwitcher';
import { NotificationBell } from './components/infrastructure/NotificationBell';
import { useMobileViewport } from './mobile/hooks/useMobileViewport';
import { MobileShell } from './mobile/MobileShell';
import { LanguageProvider, useLanguage } from './engine/ui-loader/LanguageContext';
import { WindowProvider } from './engine/ui-loader/WindowContext';
import { WindowManagerRenderer } from './components/runtime/WindowManagerRenderer';
import { useWindowManager } from './engine/ui-loader/WindowContext';
import { OperationalEntitiesConsole } from './pages/admin/OperationalEntitiesConsole';
import { NotificationPolicyConsole } from './pages/admin/NotificationPolicyConsole';
import { SecurityControlTab } from './pages/admin/tabs/SecurityControlTab';

import { EmployeeWorkspace } from './pages/workspace/EmployeeWorkspace';
import { DepartmentHeadWorkspace } from './pages/management/DepartmentHeadWorkspace';
import { SystemModeToggle } from './components/molecules/SystemModeToggle';
import { FloatingTaskbar } from './components/runtime/FloatingTaskbar';

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

  // 1. If we are in Employee Mode:
  if (systemMode === 'employee') {
    return <EmployeeWorkspace />;
  }

  // 2. If we are in Work Mode and this is the employee route:
  if (isEmployeeRoute) {
    // Technicians or operational users see their OperationalDashboard in Work Mode
    if (user.role === 'Technician' || user.role === 'editor') {
      return <OperationalDashboard />;
    }
    // Admin and Department Head see the Employee Workspace when they explicitly visit `/employee` in Work Mode
    return <>{children}</>;
  }

  // 3. Normal Role Guard checks in Work Mode
  if (!allowedRoles.includes(user.role) && !allowedRoles.includes('ANY')) {
    if (['super_admin', 'co_admin'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    } else if (['dept_head', 'tech_director', 'team_leader'].includes(user.role) || user.role === 'HEAD_DEPT') {
      return <Navigate to="/head" replace />;
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
  
  // Unified Navigation across all workspaces
  
  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '14px 32px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    direction: dir,
    
    
  
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    boxSizing: 'border-box',
    height: '64px',
    zIndex: 95000,};

  const linkStyle = (path: string): React.CSSProperties => {
    const isActive = (location.pathname.startsWith(path) && path !== '/') || location.pathname === path;
    return {
      color: isActive ? '#6366f1' : '#64748b',
      fontWeight: isActive ? '600' : '500',
      textDecoration: 'none',
      fontSize: '14px',
      padding: '6px 14px',
      borderRadius: '10px',
      background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
      transition: 'all 0.25s ease',
      letterSpacing: '0.2px'
    };
  };

  return (
    <nav style={navStyle}>
      <div style={{ fontWeight: '800', [dir === 'rtl' ? 'marginRight' : 'marginLeft']: 'auto', color: '#0f172a', fontSize: '16px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('footer.brand')}</span>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>v43.5</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleLanguage}
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: 'none',
            color: '#6366f1',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          🌐 {t('nav.language')}
        </button>
        <SystemModeToggle />
        <NotificationBell />
        <UnifiedProfileDropdown currentUserRole={user?.role || 'EMPLOYEE'} />
      </div>
    </nav>
  );
};

const UniversalWorkspaceRouter: React.FC<{ user: any, systemMode: string }> = ({ user, systemMode }) => {
  const role = user?.role;
  
  if (!user) return <Navigate to="/login" replace />;

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
      return (
        <div key={role} style={wrapperStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
            <UnifiedSmartAnalytics title="نظرة عامة على العمليات التقنية" metrics={[]} layout="GRID" />
            <OperationalDashboard />
          </div>
        </div>
      );
    case 'dept_head':
      return <div key={role} style={wrapperStyle}><DepartmentHeadWorkspace /></div>;
    case 'team_leader':
      return (
        <div key={role} style={wrapperStyle}>
          <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
            <h2>واجهة قيادة الفريق (Team Leader Hub)</h2>
            <p>توزيع التذاكر ومراقبة أداء الفريق</p>
            <button style={{ padding: '10px 20px', background: '#0052cc', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', marginTop: '20px' }}>
              فتح سياسات المشرفين (Supervisor Policy Modal)
            </button>
            <div style={{ marginTop: '40px' }}>
              <EmployeeWorkspace />
            </div>
          </div>
        </div>
      );
    case 'employee':
    default:
      return <div key={role} style={wrapperStyle}><EmployeeWorkspace /></div>;
  }
};

const AppContent: React.FC = () => {
  const isMobile = useMobileViewport();
  const { user, systemMode } = useAuth();
  const { activeWindows } = useWindowManager();
  const location = useLocation();

  if (isMobile) {
    return (
      <>
        <MobileShell />
        <NeonSignalToast />
      </>
    );
  }

  const isLoginPage = location.pathname === '/login';
  const isSystemDirector = user?.role === 'system_director';

  // 1. If we are on the login page, render ONLY the login page without the Navigation shell
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
      <FloatingTaskbar />
      
      <WindowManagerRenderer />
      <PersonaSwitcher />
      
      <div 
        className={`app-content-layer ${activeWindows.length > 0 ? 'app-content-layer--dimmed' : ''}`}
        style={{ 
          flex: 1, 
          padding: user && !['super_admin', 'co_admin', 'system_director'].includes(user.role) ? '0' : '0 20px', 
          minHeight: 'calc(100vh - 64px)', 
          paddingTop: '64px' 
        }}>
        <Routes>
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
            <WindowProvider>
          <AppContent />
        </WindowProvider>
          </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
