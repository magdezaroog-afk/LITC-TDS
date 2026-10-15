/**
 * LITC Enterprise OS v43 - Multi-Dimensional Comparative Engine
 * =============================================================
 * محرك المقارنة والمفاضلة متعدد الأبعاد:
 * 1. مقارنة الكادر الفني (فني ضد فني في مؤشرات الأداء والإنجاز)
 * 2. مقارنة المواقع والمباني (مبنى ضد مبنى في أنواع الأعطال والأحمال)
 * 3. المقارنة الزمنية والموضوعية المتقاطعة (مشكلة فرعية محددة عبر فترتين وموقعين)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Building2, Calendar, TrendingUp, TrendingDown, 
  ArrowRightLeft, Award, CheckCircle2, Clock, AlertTriangle, 
  Download, RefreshCw, BarChart2, ShieldCheck, Filter
} from 'lucide-react';

export interface MultiDimensionalComparatorProps {
  departmentId: number;
  departmentName: string;
  technicians: Array<{ id: number; fullName?: string; username: string; jobTitle?: string }>;
  buildings: Array<{ id: number; name: string }>;
  canExport?: boolean;
}

export const MultiDimensionalComparator: React.FC<MultiDimensionalComparatorProps> = ({
  departmentId,
  departmentName,
  technicians = [],
  buildings = [],
  canExport = true
}) => {
  // أنماط المقارنة: كوادر / مباني / مشكلة متقاطعة زمنياً
  const [activeMode, setActiveMode] = useState<'PEER_VS_PEER' | 'BUILDING_VS_BUILDING' | 'CROSS_TEMPORAL_ISSUE'>('PEER_VS_PEER');

  // حالة مقارنة الكوادر
  const [selectedTech1, setSelectedTech1] = useState<number>(technicians[0]?.id || 0);
  const [selectedTech2, setSelectedTech2] = useState<number>(technicians[1]?.id || technicians[0]?.id || 0);

  // حالة مقارنة المشكلة المتقاطعة زمنياً
  const [selectedIssue, setSelectedIssue] = useState<string>('انقطاع كامل للشبكة');
  const [periodALabel, setPeriodALabel] = useState<string>('الشهر الحالي');
  const [periodBLabel, setPeriodBLabel] = useState<string>('الشهر السابق');

  // البيانات والحالة
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // جلب المقارنة
  const fetchComparison = useCallback(async () => {
    if (!departmentId) return;
    try {
      setLoading(true);
      setError(null);

      let payload: any = {
        departmentId,
        comparisonType: activeMode
      };

      if (activeMode === 'PEER_VS_PEER') {
        payload.targetIds = [selectedTech1, selectedTech2].filter(Boolean);
      } else if (activeMode === 'BUILDING_VS_BUILDING') {
        payload.targetIds = buildings.map(b => b.id);
      } else if (activeMode === 'CROSS_TEMPORAL_ISSUE') {
        payload.issueKey = 'sub_issue';
        payload.issueValue = selectedIssue;
        payload.periodA = {
          label: periodALabel,
          start: new Date(Date.now() - 30 * 86400000).toISOString(),
          end: new Date().toISOString()
        };
        payload.periodB = {
          label: periodBLabel,
          start: new Date(Date.now() - 60 * 86400000).toISOString(),
          end: new Date(Date.now() - 31 * 86400000).toISOString()
        };
      }

      const res = await fetch('/api/v1/analytics/compare', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل إجراء المقارنة الإحصائية');
      }

      const json = await res.json();
      setComparisonData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [departmentId, activeMode, selectedTech1, selectedTech2, selectedIssue, periodALabel, periodBLabel, buildings]);

  // مزامنة الفنيين المحددين عند تحميل بيانات الكوادر من الإدارة
  useEffect(() => {
    if (technicians && technicians.length > 0) {
      setSelectedTech1(prev => (prev && technicians.some(t => t.id === prev) ? prev : technicians[0].id));
      setSelectedTech2(prev => {
        if (prev && technicians.some(t => t.id === prev) && prev !== (technicians[0]?.id)) return prev;
        return technicians[1]?.id || technicians[0].id;
      });
    }
  }, [technicians]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  // تصدير النتائج لملف CSV
  const handleExportCSV = () => {
    if (!comparisonData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeMode === 'PEER_VS_PEER' && Array.isArray(comparisonData)) {
      csvContent += 'الاسم,المسمى الوظيفي,إجمالي التذاكر,المغلقة,نسبة الإنجاز,التقييم\n';
      comparisonData.forEach((item: any) => {
        csvContent += `"${item.name}","${item.title}",${item.totalTickets},${item.closedTickets},${item.completionRate}%,${item.avgRating}\n`;
      });
    } else if (activeMode === 'BUILDING_VS_BUILDING' && Array.isArray(comparisonData)) {
      csvContent += 'المبنى,إجمالي التذاكر,المغلقة,العطل الأبرز,الالتزام بـ SLA\n';
      comparisonData.forEach((item: any) => {
        csvContent += `"${item.buildingName}",${item.totalTickets},${item.closedTickets},"${item.topIssue}",${item.slaCompliance}%\n`;
      });
    } else if (activeMode === 'CROSS_TEMPORAL_ISSUE') {
      csvContent += `العطل المستهدف,${comparisonData.targetIssue}\n`;
      csvContent += `الفترة أ (${comparisonData.periodA?.label}),${comparisonData.periodA?.count}\n`;
      csvContent += `الفترة ب (${comparisonData.periodB?.label}),${comparisonData.periodB?.count}\n`;
      csvContent += `نسبة التغير,${comparisonData.changePercentage}%\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `litc_comparison_${activeMode.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
      direction: 'rtl',
      lineHeight: 1.7,
      color: '#1e293b',
      marginTop: '20px'
    }}>
      {/* ─── الترويسة وأزرار التبديل ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}>
            <ArrowRightLeft size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              محرك المقارنة والمفاضلة التفاعلي
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              مفاضلة دقيقة للمؤشرات والأداء لإدارة: <strong style={{ color: '#2563eb' }}>{departmentName}</strong>
            </p>
          </div>
        </div>

        {/* أزرار أوضاع المقارنة */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveMode('PEER_VS_PEER')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'PEER_VS_PEER' ? '#ffffff' : 'transparent',
              color: activeMode === 'PEER_VS_PEER' ? '#0f172a' : '#64748b',
              boxShadow: activeMode === 'PEER_VS_PEER' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Users size={16} />
            مقارنة الكوادر
          </button>

          <button
            onClick={() => setActiveMode('BUILDING_VS_BUILDING')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'BUILDING_VS_BUILDING' ? '#ffffff' : 'transparent',
              color: activeMode === 'BUILDING_VS_BUILDING' ? '#0f172a' : '#64748b',
              boxShadow: activeMode === 'BUILDING_VS_BUILDING' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Building2 size={16} />
            مقارنة المواقع والمباني
          </button>

          <button
            onClick={() => setActiveMode('CROSS_TEMPORAL_ISSUE')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'CROSS_TEMPORAL_ISSUE' ? '#ffffff' : 'transparent',
              color: activeMode === 'CROSS_TEMPORAL_ISSUE' ? '#0f172a' : '#64748b',
              boxShadow: activeMode === 'CROSS_TEMPORAL_ISSUE' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Calendar size={16} />
            مفاضلة الأعطال زمنياً
          </button>
        </div>

        {/* زر التصدير وإعادة التحميل */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchComparison}
            title="تحديث البيانات"
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <RefreshCw size={16} />
          </button>
          {canExport && (
            <button
              onClick={handleExportCSV}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={15} />
              تصدير التقرير
            </button>
          )}
        </div>
      </div>

      {/* ─── شريط التحكم واختيار الأطراف المقارنة ───────────────────── */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '16px'
      }}>
        {activeMode === 'PEER_VS_PEER' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>الموظف الأول:</span>
              <select
                value={selectedTech1}
                onChange={e => setSelectedTech1(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.fullName || tech.username} ({tech.jobTitle || 'فني'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#64748b'
            }}>
              VS
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>الموظف الثاني:</span>
              <select
                value={selectedTech2}
                onChange={e => setSelectedTech2(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.fullName || tech.username} ({tech.jobTitle || 'فني'})
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {activeMode === 'CROSS_TEMPORAL_ISSUE' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>العطل المستهدف:</span>
              <input
                type="text"
                value={selectedIssue}
                onChange={e => setSelectedIssue(e.target.value)}
                placeholder="أدخل المشكلة أو اخترها..."
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13px',
                  minWidth: '220px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>الفترة أ:</span>
              <select
                value={periodALabel}
                onChange={e => setPeriodALabel(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13px'
                }}
              >
                <option value="الشهر الحالي">الشهر الحالي (آخر 30 يوماً)</option>
                <option value="الأسبوع الحالي">الأسبوع الحالي (آخر 7 أيام)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>مقارنة مع الفترة ب:</span>
              <select
                value={periodBLabel}
                onChange={e => setPeriodBLabel(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13px'
                }}
              >
                <option value="الشهر السابق">الشهر السابق (31-60 يوماً مضت)</option>
                <option value="نفس الفترة من العام الماضي">نفس الفترة قبل شهرين</option>
              </select>
            </div>
          </>
        )}

        {activeMode === 'BUILDING_VS_BUILDING' && (
          <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={16} color="#0ea5e9" />
            يتم فحص ومقارنة كافة المباني والمواقع المعتمدة في النظام ({buildings.length} مواقع) تلقائياً.
          </div>
        )}
      </div>

      {/* ─── عرض نتائج المقارنة ─────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#0284c7' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '14px', fontWeight: 600 }}>جاري استخراج وتحليل المقارنة المتقاطعة...</div>
        </div>
      ) : error ? (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      ) : (
        <div style={{ marginTop: '24px' }}>
          {/* نمط 1: بطاقات مقارنة الكوادر جنباً إلى جنب */}
          {activeMode === 'PEER_VS_PEER' && Array.isArray(comparisonData) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {comparisonData.map((tech: any, idx: number) => {
                const isBest = idx === 0 && comparisonData.length > 1 && tech.completionRate >= comparisonData[1].completionRate;
                return (
                  <div key={tech.id} style={{
                    background: '#fff',
                    borderRadius: '16px',
                    border: isBest ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    padding: '20px',
                    position: 'relative',
                    boxShadow: isBest ? '0 8px 24px rgba(2, 132, 199, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    {isBest && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '20px',
                        background: '#0284c7',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Award size={13} />
                        الأعلى إنجازاً
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '16px'
                      }}>
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{tech.name}</h4>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{tech.title}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>التذاكر المسندة</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{tech.totalTickets}</div>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#16a34a' }}>تم إغلاقها</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{tech.closedTickets}</div>
                      </div>
                    </div>

                    {/* مقياس نسبة الإنجاز */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>نسبة الإنجاز</span>
                        <strong style={{ color: '#0284c7' }}>{tech.completionRate}%</strong>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${tech.completionRate}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span>متوسط التقييم: <strong style={{ color: '#eab308' }}>★ {tech.avgRating}</strong></span>
                      <span>زمن الحل التقديري: <strong>{tech.avgResolutionHours} س</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* نمط 2: مقارنة المباني والمواقع */}
          {activeMode === 'BUILDING_VS_BUILDING' && Array.isArray(comparisonData) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {comparisonData.map((b: any) => (
                <div key={b.buildingId} style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <Building2 size={20} color="#0284c7" />
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{b.buildingName}</h4>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>إجمالي التذاكر:</span>
                    <strong style={{ color: '#0f172a' }}>{b.totalTickets} طلب</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>التذاكر المنجزة:</span>
                    <strong style={{ color: '#16a34a' }}>{b.closedTickets} محلولة</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>العطل الأكثر شيوعاً:</span>
                    <span style={{
                      background: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}>
                      {b.topIssue}
                    </span>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>الالتزام بـ SLA:</span>
                    <strong style={{ color: b.slaCompliance > 85 ? '#16a34a' : '#ea580c' }}>{b.slaCompliance}%</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* نمط 3: المقارنة الزمنية المتقاطعة للعطل */}
          {activeMode === 'CROSS_TEMPORAL_ISSUE' && comparisonData && (
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>العطل المقارن:</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  {comparisonData.targetIssue}
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: '#f8fafc',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    {comparisonData.periodA?.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                    {comparisonData.periodA?.range}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#0284c7' }}>
                    {comparisonData.periodA?.count} <span style={{ fontSize: '14px', fontWeight: 500 }}>حادثة</span>
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    {comparisonData.periodB?.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                    {comparisonData.periodB?.range}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#475569' }}>
                    {comparisonData.periodB?.count} <span style={{ fontSize: '14px', fontWeight: 500 }}>حادثة</span>
                  </div>
                </div>
              </div>

              {/* بطاقة اتجاه التغير */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: comparisonData.changePercentage > 0 ? '#fef2f2' : '#f0fdf4',
                border: comparisonData.changePercentage > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {comparisonData.changePercentage > 0 ? (
                    <TrendingUp size={24} color="#dc2626" />
                  ) : (
                    <TrendingDown size={24} color="#16a34a" />
                  )}
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      color: comparisonData.changePercentage > 0 ? '#b91c1c' : '#15803d'
                    }}>
                      {comparisonData.changePercentage > 0 ? 'زيادة في تكرار المشكلة' : 'انخفاض وتحسن تشغيلي'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      مقارنة بالفترة المرجعية السابقة
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: comparisonData.changePercentage > 0 ? '#dc2626' : '#16a34a'
                }}>
                  {comparisonData.changePercentage > 0 ? `+${comparisonData.changePercentage}%` : `${comparisonData.changePercentage}%`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiDimensionalComparator;
