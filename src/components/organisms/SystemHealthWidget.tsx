/**
 * LITC-TS v43.0 - SystemHealthWidget Organism
 * لوحة القيادة الذكية والمشفرة لمسؤولي النظام لمتابعة أداء ورصد أخطاء الواجهة بشكل فوري وحي.
 */
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { SystemObserver, RenderLog, ErrorLog } from '../../engine/monitoring/SystemObserver';

export const SystemHealthWidget: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  
  // حالة محلية لتخزين البيانات ورصد التغيرات الفورية
  const [renderLogs, setRenderLogs] = useState<RenderLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [avgLatency, setAvgLatency] = useState<number>(0);

  // حارس أمن إضافي على مستوى المكون
  const isAdmin = hasPermission('admin');

  useEffect(() => {
    if (!isAdmin) return;

    const updateMetrics = () => {
      const currentRenders = SystemObserver.getRenderLogs();
      const currentErrors = SystemObserver.getErrorLogs();
      
      setRenderLogs([...currentRenders]);
      setErrorLogs([...currentErrors]);

      // حساب متوسط الكمون
      if (currentRenders.length > 0) {
        const total = currentRenders.reduce((acc, log) => acc + log.durationMs, 0);
        setAvgLatency(total / currentRenders.length);
      } else {
        setAvgLatency(0);
      }
    };

    // تحديث البيانات فورياً وتكرار التحديث كل ثانية بشكل تلقائي
    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // حظر العرض في حال عدم كفاية الصلاحيات
  if (!isAdmin) {
    return (
      <div style={{
        padding: theme.spacing.lg,
        color: theme.colors.error,
        backgroundColor: '#ffebe6',
        border: `1px solid ${theme.colors.error}`,
        borderRadius: '4px',
        margin: theme.spacing.md
      }}>
        <strong>ACCESS_DENIED:</strong> ليس لديك الصلاحيات الكافية للوصول للمراقب الذكي.
      </div>
    );
  }

  return (
    <div style={{
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.secondary}`,
      borderRadius: '8px',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily
    }}>
      <h2 style={{ 
        fontSize: theme.typography.titleSize, 
        borderBottom: `2px solid ${theme.colors.secondary}`,
        paddingBottom: theme.spacing.sm,
        marginTop: 0,
        color: theme.colors.primary
      }}>
        لوحة قيادة حالة وموثوقية النظام الذاتية LITC-TS v43.0
      </h2>

      {/* لوحة المؤشرات (Metrics Grid) */}
      <div style={{ display: 'flex', gap: theme.spacing.md, margin: `${theme.spacing.md} 0` }}>
        <div style={{
          flex: 1,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.secondary,
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: theme.colors.text }}>متوسط زمن الرندر (Latency)</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0', color: theme.colors.primary }}>
            {avgLatency.toFixed(2)} ms
          </p>
        </div>
        
        <div style={{
          flex: 1,
          padding: theme.spacing.md,
          backgroundColor: errorLogs.length > 0 ? '#ffebe6' : '#e6f4ea',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0, color: theme.colors.text }}>إجمالي الانهيارات المكتشفة</h4>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            margin: '10px 0 0 0', 
            color: errorLogs.length > 0 ? theme.colors.error : theme.colors.success 
          }}>
            {errorLogs.length}
          </p>
        </div>
      </div>

      {/* جدول تتبع الأخطاء الأخيرة */}
      <div>
        <h3 style={{ fontSize: '15px', color: theme.colors.text, marginBottom: theme.spacing.sm }}>
          سجل الانهيارات وأخطاء المكونات الأخيرة (ErrorBoundary Logs):
        </h3>
        
        {errorLogs.length === 0 ? (
          <p style={{ color: theme.colors.success, fontSize: '13px', fontStyle: 'italic' }}>
            ✓ لا توجد أخطاء مكتشفة في عرض المكونات، النظام مستقر تماماً.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.secondary, textAlign: 'left' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Component ID</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Error Type</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>Error Message</th>
              </tr>
            </thead>
            <tbody>
              {errorLogs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{log.componentId}</td>
                  <td style={{ padding: '8px', color: theme.colors.error }}>{log.errorName}</td>
                  <td style={{ padding: '8px', color: '#555' }}>{log.errorMessage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
