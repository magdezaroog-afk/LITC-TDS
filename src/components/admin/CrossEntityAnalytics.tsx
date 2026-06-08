import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';

interface EntityData {
  department: string;
  total: number;
  open: number;
  closed: number;
  escalated: number;
  performanceScore: number;
}

export const CrossEntityAnalytics: React.FC = () => {
  const theme = useTheme();
  const [data, setData] = useState<EntityData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/v1/analytics/cross-entity', {
          headers: {
            'Authorization': 'Bearer system_token_123'
          }
        });
        
        if (!response.ok) {
          throw new Error('فشل جلب البيانات التحليلية المتقاطعة.');
        }

        const result = await response.json();
        setData(result.data.departments || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderRadius: '24px',
    background: 'linear-gradient(135deg, rgba(20, 20, 40, 0.7) 0%, rgba(10, 10, 20, 0.8) 100%)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(0, 229, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 229, 255, 0.1)',
    color: '#0f172a',
    fontFamily: theme.typography.fontFamily,
    direction: 'rtl',
    position: 'relative',
    overflow: 'hidden',
    marginTop: theme.spacing.xl
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00e5ff',
    textShadow: '0 0 10px rgba(0, 229, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: theme.spacing.xl,
    borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
    paddingBottom: theme.spacing.sm
  };

  const cardGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: theme.spacing.lg
  };

  const cardStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease',
    cursor: 'default'
  };

  const progressBarContainer: React.CSSProperties = {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    marginTop: '8px',
    overflow: 'hidden',
    position: 'relative'
  };

  const getProgressBarFill = (score: number): React.CSSProperties => {
    let color = '#ff3d57'; // Red
    let glow = 'rgba(255, 61, 87, 0.8)';
    if (score >= 80) {
      color = '#00e5ff'; // Cyan/Neon
      glow = 'rgba(0, 229, 255, 0.8)';
    } else if (score >= 50) {
      color = '#ff8c00'; // Orange
      glow = 'rgba(255, 140, 0, 0.8)';
    }

    return {
      height: '100%',
      width: `${score}%`,
      backgroundColor: color,
      boxShadow: `0 0 10px ${glow}`,
      transition: 'width 1s ease-in-out'
    };
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>📊</span> 
        <span>محرك التحاليل التقاطعية (Cross-Entity Analytics)</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#00e5ff', animation: 'pulse 1.5s infinite' }}>
          جاري المعالجة وتحليل البيانات التقاطعية...
        </div>
      ) : error ? (
        <div style={{ background: 'rgba(255, 61, 87, 0.1)', border: '1px solid #ff3d57', padding: '16px', borderRadius: '12px', color: '#ff3d57' }}>
          {error}
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>لا توجد بيانات متاحة للمقارنة.</div>
      ) : (
        <div style={cardGridStyle}>
          {data.map((entity, idx) => (
            <div key={idx} style={cardStyle} className="hover:scale-105">
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '18px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                {entity.department}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>إجمالي التذاكر</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00e5ff' }}>{entity.total}</div>
                </div>
                <div style={{ background: 'rgba(255, 140, 0, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255, 140, 0, 0.2)' }}>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>قيد المعالجة</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff8c00' }}>{entity.open}</div>
                </div>
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#00875a' }}>تم الإنجاز: {entity.closed}</span>
                <span style={{ color: '#ff3d57' }}>تم التصعيد: {entity.escalated}</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.9 }}>
                  <span>مؤشر الكفاءة التشغيلية</span>
                  <span>{entity.performanceScore}%</span>
                </div>
                <div style={progressBarContainer}>
                  <div style={getProgressBarFill(entity.performanceScore)}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
