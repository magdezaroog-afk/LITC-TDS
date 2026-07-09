import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../../engine/ui-loader/ThemeProvider';
import { EventBus } from '../../../engine/events/EventBus';
import { RolePermission, AuditLogEntry, GovernanceLogEntry } from '../AdminGovernanceConsole';

/* ── Apple Design Tokens ── */
const A = {
  text: '#1D1D1F',
  textSub: '#6E6E73',
  textTer: '#AEAEB2',
  surface: '#FFFFFF',
  bg: '#F5F5F7',
  sep: 'rgba(0,0,0,0.08)',
  radius: '14px',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  amber: '#FF9500',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
};

/* ── Shared Sub-components ── */
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: A.surface,
    borderRadius: A.radius,
    border: `1px solid ${A.sep}`,
    boxShadow: A.shadow,
    padding: '24px',
    ...style
  }}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = A.text }) => (
  <h4 style={{
    margin: '0 0 16px',
    fontSize: '15px',
    fontWeight: '700',
    color,
    letterSpacing: '-0.2px',
    fontFamily: A.font,
  }}>
    {children}
  </h4>
);

const StatusDot: React.FC<{ status: 'healthy' | 'degraded' | 'critical' | 'loading' }> = ({ status }) => {
  const colors: Record<string, string> = {
    healthy: A.green,
    degraded: A.amber,
    critical: A.red,
    loading: A.textTer,
  };
  return (
    <div style={{
      width: '10px', height: '10px', borderRadius: '50%',
      background: colors[status] || A.textTer,
      boxShadow: status === 'loading' ? 'none' : `0 0 6px ${colors[status]}80`,
      flexShrink: 0,
    }} />
  );
};

const AppleButton: React.FC<{
  onClick: () => void;
  color?: string;
  variant?: 'solid' | 'ghost' | 'tinted';
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ onClick, color = A.blue, variant = 'tinted', disabled, children, style }) => {
  const base: React.CSSProperties = {
    padding: '9px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.18s ease',
    fontFamily: A.font,
    opacity: disabled ? 0.4 : 1,
  };
  const styles: Record<string, React.CSSProperties> = {
    solid: { background: color, color: '#fff', boxShadow: `0 2px 8px ${color}40` },
    tinted: { background: `${color}15`, color, border: `1px solid ${color}25` },
    ghost: { background: 'transparent', color, border: `1px solid ${A.sep}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...styles[variant], ...style }}>
      {children}
    </button>
  );
};

/* ── Main Component ── */
export const SecurityControlTab: React.FC = () => {
  const theme = useTheme();

  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [governanceLogs, setGovernanceLogs] = useState<GovernanceLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

      const logsResponse = await fetch('/api/v1/admin/audit-logs', {
        headers: { 'Authorization': 'Bearer system_token_123' }
      });
      if (logsResponse.ok) {
        const result = await logsResponse.json();
        setAuditLogs(result.data || []);
      }

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
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer system_token_123' },
        body: JSON.stringify({ targetState })
      });
      const data = await res.json();
      if (res.ok) {
        setCircuitState(data.circuitBreaker?.state ?? targetState);
        setQueueSize(data.circuitBreaker?.queueSize ?? 0);
        setOverrideMessage(`تم تطبيق حالة ${targetState} بنجاح`);
      } else {
        setOverrideMessage(`فشل التجاوز: ${data.message}`);
      }
    } catch (err: any) {
      setOverrideMessage(`خطأ في الاتصال: ${err.message}`);
    } finally {
      setOverrideLoading(false);
      setTimeout(() => setOverrideMessage(null), 4000);
    }
  };

  const statusLabels: Record<string, string> = {
    healthy: 'يعمل بشكل طبيعي',
    degraded: 'أداء منخفض',
    critical: 'حالة حرجة',
    loading: 'جاري الفحص...',
  };

  return (
    <div style={{ fontFamily: A.font, color: A.text, maxWidth: '900px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: A.text, letterSpacing: '-0.4px' }}>
          الأمان والحوكمة
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: A.textSub }}>
          Security Control Core — مراقبة النظام وقاطع الدائرة والسجلات غير القابلة للتعديل
        </p>
      </div>

      {/* Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* System Health Card */}
        <Card>
          <SectionTitle>صحة النظام</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <StatusDot status={healthStatus} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: A.text }}>
                {statusLabels[healthStatus]}
              </div>
              <div style={{ fontSize: '12px', color: A.textTer, marginTop: '2px' }}>
                {healthStatus.toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{
            background: A.bg, borderRadius: '10px', padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: A.textSub }}>استجابة قاعدة البيانات</span>
            <span style={{
              fontSize: '14px', fontWeight: '700',
              color: healthLatency < 100 ? A.green : healthLatency < 300 ? A.amber : A.red
            }}>
              {healthLatency >= 0 ? `${healthLatency}ms` : '—'}
            </span>
          </div>
        </Card>

        {/* Circuit Breaker Card */}
        <Card>
          <SectionTitle>قاطع الدائرة السيادي</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              background: circuitState === 'CLOSED' ? `${A.green}15` : `${A.red}15`,
              color: circuitState === 'CLOSED' ? A.green : A.red,
              border: `1px solid ${circuitState === 'CLOSED' ? A.green : A.red}25`,
            }}>
              <span style={{ fontSize: '8px' }}>●</span>
              {circuitState}
            </div>
            <span style={{ fontSize: '12px', color: A.textSub }}>
              {queueSize} طلب في الطابور
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <AppleButton
              onClick={() => handleCircuitOverride('CLOSED')}
              color={A.green}
              variant="tinted"
              disabled={overrideLoading}
            >
              فرض CLOSED
            </AppleButton>
            <AppleButton
              onClick={() => handleCircuitOverride('OPEN')}
              color={A.red}
              variant="tinted"
              disabled={overrideLoading}
            >
              فرض OPEN
            </AppleButton>
          </div>
          {overrideMessage && (
            <div style={{
              marginTop: '12px', padding: '8px 12px',
              background: A.bg, borderRadius: '8px',
              fontSize: '12px', color: A.textSub
            }}>
              {overrideMessage}
            </div>
          )}
        </Card>
      </div>

      {/* Audit Logs Card */}
      <Card>
        <SectionTitle>سجلات التدقيق غير القابلة للتعديل</SectionTitle>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: A.textTer, fontSize: '14px' }}>
            جاري التحميل...
          </div>
        ) : auditLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: A.textTer }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>لا توجد سجلات تدقيق</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${A.sep}` }}>
                  {['# المعرف', 'الإجراء', 'السبب', 'وقت التنفيذ'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'start',
                      fontSize: '11px', fontWeight: '700',
                      color: A.textTer, textTransform: 'uppercase',
                      letterSpacing: '0.5px', background: A.bg,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={log.logId} style={{
                    borderBottom: `1px solid ${A.sep}`,
                    background: i % 2 === 0 ? 'transparent' : A.bg + '50',
                  }}>
                    <td style={{ padding: '12px 14px', fontSize: '12px', fontFamily: 'monospace', color: A.textSub }}>
                      {log.logId}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: A.text }}>
                      تحويل التذكرة #{log.ticketId} من {log.sourceDepartment} إلى {log.targetDepartment}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: A.textSub }}>
                      {log.transferReason}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: A.textTer }}>
                      {log.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
