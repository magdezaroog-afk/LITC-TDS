import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock fetch for NotificationLog
    const fetchNotifications = async () => {
      try {
        const mockData = [
          { id: '1', title: 'New Ticket Assigned', body: 'Ticket 501 needs your attention.', componentKey: 'TICKET_TRIAGE', recordId: '501', isRead: false, createdAt: new Date().toISOString() },
          { id: '2', title: 'System Alert', body: 'Maintenance window scheduled.', componentKey: 'DASHBOARD', recordId: 'sys-1', isRead: true, createdAt: new Date().toISOString() }
        ];
        setNotifications(mockData);
        setUnreadCount(mockData.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = (notif: any) => {
    // Smart Deep-Linking
    if (notif.componentKey === 'TICKET_TRIAGE') {
      navigate(`/employee?ticketId=${notif.recordId}`);
    } else if (notif.componentKey === 'TICKET_ENTRY') {
      navigate(`/employee/ticket/${notif.recordId}`);
    } else if (notif.componentKey === 'DASHBOARD') {
      navigate(`/`);
    } else {
      navigate(`/${notif.componentKey.toLowerCase()}/${notif.recordId}`);
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', zIndex: 9999 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', padding: '6px 10px', fontSize: '18px', cursor: 'pointer', position: 'relative', color: 'inherit' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#e11d48', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 'bold', border: '2px solid white'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0,
          width: '320px', background: '#ffffff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          borderRadius: '12px', zIndex: 100000,
          border: '1px solid #e2e8f0',
          maxHeight: '400px', overflowY: 'auto',
          marginTop: '10px', direction: 'rtl', color: '#0f172a'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>الإشعارات</span>
            <span style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>تحديد كـ مقروء</span>
          </div>
          {notifications.map(n => (
            <div 
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              style={{
                padding: '15px', borderBottom: '1px solid #f8fafc',
                cursor: 'pointer', background: n.isRead ? 'transparent' : '#eff6ff',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{n.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>{n.body}</div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              لا توجد إشعارات جديدة
            </div>
          )}
        </div>
      )}
    </div>
  );
};
