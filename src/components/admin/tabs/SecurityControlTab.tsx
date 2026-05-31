import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../../engine/ui-loader/ThemeProvider';
import { EventBus } from '../../../engine/events/EventBus';
import { RolePermission, AuditLogEntry, GovernanceLogEntry } from '../AdminGovernanceConsole';

export const SecurityControlTab: React.FC = () => {
  const theme = useTheme();

  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [governanceLogs, setGovernanceLogs] = useState<GovernanceLogEntry[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'critical' | 'loading'>('loading');
  const [healthLatency, setHealthLatency] = useState<number>(-1);
  const [circuitState, setCircuitState] = useState<'CLOSED' | 'OPEN' | 'HALF-OPEN'>('CLOSED');
  const [queueSize, setQueueSize] = useState<number>(0);
  const [overrideLoading, setOverrideLoading] = useState<boolean>(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  const healthIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHealthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/health', {
        headers: { 'Authorization': 'Bearer system_token_123' }
      });
      if (res.ok || res.status === 503) {
        const data = await res.json();
        setHealthStatus(data.status || 'critical');
        setHealthLatency(data.database?.latencyMs ?? -1);
        if (data.circuitBreaker) {
          setCircuitState(data.circuitBreaker.state);
          setQueueSize(data.circuitBreaker.queueSize ?? 0);
        }
      }
    } catch {
      setHealthStatus('critical');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Permissions mock fetch
      const roles = ['Employee', 'Maintenance_Head', 'IT_Admin'];
      const fetchedPerms: RolePermission[] = [];
      for (const r of roles) {
        const response = await fetch(`/api/v1/auth/permissions/${r}`, {
          headers: { 'Authorization': 'Bearer system_token_123' }
        });
        if (response.ok) {
          const data = await response.json();
          fetchedPerms.push({ roleName: r, canTransfer: data.canTransfer, canClose: data.canClose });
        } else {
          fetchedPerms.push({ roleName: r, canTransfer: false, canClose: false });
        }
      }
      setPermissions(fetchedPerms);

      // Audit logs
      const logsResponse = await fetch('/api/v1/admin/audit-logs', {
        headers: { 'Authorization': 'Bearer system_token_123' }
      });
      if (logsResponse.ok) {
        const result = await logsResponse.json();
        setAuditLogs(result.data || []);
      }

      // Governance ledger
      const govResponse = await fetch('/api/v1/admin/governance-ledger', {
        headers: { 'Authorization': 'Bearer system_token_123' }
      });
      if (govResponse.ok) {
        const result = await govResponse.json();
        setGovernanceLogs(result.data || []);
      }

    } catch (err: any) {
      setError('فشل في جلب بيانات الحوكمة من السيرفر.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHealthStatus();
    healthIntervalRef.current = setInterval(fetchHealthStatus, 10000);
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    };
  }, [fetchData, fetchHealthStatus]);

  const handleCircuitOverride = async (targetState: 'CLOSED' | 'OPEN') => {
    if (overrideLoading) return;
    setOverrideLoading(true);
    setOverrideMessage(null);
    try {
      const res = await fetch('/api/v1/admin/circuit-breaker/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer system_token_123'
        },
        body: JSON.stringify({ targetState })
      });
      const data = await res.json();
      if (res.ok) {
        setCircuitState(data.circuitBreaker?.state ?? targetState);
        setQueueSize(data.circuitBreaker?.queueSize ?? 0);
        setOverrideMessage(`✅ تم فرض حالة ${targetState} بنجاح.`);
      } else {
        setOverrideMessage(`❌ فشل التجاوز: ${data.message}`);
      }
    } catch (err: any) {
      setOverrideMessage(`❌ خطأ في الاتصال: ${err.message}`);
    } finally {
      setOverrideLoading(false);
      setTimeout(() => setOverrideMessage(null), 4000);
    }
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '20px'
  };

  const thStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    textAlign: 'start',
    background: 'rgba(0, 82, 204, 0.25)',
    borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
    fontSize: '14px',
    fontWeight: 'bold'
  };

  const tdStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    fontSize: '13px'
  };

  return (
    <div>
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '15px' }}>
        الأمان والمتابعة (Security & Database Control Core)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* System Health */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ color: theme.colors.primary, marginBottom: '15px' }}>مؤشرات صحة النظام (System Health)</h4>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: healthStatus === 'healthy' ? '#00ff78' : healthStatus === 'degraded' ? '#ffab00' : '#de350b', boxShadow: `0 0 10px ${healthStatus === 'healthy' ? '#00ff78' : healthStatus === 'degraded' ? '#ffab00' : '#de350b'}` }} />
            <span>الحالة العامة: {healthStatus.toUpperCase()}</span>
          </div>
          <div>زمن استجابة قاعدة البيانات: {healthLatency}ms</div>
        </div>

        {/* Circuit Breaker */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ color: theme.colors.primary, marginBottom: '15px' }}>قاطع الدائرة السيادي (Sovereign Circuit Breaker)</h4>
          <div style={{ marginBottom: '10px' }}>الحالة الحالية: <strong style={{ color: circuitState === 'CLOSED' ? '#00ff78' : '#de350b' }}>{circuitState}</strong></div>
          <div style={{ marginBottom: '15px' }}>حجم طابور الانتظار: {queueSize} طلب</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleCircuitOverride('CLOSED')} disabled={overrideLoading} style={{ padding: '6px 12px', background: 'rgba(0, 255, 120, 0.2)', border: '1px solid #00ff78', color: '#00ff78', borderRadius: '6px', cursor: 'pointer' }}>فرض حالة CLOSED</button>
            <button onClick={() => handleCircuitOverride('OPEN')} disabled={overrideLoading} style={{ padding: '6px 12px', background: 'rgba(222, 53, 11, 0.2)', border: '1px solid #de350b', color: '#ffdddd', borderRadius: '6px', cursor: 'pointer' }}>فرض حالة OPEN</button>
          </div>
          {overrideMessage && <div style={{ marginTop: '10px', fontSize: '12px' }}>{overrideMessage}</div>}
        </div>
      </div>

      <h4 style={{ color: theme.colors.primary, marginBottom: '15px' }}>سجلات الحوكمة التشغيلية غير القابلة للتعديل (Immutable Audit Logs)</h4>
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}># المعرف</th>
              <th style={thStyle}>الإجراء</th>
              <th style={thStyle}>السبب</th>
              <th style={thStyle}>وقت التنفيذ</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length > 0 ? auditLogs.map(log => (
              <tr key={log.logId} style={{ background: 'rgba(255,255,255,0.01)' }}>
                <td style={tdStyle}>{log.logId}</td>
                <td style={tdStyle}>تحويل التذكرة #{log.ticketId} من {log.sourceDepartment} إلى {log.targetDepartment}</td>
                <td style={tdStyle}>{log.transferReason}</td>
                <td style={tdStyle}>{log.timestamp}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} style={{...tdStyle, textAlign: 'center'}}>لا توجد سجلات تدقيق</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
