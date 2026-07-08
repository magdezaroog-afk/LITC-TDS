import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { EventBus } from '../../engine/events/EventBus';

export const UnifiedSmartAnalytics: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Determine user context securely
  const role = (user as any)?.role || 'technician';
  const isAdmin = role === 'admin' || role === 'IT_Admin' || role === 'manager';
  const isHead = role === 'head' || role === 'Head';

  // [TODO/Blueprint] API Migration:
  // currently we fetch from universal-cube mock. In production with SQL Server,
  // we will pass the user's UUID and taxonomy constraints as Query Parameters
  // to fetch precisely filtered analytics without client-side heavy lifting.
  const fetchUniversalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/v1/analytics/universal-cube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer system_token_123'
        },
        body: JSON.stringify({
          startDate: '2026-01-01',
          endDate: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('فشل جلب سياق التحاليل الموحد');
      const res = await response.json();
      setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUniversalData();
    EventBus.on('TICKET_REFRESH', fetchUniversalData);
    return () => {
      EventBus.off('TICKET_REFRESH', fetchUniversalData);
    };
  }, [fetchUniversalData]);

  // Glassmorphic Container
  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.xl,
    borderRadius: '30px',
    background: 'linear-gradient(135deg, rgba(15, 20, 35, 0.8) 0%, rgba(5, 10, 20, 0.9) 100%)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(0, 255, 204, 0.15)',
    boxShadow: '0 10px 40px rgba(0, 255, 204, 0.05), inset 0 0 20px rgba(0, 255, 204, 0.02)',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily,
    direction: 'rtl',
    marginTop: theme.spacing.xl,
    position: 'relative'
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00ffcc',
    textShadow: '0 0 15px rgba(0, 255, 204, 0.6)',
    marginBottom: theme.spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  // 1. Admin Matrix (Governance + System Health)
  const RenderAdminMatrix = ({ context }: { context: any }) => (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#00ffcc' }}>
        لوحة التقارير والتحليلات الرقابية العليا (Governance)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: 'rgba(255,61,87,0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,61,87,0.3)', boxShadow: '0 0 15px rgba(255,61,87,0.1)' }}>
          <h4 style={{ color: '#ff3d57', margin: '0 0 10px 0' }}>مصدات الخرق والسبام</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{context.systemHealth?.spamAttempts || 0}</div>
        </div>
        <div style={{ background: 'rgba(0,255,204,0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,255,204,0.3)', boxShadow: '0 0 15px rgba(0,255,204,0.1)' }}>
          <h4 style={{ color: '#00ffcc', margin: '0 0 10px 0' }}>أداء السيرفر (Memory)</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{context.systemHealth?.processMemoryMB || 0} MB</div>
        </div>
        {context.globalEntities?.map((entity: any) => (
          <div key={entity.name} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', margin: '0 0 10px 0' }}>{entity.name}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
              <span>تذاكر مغلقة</span>
              <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{entity.closed} / {entity.total}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${(entity.closed / Math.max(entity.total, 1)) * 100}%`, height: '100%', background: '#00ffcc', boxShadow: '0 0 10px #00ffcc' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 2. Department Head Heatmap
  const RenderDepartmentHeatmap = ({ context }: { context: any }) => (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#ff8c00' }}>
        تحليلات القسم (Department Heatmap)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: 'rgba(0,255,204,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,255,204,0.2)' }}>
          <h4 style={{ color: '#00ffcc', margin: '0 0 15px 0' }}>أداء المهندسين الفردي</h4>
          {context.departmentHeatmap?.engineers?.map((eng: any) => (
            <div key={eng.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>
              <span>{eng.id}</span>
              <span style={{ color: eng.score > 70 ? '#00ffcc' : '#ff8c00' }}>{eng.score}% إنجاز</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,140,0,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,140,0,0.2)' }}>
          <h4 style={{ color: '#ff8c00', margin: '0 0 15px 0' }}>تحويلات التذاكر الخارجة (Outflow)</h4>
          {context.departmentHeatmap?.subTicketOutflows?.map((out: any) => (
            <div key={out.target} style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
              <span>إلى: {out.target}</span>
              <span style={{ fontWeight: 'bold' }}>{out.count} تذاكر</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 3. Technician Field Ops
  const RenderFieldOps = ({ context }: { context: any }) => (
    <div style={{ animation: 'fadeIn 0.5s ease-out', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
      <h3 style={{ color: '#00ffcc', margin: '0 0 20px 0' }}>العمليات الميدانية الخاصة بك (Field Ops)</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '20px' }}>
        <div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{context.fieldOps?.assignedToMe || 0}</div>
          <div style={{ opacity: 0.7 }}>قيد المعالجة لدي</div>
        </div>
        <div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff8c00' }}>{context.fieldOps?.myPendingSubTickets || 0}</div>
          <div style={{ opacity: 0.7 }}>تذاكر فرعية منتظرة</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>🧊</span> 
        <span>منصة التحليلات الموحدة (Unified Smart Analytics)</span>
      </div>

      {loading ? (
        <div style={{ color: '#00ffcc', textAlign: 'center', padding: '30px', animation: 'pulse 1.5s infinite' }}>جاري تجميع البيانات الاستراتيجية...</div>
      ) : error ? (
        <div style={{ background: 'rgba(255, 61, 87, 0.1)', border: '1px solid #ff3d57', padding: '16px', borderRadius: '12px', color: '#ff3d57' }}>
          {error}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'inline-block' }}>
            تم تكييف نطاق الرؤية لصلاحية: <strong style={{ color: '#00ffcc' }}>{role}</strong>
          </div>
          
          {isAdmin && <RenderAdminMatrix context={data?.context || {}} />}
          {(!isAdmin && isHead) && <RenderDepartmentHeatmap context={data?.context || {}} />}
          {(!isAdmin && !isHead) && <RenderFieldOps context={data?.context || {}} />}
        </div>
      )}
    </div>
  );
};

UnifiedSmartAnalytics.displayName = 'UnifiedSmartAnalytics';
Object.freeze(UnifiedSmartAnalytics);
