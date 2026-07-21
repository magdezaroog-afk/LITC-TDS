import React, { useState, useEffect } from 'react';

interface AuditLog {
  id: number;
  actorId: number;
  targetUserId: number;
  componentKey: string;
  changeSummary: string;
  status: string;
  createdAt: string;
}

export const PolicyVetoTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/governance/policy/pending', {
        headers: { 'Authorization': 'Bearer system_token_123' }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setError('Failed to load pending policies.');
      }
    } catch (err) {
      setError('Network error loading pending policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleAction = async (action: 'approve' | 'veto', logId: number) => {
    try {
      const res = await fetch(`/api/v1/admin/governance/policy/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer system_token_123'
        },
        body: JSON.stringify({ logId })
      });
      if (res.ok) {
        if (navigator.vibrate) navigator.vibrate(50);
        setLogs(prev => prev.filter(l => l.id !== logId));
      } else {
        alert(`Failed to ${action} policy override.`);
      }
    } catch (err) {
      alert(`Error processing ${action}.`);
    }
  };

  const glassPanel: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '25px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
    color: '#172b4d'
  };

  return (
    <div style={{ padding: '20px', direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ ...glassPanel, marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#172b4d', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🚨 Admin Supreme Veto Hub</span>
        </h2>
        <p style={{ margin: 0, color: '#5e6c84', fontSize: '14px' }}>
          مراقبة ونقض الاستثناءات المخصصة لصلاحيات الموظفين من قبل المشرفين قبل اعتمادها بشكل نهائي.
        </p>
      </div>

      <div style={glassPanel}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#0052cc' }}>جاري التحميل...</div>
        ) : error ? (
          <div style={{ color: '#ff5630', padding: '20px', textAlign: 'center' }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#5e6c84', fontSize: '16px' }}>
            لا توجد استثناءات بانتظار المراجعة.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(9,30,66,0.1)', color: '#5e6c84' }}>
                <th style={{ padding: '15px', textAlign: 'right' }}>المعرف</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>المشرف (Actor)</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>الموظف (Target)</th>
                <th style={{ padding: '15px', textAlign: 'right' }}>التفاصيل</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>التاريخ</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>#{log.id}</td>
                  <td style={{ padding: '15px' }}>{log.actorId}</td>
                  <td style={{ padding: '15px' }}>{log.targetUserId}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0052cc' }}>{log.componentKey}</div>
                    <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>{log.changeSummary}</div>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', color: '#5e6c84' }}>
                    {new Date(log.createdAt).toLocaleString('ar-LY')}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleAction('approve', log.id)}
                        style={{ padding: '8px 12px', background: '#e3fcef', color: '#006644', border: '1px solid #79f2c0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                      >
                        ✅ اعتماد الاستثناء
                      </button>
                      <button 
                        onClick={() => handleAction('veto', log.id)}
                        style={{ padding: '8px 12px', background: '#ffebe6', color: '#ff5630', border: '1px solid #ffbdad', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                      >
                        🚨 نقض وإعادة ضبط
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
