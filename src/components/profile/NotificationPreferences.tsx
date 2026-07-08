import React, { useState } from 'react';

// Using actual roles from AuthContext / System
export type UserRole = 'Technician' | 'Employee' | 'viewer' | 'editor' | 'Department_Head' | 'HEAD_DEPT' | 'admin' | 'IT_Admin';

export interface NotificationSetting {
  id: string;
  label: string;
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
  isHighPriority?: boolean; // For Emergency WhatsApp Gateway mapping
  slaThresholdMinutes?: number; 
  isSLASetting?: boolean;
  isBroadcastSetting?: boolean;
}

interface NotificationPreferencesProps {
  role: UserRole;
  initialSettings: NotificationSetting[];
  isSlaLockedByAdmin?: boolean; // Admin Master Configuration
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ 
  role, 
  initialSettings, 
  isSlaLockedByAdmin = false 
}) => {
  const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings);

  const isAdmin = role === 'admin' || role === 'IT_Admin';
  const isManager = role === 'Department_Head' || role === 'HEAD_DEPT' || isAdmin;
  const isEngineer = !isManager; // Engineer only sees their own ticket movements

  const toggleChannel = (id: string, channel: 'inApp' | 'email' | 'whatsapp') => {
    // If Admin locks SLA, we might also lock whatsapp overrides for SLA events
    const setting = settings.find(s => s.id === id);
    if (setting?.isSLASetting && isSlaLockedByAdmin && channel === 'whatsapp' && !isAdmin) return;
    
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [channel]: !s[channel] } : s));
  };

  const updateSLAThreshold = (id: string, minutes: number) => {
    if (isSlaLockedByAdmin && !isAdmin) return;
    setSettings(prev => prev.map(s => s.id === id ? { ...s, slaThresholdMinutes: minutes } : s));
  };

  // Separate settings by category
  const standardSettings = settings.filter(s => !s.isSLASetting && !s.isBroadcastSetting);
  const slaSettings = settings.filter(s => s.isSLASetting);
  const broadcastSettings = settings.filter(s => s.isBroadcastSetting);

  // CSS in JS to replicate Tailwind requirements (bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl)
  return (
    <div 
      style={{
        background: 'rgba(15, 23, 42, 0.6)', // bg-slate-900/60
        backdropFilter: 'blur(24px)', // backdrop-blur-xl
        border: '1px solid rgba(51, 65, 85, 0.5)', // border-slate-700/50
        borderRadius: '16px', // rounded-2xl
        padding: '24px',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginTop: '24px',
        direction: 'rtl'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#22d3ee' }}>⚡</span> مصفوفة التنبيهات وإدارة مستوى الخدمة
        </h3>
      </div>

      {/* Emergency WhatsApp Gateway Banner */}
      <div 
        style={{
          background: 'rgba(2, 44, 34, 0.2)', // bg-emerald-950/20
          border: '1px solid rgba(16, 185, 129, 0.3)', // border-emerald-500/30
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
        }}
      >
        <span style={{ fontSize: '24px', filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))' }}>🟢</span>
        <div>
          <h4 style={{ margin: 0, color: '#34d399', fontSize: '14px', fontWeight: 'bold' }}>بوابة طوارئ واتساب (Emergency WhatsApp Gateway)</h4>
          <p style={{ margin: '4px 0 0 0', color: '#a7f3d0', fontSize: '12px' }}>
            تعمل هذه البوابة كقناة تجاوز سريعة (Override) للحالات عالية الأولوية فقط.
          </p>
        </div>
      </div>

      {/* Matrix Interface */}
      <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>نوع الحدث التشغيلي</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>سجل النظام (Cyan)</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>بريد الشركة (Blue)</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>واتساب الطوارئ</th>
            </tr>
          </thead>
          <tbody>
            {/* Standard Settings Row */}
            {standardSettings.map((setting, index) => (
              <tr 
                key={setting.id} 
                style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '16px', fontSize: '13px', color: '#e2e8f0' }}>{setting.label}</td>
                
                {/* In-App Log Cyan */}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <label className="toggle-cyan" style={{ display: 'flex', justifyContent: 'center' }}>
                    <input type="checkbox" checked={setting.inApp} onChange={() => toggleChannel(setting.id, 'inApp')} style={{ cursor: 'pointer', accentColor: '#06b6d4', width: '16px', height: '16px' }} />
                  </label>
                </td>
                
                {/* Office 365 Blue */}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <label className="toggle-blue" style={{ display: 'flex', justifyContent: 'center' }}>
                    <input type="checkbox" checked={setting.email} onChange={() => toggleChannel(setting.id, 'email')} style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }} />
                  </label>
                </td>
                
                {/* Emergency WhatsApp */}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                   <label className="toggle-emerald" style={{ display: 'flex', justifyContent: 'center' }}>
                    <input type="checkbox" checked={setting.whatsapp} onChange={() => toggleChannel(setting.id, 'whatsapp')} style={{ cursor: 'pointer', accentColor: '#10b981', width: '16px', height: '16px' }} />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Managerial Tier Section */}
      {isManager && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#38bdf8', fontWeight: 'bold' }}>
              إعدادات الرقابة الإدارية والتجاوزات (Managerial Tier SLA)
            </h4>
            {isSlaLockedByAdmin && !isAdmin && (
              <span style={{ 
                background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                🔒 مقفل أمنياً من قبل الإدارة
              </span>
            )}
          </div>
          
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden', padding: '16px' }}>
            {slaSettings.map((setting) => (
              <div key={setting.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{setting.label}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>المدة الزمنية للتنبيه (بالدقائق):</span>
                    <input 
                      type="number" 
                      value={setting.slaThresholdMinutes || 0}
                      onChange={(e) => updateSLAThreshold(setting.id, parseInt(e.target.value))}
                      disabled={isSlaLockedByAdmin && !isAdmin}
                      style={{
                        background: (isSlaLockedByAdmin && !isAdmin) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        border: (isSlaLockedByAdmin && !isAdmin) ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: (isSlaLockedByAdmin && !isAdmin) ? '#f87171' : '#f8fafc',
                        width: '80px',
                        outline: 'none',
                        fontSize: '13px',
                        cursor: (isSlaLockedByAdmin && !isAdmin) ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                  
                  {/* Channels for SLA Alert */}
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label title="In-App Log" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" checked={setting.inApp} onChange={() => toggleChannel(setting.id, 'inApp')} style={{ cursor: 'pointer', accentColor: '#06b6d4', width: '16px', height: '16px' }} />
                    </label>
                    <label title="Office 365" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" checked={setting.email} onChange={() => toggleChannel(setting.id, 'email')} style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }} />
                    </label>
                    <label title="Emergency WhatsApp" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" checked={setting.whatsapp} disabled={isSlaLockedByAdmin && !isAdmin} onChange={() => toggleChannel(setting.id, 'whatsapp')} style={{ cursor: (isSlaLockedByAdmin && !isAdmin) ? 'not-allowed' : 'pointer', accentColor: '#10b981', width: '16px', height: '16px' }} />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Broadcast Section */}
      {isAdmin && broadcastSettings.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#f43f5e', fontWeight: 'bold' }}>
              بث النظام الشامل للإدارة العليا (Admin Broadcast)
            </h4>
          </div>
          
          <div style={{ background: 'rgba(225, 29, 72, 0.1)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)', overflow: 'hidden', padding: '16px' }}>
            {broadcastSettings.map((setting) => (
              <div key={setting.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(244, 63, 94, 0.1)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', color: '#ffe4e6', fontWeight: 'bold' }}>{setting.label}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {/* Channels for Broadcast Alert */}
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label title="In-App Log" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" checked={setting.inApp} onChange={() => toggleChannel(setting.id, 'inApp')} style={{ cursor: 'pointer', accentColor: '#06b6d4', width: '16px', height: '16px' }} />
                    </label>
                    <label title="Office 365" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" checked={setting.email} onChange={() => toggleChannel(setting.id, 'email')} style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }} />
                    </label>
                    <label title="Emergency WhatsApp" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" checked={setting.whatsapp} onChange={() => toggleChannel(setting.id, 'whatsapp')} style={{ cursor: 'pointer', accentColor: '#10b981', width: '16px', height: '16px' }} />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Style for the Pulse Animation if not present globally */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .7; }
        }
      `}</style>
    </div>
  );
};

export default NotificationPreferences;
