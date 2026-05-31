import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';

export const NotificationPolicyConsole: React.FC = () => {
  const theme = useTheme();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default event types for the system
  const systemEventTypes = ['SLA_BREACH', 'NEW_TICKET', 'TICKET_ESCALATED', 'SYSTEM_DANGER'];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    // In a real implementation, we would fetch from the backend via an API
    // For now, let's mock it or initialize defaults
    setPolicies(systemEventTypes.map(type => ({
      eventType: type,
      soundEnabled: true,
      flashEnabled: type.includes('DANGER') || type.includes('BREACH'),
      toastEnabled: true,
      repeatInterval: type.includes('DANGER') ? 5 : 0 // repeat every 5 mins for danger
    })));
    setLoading(false);
  };

  const updatePolicy = (eventType: string, key: string, value: any) => {
    setPolicies(prev => prev.map(p => p.eventType === eventType ? { ...p, [key]: value } : p));
  };

  const handleSave = async () => {
    // Here we would normally make a PUT/POST request to save to backend DB
    console.log('Saving Notification Policies', policies);
    alert('OU OOO1 OUSOO3OO O U,OO1OOOO O"U+O,OO-!');
  };

  if (loading) return <div style={{ color: '#fff', padding: '20px' }}>جاري التحميل...</div>;

  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '25px',
        border: `1px solid ${theme.colors.primary}44`,
        boxShadow: `0 0 20px ${theme.colors.primary}22`
      }}>
        <h2 style={{ color: theme.colors.primary, marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          مركز سياسات التنبيهات (Notification Policy Center)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {policies.map(policy => (
            <div key={policy.eventType} style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '15px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', width: '25%' }}>{policy.eventType}</div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={policy.soundEnabled} onChange={(e) => updatePolicy(policy.eventType, 'soundEnabled', e.target.checked)} />
                  صوت
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={policy.flashEnabled} onChange={(e) => updatePolicy(policy.eventType, 'flashEnabled', e.target.checked)} />
                  وميض الشاشة
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={policy.toastEnabled} onChange={(e) => updatePolicy(policy.eventType, 'toastEnabled', e.target.checked)} />
                  إشعار نيوني (Toast)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  تكرار (دقائق):
                  <input 
                    type="number" 
                    value={policy.repeatInterval} 
                    onChange={(e) => updatePolicy(policy.eventType, 'repeatInterval', parseInt(e.target.value) || 0)}
                    style={{ width: '60px', padding: '4px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '25px', textAlign: 'right' }}>
          <button onClick={handleSave} style={{
            background: theme.colors.primary,
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 0 10px ${theme.colors.primary}`
          }}>
            حفظ وتفعيل السياسات
          </button>
        </div>
      </div>
    </div>
  );
};
