/**
 * NEXUS TDS - Dynamic Form-Aware Analytics Engine (NACE Universal Pillars)
 * =======================================================================
 * محرك التحليلات والمقارنة الذكي المعتمد ديناميكياً على نماذج التذاكر ومسارات العمل:
 * - يدعم الركائز التشغيلية الـ 5 الموحدة (المتأخرة، المحولة، المسحوبة ذاتياً، المهام الفرعية، وسرعة الإنجاز).
 * - يتكيف فورياً مع حقول النماذج الخاصة بكل مسار عمل (Dynamic Track-Form Adaptation).
 * - يعزل بيانات كل مسار لمنع أي تداخل بين المسارات والإدارات (Zero Data Leakage).
 * - يدمج محرك المقارنة والمفاضلة متعدد الأبعاد (MultiDimensionalComparator).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, Filter, RefreshCw, Download, Calendar, 
  Building2, Users, CheckCircle2, Clock, AlertTriangle, 
  Layers, ArrowRightLeft, Sparkles, ChevronDown, X, SlidersHorizontal,
  Flame, CornerDownLeft, Inbox, GitPullRequest, ShieldAlert, Award
} from 'lucide-react';
import { MultiDimensionalComparator } from './MultiDimensionalComparator';

export interface AccessibleDept {
  departmentId: number;
  departmentName: string;
  isNative: boolean;
  canExport: boolean;
  canCompare: boolean;
  routeId: string | null;
}

export interface DynamicFormAwareAnalyticsProps {
  initialTab?: 'OVERVIEW' | 'COMPARISON';
  isDark?: boolean;
  defaultDepartmentId?: number;
  isEmbedded?: boolean;
  hideHeader?: boolean;
  hideSubTabs?: boolean;
}

export const DynamicFormAwareAnalytics: React.FC<DynamicFormAwareAnalyticsProps> = ({
  initialTab = 'OVERVIEW',
  isDark = false,
  defaultDepartmentId,
  isEmbedded = false,
  hideHeader = false,
  hideSubTabs = false
}) => {
  // ─── 1. الإدارات المصرح بها ─────────────────────────────────────────
  const [accessibleDepts, setAccessibleDepts] = useState<AccessibleDept[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(defaultDepartmentId || null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // ─── 2. المخطط والفلاتر الديناميكية ─────────────────────────────────
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState<boolean>(true);

  // ─── 3. قيم الفلاتر المحددة ─────────────────────────────────────────
  const [selectedFlowId, setSelectedFlowId] = useState<string>(''); // فلترة حسب المسار التشغيلي المحدد
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedRequesterDept, setSelectedRequesterDept] = useState<string>('');
  const [selectedRequesterDiv, setSelectedRequesterDiv] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedMainIssue, setSelectedMainIssue] = useState<string>('');
  const [selectedSubIssue, setSelectedSubIssue] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({});

  // المشاكل الرئيسية المتاحة من المخطط الديناميكي
  const availableMainIssues = useMemo(() => {
    return schemaData?.dynamicFilterDimensions?.find((d: any) => d.key === 'main_issue')?.options || [];
  }, [schemaData]);

  // المشاكل الفرعية المتاحة (تتكيف ديناميكياً مع المشكلة الرئيسية المختارة)
  const availableSubIssues = useMemo(() => {
    if (selectedMainIssue && schemaData?.issueHierarchy?.[selectedMainIssue]?.length > 0) {
      return schemaData.issueHierarchy[selectedMainIssue];
    }
    return schemaData?.dynamicFilterDimensions?.find((d: any) => d.key === 'sub_issue')?.options || [];
  }, [selectedMainIssue, schemaData]);

  // الأقسام الطالبة المتاحة من الهيكل المؤسسي
  const availableRequesterDivisions = useMemo(() => {
    if (!selectedRequesterDept || !schemaData?.institutionalDepartments) {
      return schemaData?.institutionalDivisions || [];
    }
    const matched = schemaData.institutionalDepartments.find((d: any) => d.name === selectedRequesterDept);
    return matched?.divisions?.map((div: any) => div.name) || [];
  }, [selectedRequesterDept, schemaData]);

  // ─── 4. نمط العرض: مؤشرات عامة أو محرك مقارنة ───────────────────────
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMPARISON'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ─── 5. نتائج التحليل والـ KPIs ────────────────────────────────────
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // جلب الإدارات المصرح بها عند البداية
  useEffect(() => {
    const fetchAccessibleDepts = async () => {
      try {
        const res = await fetch('/api/v1/analytics/accessible-departments', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('فشل جلب قائمة الإدارات المصرح بها');
        const json = await res.json();
        if (json.success && json.data) {
          setIsAdmin(Boolean(json.data.isAdmin));
          const depts = json.data.departments || [];
          setAccessibleDepts(depts);
          if (depts.length > 0) {
            setSelectedDeptId(prev => (prev && depts.some((d: any) => d.departmentId === prev) ? prev : depts[0].departmentId));
          }
        }
      } catch (err: any) {
        console.error('Failed to load accessible departments', err);
      }
    };
    fetchAccessibleDepts();
  }, []);

  // جلب مخطط ونماذج الإدارة المختارة
  const fetchDepartmentSchema = useCallback(async (deptId: number) => {
    try {
      setLoadingSchema(true);
      const res = await fetch(`/api/v1/analytics/department-schema?departmentId=${deptId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('فشل جلب مخطط نماذج الإدارة');
      const json = await res.json();
      setSchemaData(json.data);
    } catch (err: any) {
      console.error('Failed to load department schema', err);
    } finally {
      setLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      // تصفير الفلاتر عند تغيير الإدارة
      setSelectedFlowId('');
      setSelectedBuilding('');
      setSelectedRequesterDept('');
      setSelectedRequesterDiv('');
      setSelectedPriority('');
      setSelectedState('');
      setSelectedTech('');
      setSelectedMainIssue('');
      setSelectedSubIssue('');
      setCustomFilters({});
      fetchDepartmentSchema(selectedDeptId);
    }
  }, [selectedDeptId, fetchDepartmentSchema]);

  // جلب بيانات ومؤشرات التحليل
  const fetchAnalyticsData = useCallback(async () => {
    if (!selectedDeptId) return;
    try {
      setLoadingData(true);
      setError(null);

      const allCustomFilters: Record<string, string> = { ...customFilters };
      if (selectedMainIssue) allCustomFilters.main_issue = selectedMainIssue;
      if (selectedSubIssue) allCustomFilters.sub_issue = selectedSubIssue;

      const payload = {
        departmentId: selectedDeptId,
        flowDefinitionId: selectedFlowId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        buildingId: selectedBuilding || undefined,
        requesterDepartment: selectedRequesterDept || undefined,
        requesterDivision: selectedRequesterDiv || undefined,
        priority: selectedPriority || undefined,
        stateId: selectedState || undefined,
        techId: selectedTech || undefined,
        customFilters: allCustomFilters
      };

      const res = await fetch('/api/v1/analytics/department-data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل جلب بيانات التحليل');
      }

      const json = await res.json();
      setAnalyticsData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, [selectedDeptId, selectedFlowId, startDate, endDate, selectedBuilding, selectedRequesterDept, selectedRequesterDiv, selectedPriority, selectedState, selectedTech, selectedMainIssue, selectedSubIssue, customFilters]);

  useEffect(() => {
    if (selectedDeptId) {
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData, selectedDeptId]);

  // حساب عدد الفلاتر النشطة
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedFlowId) count++;
    if (selectedBuilding) count++;
    if (selectedRequesterDept) count++;
    if (selectedRequesterDiv) count++;
    if (selectedPriority) count++;
    if (selectedState) count++;
    if (selectedTech) count++;
    if (selectedMainIssue) count++;
    if (selectedSubIssue) count++;
    if (startDate || endDate) count++;
    count += Object.values(customFilters).filter(Boolean).length;
    return count;
  }, [selectedFlowId, selectedBuilding, selectedRequesterDept, selectedRequesterDiv, selectedPriority, selectedState, selectedTech, selectedMainIssue, selectedSubIssue, startDate, endDate, customFilters]);

  const clearAllFilters = () => {
    setSelectedFlowId('');
    setSelectedBuilding('');
    setSelectedRequesterDept('');
    setSelectedRequesterDiv('');
    setSelectedPriority('');
    setSelectedState('');
    setSelectedTech('');
    setSelectedMainIssue('');
    setSelectedSubIssue('');
    setStartDate('');
    setEndDate('');
    setCustomFilters({});
  };

  const currentDeptObj = accessibleDepts.find(d => d.departmentId === selectedDeptId);

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
      {/* ─── الترويسة الرئيسية ───────────────────────────────────────── */}
      {!isEmbedded && !hideHeader && (
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #135d79 0%, #0d4257 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(19, 93, 121, 0.35)'
            }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: textColor }}>
                  محرك التحليلات التكيفي والمقارنة متعددة الأبعاد
                </h2>
                {isAdmin && (
                  <span style={{
                    background: isDark ? 'rgba(243, 108, 33, 0.15)' : '#fff7ed',
                    color: '#ea580c',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(243, 108, 33, 0.3)'
                  }}>
                    رؤية قيادية شاملة (Admin)
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: subtextColor }}>
                استخراج فوري للركائز التشغيلية الموحدة ومطابقة ديناميكية لنماذج المسارات مع حظر تداخل البيانات
              </p>
            </div>
          </div>

          {/* محدد الإدارة المستهدفة */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: subtextColor }}>الإدارة:</span>
            <select
              value={selectedDeptId || ''}
              onChange={e => setSelectedDeptId(Number(e.target.value))}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${cardBorder}`,
                background: isDark ? '#1e293b' : '#fff',
                fontSize: '13.5px',
                fontWeight: 700,
                color: textColor,
                outline: 'none',
                cursor: 'pointer',
                minWidth: '220px'
              }}
            >
              {accessibleDepts.map(d => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName} {d.isNative ? '(إدارتك)' : '(تفويض)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ─── شريط التحكم المدمج عند التضمين في المستطيل الموحد ─────────── */}
      {isEmbedded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9'
        }}>
          {/* Department Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color={isDark ? '#38bdf8' : '#135d79'} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: subtextColor }}>الإدارة المستهدفة:</span>
            <select
              value={selectedDeptId || ''}
              onChange={e => setSelectedDeptId(Number(e.target.value))}
              style={{
                padding: '7px 12px',
                borderRadius: '10px',
                border: `1px solid ${cardBorder}`,
                background: isDark ? '#1e293b' : '#fff',
                fontSize: '13px',
                fontWeight: 700,
                color: textColor,
                outline: 'none',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              {accessibleDepts.map(d => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName} {d.isNative ? '(إدارتك)' : '(تفويض)'}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin && (
              <span style={{
                background: isDark ? 'rgba(243, 108, 33, 0.15)' : '#fff7ed',
                color: '#ea580c',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(243, 108, 33, 0.3)'
              }}>
                رؤية قيادية شاملة (Admin)
              </span>
            )}
            <button
              onClick={fetchAnalyticsData}
              disabled={loadingData}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: `1px solid ${cardBorder}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                fontSize: '12.5px',
                fontWeight: 600,
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={13} className={loadingData ? 'animate-spin' : ''} />
              <span>تحديث المؤشرات</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── أزرار التبديل بين المؤشرات العامة ومحرك المقارنة ──────────── */}
      {!isEmbedded && !hideSubTabs && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px'
          }}>
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: activeTab === 'OVERVIEW' ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                background: activeTab === 'OVERVIEW' ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
                color: activeTab === 'OVERVIEW' ? '#135d79' : subtextColor,
                boxShadow: activeTab === 'OVERVIEW' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <BarChart3 size={16} color={activeTab === 'OVERVIEW' ? '#135d79' : 'currentColor'} />
              الركائز التشغيلية والمؤشرات العامة
            </button>

            <button
              onClick={() => setActiveTab('COMPARISON')}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: activeTab === 'COMPARISON' ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                background: activeTab === 'COMPARISON' ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
                color: activeTab === 'COMPARISON' ? '#135d79' : subtextColor,
                boxShadow: activeTab === 'COMPARISON' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <ArrowRightLeft size={16} color={activeTab === 'COMPARISON' ? '#135d79' : 'currentColor'} />
              محرك المقارنة متعدد الأبعاد (N-Entities)
            </button>
          </div>

          {/* زر التحديث السريع */}
          <button
            onClick={fetchAnalyticsData}
            disabled={loadingData}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              fontSize: '13px',
              fontWeight: 600,
              color: textColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
            تحديث المؤشرات
          </button>
        </div>
      )}

      {/* ─── المحتوى بحسب التبويب المختار ────────────────────────────── */}
      {activeTab === 'COMPARISON' ? (
        <MultiDimensionalComparator
          departmentId={selectedDeptId || 0}
          departmentName={currentDeptObj?.departmentName || ''}
          technicians={schemaData?.technicians || []}
          buildings={schemaData?.buildings || []}
          flows={schemaData?.flows || []}
          institutionalDepartments={schemaData?.institutionalDepartments || []}
          canExport={currentDeptObj?.canExport ?? true}
          isDark={isDark}
        />
      ) : (
        <>
          {/* ─── شريط الفلاتر الديناميكي المتكيف مع نموذج المسار ───────────────── */}
          <div style={{
            background: cardBg,
            borderRadius: '16px',
            border: `1px solid ${cardBorder}`,
            padding: '18px 20px',
            marginBottom: '20px',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: `1px solid ${cardBorder}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={16} color="#135d79" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: textColor }}>
                  فلاتر النماذج والأبعاد المشتقة ديناميكياً
                </h4>
                {activeFiltersCount > 0 && (
                  <span style={{
                    background: isDark ? 'rgba(19, 93, 121, 0.25)' : '#e0f2fe',
                    color: isDark ? '#38bdf8' : '#0369a1',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '20px'
                  }}>
                    {activeFiltersCount} نشط
                  </span>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <X size={13} />
                  تصفير الفلاتر
                </button>
              )}
            </div>

            {/* شبكة حقول الفلترة */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {/* 1. مسار الاستقبال المحدد (Flow Isolation) */}
              {schemaData?.flows?.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    مسار العمل المحدد:
                  </label>
                  <select
                    value={selectedFlowId}
                    onChange={e => setSelectedFlowId(e.target.value)}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '12.5px', outline: 'none'
                    }}
                  >
                    <option value="">-- كافة مسارات الإدارة --</option>
                    {schemaData.flows.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 2. المبنى / الموقع المعتمد */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                  المبنى / الموقع:
                </label>
                <select
                  value={selectedBuilding}
                  onChange={e => setSelectedBuilding(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', outline: 'none'
                  }}
                >
                  <option value="">جميع المباني المعتمدة</option>
                  {schemaData?.buildings?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. ب) الإدارة الطالبة من الهيكل المؤسسي */}
              {schemaData?.institutionalDepartments?.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    الإدارة الطالبة (الهيكل المؤسسي):
                  </label>
                  <select
                    value={selectedRequesterDept}
                    onChange={e => {
                      setSelectedRequesterDept(e.target.value);
                      setSelectedRequesterDiv('');
                    }}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '12.5px', outline: 'none'
                    }}
                  >
                    <option value="">كافة الإدارات الطالبة</option>
                    {schemaData.institutionalDepartments.map((d: any) => (
                      <option key={d.id || d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 2. ج) القسم الطالب من الهيكل المؤسسي */}
              {availableRequesterDivisions.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    القسم الطالب (الهيكل المؤسسي):
                  </label>
                  <select
                    value={selectedRequesterDiv}
                    onChange={e => setSelectedRequesterDiv(e.target.value)}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '12.5px', outline: 'none'
                    }}
                  >
                    <option value="">كافة الأقسام</option>
                    {availableRequesterDivisions.map((divName: string) => (
                      <option key={divName} value={divName}>{divName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3. الفني المكلف */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                  المهندس المكلف:
                </label>
                <select
                  value={selectedTech}
                  onChange={e => setSelectedTech(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', outline: 'none'
                  }}
                >
                  <option value="">جميع الكوادر</option>
                  {schemaData?.technicians?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.fullName || t.username}</option>
                  ))}
                </select>
              </div>

              {/* 4. المشكلة الرئيسية (مشتقة ديناميكياً من المسار والنماذج) */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                  المشكلة الرئيسية:
                </label>
                <select
                  value={selectedMainIssue}
                  onChange={e => {
                    setSelectedMainIssue(e.target.value);
                    setSelectedSubIssue('');
                  }}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', outline: 'none'
                  }}
                >
                  <option value="">جميع المشاكل الرئيسية</option>
                  {availableMainIssues.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* 4.1 المشكلة الفرعية (تتكيف تلقائياً مع المشكلة الرئيسية) */}
              {availableSubIssues.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    المشكلة الفرعية:
                  </label>
                  <select
                    value={selectedSubIssue}
                    onChange={e => setSelectedSubIssue(e.target.value)}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '12.5px', outline: 'none'
                    }}
                  >
                    <option value="">جميع المشاكل الفرعية</option>
                    {availableSubIssues.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 4.2 أي حقول ونماذج ديناميكية إضافية خاصة بالمسار والإدارة */}
              {schemaData?.dynamicFilterDimensions?.filter((d: any) => d.key !== 'main_issue' && d.key !== 'sub_issue').map((dim: any) => (
                <div key={dim.key}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    {dim.label}:
                  </label>
                  <select
                    value={customFilters[dim.key] || ''}
                    onChange={e => setCustomFilters({ ...customFilters, [dim.key]: e.target.value })}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '12.5px', outline: 'none'
                    }}
                  >
                    <option value="">كافة خيارات ({dim.label})</option>
                    {dim.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* 5. الأولوية */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                  الأولوية:
                </label>
                <select
                  value={selectedPriority}
                  onChange={e => setSelectedPriority(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', outline: 'none'
                  }}
                >
                  <option value="">كافة الأولويات</option>
                  {schemaData?.priorities?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* 6. من تاريخ */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                  من تاريخ:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: '8px',
                    border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12px', outline: 'none'
                  }}
                />
              </div>

              {/* 7. إلى تاريخ */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                  إلى تاريخ:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: '8px',
                    border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12px', outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* ─── الركائز التشغيلية الـ 5 الموحدة (Universal Operational Pillars) ─── */}
          {loadingData ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#135d79' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>جاري استخراج وتحليل المؤشرات التشغيلية...</div>
            </div>
          ) : error ? (
            <div style={{
              background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              color: isDark ? '#fca5a5' : '#b91c1c',
              fontSize: '13px',
              fontWeight: 700
            }}>
              {error}
            </div>
          ) : (
            <>
              {/* الركائز التشغيلية الخمس الكبرى */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}>
                {/* 1. المتأخرة عن SLA (Overdue) */}
                <div style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fff1f2',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecdd3',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e11d48' }}>المتأخرة عن SLA</span>
                    <ShieldAlert size={18} color="#e11d48" />
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#be123c', fontVariantNumeric: 'tabular-nums' }}>
                    {analyticsData?.kpis?.overdueCount || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9f1239', marginTop: '4px' }}>
                    تجاوزت المهلة الزمنية المحددة للحل
                  </div>
                </div>

                {/* 2. المحولة (Transferred In / Out) */}
                <div style={{
                  background: isDark ? 'rgba(243, 108, 33, 0.08)' : '#fff7ed',
                  border: isDark ? '1px solid rgba(243, 108, 33, 0.3)' : '1px solid #ffedd5',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c' }}>التذاكر المحولة</span>
                    <CornerDownLeft size={18} color="#ea580c" />
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#c2410c', fontVariantNumeric: 'tabular-nums' }}>
                    {analyticsData?.kpis?.transferredInCount || 0} <span style={{ fontSize: '13px', fontWeight: 600 }}>واردة</span>
                    {analyticsData?.kpis?.transferredOutCount > 0 && (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: subtextColor }}> / {analyticsData?.kpis?.transferredOutCount} صادرة</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9a3412', marginTop: '4px' }}>
                    تحويلات عابرة للمسارات والإدارات
                  </div>
                </div>

                {/* 3. المسحوبة ذاتياً من الحوض (Self-Pulled) */}
                <div style={{
                  background: isDark ? 'rgba(19, 93, 121, 0.12)' : '#f0f9ff',
                  border: isDark ? '1px solid rgba(19, 93, 121, 0.35)' : '1px solid #bae6fd',
                  borderRadius: '14px',
                  padding: '16px 18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7' }}>المسحوبة ذاتياً من الحوض</span>
                    <Inbox size={18} color="#0284c7" />
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#0369a1', fontVariantNumeric: 'tabular-nums' }}>
                    {analyticsData?.kpis?.pulledCount || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#075985', marginTop: '4px' }}>
                    تم استلامها ذاتياً بمبادرة من الفني
                  </div>
                </div>

                {/* 4. المهام والتكليفات الفرعية (Sub-Tickets) */}
                <div style={{
                  background: isDark ? 'rgba(126, 34, 206, 0.1)' : '#faf5ff',
                  border: isDark ? '1px solid rgba(126, 34, 206, 0.3)' : '1px solid #e9d5ff',
                  borderRadius: '14px',
                  padding: '16px 18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#7e22ce' }}>المهام الفرعية المنبثقة</span>
                    <GitPullRequest size={18} color="#7e22ce" />
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#6b21a8', fontVariantNumeric: 'tabular-nums' }}>
                    {analyticsData?.kpis?.subTicketsCount || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#581c87', marginTop: '4px' }}>
                    تكليفات داخلية تابعة لتذاكر رئيسية
                  </div>
                </div>

                {/* 5. نسبة الإنجاز والالتزام بـ SLA */}
                <div style={{
                  background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
                  border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '16px 18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>الالتزام بـ SLA</span>
                    <CheckCircle2 size={18} color="#16a34a" />
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#15803d', fontVariantNumeric: 'tabular-nums' }}>
                    {analyticsData?.kpis?.slaCompliance || 0}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                    نسبة الإغلاق: {analyticsData?.kpis?.closeRate || 0}% (متوسط {analyticsData?.kpis?.avgResolutionTimeHours || 0} ساعة)
                  </div>
                </div>
              </div>

              {/* ─── شبكة المخططات والتوزيع الإحصائي ─────────────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {/* 1. توزيع المشاكل الرئيسية */}
                <div style={{
                  background: cardBg,
                  borderRadius: '16px',
                  border: `1px solid ${cardBorder}`,
                  padding: '20px',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'
                }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '14.5px', fontWeight: 800, color: textColor }}>
                    تصنيف البلاغات والمشاكل الأكثر تكراراً
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analyticsData?.mainIssueDistribution?.map((issue: any) => (
                      <div key={issue.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                          <span style={{ color: textColor, fontWeight: 700 }}>{issue.name}</span>
                          <span style={{ color: subtextColor, fontVariantNumeric: 'tabular-nums' }}>
                            {issue.count} ({issue.percentage}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${issue.percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #135d79, #f36c21)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. توزيع التذاكر حسب المباني والمواقع المعتمدة */}
                <div style={{
                  background: cardBg,
                  borderRadius: '16px',
                  border: `1px solid ${cardBorder}`,
                  padding: '20px',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'
                }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '14.5px', fontWeight: 800, color: textColor }}>
                    كثافة التذاكر حسب المباني والمواقع المعتمدة
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsData?.buildingDistribution?.map((b: any) => (
                      <div key={b.building} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                        borderRadius: '10px',
                        border: `1px solid ${cardBorder}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: textColor }}>
                          <Building2 size={15} color="#135d79" />
                          <span>{b.building}</span>
                        </div>
                        <span style={{
                          background: isDark ? 'rgba(19, 93, 121, 0.2)' : '#e0f2fe',
                          color: isDark ? '#38bdf8' : '#0369a1',
                          fontWeight: 800,
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {b.count} تذكرة
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. توزيع الطلبات حسب الإدارات الطالبة من الهيكل المؤسسي */}
                <div style={{
                  background: cardBg,
                  borderRadius: '16px',
                  border: `1px solid ${cardBorder}`,
                  padding: '20px',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'
                }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '14.5px', fontWeight: 800, color: textColor }}>
                    الطلبات حسب الإدارات الطالبة (الهيكل المؤسسي)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsData?.requesterDepartmentDistribution?.map((dept: any) => (
                      <div key={dept.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                        borderRadius: '10px',
                        border: `1px solid ${cardBorder}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: textColor }}>
                          <Inbox size={15} color="#f36c21" />
                          <span>{dept.name}</span>
                        </div>
                        <span style={{
                          background: isDark ? 'rgba(243, 108, 33, 0.15)' : '#fff7ed',
                          color: isDark ? '#fb923c' : '#c2410c',
                          fontWeight: 800,
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {dept.count} طلب ({dept.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. لائحة شرف وإنتاجية الكوادر التشغيلية */}
              <div style={{
                background: cardBg,
                borderRadius: '16px',
                border: `1px solid ${cardBorder}`,
                padding: '20px',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Award size={18} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: textColor }}>
                    لائحة كفاءة وأداء الكوادر والمهندسين في المسار
                  </h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ background: tableHeaderBg, borderBottom: `1px solid ${cardBorder}` }}>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>اسم المهندس</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المسندة</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المغلقة</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المسحوبة ذاتياً</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المتأخرة (SLA)</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>نسبة الإنجاز</th>
                        <th style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>التقييم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData?.technicianLeaderboard?.map((tech: any) => (
                        <tr
                          key={tech.techId}
                          style={{ borderBottom: `1px solid ${cardBorder}`, transition: 'background-color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHoverBg)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 800, fontSize: '13px', color: textColor }}>
                            {tech.techName}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontVariantNumeric: 'tabular-nums', color: textColor }}>
                            {tech.totalAssigned}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#10b981' }}>
                            {tech.closed}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontVariantNumeric: 'tabular-nums', color: '#135d79' }}>
                            {tech.pulledCount || 0}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: tech.overdueCount > 0 ? '#ef4444' : subtextColor }}>
                            {tech.overdueCount || 0}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              fontWeight: 800,
                              color: tech.completionRate >= 80 ? '#10b981' : '#f59e0b',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {tech.completionRate}%
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                            ★ {tech.averageRating}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
