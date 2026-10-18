import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Check if dark mode
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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const mockData = [
          {
            id: '1',
            title: 'تم إسناد تذكرة جديدة إليك',
            body: 'تذكرة #REQ-0038 بانتظار المراجعة الفنية واعتماد الإجراء.',
            componentKey: 'TICKET_TRIAGE',
            recordId: '0038',
            isRead: false,
            time: 'منذ 5 دقائق'
          },
          {
            id: '2',
            title: 'تحديث أمني للنظام',
            body: 'تم بنجاح تطبيق ترقية منظومة NEXUS TDS للإصدار المؤسسي v43.5.',
            componentKey: 'DASHBOARD',
            recordId: 'sys-1',
            isRead: false,
            time: 'منذ ساعة'
          },
          {
            id: '3',
            title: 'اكتمال معالجة الطلب',
            body: 'تم إغلاق طلب صيانة الطابعات #REQ-0024 بنجاح.',
            componentKey: 'TICKET_ENTRY',
            recordId: '0024',
            isRead: true,
            time: 'أمس'
          }
        ];
        setNotifications(mockData);
        setUnreadCount(mockData.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
  }, []);

  // Click outside listener
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

  const handleNotificationClick = (notif: any) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    navigate('/hub');
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* ── Bell Trigger Button ── */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="الإشعارات"
        title="التنبيهات والإشعارات"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(203, 213, 225, 0.8)',
          backgroundColor: isDark 
            ? (isOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)') 
            : (isOpen ? 'rgba(19, 93, 121, 0.12)' : 'rgba(255, 255, 255, 0.7)'),
          color: isDark ? '#e2e8f0' : '#135d79',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.borderColor = '#f36c21';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(203, 213, 225, 0.8)';
        }}
      >
        <Bell size={17} strokeWidth={2} />

        {/* Glowing Orange Unread Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: '#f36c21',
              color: '#ffffff',
              borderRadius: '9999px',
              minWidth: '17px',
              height: '17px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(243, 108, 33, 0.5)',
              border: isDark ? '2px solid #0b141f' : '2px solid #ffffff',
              lineHeight: 1
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── Modern Glassmorphic Dropdown Panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            left: 0,
            width: '340px',
            borderRadius: '16px',
            backgroundColor: isDark ? 'rgba(11, 20, 31, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: isDark 
              ? '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset' 
              : '0 16px 40px rgba(19, 93, 121, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
            zIndex: 90000,
            overflow: 'hidden',
            direction: 'rtl',
            fontFamily: "'Cairo', sans-serif",
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(248, 250, 252, 0.8)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                مركز التنبيهات
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(243, 108, 33, 0.15)',
                    color: '#f36c21',
                    border: '1px solid rgba(243, 108, 33, 0.25)'
                  }}
                >
                  {unreadCount} جديد
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.18s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#f36c21'}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'}
              >
                <CheckCheck size={13} />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '13px 18px',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid #f8fafc',
                  cursor: 'pointer',
                  backgroundColor: n.isRead 
                    ? 'transparent' 
                    : (isDark ? 'rgba(243, 108, 33, 0.06)' : 'rgba(243, 108, 33, 0.04)'),
                  transition: 'all 0.18s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = n.isRead 
                    ? 'transparent' 
                    : (isDark ? 'rgba(243, 108, 33, 0.06)' : 'rgba(243, 108, 33, 0.04)');
                }}
              >
                {!n.isRead && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '8px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#f36c21'
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {n.title}
                  </div>
                  <span style={{ fontSize: '10.5px', color: isDark ? '#64748b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={11} />
                    {n.time}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.45 }}>
                  {n.body}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9',
              textAlign: 'center',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : '#ffffff'
            }}
          >
            <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>
              نظام الإشعارات المؤسسي الذكي • NEXUS TDS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationBell;
