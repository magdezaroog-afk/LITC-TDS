import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../engine/auth/AuthContext';
import { useLanguage } from '../../engine/ui-loader/LanguageContext';
import { useWindowManager } from '../../engine/ui-loader/WindowContext';
import { Ticket, Archive, Shield, Settings, LayoutDashboard } from 'lucide-react';

export const FloatingTaskbar: React.FC = () => {
  const { user, hasPermission, systemMode } = useAuth();
  const { dir } = useLanguage();
  const { toggleWindow, activeWindows } = useWindowManager();

  const isWorkMode = systemMode === 'work';

  const apps = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'لوحة القيادة', requiredPerm: 'view_dashboard' },
    { id: 'tickets', icon: <Ticket size={20} />, label: 'التذاكر', requiredPerm: 'view_dashboard' },
    { id: 'archive', icon: <Archive size={20} />, label: 'الأرشيف', requiredPerm: 'view_dashboard' },
    { id: 'admin_panel', icon: <Shield size={20} />, label: 'التحكم الأمني', requiredRole: 'admin' },
    { id: 'settings', icon: <Settings size={20} />, label: 'الإعدادات', requiredPerm: 'edit_settings' },
  ];

  const authorizedApps = apps.filter(app => {
    if (!user) return false;
    if (app.requiredRole && user.role !== app.requiredRole && user.role !== 'IT_Admin') return false;
    if (app.requiredPerm && !hasPermission(app.requiredPerm)) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {isWorkMode && (
        <motion.div 
          initial={{ y: 80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="floating-taskbar-dock"
          style={{ direction: dir }}
        >
          {authorizedApps.map(app => {
            const isActive = activeWindows.includes(app.id);
            return (
              <motion.button 
                whileHover={{ scale: 1.2, y: -6 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleWindow(app.id)}
                key={app.id}
                title={app.label}
                className={`floating-taskbar-dock__btn ${isActive ? 'floating-taskbar-dock__btn--active' : ''}`}
              >
                {app.icon}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
