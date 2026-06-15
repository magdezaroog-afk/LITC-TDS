import React from 'react';
import { useAuth } from '../../engine/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SystemModeToggle: React.FC = () => {
  const { user, systemMode, setSystemMode } = useAuth();
  const navigate = useNavigate();

  // Roles that have specialized work workspaces
  const privilegedRoles = ['IT_Admin', 'admin', 'Department_Head', 'HEAD_DEPT', 'Technician', 'editor'];

  // If user is not logged in or is a plain employee/viewer without work role, do not render the switch button
  if (!user || !privilegedRoles.includes(user.role)) {
    return null;
  }

  const handleToggle = () => {
    const newMode = systemMode === 'employee' ? 'work' : 'employee';
    setSystemMode(newMode);

    if (newMode === 'work') {
      // Direct them to their specialized workspace
      if (user.role === 'IT_Admin' || user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'Department_Head' || user.role === 'HEAD_DEPT') {
        navigate('/head');
      } else {
        // Technician / editor / etc. -> Renders OperationalDashboard at /employee route
        navigate('/employee');
      }
    } else {
      // Return to employee workspace
      navigate('/employee');
    }
  };

  const isEmployeeMode = systemMode === 'employee';

  return (
    <>
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes pulse-cyan {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.7);
            transform: scale(1);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(0, 229, 255, 0);
            transform: scale(1.05);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 229, 255, 0);
            transform: scale(1);
          }
        }
        @keyframes pulse-orange {
          0% {
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
            transform: scale(1);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(249, 115, 22, 0);
            transform: scale(1.05);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
            transform: scale(1);
          }
        }
        .mode-toggle-container:hover {
          transform: translateX(-50%) translateY(-2px) scale(1.01);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(99, 102, 241, 0.3);
        }
        .mode-toggle-btn:hover {
          filter: brightness(1.1);
          transform: scale(1.03);
        }
        .mode-toggle-btn:active {
          transform: scale(0.97);
        }
      `}</style>

      <div 
        className="mode-toggle-container"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '30px',
          padding: '10px 20px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 15px rgba(99, 102, 241, 0.15)',
          color: '#fff',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          direction: 'rtl',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'auto'
        }}
      >
        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isEmployeeMode ? '#00e5ff' : '#f97316',
              animation: isEmployeeMode ? 'pulse-cyan 2s infinite' : 'pulse-orange 2s infinite',
              transition: 'all 0.5s ease'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
            الوضع الحالي: <span style={{ fontWeight: 'bold', color: isEmployeeMode ? '#00e5ff' : '#f97316' }}>
              {isEmployeeMode ? 'الموظف العادي' : 'العمل والتشغيل'}
            </span>
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Action Toggle Button */}
        <button
          className="mode-toggle-btn"
          onClick={handleToggle}
          style={{
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isEmployeeMode 
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
              : 'rgba(255, 255, 255, 0.08)',
            borderStyle: isEmployeeMode ? 'none' : 'solid',
            borderWidth: isEmployeeMode ? '0' : '1px',
            borderColor: isEmployeeMode ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
            boxShadow: isEmployeeMode ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
            outline: 'none'
          }}
        >
          {isEmployeeMode ? (
            <>
              <span>⚡</span>
              <span>تفعيل وضع العمل</span>
            </>
          ) : (
            <>
              <span>👤</span>
              <span>العودة للوضع العادي</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
