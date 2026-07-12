/**
 * LITC-TS v43.5 - Main Entry Point
 * نقطة الدخول المركزية المحدثة لتدعم نظام التوجيه والواجهات.
 */

import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './engine/ui-loader/ThemeProvider';
import { AuthProvider, useAuth } from './engine/auth/AuthContext';
import { OperationalDashboard } from './pages/console/OperationalDashboard';
import { AdminGovernanceConsole } from './pages/admin/AdminGovernanceConsole';

import { NeonSignalToast } from './components/notifications/NeonSignalToast';
import { UnifiedProfileDropdown } from './components/infrastructure/UnifiedProfileDropdown';
import { NotificationBell } from './components/infrastructure/NotificationBell';
import { useMobileViewport } from './mobile/hooks/useMobileViewport';
import { MobileShell } from './mobile/MobileShell';
import { LanguageProvider, useLanguage } from './engine/ui-loader/LanguageContext';
import { OperationalEntitiesConsole } from './pages/admin/OperationalEntitiesConsole';
import { NotificationPolicyConsole } from './pages/admin/NotificationPolicyConsole';
import { SecurityControlTab } from './pages/admin/tabs/SecurityControlTab';

import { EmployeeWorkspace } from './pages/workspace/EmployeeWorkspace';
import { DepartmentHeadWorkspace } from './pages/management/DepartmentHeadWorkspace';
import { SystemModeToggle } from './components/molecules/SystemModeToggle';

// Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>جاري التحقق من الهوية...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role) && !allowedRoles.includes('ANY')) {
    // Redirect if they have insufficient permissions
    if (user.role === 'IT_Admin' || user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'Department_Head') {
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
    if (user.role === 'IT_Admin' || user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'Department_Head' || user.role === 'HEAD_DEPT') {
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
  
  // Hide Navigation on specific workspaces
  if (location.pathname === '/employee' || location.pathname === '/head' || location.pathname === '/login') return null;
  
  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '14px 32px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    fontFamily: "'Inter', sans-serif",
    direction: dir
  };

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
        <NotificationBell />
        <UnifiedProfileDropdown currentUserRole={user?.role || 'EMPLOYEE'} />
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const isMobile = useMobileViewport();
  const { user, systemMode } = useAuth();

  if (isMobile) {
    return (
      <>
        <MobileShell />
        <NeonSignalToast />

      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <NeonSignalToast />

      <SystemModeToggle />
      
      <div style={{ flex: 1, padding: user && user.role !== 'IT_Admin' && user.role !== 'admin' ? '0' : '0 20px' }}>
        <Routes>
          {/* Default Route: Redirect based on role and systemMode */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['ANY']}>
              {systemMode === 'employee' ? (
                <Navigate to="/employee" replace />
              ) : (
                user?.role === 'IT_Admin' || user?.role === 'admin' ? 
                  <Navigate to="/admin" replace /> : 
                 user?.role === 'Department_Head' || user?.role === 'HEAD_DEPT' ? 
                  <Navigate to="/head" replace /> :
                  <Navigate to="/employee" replace />
              )}
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={<WorkspaceWrapper allowedRoles={['IT_Admin', 'admin']}><AdminGovernanceConsole /></WorkspaceWrapper>} />
          <Route path="/admin/operational" element={<WorkspaceWrapper allowedRoles={['IT_Admin', 'admin']}><OperationalEntitiesConsole /></WorkspaceWrapper>} />
          <Route path="/admin/policies" element={<WorkspaceWrapper allowedRoles={['IT_Admin', 'admin']}><NotificationPolicyConsole /></WorkspaceWrapper>} />
          <Route path="/admin/security" element={<WorkspaceWrapper allowedRoles={['IT_Admin', 'admin']}><SecurityControlTab /></WorkspaceWrapper>} />
          
          {/* Department Head Route */}
          <Route path="/head" element={<WorkspaceWrapper allowedRoles={['Department_Head', 'HEAD_DEPT', 'IT_Admin', 'admin']}><DepartmentHeadWorkspace /></WorkspaceWrapper>} />

          {/* Employee Routes */}
          <Route path="/employee" element={<WorkspaceWrapper allowedRoles={['Technician', 'Employee', 'viewer', 'IT_Admin', 'admin']} isEmployeeRoute={true}><EmployeeWorkspace /></WorkspaceWrapper>} />
          
          {/* Shared Routes */}

          
          {/* Fallback Routes */}
          <Route path="/login" element={
            <div style={{ textAlign: 'center', marginTop: '100px', color: '#fff' }}>
              <h2>شاشة تسجيل الدخول (Mock)</h2>
              <p>تم تحويلك إلى هنا لأنك لست مسجلاً.</p>
              <Link to="/">اضغط هنا لتسجيل الدخول (Simulated)</Link>
            </div>
          } />
          
          <Route path="*" element={<NotFoundPage />} />
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
