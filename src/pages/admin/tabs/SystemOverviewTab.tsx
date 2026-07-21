import React, { useState, useEffect } from 'react';

const APPLE = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  text: '#1D1D1F',
  textSecondary: '#6E6E73',
  separator: 'rgba(0,0,0,0.08)',
  shadowCard: '0 4px 16px rgba(0,0,0,0.04)',
  radiusLg: '20px',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif"
};

export const SystemOverviewTab: React.FC = () => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  const Card: React.FC<{ title: string, icon: string, children: React.ReactNode, color: string }> = ({ title, icon, children, color }) => (
    <div style={{
      background: APPLE.surface,
      borderRadius: APPLE.radiusLg,
      padding: '24px',
      boxShadow: APPLE.shadowCard,
      border: `1px solid ${APPLE.separator}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '4px', height: '100%',
        background: color
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '10px', 
          background: `${color}15`, color: color, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
        }}>
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: APPLE.text }}>{title}</h3>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: APPLE.font, animation: 'appleReveal 0.5s ease forwards' }}>
      
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: APPLE.text, margin: '0 0 8px 0' }}>اللوحة المركزية (Overview)</h2>
          <p style={{ color: APPLE.textSecondary, margin: 0, fontSize: '15px' }}>مراقبة حية للأداء، الأمن، والمستخدمين النشطين (Live Telemetry)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#e6f4ea', color: '#10b981', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', opacity: pulse ? 1 : 0.4, transition: 'opacity 0.5s' }} />
          النظام يعمل بكفاءة
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* DB & Core Health */}
        <Card title="نبض النظام (Core & DB Health)" icon="🗄️" color="#3b82f6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px' }}>حالة قاعدة البيانات:</span>
              <span style={{ fontWeight: 'bold', color: '#10b981' }}>متصل (Healthy)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px' }}>زمن الاستجابة (Latency):</span>
              <span style={{ fontWeight: 'bold', color: APPLE.text }}>24 ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px' }}>مدة التشغيل (Uptime):</span>
              <span style={{ fontWeight: 'bold', color: APPLE.text }}>99.98% (45 Days)</span>
            </div>
            <div style={{ marginTop: '10px', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '90%', background: '#3b82f6', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '11px', color: APPLE.textSecondary }}>استهلاك الموارد: 90% استقرار</span>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card title="المستخدمون النشطون (Active Sessions)" icon="👥" color="#8b5cf6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '36px', fontWeight: '800', color: APPLE.text, lineHeight: '1' }}>124</span>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px', paddingBottom: '4px' }}>مستخدم متصل</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ color: APPLE.textSecondary }}>مدراء النظام:</span>
              <span style={{ fontWeight: 'bold' }}>4</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ color: APPLE.textSecondary }}>رؤساء الأقسام:</span>
              <span style={{ fontWeight: 'bold' }}>12</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ color: APPLE.textSecondary }}>الموظفون:</span>
              <span style={{ fontWeight: 'bold' }}>108</span>
            </div>
          </div>
        </Card>

        {/* Security Radar */}
        <Card title="مراقبة الأمن (Security Radar)" icon="🛡️" color="#ef4444">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px' }}>محاولات دخول فاشلة:</span>
              <span style={{ fontWeight: 'bold', color: '#ef4444' }}>3 (اليوم)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px' }}>معدل طلبات API:</span>
              <span style={{ fontWeight: 'bold', color: APPLE.text }}>450 req/s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px' }}>جدار الحماية (WAF):</span>
              <span style={{ fontWeight: 'bold', color: '#10b981' }}>نشط وفعال</span>
            </div>
            <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', marginTop: '5px' }}>
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>⚠️ تم حظر 2 IP من خارج المنطقة</span>
            </div>
          </div>
        </Card>

        {/* External Integrations */}
        <Card title="الأنظمة الخارجية (Integrations)" icon="🔌" color="#f59e0b">
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px', display: 'flex', gap: '6px', alignItems:'center' }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                Microsoft 365
              </span>
              <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#10b981' }}>Synced 2m ago</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px', display: 'flex', gap: '6px', alignItems:'center' }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                Active Directory
              </span>
              <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#10b981' }}>Live</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: APPLE.textSecondary, fontSize: '14px', display: 'flex', gap: '6px', alignItems:'center' }}>
                <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />
                Legacy ERP Sync
              </span>
              <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#ef4444' }}>Retrying...</span>
            </div>
            <button style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#fef3c7'} onMouseOut={e=>e.currentTarget.style.background='#fffbeb'}>
              إعادة المزامنة الآن
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
};
