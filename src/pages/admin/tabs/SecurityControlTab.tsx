import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../engine/ui-loader/ThemeProvider';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;


const A = {
  text: '#1D1D1F', textSub: '#6E6E73', textTer: '#AEAEB2', surface: '#FFFFFF',
  bg: '#F5F5F7', sep: 'rgba(0,0,0,0.08)', radius: '14px', shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  blue: '#007AFF', green: '#34C759', red: '#FF3B30', amber: '#FF9500',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: A.surface, borderRadius: A.radius, border: `1px solid ${A.sep}`, boxShadow: A.shadow, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', ...style }}>{children}</div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; subtitle?: string }> = ({ children, subtitle }) => (
  <div><h4 style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: A.text, fontFamily: A.font }}>{children}</h4>{subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: A.textSub }}>{subtitle}</p>}</div>
);

const ActionButton: React.FC<{ onClick: () => void; label: string; color?: string; loading?: boolean }> = ({ onClick, label, color = A.blue, loading }) => (
  <button onClick={onClick} disabled={loading} style={{ background: `${color}15`, color, border: `1px solid ${color}25`, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: loading ? 'wait' : 'pointer', transition: '0.2s', opacity: loading ? 0.6 : 1 }}>
    {loading ? '⏳' : label}
  </button>
);

export const SecurityControlTab: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newRule, setNewRule] = useState({ ruleType: 'IP_BLOCK', target: '', action: 'BLOCK' });
  const [ruleLoading, setRuleLoading] = useState(false);

  const fetchSOCData = async () => {
    try {
      const [telRes, sessRes, nodeRes, ruleRes, logRes] = await Promise.all([
        fetch('/api/v1/admin/soc/telemetry', { headers: { 'x-user-id': '1' } }),
        fetch('/api/v1/admin/soc/sessions', { headers: { 'x-user-id': '1' } }),
        fetch('/api/v1/admin/soc/waf-nodes', { headers: { 'x-user-id': '1' } }),
        fetch('/api/v1/admin/soc/waf-rules', { headers: { 'x-user-id': '1' } }),
        fetch('/api/v1/admin/soc/siem-logs', { headers: { 'x-user-id': '1' } })
      ]);
      setTelemetry(await telRes.json());
      setSessions((await sessRes.json()).users || []);
      setNodes((await nodeRes.json()).nodes || []);
      setRules((await ruleRes.json()).rules || []);
      setLogs((await logRes.json()).logs || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSOCData();
    const interval = setInterval(fetchSOCData, 10000); // 10s Live Sync
    return () => clearInterval(interval);
  }, []);

  const handleCreateRule = async () => {
    if (!newRule.target) return alert(t('admin.security_control.err_target', 'Target cannot be empty'));
    setRuleLoading(true);
    await fetch('/api/v1/admin/soc/waf-rules', { 
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': '1' }, body: JSON.stringify(newRule) 
    });
    setNewRule({ ruleType: 'IP_BLOCK', target: '', action: 'BLOCK' });
    await fetchSOCData();
    setRuleLoading(false);
  };

  const handleDeleteRule = async (id: string) => {
    await fetch(`/api/v1/admin/soc/waf-rules/${id}`, { method: 'DELETE', headers: { 'x-user-id': '1' } });
    fetchSOCData();
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('admin.security_control.loading') || 'Loading LITC Enterprise SOC...'}</div>;

  return (
    <div className="admin-scroll" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto' }}>
      
      {/* 1. Core Telemetry */}
      <SectionTitle subtitle={t('admin.security_control.sub_telemetry') || 'قراءة حية للعتاد (Bare-Metal Telemetry)'}>{t('admin.security_control.title_telemetry') || 'الموارد الأساسية (Core Resources)'}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card style={{ alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: A.textSub }}>{t('admin.security_control.lbl_cpu') || 'المعالج (CPU)'}</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: telemetry?.cpu > 80 ? A.red : A.blue }}>{telemetry?.cpu ?? 0}%</div>
        </Card>
        <Card style={{ alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: A.textSub }}>{t('admin.security_control.lbl_ram') || 'الذاكرة (RAM)'}</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: A.blue }}>{telemetry?.memoryUsage ?? 0} MB</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 2. WAF Rule Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionTitle subtitle={t('admin.security_control.sub_waf') || 'إضافة قواعد WAF للحماية من الهجمات'}>{t('admin.security_control.title_waf') || 'صانع سياسات الجدار الناري (WAF Rules)'}</SectionTitle>
          <Card>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={newRule.ruleType} onChange={e => setNewRule(p => ({...p, ruleType: e.target.value}))} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${A.sep}` }}>
                <option value="IP_BLOCK">{t('admin.security_control.opt_ip_block') || 'حظر IP'}</option>
                <option value="PAYLOAD_BLOCK">{t('admin.security_control.opt_regex_block') || 'حظر محتوى (Regex)'}</option>
              </select>
              <input type="text" placeholder={t('admin.security_control.placeholder_target') || 'مثال: 192.168.1.5 أو DROP TABLE'} value={newRule.target} onChange={e => setNewRule(p => ({...p, target: e.target.value}))} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${A.sep}` }} />
              <ActionButton label={t('admin.security_control.btn_add') || 'إضافة'} color={A.green} onClick={handleCreateRule} loading={ruleLoading} />
            </div>
            
            <div style={{ marginTop: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              {rules.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: A.bg, borderRadius: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>[{r.ruleType}] {r.target}</span>
                  <ActionButton label={t('admin.security_control.btn_delete') || 'حذف'} color={A.red} onClick={() => handleDeleteRule(r.id)} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 3. SIEM Log Explorer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionTitle subtitle={t('admin.security_control.sub_siem') || 'السجلات الأمنية الحديثة المستخرجة عبر الـ Redis Queue'}>{t('admin.security_control.title_siem') || 'سجلات SIEM'}</SectionTitle>
          <Card style={{ maxHeight: '330px', overflowY: 'auto', padding: '12px' }}>
            {logs.length === 0 ? <div style={{color: A.textSub}}>{t('admin.security_control.no_logs') || 'لا توجد سجلات.'}</div> : logs.map(log => (
              <div key={log.id} style={{ padding: '8px', borderBottom: `1px solid ${A.sep}`, fontSize: '12px', display: 'flex', gap: '12px' }}>
                <div style={{ color: log.severity === 'CRITICAL' ? A.red : log.severity === 'WARNING' ? A.amber : A.blue, fontWeight: 'bold' }}>
                  [{log.severity}]
                </div>
                <div>
                  <div style={{ color: A.text }}>{log.eventType} | <span style={{ color: A.textSub }}>{log.sourceIp}</span></div>
                  <div style={{ color: A.textTer, fontSize: '11px', marginTop: '4px' }}>{new Date(log.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

      </div>
    </div>
  );
};
