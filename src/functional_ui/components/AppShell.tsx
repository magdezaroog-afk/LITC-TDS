import { Outlet } from 'react-router-dom';
import { useHub } from '../context/HubContext';
import { RequestSheet } from './RequestSheet';
import { UserProfileModal } from './UserProfileModal';

export function AppShell() {
  const { language, darkMode } = useHub();
  const isRtl = language === 'ar';

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
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '24px 20px 90px',
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
