import React, { useState, useEffect } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';

export const PersonaSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [testUsers, setTestUsers] = useState<any[]>([]);

  useEffect(() => {
    // Load the 4 specific testing users from localStorage
    const stored = localStorage.getItem('litc_operational_users');
    if (stored) {
      try {
        const users = JSON.parse(stored);
        const specificUsers = users.filter((u: any) => 
          ['م. مجدي الزروق', 'أحمد النكوع', 'نضال أبو غامجة', 'محمد الزياني'].includes(u.name)
        );
        setTestUsers(specificUsers);
      } catch (e) {
        console.error("Failed to parse test users");
      }
    }
  }, []);

  const handleOpenTest = (userId: string) => {
    // Open in same window to avoid multiple tabs, or open in new tab based on preference
    // The user said "دون اطراري لتسجيل الخروج وتغيير الدور", meaning we can just reload the same window or open a new tab. Let's open in same window to avoid tab clutter.
    window.location.href = `/?login_as_user=${userId}`;
  };

  // Keep it visible if it's admin or if the user is one of the test users
  const isSuperAdmin = user?.role === 'system_director' || user?.role === 'super_admin';
  const isTestUser = testUsers.some(u => u.id === user?.id);

  if (!isSuperAdmin && !isTestUser) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}
        title="محاكاة أدوار النظام"
      >
        🎭
      </button>
      
      {isOpen && (
        <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '20px', padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '8px', direction: 'rtl', minWidth: '220px' }}>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b', marginBottom: '8px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
            محاكاة المستخدمين الحقيقيين
          </div>
          {testUsers.map(tu => (
            <button 
              key={tu.id}
              onClick={() => handleOpenTest(tu.id)}
              style={{
                background: user?.id === tu.id ? 'rgba(37, 99, 235, 0.9)' : 'rgba(255,255,255,0.6)',
                color: user?.id === tu.id ? '#fff' : '#334155',
                border: '1px solid rgba(0,0,0,0.05)',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                boxShadow: user?.id === tu.id ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
              }}
              onMouseOver={(e) => { if(user?.id !== tu.id) e.currentTarget.style.background = 'rgba(255,255,255,0.9)' }}
              onMouseOut={(e) => { if(user?.id !== tu.id) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>{tu.name}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>{tu.role === 'NONE' || !tu.role ? 'بدون دور' : tu.role}</span>
              </span>
              {user?.id === tu.id ? <span>✅</span> : <span>🔗</span>}
            </button>
          ))}
          {testUsers.length === 0 && (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '10px' }}>
              لا يوجد مستخدمين للاختبار
            </div>
          )}
        </div>
      )}
    </div>
  );
};
