/**
 * LITC-TS v43.5 - Main Entry Point
 * نقطة الدخول المركزية المحدثة لتدعم نظام التوجيه والواجهات.
 */

import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from './engine/ui-loader/ThemeProvider';
import { AuthProvider, useAuth } from './engine/auth/AuthContext';
import { OperationalDashboard } from './components/dashboard/OperationalDashboard';
import { AdminGovernanceConsole } from './components/admin/AdminGovernanceConsole';
import { UserProfileConsole } from './components/profile/UserProfileConsole';
import { NeonSignalToast } from './components/notifications/NeonSignalToast';
import { useMobileViewport } from './mobile/hooks/useMobileViewport';
import { MobileShell } from './mobile/MobileShell';
import { LanguageProvider } from './engine/ui-loader/LanguageContext';
import { OperationalEntitiesConsole } from './components/admin/OperationalEntitiesConsole';
import { NotificationPolicyConsole } from './components/admin/NotificationPolicyConsole';
import { SecurityControlTab } from './components/admin/tabs/SecurityControlTab';
import { FloatingAIBot } from './components/bot/FloatingAIBot';
import { EmployeeWorkspace } from './components/dashboard/EmployeeWorkspace';
import { DepartmentHeadWorkspace } from './components/dashboard/DepartmentHeadWorkspace';

// Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>جاري التحقق من الهوية...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role) && !allowedRoles.includes('ANY')) {
    // Redirect if they have insufficient permissions
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
    fontFamily: "'Inter', sans-serif"
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
      <div style={{ fontWeight: '800', marginRight: 'auto', color: '#0f172a', fontSize: '16px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LITC-TS</span>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>v43.5</span>
      </div>
      <Link to="/" style={linkStyle('/')}>الرئيسية</Link>
      {user && (user.role === 'IT_Admin' || user.role === 'admin') && (
        <>
          <Link to="/admin/security" style={linkStyle('/admin/security')}>🛡️ الأمان وقاعدة البيانات</Link>
          <Link to="/admin/policies" style={linkStyle('/admin/policies')}>🔔 سياسات الإشعارات</Link>
        </>
      )}
      <Link to="/profile" style={linkStyle('/profile')}>👤 الملف الشخصي</Link>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const isMobile = useMobileViewport();
  const { user } = useAuth();

  if (isMobile) {
    return (
      <>
        <MobileShell />
        <NeonSignalToast />
        <FloatingAIBot />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <NeonSignalToast />
      <FloatingAIBot />
      
      <div style={{ flex: 1, padding: user && user.role !== 'IT_Admin' && user.role !== 'admin' ? '0' : '0 20px' }}>
        <Routes>
          {/* Default Route: Redirect based on role */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['ANY']}>
              {user?.role === 'IT_Admin' || user?.role === 'admin' ? 
                <Navigate to="/admin" replace /> : 
               user?.role === 'Department_Head' || user?.role === 'HEAD_DEPT' ? 
                <Navigate to="/head" replace /> :
                <Navigate to="/employee" replace />
              }
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['IT_Admin', 'admin']}><AdminGovernanceConsole /></ProtectedRoute>} />
          <Route path="/admin/operational" element={<ProtectedRoute allowedRoles={['IT_Admin', 'admin']}><OperationalEntitiesConsole /></ProtectedRoute>} />
          <Route path="/admin/policies" element={<ProtectedRoute allowedRoles={['IT_Admin', 'admin']}><NotificationPolicyConsole /></ProtectedRoute>} />
          <Route path="/admin/security" element={<ProtectedRoute allowedRoles={['IT_Admin', 'admin']}><SecurityControlTab /></ProtectedRoute>} />
          
          {/* Department Head Route */}
          <Route path="/head" element={<ProtectedRoute allowedRoles={['Department_Head', 'HEAD_DEPT', 'IT_Admin', 'admin']}><DepartmentHeadWorkspace /></ProtectedRoute>} />

          {/* Employee Routes */}
          <Route path="/employee" element={<ProtectedRoute allowedRoles={['Technician', 'Employee', 'viewer', 'IT_Admin', 'admin']}><EmployeeWorkspace /></ProtectedRoute>} />
          
          {/* Shared Routes */}
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['ANY']}><UserProfileConsole /></ProtectedRoute>} />
          
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
