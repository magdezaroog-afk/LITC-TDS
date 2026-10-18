import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../engine/auth/AuthContext';
import {
  User,
  Shield,
  Sliders,
  LogOut,
  ChevronDown,
  Sparkles,
  Building2,
  Mail,
  CheckCircle2,
  CircleDot
} from 'lucide-react';

export const UnifiedProfileDropdown: React.FC<{ currentUserRole?: string }> = ({
  currentUserRole = 'EMPLOYEE'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availability, setAvailability] = useState<'AVAILABLE' | 'BUSY' | 'AWAY'>('AVAILABLE');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Theme observer
  const [isDark, setIsDark] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const rawName = user?.name || 'مستخدم النظام';
  const displayName = rawName === 'System Administrator' ? 'مدير النظام' : rawName;
  const rawEmail = user?.email || 'admin@nexus.ly';
  const displayEmail = rawEmail.replace(/@.*litc\.ly$/i, '@nexus.ly');
  const displayRole = user?.role || currentUserRole;
  const displayDept = user?.department || 'إدارة العمليات المركزية';

  // Role title in Arabic
  const roleNameMap: Record<string, string> = {
    super_admin: 'مدير النظام الأعلى',
    system_director: 'مدير الأنظمة والتقنية',
    tech_director: 'مدير العمليات الفنية',
    dept_head: 'رئيس قسم / إدارة',
    team_leader: 'قائد فريق عمل',
    employee: 'موظف مؤسسي',
    co_admin: 'مشرف نظام'
  };

  const roleTitle = roleNameMap[displayRole] || displayRole;

  // Status Config
  const statusConfig = {
    AVAILABLE: { color: '#10b981', label: 'متاح', glow: 'rgba(16, 185, 129, 0.5)' },
    BUSY: { color: '#f59e0b', label: 'مشغول', glow: 'rgba(245, 158, 11, 0.5)' },
    AWAY: { color: '#64748b', label: 'بالخارج', glow: 'rgba(100, 116, 139, 0.3)' }
  };
  const activeStatus = statusConfig[availability];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* ── Ultra-Luxury Pill Profile Trigger ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="قائمة الملف الشخصي المؤسسي"
        title={`${displayName} - ${roleTitle}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          cursor: 'pointer',
          padding: '3px 10px 3px 4px',
          borderRadius: '9999px',
          border: isDark 
            ? (isOpen ? '1px solid #f36c21' : '1px solid rgba(255, 255, 255, 0.12)') 
            : (isOpen ? '1px solid #135d79' : '1px solid rgba(19, 93, 121, 0.18)'),
          backgroundColor: isDark 
            ? (isOpen ? 'rgba(243, 108, 33, 0.12)' : 'rgba(255, 255, 255, 0.04)') 
            : (isOpen ? 'rgba(19, 93, 121, 0.08)' : 'rgba(255, 255, 255, 0.85)'),
          boxShadow: isOpen 
            ? (isDark ? '0 0 16px rgba(243, 108, 33, 0.25)' : '0 4px 14px rgba(19, 93, 121, 0.12)') 
            : (isDark ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)'),
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
          userSelect: 'none'
        }}
        onMouseEnter={e => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = isDark ? 'rgba(243, 108, 33, 0.6)' : 'rgba(19, 93, 121, 0.4)';
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = isDark 
              ? '0 4px 14px rgba(0, 0, 0, 0.4)' 
              : '0 4px 12px rgba(19, 93, 121, 0.1)';
          }
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(19, 93, 121, 0.18)';
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = isDark ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)';
          }
        }}
      >
        {/* ── Executive Circular Avatar with Dual Gradient Luminous Aura ── */}
        <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              padding: '2px',
              background: 'linear-gradient(135deg, #135d79 0%, #f36c21 100%)',
              boxShadow: isDark 
                ? '0 0 10px rgba(243, 108, 33, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4)' 
                : '0 2px 8px rgba(19, 93, 121, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}
          >
            {/* Inner Avatar Graphic */}
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: isDark ? '#0b141f' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                  fill="url(#nexusAvatarGrad)"
                />
                <path
                  d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z"
                  fill="url(#nexusAvatarGrad)"
                />
                <defs>
                  <linearGradient id="nexusAvatarGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#135d79" />
                    <stop offset="1" stopColor="#f36c21" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Live Pulsing Presence Dot */}
          <span
            style={{
              position: 'absolute',
              bottom: '0px',
              left: '0px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeStatus.color,
              border: isDark ? '1.5px solid #080e18' : '1.5px solid #ffffff',
              boxShadow: `0 0 6px ${activeStatus.glow}`
            }}
          />
        </div>

        {/* User Identity Info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'right', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: "'Cairo', sans-serif" }}>
              {displayName}
            </span>
          </div>
          <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#f36c21', letterSpacing: '0.01em', fontFamily: "'Cairo', sans-serif" }}>
            {roleTitle}
          </span>
        </div>

        {/* Minimalist Micro Chevron */}
        <ChevronDown
          size={13}
          style={{
            color: isDark ? '#94a3b8' : '#64748b',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            marginRight: '2px'
          }}
        />
      </button>

      {/* ── Ultra-Luxury Glassmorphic Dropdown Panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            left: 0,
            width: '295px',
            borderRadius: '20px',
            backgroundColor: isDark ? 'rgba(11, 20, 31, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(19, 93, 121, 0.15)',
            boxShadow: isDark 
              ? '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05) inset' 
              : '0 20px 48px rgba(19, 93, 121, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
            zIndex: 99999,
            overflow: 'hidden',
            direction: 'rtl',
            fontFamily: "'Cairo', sans-serif",
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Top User Institutional Card */}
          <div
            style={{
              padding: '20px 18px 16px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(248, 250, 252, 0.9)',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(19, 93, 121, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            {/* Large Circular Luxury Avatar with Luminous Glow */}
            <div
              style={{
                position: 'relative',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                padding: '2.5px',
                background: 'linear-gradient(135deg, #135d79 0%, #f36c21 100%)',
                boxShadow: isDark 
                  ? '0 4px 18px rgba(243, 108, 33, 0.35)' 
                  : '0 4px 16px rgba(19, 93, 121, 0.25)',
                marginBottom: '10px'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#0b141f' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                    fill="url(#nexusAvatarMenuGrad)"
                  />
                  <path
                    d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z"
                    fill="url(#nexusAvatarMenuGrad)"
                  />
                  <defs>
                    <linearGradient id="nexusAvatarMenuGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#135d79" />
                      <stop offset="1" stopColor="#f36c21" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Verified Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isDark ? '2px solid #0b141f' : '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                }}
              >
                <CheckCircle2 size={11} color="#ffffff" strokeWidth={3} />
              </div>
            </div>

            <div style={{ fontSize: '14.5px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={11} />
              <span>{displayEmail}</span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: isDark ? 'rgba(243, 108, 33, 0.15)' : 'rgba(243, 108, 33, 0.1)',
                  color: '#f36c21',
                  border: '1px solid rgba(243, 108, 33, 0.3)'
                }}
              >
                {roleTitle}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: isDark ? 'rgba(19, 93, 121, 0.2)' : 'rgba(19, 93, 121, 0.08)',
                  color: isDark ? '#38bdf8' : '#135d79',
                  border: isDark ? '1px solid rgba(19, 93, 121, 0.3)' : '1px solid rgba(19, 93, 121, 0.15)'
                }}
              >
                {displayDept}
              </span>
            </div>
          </div>

          {/* Availability Status Segmented Pill */}
          <div style={{ padding: '12px 16px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
              الحالة المؤسسية للتواجد
            </div>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '3px',
                borderRadius: '10px',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : '#f1f5f9'
              }}
            >
              {(['AVAILABLE', 'BUSY', 'AWAY'] as const).map(key => {
                const cfg = statusConfig[key];
                const isActive = availability === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAvailability(key)}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      backgroundColor: isActive 
                        ? (isDark ? 'rgba(255, 255, 255, 0.12)' : '#ffffff') 
                        : 'transparent',
                      color: isActive ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <span style={{ width: '6.5px', height: '6.5px', borderRadius: '50%', backgroundColor: cfg.color }} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Links */}
          <div style={{ padding: '8px' }}>
            <button
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
              type="button"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: isDark ? '#e2e8f0' : '#334155',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc';
                e.currentTarget.style.paddingRight = '16px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingRight = '12px';
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: isDark ? 'rgba(19, 93, 121, 0.25)' : 'rgba(19, 93, 121, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={15} color="#135d79" />
              </div>
              <span>الملف الشخصي والبيانات</span>
            </button>

            <button
              onClick={() => {
                navigate('/admin/notifications');
                setIsOpen(false);
              }}
              type="button"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: isDark ? '#e2e8f0' : '#334155',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc';
                e.currentTarget.style.paddingRight = '16px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingRight = '12px';
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: isDark ? 'rgba(243, 108, 33, 0.2)' : 'rgba(243, 108, 33, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={15} color="#f36c21" />
              </div>
              <span>إعدادات النظام والتفضيلات</span>
            </button>

            <button
              onClick={() => {
                navigate('/admin');
                setIsOpen(false);
              }}
              type="button"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: isDark ? '#e2e8f0' : '#334155',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc';
                e.currentTarget.style.paddingRight = '16px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingRight = '12px';
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: isDark ? 'rgba(2, 132, 199, 0.25)' : 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={15} color="#0284c7" />
              </div>
              <span>صلاحيات الدور المؤسسي</span>
            </button>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9', margin: '6px 4px' }} />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              type="button"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#ef4444',
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2';
                e.currentTarget.style.paddingRight = '16px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingRight = '12px';
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={15} color="#ef4444" />
              </div>
              <span>تسجيل الخروج من النظام</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedProfileDropdown;
