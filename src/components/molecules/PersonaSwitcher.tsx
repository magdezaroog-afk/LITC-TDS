import React from 'react';
import { useAuth } from '../../engine/auth/AuthContext';

export const PersonaSwitcher: React.FC = () => {
  const { user } = useAuth();
  
  const testRoles = [
    { role: 'employee', label: 'مستخدم تشغيلي' },
    { role: 'team_leader', label: 'رئيس فريق/وحدة' },
    { role: 'dept_head', label: 'رئيس قسم' },
    { role: 'tech_director', label: 'مدير إدارة' }
  ];

  const handleOpenTest = (role: string) => {
    window.open(`/?login_as=${role}`, '_blank');
  };

  if (user?.role !== 'system_director' && user?.role !== 'super_admin' && !testRoles.some(r => r.role === user?.role)) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999999, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '8px', direction: 'rtl' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '6px', marginBottom: '4px' }}>
        🧪 اختبار أدوار الـ IT
      </div>
      {testRoles.map(tr => (
        <button 
          key={tr.role}
          onClick={() => handleOpenTest(tr.role)}
          style={{
            background: user?.role === tr.role ? '#007AFF' : '#f0f0f0',
            color: user?.role === tr.role ? 'white' : '#333',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'right'
          }}
        >
          {user?.role === tr.role ? '✅ ' : '🔗 '} {tr.label}
        </button>
      ))}
    </div>
  );
};
