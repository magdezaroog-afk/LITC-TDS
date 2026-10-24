import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useHub } from '../context/HubContext';
import { RequestSheet } from './RequestSheet';
import { UserProfileModal } from './UserProfileModal';

export function AppShell() {
  const { language, darkMode } = useHub();
  const isRtl = language === 'ar';
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={`functional-ui-root ${darkMode ? 'dark-theme' : 'light-theme'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0b0f19' : '#f8fafc',
        color: darkMode ? '#f8fafc' : '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Cairo', 'Segoe UI', system-ui, -apple-system, sans-serif",
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {/* ═══ MAIN WORKSPACE CANVAS ═══ */}
      <main
        className="app-shell-main"
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1480px',
          margin: '0 auto',
          padding: isMobileScreen ? '6px 12px 20px' : '8px 20px 8px',
        }}
      >
        <Outlet />
      </main>

      {/* Modals & Drawers */}
      <RequestSheet />
      <UserProfileModal />
    </div>
  );
}

export default AppShell;
