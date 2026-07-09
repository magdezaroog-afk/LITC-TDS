import React, { useState, useEffect } from 'react';

/* ── Apple Design Tokens ── */
const A = {
  text: '#1D1D1F',
  textSub: '#6E6E73',
  textTer: '#AEAEB2',
  surface: '#FFFFFF',
  bg: '#F5F5F7',
  sep: 'rgba(0,0,0,0.08)',
  sepStr: 'rgba(0,0,0,0.12)',
  radius: '14px',
  radiusSm: '10px',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  amber: '#FF9500',
  purple: '#AF52DE',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
};

const EVENT_META: Record<string, { label: string; description: string; color: string; icon: string }> = {
  SLA_BREACH: {
    label: 'خرق مستوى الخدمة',
    description: 'تجاوز وقت الاستجابة المتفق عليه (SLA)',
    color: A.red,
    icon: '⚡',
  },
  NEW_TICKET: {
    label: 'تذكرة جديدة',
    description: 'عند إنشاء تذكرة دعم جديدة',
    color: A.blue,
    icon: '📩',
  },
  TICKET_ESCALATED: {
    label: 'تصعيد التذكرة',
    description: 'رفع التذكرة لمستوى أعلى',
    color: A.amber,
    icon: '🔼',
  },
  SYSTEM_DANGER: {
    label: 'خطر النظام',
    description: 'تنبيهات الأمان والأحداث الحرجة',
    color: '#FF453A',
    icon: '🚨',
  },
};

/* ── Toggle Switch Component ── */
const AppleToggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}> = ({ checked, onChange, color = A.green }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: '44px',
      height: '26px',
      borderRadius: '13px',
      background: checked ? color : '#E5E5EA',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.25s ease',
      flexShrink: 0,
      boxShadow: checked ? `0 0 8px ${color}40` : 'none',
    }}
  >
    <div style={{
      position: 'absolute',
      top: '3px',
      left: checked ? '21px' : '3px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: '#FFFFFF',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      transition: 'left 0.25s cubic-bezier(0.28, 0.11, 0.32, 1)',
    }} />
  </div>
);

/* ── Main Component ── */
export const NotificationPolicyConsole: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const systemEventTypes = ['SLA_BREACH', 'NEW_TICKET', 'TICKET_ESCALATED', 'SYSTEM_DANGER'];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setPolicies(systemEventTypes.map(type => ({
      eventType: type,
      soundEnabled: true,
      flashEnabled: type.includes('DANGER') || type.includes('BREACH'),
      toastEnabled: true,
      repeatInterval: type.includes('DANGER') ? 5 : 0,
    })));
    setLoading(false);
  };

  const updatePolicy = (eventType: string, key: string, value: any) => {
    setPolicies(prev => prev.map(p => p.eventType === eventType ? { ...p, [key]: value } : p));
  };

  const handleSave = async () => {
    console.log('Saving Notification Policies', policies);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: A.textTer, fontFamily: A.font }}>
      <div>جاري التحميل...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: A.font, color: A.text, maxWidth: '800px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: A.text, letterSpacing: '-0.4px' }}>
          سياسات التنبيهات
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: A.textSub }}>
          Notification Policy Center — تحكم كامل في كيفية وتكرار التنبيهات لكل حدث
        </p>
      </div>

      {/* Policy Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
        {policies.map(policy => {
          const meta = EVENT_META[policy.eventType] || {
            label: policy.eventType,
            description: '',
            color: A.blue,
            icon: '🔔',
          };

          return (
            <div
              key={policy.eventType}
              style={{
                background: A.surface,
                borderRadius: A.radius,
                border: `1px solid ${A.sep}`,
                boxShadow: A.shadow,
                padding: '20px 24px',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `${meta.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0,
                }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: A.text }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: '12px', color: A.textSub, marginTop: '2px' }}>
                    {meta.description}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px', fontWeight: '700', color: meta.color,
                  background: `${meta.color}12`, padding: '3px 10px',
                  borderRadius: '20px', fontFamily: 'monospace',
                }}>
                  {policy.eventType}
                </div>
              </div>

              {/* Toggle Controls */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
              }}>
                {/* Sound */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: A.bg, borderRadius: '10px', padding: '10px 14px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: A.text }}>🔊 صوت</div>
                    <div style={{ fontSize: '11px', color: A.textTer }}>تنبيه صوتي</div>
                  </div>
                  <AppleToggle
                    checked={policy.soundEnabled}
                    onChange={v => updatePolicy(policy.eventType, 'soundEnabled', v)}
                    color={meta.color}
                  />
                </div>

                {/* Flash */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: A.bg, borderRadius: '10px', padding: '10px 14px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: A.text }}>✨ وميض</div>
                    <div style={{ fontSize: '11px', color: A.textTer }}>إضاءة الشاشة</div>
                  </div>
                  <AppleToggle
                    checked={policy.flashEnabled}
                    onChange={v => updatePolicy(policy.eventType, 'flashEnabled', v)}
                    color={meta.color}
                  />
                </div>

                {/* Toast */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: A.bg, borderRadius: '10px', padding: '10px 14px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: A.text }}>💬 Toast</div>
                    <div style={{ fontSize: '11px', color: A.textTer }}>إشعار منبثق</div>
                  </div>
                  <AppleToggle
                    checked={policy.toastEnabled}
                    onChange={v => updatePolicy(policy.eventType, 'toastEnabled', v)}
                    color={meta.color}
                  />
                </div>

                {/* Repeat Interval */}
                <div style={{
                  background: A.bg, borderRadius: '10px', padding: '10px 14px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: A.text, marginBottom: '6px' }}>
                    🔁 تكرار كل
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={policy.repeatInterval}
                      onChange={e => updatePolicy(policy.eventType, 'repeatInterval', parseInt(e.target.value) || 0)}
                      min={0}
                      style={{
                        width: '64px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${A.sepStr}`,
                        background: A.surface,
                        color: A.text,
                        fontSize: '14px',
                        fontFamily: A.font,
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: A.textSub }}>دقيقة</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '12px 32px',
            background: saved ? A.green : A.purple,
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: A.font,
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 14px ${saved ? A.green : A.purple}40`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {saved ? '✓ تم الحفظ بنجاح' : 'حفظ وتفعيل السياسات'}
        </button>
      </div>
    </div>
  );
};
