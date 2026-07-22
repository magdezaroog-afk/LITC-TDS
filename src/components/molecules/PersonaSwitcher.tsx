import React from 'react';
import { useAuth } from '../../engine/auth/AuthContext';

export const PersonaSwitcher: React.FC = () => {
  const { user } = useAuth();
  
  const testRoles = [
    { role: 'employee', label: 'محمد الزياني (مستخدم تشغيلي)' },
    { role: 'team_leader', label: 'نضال أبو غامجة (رئيس فريق)' },
    { role: 'dept_head', label: 'أحمد النكوع (رئيس قسم)' },
    { role: 'tech_director', label: 'م. مجدي الزروق (مدير إدارة)' }
  ];

  const handleOpenTest = (role: string) => {
    window.open(`/?login_as=${role}`, '_blank');
  };

  if (user?.role !== 'system_director' && user?.role !== 'super_admin' && !testRoles.some(r => r.role === user?.role)) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999999, background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '24px', padding: '10px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', direction: 'rtl' }}>
      <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', marginLeft: '10px' }}>
        🧪 محاكاة أدوار الـ IT:
      </div>
      {testRoles.map(tr => (
        <button 
          key={tr.role}
          onClick={() => handleOpenTest(tr.role)}
          style={{
            background: user?.role === tr.role ? 'rgba(37, 99, 235, 0.9)' : 'rgba(255,255,255,0.5)',
            color: user?.role === tr.role ? '#fff' : '#334155',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: user?.role === tr.role ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
          }}
          onMouseOver={(e) => { if(user?.role !== tr.role) e.currentTarget.style.background = 'rgba(255,255,255,0.8)' }}
          onMouseOut={(e) => { if(user?.role !== tr.role) e.currentTarget.style.background = 'rgba(255,255,255,0.5)' }}
        >
          {user?.role === tr.role ? '✅' : '🔗'} {tr.label}
        </button>
      ))}
    </div>
  );
};
