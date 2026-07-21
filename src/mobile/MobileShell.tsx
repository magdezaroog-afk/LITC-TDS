import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { OperationalDashboard } from '../pages/console/OperationalDashboard';
import { AdminGovernanceConsole } from '../pages/admin/AdminGovernanceConsole';
import { MobileAnalyticsCube } from './components/MobileAnalyticsCube';
import { NotificationBell } from '../components/infrastructure/NotificationBell';
import { SystemModeToggle } from '../components/molecules/SystemModeToggle';

export const MobileShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'الرئيسية', path: '/', icon: '🏠' },
    { label: 'التحاليل', path: '/mobile/analytics', icon: '📊' },
    { label: 'الحوكمة', path: '/admin', icon: '🛡️' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(to bottom, #0a0f1d, #1a1f2e)',
      color: '#fff',
      overflow: 'hidden'
    }}>
      {/* Header */}
      

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        paddingBottom: '80px' // Space for bottom nav
      }}>
        <Routes>
          <Route path="/" element={<OperationalDashboard />} />
          <Route path="/admin" element={<AdminGovernanceConsole />} />
          <Route path="/mobile/analytics" element={<MobileAnalyticsCube />} />
        </Routes>
      </div>

      {/* Bottom Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'rgba(15, 20, 35, 0.85)',
        backdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(0, 255, 204, 0.3)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 90000,
        boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? '#00ffcc' : '#888',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isActive ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              <div style={{ 
                fontSize: '24px', 
                marginBottom: '4px',
                textShadow: isActive ? '0 0 10px rgba(0,255,204,0.8)' : 'none'
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '11px', fontWeight: isActive ? 'bold' : 'normal' }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
