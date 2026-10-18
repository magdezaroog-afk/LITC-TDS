/**
 * NEXUS TDS - Multi-Dimensional Comparative Engine (N-Entity NACE)
 * ===============================================================
 * محرك المقارنة والمفاضلة متعدد الأبعاد:
 * 1. مقارنة الكادر الفني حتى N مهندس (PEER_VS_PEER Matrix)
 * 2. مقارنة المواقع والمباني حتى N مبنى (BUILDING_VS_BUILDING Matrix)
 * 3. مقارنة المسارات والتدفقات التشغيلية (TRACK_VS_TRACK Matrix)
 * 4. المقارنة الزمنية والموضوعية المتقاطعة (CROSS_TEMPORAL_ISSUE)
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Building2, Calendar, TrendingUp, TrendingDown, 
  ArrowRightLeft, Award, CheckCircle2, Clock, AlertTriangle, 
  Download, RefreshCw, BarChart2, ShieldCheck, Filter, Plus, X, Layers, Sparkles
} from 'lucide-react';

export interface MultiDimensionalComparatorProps {
  departmentId: number;
  departmentName: string;
  technicians?: Array<{ id: number; fullName?: string; username: string; jobTitle?: string }>;
  buildings?: Array<{ id: number; name: string }>;
  flows?: Array<{ id: string; name: string; routeId?: string }>;
  institutionalDepartments?: Array<{ id: string; name: string; type?: string; divisions?: any[] }>;
  canExport?: boolean;
  isDark?: boolean;
}

export const MultiDimensionalComparator: React.FC<MultiDimensionalComparatorProps> = ({
  departmentId,
  departmentName,
  technicians = [],
  buildings = [],
  flows = [],
  institutionalDepartments = [],
  canExport = true,
  isDark = false
}) => {
  // أنماط المقارنة: كوادر / مباني / إدارات طالبة مؤسسية / مسارات / مشكلة متقاطعة زمنياً
  const [activeMode, setActiveMode] = useState<'PEER_VS_PEER' | 'BUILDING_VS_BUILDING' | 'INSTITUTIONAL_DEPT_VS_DEPT' | 'TRACK_VS_TRACK' | 'CROSS_TEMPORAL_ISSUE'>('PEER_VS_PEER');

  // قائمة الفنيين المحددين للمقارنة (يدعم N مهندس)
  const [selectedTechIds, setSelectedTechIds] = useState<number[]>([]);

  // قائمة المباني المحددة للمقارنة (يدعم N مبنى)
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<number[]>([]);

  // قائمة الإدارات الطالبة من الهيكل المؤسسي المحددة للمقارنة
  const [selectedDeptNames, setSelectedDeptNames] = useState<string[]>([]);

  // قائمة المسارات المحددة للمقارنة (يدعم N مسار)
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  // حالة مقارنة المشكلة المتقاطعة زمنياً
  const [selectedIssue, setSelectedIssue] = useState<string>('انقطاع كامل للشبكة');
  const [periodALabel, setPeriodALabel] = useState<string>('الشهر الحالي');
  const [periodBLabel, setPeriodBLabel] = useState<string>('الشهر السابق');

  // البيانات والحالة
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // تهيئة الكوادر الافتراضية عند التحميل (اختيار أول فنيين كبداية)
  useEffect(() => {
    if (technicians && technicians.length >= 2 && selectedTechIds.length === 0) {
      setSelectedTechIds([technicians[0].id, technicians[1].id]);
    } else if (technicians && technicians.length === 1 && selectedTechIds.length === 0) {
      setSelectedTechIds([technicians[0].id]);
    }
  }, [technicians]);

  // تهيئة المباني الافتراضية
  useEffect(() => {
    if (buildings && buildings.length >= 2 && selectedBuildingIds.length === 0) {
      setSelectedBuildingIds(buildings.slice(0, 4).map(b => b.id));
    }
  }, [buildings]);

  // تهيئة المسارات الافتراضية
  useEffect(() => {
    if (flows && flows.length >= 2 && selectedTrackIds.length === 0) {
      setSelectedTrackIds(flows.slice(0, 3).map(f => f.id));
    }
  }, [flows]);

  // تهيئة الإدارات الطالبة من الهيكل المؤسسي
  useEffect(() => {
    if (institutionalDepartments && institutionalDepartments.length >= 2 && selectedDeptNames.length === 0) {
      setSelectedDeptNames(institutionalDepartments.slice(0, 4).map(d => d.name));
    }
  }, [institutionalDepartments]);

  // جلب بيانات المقارنة من السيرفر
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
        if (selectedTechIds.length < 2) {
          setError('يلزم تحديد مهندسين اثنين على الأقل لإجراء المقارنة.');
          setLoading(false);
          return;
        }
        payload.targetIds = selectedTechIds;
      } else if (activeMode === 'BUILDING_VS_BUILDING') {
        payload.targetIds = selectedBuildingIds.length > 0 ? selectedBuildingIds : buildings.map(b => b.id);
      } else if (activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT') {
        if (selectedDeptNames.length < 2) {
          setError('يلزم تحديد إدارتين اثنتين على الأقل لإجراء المقارنة.');
          setLoading(false);
          return;
        }
        payload.targetIds = selectedDeptNames;
      } else if (activeMode === 'TRACK_VS_TRACK') {
        payload.targetIds = selectedTrackIds;
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
      setBenchmark(json.benchmark || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [departmentId, activeMode, selectedTechIds, selectedBuildingIds, selectedDeptNames, selectedTrackIds, selectedIssue, periodALabel, periodBLabel, buildings]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  // إدارة إضافة وإزالة فني من المقارنة (N-Entities)
  const addTechnicianToCompare = (techId: number) => {
    if (!selectedTechIds.includes(techId) && selectedTechIds.length < 10) {
      setSelectedTechIds([...selectedTechIds, techId]);
    }
  };

  const removeTechnicianFromCompare = (techId: number) => {
    if (selectedTechIds.length > 2) {
      setSelectedTechIds(selectedTechIds.filter(id => id !== techId));
    }
  };

  // إدارة إضافة وإزالة إدارة طالبة من المقارنة (الهيكل المؤسسي)
  const addDeptToCompare = (deptName: string) => {
    if (!selectedDeptNames.includes(deptName) && selectedDeptNames.length < 10) {
      setSelectedDeptNames([...selectedDeptNames, deptName]);
    }
  };

  const removeDeptFromCompare = (deptName: string) => {
    if (selectedDeptNames.length > 2) {
      setSelectedDeptNames(selectedDeptNames.filter(name => name !== deptName));
    }
  };

  // تصدير النتائج لملف CSV
  const handleExportCSV = () => {
    if (!comparisonData) return;
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

    if (activeMode === 'PEER_VS_PEER' && Array.isArray(comparisonData)) {
      csvContent += 'الاسم,المسمى الوظيفي,إجمالي التذاكر,المغلقة,المتأخرة,المسحوبة,نسبة الإنجاز,التقييم\n';
      comparisonData.forEach((item: any) => {
        csvContent += `"${item.name}","${item.title}",${item.totalTickets},${item.closedTickets},${item.overdueTickets || 0},${item.pulledTickets || 0},${item.completionRate}%,${item.avgRating}\n`;
      });
    } else if (activeMode === 'BUILDING_VS_BUILDING' && Array.isArray(comparisonData)) {
      csvContent += 'المبنى,إجمالي التذاكر,المغلقة,المتأخرة,العطل الأبرز,الالتزام بـ SLA\n';
      comparisonData.forEach((item: any) => {
        csvContent += `"${item.buildingName}",${item.totalTickets},${item.closedTickets},${item.overdueTickets || 0},"${item.topIssue}",${item.slaCompliance}%\n`;
      });
    } else if (activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' && Array.isArray(comparisonData)) {
      csvContent += 'الإدارة الطالبة (الهيكل المؤسسي),إجمالي الطلبات الواردة,المغلقة,المفتوحة,المتأخرة عن SLA,نسبة الإنجاز,الخدمة الأكثر طلباً,الالتزام بـ SLA,متوسط التقييم\n';
      comparisonData.forEach((item: any) => {
        csvContent += `"${item.deptName}",${item.totalTickets},${item.closedTickets},${item.openTickets},${item.overdueTickets || 0},${item.completionRate}%,${item.topIssue},${item.slaCompliance}%,${item.avgRating}\n`;
      });
    } else if (activeMode === 'TRACK_VS_TRACK' && Array.isArray(comparisonData)) {
      csvContent += 'المسار,إجمالي التذاكر,المغلقة,المتأخرة,نسبة الإنجاز,الالتزام بـ SLA\n';
      comparisonData.forEach((item: any) => {
        csvContent += `"${item.trackName}",${item.totalTickets},${item.closedTickets},${item.overdueTickets || 0},${item.completionRate}%,${item.slaCompliance}%\n`;
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
    link.setAttribute('download', `nexus_comparison_${activeMode.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // توكنز التصميم المعتمدة (Slate & Teal & Orange)
  const cardBg = isDark ? '#111827' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const tableHeaderBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc';
  const rowHoverBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9';

  return (
    <div style={{
      fontFamily: "'Cairo', sans-serif",
      direction: 'rtl',
      lineHeight: 1.6
    }}>
      {/* ─── شريط أوضاع المقارنة الأربعة ─── */}
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{
          display: 'flex',
          background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {/* 1. مقارنة الكوادر */}
          <button
            onClick={() => setActiveMode('PEER_VS_PEER')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeMode === 'PEER_VS_PEER' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'PEER_VS_PEER' ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
              color: activeMode === 'PEER_VS_PEER' ? '#135d79' : subtextColor,
              boxShadow: activeMode === 'PEER_VS_PEER' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Users size={15} color={activeMode === 'PEER_VS_PEER' ? '#135d79' : 'currentColor'} />
            مقارنة الكوادر (N مهندس)
          </button>

          {/* 2. مقارنة المباني */}
          <button
            onClick={() => setActiveMode('BUILDING_VS_BUILDING')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeMode === 'BUILDING_VS_BUILDING' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'BUILDING_VS_BUILDING' ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
              color: activeMode === 'BUILDING_VS_BUILDING' ? '#135d79' : subtextColor,
              boxShadow: activeMode === 'BUILDING_VS_BUILDING' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Building2 size={15} color={activeMode === 'BUILDING_VS_BUILDING' ? '#135d79' : 'currentColor'} />
            مقارنة المواقع والمباني
          </button>

          {/* 3. مقارنة الإدارات الطالبة من الهيكل المؤسسي */}
          <button
            onClick={() => setActiveMode('INSTITUTIONAL_DEPT_VS_DEPT')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
              color: activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' ? '#135d79' : subtextColor,
              boxShadow: activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Sparkles size={15} color={activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' ? '#135d79' : 'currentColor'} />
            مقارنة الإدارات الطالبة (الهيكل المؤسسي)
          </button>

          {/* 4. مقارنة المسارات */}
          <button
            onClick={() => setActiveMode('TRACK_VS_TRACK')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeMode === 'TRACK_VS_TRACK' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'TRACK_VS_TRACK' ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
              color: activeMode === 'TRACK_VS_TRACK' ? '#135d79' : subtextColor,
              boxShadow: activeMode === 'TRACK_VS_TRACK' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Layers size={15} color={activeMode === 'TRACK_VS_TRACK' ? '#135d79' : 'currentColor'} />
            مقارنة المسارات والتدفقات
          </button>

          {/* 4. المقارنة الزمنية والموضوعية */}
          <button
            onClick={() => setActiveMode('CROSS_TEMPORAL_ISSUE')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeMode === 'CROSS_TEMPORAL_ISSUE' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeMode === 'CROSS_TEMPORAL_ISSUE' ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
              color: activeMode === 'CROSS_TEMPORAL_ISSUE' ? '#135d79' : subtextColor,
              boxShadow: activeMode === 'CROSS_TEMPORAL_ISSUE' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Calendar size={15} color={activeMode === 'CROSS_TEMPORAL_ISSUE' ? '#135d79' : 'currentColor'} />
            المقارنة الزمنية للعطل
          </button>
        </div>

        {/* أزرار التحديث والتصدير */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchComparison}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              color: textColor,
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>

          {canExport && (
            <button
              onClick={handleExportCSV}
              disabled={loading || !comparisonData}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #135d79 0%, #f36c21 100%)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(243, 108, 33, 0.25)'
              }}
            >
              <Download size={13} />
              تصدير شيت المقارنة
            </button>
          )}
        </div>
      </div>

      {/* ─── أشرطة ضبط الأبعاد بحسب النمط ─── */}
      {activeMode === 'PEER_VS_PEER' && (
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: textColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#135d79" />
              <span>المهندسون المحددون للمقارنة والمفاضلة ({selectedTechIds.length} مهندسين):</span>
            </div>
            <span style={{ fontSize: '11px', color: subtextColor }}>
              يمكنك مقارنة حتى 10 مهندسين في آن واحد للحصول على مصفوفة قياس الأداء
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {selectedTechIds.map(tid => {
              const tech = technicians.find(t => t.id === tid);
              return (
                <div
                  key={tid}
                  style={{
                    background: isDark ? 'rgba(19, 93, 121, 0.2)' : '#e0f2fe',
                    border: '1px solid rgba(19, 93, 121, 0.35)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: isDark ? '#38bdf8' : '#0369a1'
                  }}
                >
                  <span>{tech?.fullName || tech?.username || `مهندس #${tid}`}</span>
                  {selectedTechIds.length > 2 && (
                    <button
                      onClick={() => removeTechnicianFromCompare(tid)}
                      title="إزالة من المقارنة"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* إضافة مهندس آخر */}
            {selectedTechIds.length < 10 && (
              <select
                onChange={e => {
                  if (e.target.value) {
                    addTechnicianToCompare(Number(e.target.value));
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`,
                  background: 'transparent',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>+ إضافة مهندس للمقارنة...</option>
                {technicians
                  .filter(t => !selectedTechIds.includes(t.id))
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName || t.username}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* شريط ضبط مقارنة الإدارات الطالبة من الهيكل المؤسسي */}
      {activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' && (
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: textColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="#135d79" />
              <span>الإدارات الطالبة المحددة للمقارنة من الهيكل المؤسسي ({selectedDeptNames.length} إدارات):</span>
            </div>
            <span style={{ fontSize: '11px', color: subtextColor }}>
              تستمد البيانات مباشرة من الهيكل المؤسسي الشامل لكافة موظفي الشركة
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {selectedDeptNames.map(dName => (
              <div
                key={dName}
                style={{
                  background: isDark ? 'rgba(19, 93, 121, 0.2)' : '#e0f2fe',
                  border: '1px solid rgba(19, 93, 121, 0.35)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: isDark ? '#38bdf8' : '#0369a1'
                }}
              >
                <span>{dName}</span>
                {selectedDeptNames.length > 2 && (
                  <button
                    onClick={() => removeDeptFromCompare(dName)}
                    title="إزالة من المقارنة"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}

            {/* إضافة إدارة أخرى من الهيكل المؤسسي */}
            {selectedDeptNames.length < 10 && (
              <select
                onChange={e => {
                  if (e.target.value) {
                    addDeptToCompare(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`,
                  background: 'transparent',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>+ إضافة إدارة من الهيكل المؤسسي...</option>
                {institutionalDepartments
                  .filter(d => !selectedDeptNames.includes(d.name))
                  .map(d => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* شريط ضبط مقارنة المشكلة زمنياً */}
      {activeMode === 'CROSS_TEMPORAL_ISSUE' && (
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          alignItems: 'center'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, marginBottom: '6px' }}>
              العطل المستهدف للمقارنة:
            </label>
            <select
              value={selectedIssue}
              onChange={e => setSelectedIssue(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                color: textColor, fontSize: '13px', outline: 'none'
              }}
            >
              <option value="انقطاع كامل للشبكة">انقطاع كامل للشبكة</option>
              <option value="بطء في التصفح والإنترنت">بطء في التصفح والإنترنت</option>
              <option value="توقف نظام التشغيل">توقف نظام التشغيل</option>
              <option value="استبدال حبر الطابعة">استبدال حبر الطابعة</option>
              <option value="إعادة تعيين كلمة المرور">إعادة تعيين كلمة المرور</option>
              <option value="عطل وحدة تزويد الطاقة">عطل وحدة تزويد الطاقة</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, marginBottom: '6px' }}>
              تسمية الفترة أ:
            </label>
            <input
              type="text"
              value={periodALabel}
              onChange={e => setPeriodALabel(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                color: textColor, fontSize: '13px', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, marginBottom: '6px' }}>
              تسمية الفترة ب:
            </label>
            <input
              type="text"
              value={periodBLabel}
              onChange={e => setPeriodBLabel(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '10px',
                border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                color: textColor, fontSize: '13px', outline: 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* ─── حالة التحميل والخطأ ─── */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#135d79' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>جاري معالجة مصفوفة المقارنة متعددة الأبعاد...</div>
        </div>
      ) : error ? (
        <div style={{
          background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '16px',
          color: isDark ? '#fca5a5' : '#b91c1c',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      ) : !comparisonData ? null : (
        <>
          {/* ─── النمط 1: مصفوفة المهندسين والكوادر (N-Entity Peer Matrix) ─── */}
          {activeMode === 'PEER_VS_PEER' && Array.isArray(comparisonData) && (
            <div>
              {/* شريط المرجع المعياري للمجموعة (Benchmark) */}
              {benchmark && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    padding: '14px 18px'
                  }}>
                    <span style={{ fontSize: '11.5px', color: subtextColor, display: 'block' }}>متوسط إنجاز المجموعة</span>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                      {benchmark.averageCompletionRate}%
                    </span>
                  </div>

                  <div style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    padding: '14px 18px'
                  }}>
                    <span style={{ fontSize: '11.5px', color: subtextColor, display: 'block' }}>متوسط رضا المستفيدين</span>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                      ★ {benchmark.averageRating}
                    </span>
                  </div>

                  <div style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '12px',
                    padding: '14px 18px'
                  }}>
                    <span style={{ fontSize: '11.5px', color: subtextColor, display: 'block' }}>عدد الكوادر المقارنة</span>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#135d79', fontVariantNumeric: 'tabular-nums' }}>
                      {benchmark.totalEntitiesCompared} مهندسين
                    </span>
                  </div>
                </div>
              )}

              {/* بطاقات المقارنة جنباً إلى جنب */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
                gap: '16px',
                marginBottom: '24px'
              }}>
                {comparisonData.map((peer: any, idx: number) => {
                  const isTopAchiever = idx === 0 && peer.completionRate > 0;
                  return (
                    <div
                      key={peer.id}
                      style={{
                        background: cardBg,
                        border: isTopAchiever ? '2px solid #10b981' : `1px solid ${cardBorder}`,
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                    >
                      {isTopAchiever && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: '#10b981',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Award size={12} /> المتصدر
                        </div>
                      )}

                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: textColor, margin: '0 0 2px' }}>
                          {peer.name}
                        </div>
                        <div style={{ fontSize: '12px', color: subtextColor }}>
                          {peer.title}
                        </div>
                      </div>

                      {/* شريط نسبة الإنجاز */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ color: subtextColor }}>نسبة إغلاق التذاكر:</span>
                          <span style={{ fontWeight: 800, color: peer.completionRate >= 80 ? '#10b981' : '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                            {peer.completionRate}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${peer.completionRate}%`,
                            height: '100%',
                            background: peer.completionRate >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                            borderRadius: '4px',
                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                          }} />
                        </div>
                      </div>

                      {/* شبكة الأرقام القياسية */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${cardBorder}`
                      }}>
                        <div>
                          <span style={{ fontSize: '11px', color: subtextColor, display: 'block' }}>إجمالي المسندة</span>
                          <span style={{ fontSize: '17px', fontWeight: 800, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                            {peer.totalTickets}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: subtextColor, display: 'block' }}>المغلقة بنجاح</span>
                          <span style={{ fontSize: '17px', fontWeight: 800, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                            {peer.closedTickets}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: subtextColor, display: 'block' }}>المتأخرة (SLA)</span>
                          <span style={{ fontSize: '17px', fontWeight: 800, color: peer.overdueTickets > 0 ? '#ef4444' : textColor, fontVariantNumeric: 'tabular-nums' }}>
                            {peer.overdueTickets || 0}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: subtextColor, display: 'block' }}>المسحوبة ذاتياً</span>
                          <span style={{ fontSize: '17px', fontWeight: 800, color: '#135d79', fontVariantNumeric: 'tabular-nums' }}>
                            {peer.pulledTickets || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── النمط 2: مقارنة المباني والمواقع (Building Matrix) ─── */}
          {activeMode === 'BUILDING_VS_BUILDING' && Array.isArray(comparisonData) && (
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: tableHeaderBg, borderBottom: `1px solid ${cardBorder}` }}>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المبنى / الموقع</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>إجمالي التذاكر</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المغلقة</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المتأخرة</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>العطل الأبرز بالنموذج</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الالتزام بـ SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((b: any) => (
                      <tr
                        key={b.buildingId}
                        style={{ borderBottom: `1px solid ${cardBorder}`, transition: 'background-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHoverBg)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '13.5px', color: textColor }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={16} color="#135d79" />
                            <span>{b.buildingName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: textColor }}>
                          {b.totalTickets}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#10b981' }}>
                          {b.closedTickets}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: b.overdueTickets > 0 ? '#ef4444' : subtextColor }}>
                          {b.overdueTickets || 0}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: textColor }}>
                          <span style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                            padding: '4px 10px',
                            borderRadius: '6px'
                          }}>
                            {b.topIssue}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontWeight: 800,
                            color: b.slaCompliance >= 90 ? '#10b981' : '#f59e0b',
                            fontVariantNumeric: 'tabular-nums'
                          }}>
                            {b.slaCompliance}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── النمط 2. ب: مقارنة الإدارات الطالبة من الهيكل المؤسسي ─── */}
          {activeMode === 'INSTITUTIONAL_DEPT_VS_DEPT' && Array.isArray(comparisonData) && (
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: tableHeaderBg, borderBottom: `1px solid ${cardBorder}` }}>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الإدارة الطالبة (الهيكل المؤسسي)</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>إجمالي الطلبات الواردة</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الطلبات المنجزة</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>قيد المعالجة</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المتأخرة عن SLA</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>نسبة الإنجاز</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الخدمة الأكثر طلباً</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الالتزام بـ SLA</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>متوسط التقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((d: any) => (
                      <tr
                        key={d.deptName}
                        style={{ borderBottom: `1px solid ${cardBorder}`, transition: 'background-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHoverBg)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '13.5px', color: textColor }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={16} color="#135d79" />
                            <span>{d.deptName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: textColor }}>
                          {d.totalTickets}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#10b981' }}>
                          {d.closedTickets}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#f59e0b' }}>
                          {d.openTickets}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: d.overdueTickets > 0 ? '#ef4444' : subtextColor }}>
                          {d.overdueTickets || 0}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#135d79' }}>
                          {d.completionRate}%
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: textColor }}>
                          <span style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                            padding: '4px 10px',
                            borderRadius: '6px'
                          }}>
                            {d.topIssue}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontWeight: 800,
                            color: d.slaCompliance >= 90 ? '#10b981' : '#f59e0b',
                            fontVariantNumeric: 'tabular-nums'
                          }}>
                            {d.slaCompliance}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '13.5px', fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                          ★ {d.avgRating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── النمط 3: مقارنة المسارات والتدفقات (Track Matrix) ─── */}
          {activeMode === 'TRACK_VS_TRACK' && Array.isArray(comparisonData) && (
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: tableHeaderBg, borderBottom: `1px solid ${cardBorder}` }}>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المسار والتدفق التشغيلي</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>إجمالي التذاكر</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المغلقة</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المتأخرة عن SLA</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>نسبة الإغلاق</th>
                      <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الالتزام بـ SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((trk: any) => (
                      <tr
                        key={trk.trackId}
                        style={{ borderBottom: `1px solid ${cardBorder}`, transition: 'background-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHoverBg)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '13.5px', color: textColor }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={16} color="#f36c21" />
                            <span>{trk.trackName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: textColor }}>
                          {trk.totalTickets}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#10b981' }}>
                          {trk.closedTickets}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: trk.overdueTickets > 0 ? '#ef4444' : subtextColor }}>
                          {trk.overdueTickets || 0}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#135d79' }}>
                          {trk.completionRate}%
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontWeight: 800,
                            color: trk.slaCompliance >= 90 ? '#10b981' : '#f59e0b',
                            fontVariantNumeric: 'tabular-nums'
                          }}>
                            {trk.slaCompliance}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── النمط 4: المقارنة الزمنية والموضوعية المتقاطعة (Cross-Temporal) ─── */}
          {activeMode === 'CROSS_TEMPORAL_ISSUE' && comparisonData && (
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: textColor }}>
                    تحليل تذبذب العطل: {comparisonData.targetIssue}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: subtextColor }}>
                    مقارنة معدلات وقوع العطل بين الفترتين لاكتشاف المشاكل المتكررة أو تأثير الصيانة
                  </p>
                </div>

                {/* مؤشر التغير والاتجاه */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: comparisonData.changePercentage > 0 
                    ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2') 
                    : (isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4'),
                  color: comparisonData.changePercentage > 0 ? '#dc2626' : '#16a34a',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 800
                }}>
                  {comparisonData.changePercentage > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{Math.abs(comparisonData.changePercentage)}% {comparisonData.changePercentage > 0 ? 'زيادة في الأعطال' : 'انخفاض بالأعطال'}</span>
                </div>
              </div>

              {/* مقارنة الصناديق للفترتين */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '13px', color: subtextColor, marginBottom: '6px' }}>{comparisonData.periodA?.label}</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#135d79', fontVariantNumeric: 'tabular-nums' }}>
                    {comparisonData.periodA?.count} <span style={{ fontSize: '14px', fontWeight: 600 }}>تذكرة</span>
                  </div>
                  <div style={{ fontSize: '11px', color: subtextColor, marginTop: '4px' }}>{comparisonData.periodA?.range}</div>
                </div>

                <div style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '13px', color: subtextColor, marginBottom: '6px' }}>{comparisonData.periodB?.label}</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#f36c21', fontVariantNumeric: 'tabular-nums' }}>
                    {comparisonData.periodB?.count} <span style={{ fontSize: '14px', fontWeight: 600 }}>تذكرة</span>
                  </div>
                  <div style={{ fontSize: '11px', color: subtextColor, marginTop: '4px' }}>{comparisonData.periodB?.range}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
