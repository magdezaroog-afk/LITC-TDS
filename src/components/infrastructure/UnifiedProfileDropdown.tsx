import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const UnifiedProfileDropdown: React.FC<{ currentUserRole?: string }> = ({ currentUserRole = 'EMPLOYEE' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availability, setAvailability] = useState('AVAILABLE'); // AVAILABLE, BUSY, ON_LEAVE
  const navigate = useNavigate();

  const handlePreferences = () => {
    // Open modal or navigate. Here we'll navigate for simplicity or just alert since modal isn't built.
    alert('فتح نافذة إعدادات الهوية والخيارات الشخصية (التحديث المحلي فقط)');
    setIsOpen(false);
  };

  const handleNotificationSettings = () => {
    navigate('/admin/notifications'); // Assuming this routes to notification policy
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', zIndex: 9999 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '5px', borderRadius: '8px', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ position: 'relative' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
            م
          </div>
          <div style={{
            position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%',
            background: availability === 'AVAILABLE' ? '#10b981' : availability === 'BUSY' ? '#f59e0b' : '#ef4444',
            border: '2px solid white'
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>محمد الموظف</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>mohammad@litc.com</span>
        </div>
        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '5px' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: '280px',
          background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0', zIndex: 10000, marginTop: '8px', overflow: 'hidden'
        }}>
          {/* Identity Summary */}
          <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', margin: '0 auto 10px' }}>م</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>محمد الموظف</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>قسم الدعم الفني ({currentUserRole})</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'inline-block', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>SSO Mapped</div>
          </div>

          <div style={{ padding: '15px' }}>
            {/* Availability Toggle */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>حالة التوافر</div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => setAvailability('AVAILABLE')} style={{ flex: 1, padding: '6px', fontSize: '11px', background: availability === 'AVAILABLE' ? '#10b981' : '#f1f5f9', color: availability === 'AVAILABLE' ? 'white' : '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>متاح</button>
                <button onClick={() => setAvailability('BUSY')} style={{ flex: 1, padding: '6px', fontSize: '11px', background: availability === 'BUSY' ? '#f59e0b' : '#f1f5f9', color: availability === 'BUSY' ? 'white' : '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>مشغول</button>
                <button onClick={() => setAvailability('ON_LEAVE')} style={{ flex: 1, padding: '6px', fontSize: '11px', background: availability === 'ON_LEAVE' ? '#ef4444' : '#f1f5f9', color: availability === 'ON_LEAVE' ? 'white' : '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>إجازة</button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '15px 0' }} />

            {/* Links */}
            <div 
              onClick={handlePreferences}
              style={{ padding: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>⚙️</span> إعدادات الهوية والخيارات الشخصية
            </div>
            
            <div 
              onClick={handleNotificationSettings}
              style={{ padding: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>🔔</span> تفضيلات الإشعارات والتنبيهات
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
