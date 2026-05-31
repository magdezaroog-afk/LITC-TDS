import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';

export const UniversalAnalyticsCube: React.FC<{ user: any }> = ({ user }) => {
  const theme = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUniversalData = async () => {
      try {
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
    };
    fetchUniversalData();
  }, []);

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
    fontWeight: '800',
    color: '#00ffcc',
    textShadow: '0 0 15px rgba(0, 255, 204, 0.6)',
    marginBottom: theme.spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const RenderAdminMatrix = ({ context }: { context: any }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,255,204,0.3)' }}>
        <h4 style={{ color: '#00ffcc' }}>أداء الذاكرة والسيرفر</h4>
        <div style={{ margin: '15px 0' }}>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>الذاكرة المستخدمة</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{context.systemHealth?.processMemoryMB} MB</div>
        </div>
        <div style={{ margin: '15px 0' }}>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>الاتصالات النشطة بقاعدة البيانات</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff3d57' }}>{context.systemHealth?.activeConnections}</div>
        </div>
      </div>
      
      {context.globalEntities?.map((entity: any) => (
        <div key={entity.name} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>{entity.name}</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <span>تذاكر مغلقة</span>
            <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{entity.closed} / {entity.total}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const RenderDepartmentHeatmap = ({ context }: { context: any }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div style={{ background: 'rgba(0,255,204,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,255,204,0.2)' }}>
        <h4 style={{ color: '#00ffcc' }}>أداء المهندسين</h4>
        {context.departmentHeatmap?.engineers?.map((eng: any) => (
          <div key={eng.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>
            <span>{eng.id}</span>
            <span style={{ color: eng.score > 70 ? '#00ffcc' : '#ff8c00' }}>{eng.score}% إنجاز</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,61,87,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,61,87,0.2)' }}>
        <h4 style={{ color: '#ff3d57' }}>تحويلات التذاكر الإضافية (Outflow)</h4>
        {context.departmentHeatmap?.subTicketOutflows?.map((out: any) => (
          <div key={out.target} style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
            <span>إلى: {out.target}</span>
            <span style={{ fontWeight: 'bold' }}>{out.count} تذاكر</span>
          </div>
        ))}
      </div>
    </div>
  );

  const RenderFieldOps = ({ context }: { context: any }) => (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
      <h3 style={{ color: '#00ffcc' }}>العمليات الميدانية</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '20px' }}>
        <div>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{context.fieldOps?.assignedToMe}</div>
          <div style={{ opacity: 0.7 }}>قيد المعالجة لدي</div>
        </div>
        <div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff8c00' }}>{context.fieldOps?.myPendingSubTickets}</div>
          <div style={{ opacity: 0.7 }}>تذاكر فرعية منتظرة</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>🧊</span> 
        <span>المكعب التحليلي الموحد (Polymorphic Cube)</span>
      </div>

      {loading ? (
        <div style={{ color: '#00ffcc', textAlign: 'center', padding: '30px' }}>جاري تشكيل المكعب وتحليل السياق...</div>
      ) : error ? (
        <div style={{ color: '#ff3d57' }}>{error}</div>
      ) : (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ marginBottom: '20px', opacity: 0.7 }}>
            تم التحور بناءً على الصلاحية: <strong style={{ color: '#fff' }}>{data?.role}</strong>
          </div>
          
          {data?.role === 'IT_Admin' && <RenderAdminMatrix context={data.context} />}
          {(data?.role?.includes('Head') || data?.role === 'Admin') && <RenderDepartmentHeatmap context={data.context} />}
          {data?.role === 'Technician' && <RenderFieldOps context={data.context} />}
        </div>
      )}
    </div>
  );
};
