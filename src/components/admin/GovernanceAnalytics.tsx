import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { EventBus } from '../../engine/events/EventBus';

export interface SLAComplianceEntry {
  department: string;
  stableTickets: number;
  escalatedTickets: number;
}

export interface HourlyViolationEntry {
  hour: number;
  violationsCount: number;
  totalTransfers: number;
}

export interface AnalyticsKPIs {
  totalTickets: number;
  avgClosureTimeMinutes: number;
  totalAuditedActivities: number;
  spamAttempts: number;
}

export const GovernanceAnalytics: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  // التحقق السيادي الصارم من الهوية ودور المسؤول الأعلى
  const isAdmin = user && user.role === 'IT_Admin';

  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [slaCompliance, setSlaCompliance] = useState<SLAComplianceEntry[]>([]);
  const [hourlyViolations, setHourlyViolations] = useState<HourlyViolationEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // جلب البيانات الإحصائية التجميعية من الباك-إند
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/admin/analytics/sla', {
        headers: {
          'Authorization': 'Bearer system_token_123'
        }
      });

      if (!response.ok) {
        throw new Error(`خطأ في جلب البيانات الإحصائية: ${response.statusText}`);
      }

      const data = await response.json();
      setKpis(data.kpis);
      setSlaCompliance(data.slaCompliance || []);
      setHourlyViolations(data.hourlyViolations || []);
    } catch (err: any) {
      setError(err.message || 'فشل في استرجاع تحليلات الحوكمة من السيرفر.');
      console.error('[GovernanceAnalytics] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
      
      // إعادة الجلب التلقائي عند حدوث تحديث للصلاحيات أو التذاكر
      EventBus.on('TICKET_REFRESH', fetchAnalytics);
      
      return () => {
        EventBus.off('TICKET_REFRESH', fetchAnalytics);
      };
    }
  }, [isAdmin, fetchAnalytics]);

  // شاشة المنع والحظر الأمني الصارم لغير المسؤولين
  if (!isAdmin) {
    return (
      <div style={{
        padding: theme.spacing.xl,
        borderRadius: '24px',
        background: 'rgba(222, 53, 11, 0.1)',
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(222, 53, 11, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        color: '#ffdddd',
        fontFamily: theme.typography.fontFamily,
        maxWidth: '700px',
        margin: '60px auto',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '50px', marginBottom: theme.spacing.md }}>🛑</div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>خرق أمني - حظر صلاحيات الوصول</h2>
        <p style={{ fontSize: '13px', margin: 0, opacity: 0.9 }}>
          هذه الشاشة مخصصة لتحليلات المسؤول الأعلى للأنظمة والشبكات (IT_Admin). لا يمتلك حسابك صلاحيات كافية لاستعراض معدلات حوكمة الـ SLA أو تتبع الخروقات.
        </p>
      </div>
    );
  }

  // التنسيقات البصرية والجمالية الزجاجية المتوهجة (Glassmorphism Concept)
  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderRadius: '24px',
    background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily,
    maxWidth: '1200px',
    margin: '20px auto',
    boxSizing: 'border-box'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: theme.spacing.xl
  };

  const cardStyle = (glowColor: string): React.CSSProperties => ({
    padding: theme.spacing.md,
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: `inset 0 0 15px rgba(255, 255, 255, 0.02), 0 4px 15px rgba(0, 0, 0, 0.15)`,
    transition: 'transform 0.3s ease, border-color 0.3s ease',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  });

  const chartContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: theme.spacing.xl,
    boxSizing: 'border-box'
  };

  @media (max-width: 900px) {
    chartContainerStyle.gridTemplateColumns = '1fr';
  }

  const chartBoxStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: theme.spacing.lg,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(10px)'
  };

  const barStyle = (percentage: number, color: string): React.CSSProperties => ({
    height: '100%',
    width: `${percentage}%`,
    background: color,
    borderRadius: '4px',
    boxShadow: `0 0 10px ${color}`,
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  });

  // حساب النسبة المئوية للالتزام بالـ SLA لقسم معين
  const calculateSlaPercent = (stable: number, escalated: number): number => {
    const total = stable + escalated;
    if (total === 0) return 100;
    return Math.round((stable / total) * 100);
  };

  // العثور على القيمة القصوى للخروقات بالساعات لتطبيع طول الأعمدة البيانية
  const maxViolationValue = Math.max(...hourlyViolations.map(h => h.violationsCount), 1);

  return (
    <div style={containerStyle}>
      <h2 style={{
        fontSize: '22px',
        fontWeight: 'bold',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        paddingBottom: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>📊 لوحة التقارير والتحليلات الرقابية العليا (IT_Admin)</span>
        <button 
          onClick={fetchAnalytics} 
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 82, 204, 0.2)',
            border: '1px solid rgba(0, 82, 204, 0.4)',
            borderRadius: '8px',
            color: '#00a3ff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 0 10px rgba(0, 163, 255, 0.2)',
            transition: 'all 0.3s'
          }}
        >
          تحديث التحليلات
        </button>
      </h2>

      {error && (
        <div style={{ padding: theme.spacing.sm, backgroundColor: 'rgba(222, 53, 11, 0.2)', border: '1px solid #de350b', borderRadius: '8px', marginBottom: theme.spacing.md, fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: theme.spacing.xl, textAlign: 'center', opacity: 0.8, fontSize: '14px' }}>
          جاري تجميع البيانات والحسابات الإحصائية من قاعدة البيانات...
        </div>
      ) : (
        <>
          {/* كروت الـ KPI الحيوية المتوهجة */}
          <div style={gridStyle}>
            <div style={cardStyle('#0052cc')}>
              <span style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>إجمالي تذاكر النظام</span>
              <strong style={{ fontSize: '28px', color: '#00a3ff', textShadow: '0 0 10px rgba(0, 163, 255, 0.4)' }}>
                {kpis?.totalTickets || 0}
              </strong>
            </div>

            <div style={cardStyle('#ff8c00')}>
              <span style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>متوسط زمن إغلاق التذاكر</span>
              <strong style={{ fontSize: '28px', color: '#ff8c00', textShadow: '0 0 10px rgba(255, 140, 0, 0.4)' }}>
                {kpis?.avgClosureTimeMinutes ? `${kpis.avgClosureTimeMinutes} دقيقة` : 'لا يوجد تذاكر مغلقة'}
              </strong>
            </div>

            <div style={cardStyle('#00875a')}>
              <span style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>إجمالي الأنشطة المراجعة</span>
              <strong style={{ fontSize: '28px', color: '#00875a', textShadow: '0 0 10px rgba(0, 135, 90, 0.4)' }}>
                {kpis?.totalAuditedActivities || 0}
              </strong>
            </div>

            <div style={cardStyle('#ff3b30')}>
              <span style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>مصدات الخرق والسبام المفعّلة</span>
              <strong style={{ fontSize: '28px', color: '#ff3b30', textShadow: '0 0 10px rgba(255, 59, 48, 0.4)' }}>
                {kpis?.spamAttempts || 0}
              </strong>
            </div>
          </div>

          {/* قسم الرسوم البيانية الزجاجية */}
          <div style={chartContainerStyle}>
            
            {/* الرسم البياني الأول: معدل الالتزام بالـ SLA لكل قسم */}
            <div style={chartBoxStyle}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                معدل الالتزام بالـ SLA والتصعيد للأقسام
              </h3>
              {slaCompliance.length === 0 ? (
                <div style={{ opacity: 0.6, fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>لا تتوفر تذاكر لحساب الحوكمة.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {slaCompliance.map((item) => {
                    const slaRate = calculateSlaPercent(item.stableTickets, item.escalatedTickets);
                    const color = slaRate >= 80 ? '#00875a' : slaRate >= 50 ? '#ff8c00' : '#de350b';
                    return (
                      <div key={item.department}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                          <span>قسم: <strong>{item.department}</strong></span>
                          <span>معدل الالتزام: <strong style={{ color }}>{slaRate}%</strong></span>
                        </div>
                        {/* الخلفية الزجاجية للمؤشر */}
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={barStyle(slaRate, color)} />
                        </div>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                          <span>التذاكر المستقرة: {item.stableTickets}</span>
                          <span>التذاكر المصعدة/المخترقة لزمن الـ SLA: {item.escalatedTickets}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* الرسم البياني الثاني: خط تتبع الخروقات التراكمي بالساعات */}
            <div style={chartBoxStyle}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                خط تتبع الخروقات ومحاولات الاستدعاء الخاطئ بالساعات
              </h3>
              <div style={{
                display: 'flex',
                height: '180px',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingTop: '20px',
                boxSizing: 'border-box',
                borderBottom: '1px solid rgba(255,255,255,0.15)'
              }}>
                {hourlyViolations.map((h) => {
                  const percentage = (h.violationsCount / maxViolationValue) * 100;
                  const isPeak = h.violationsCount > 0;
                  return (
                    <div 
                      key={h.hour} 
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        height: '100%',
                        justifyContent: 'flex-end',
                        position: 'relative'
                      }}
                      title={`الساعة ${h.hour}:00 - عدد خروقات الحوكمة: ${h.violationsCount} (إجمالي الحركات: ${h.totalTransfers})`}
                    >
                      {/* عمود الخروقات الملون بالتوهج في فترات الذروة */}
                      {isPeak && (
                        <div style={{
                          width: '60%',
                          height: `${Math.max(percentage, 5)}%`,
                          background: 'linear-gradient(to top, #ff3b30, #ff8c00)',
                          borderRadius: '4px 4px 0 0',
                          boxShadow: '0 0 10px rgba(255, 59, 48, 0.6)',
                          transition: 'height 0.8s ease'
                        }} />
                      )}
                      
                      {/* عمود التحويلات الطبيعية بلون باهت في الخلفية */}
                      {!isPeak && h.totalTransfers > 0 && (
                        <div style={{
                          width: '40%',
                          height: `${Math.min((h.totalTransfers / (maxViolationValue * 2)) * 100, 100)}%`,
                          background: 'rgba(0, 163, 255, 0.2)',
                          borderRadius: '2px 2px 0 0'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.6, marginTop: '8px' }}>
                <span>12 AM (منتصف الليل)</span>
                <span>12 PM (الظهر)</span>
                <span>11 PM (مساءً)</span>
              </div>

              <div style={{ display: 'flex', gap: '15px', fontSize: '11px', marginTop: '15px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(to top, #ff3b30, #ff8c00)', boxShadow: '0 0 5px rgba(255, 59, 48, 0.6)' }} />
                  <span>محاولة خرق حوكمة / سبام</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(0, 163, 255, 0.2)' }} />
                  <span>نشاط تحويل اعتيادي للمسار</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

GovernanceAnalytics.displayName = 'GovernanceAnalytics';
Object.freeze(GovernanceAnalytics);
