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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // المسار التشغيلي المختار وتعريفاته وأبعاده التلقائية المكتشفة من المسار
  const selectedRouteDef = useMemo(() => {
    if (!schemaData?.routeDefinitions || schemaData.routeDefinitions.length === 0) return null;
    if (selectedFlowId) {
      return schemaData.routeDefinitions.find((r: any) => r.id === selectedFlowId) || null;
    }
    return schemaData.routeDefinitions[0] || null;
  }, [selectedFlowId, schemaData]);

  // البعد الأساسي للمسار (مثال: المشاكل الرئيسية، نوع الإجازة، طبيعة العطل)
  const primaryRouteDimension = useMemo(() => {
    if (selectedRouteDef?.dimensions && selectedRouteDef.dimensions.length > 0) {
      return selectedRouteDef.dimensions[0];
    }
    return schemaData?.dynamicFilterDimensions?.find((d: any) => d.key === 'main_issue') || null;
  }, [selectedRouteDef, schemaData]);

  // الخيارات المتاحة للمستدلة الأساسية
  const availableMainIssues = useMemo(() => {
    if (primaryRouteDimension?.options && primaryRouteDimension.options.length > 0) {
      return primaryRouteDimension.options.map((o: any) => typeof o === 'string' ? o : (o.label || o.name || o.id));
    }
    return schemaData?.dynamicFilterDimensions?.find((d: any) => d.key === 'main_issue')?.options || [];
  }, [primaryRouteDimension, schemaData]);

  // البعد الفرعي المرتبط بالخيار المختار (Child Binding Dimension)
  const activeChildDimension = useMemo(() => {
    if (!primaryRouteDimension || !selectedMainIssue) return null;
    if (primaryRouteDimension.childBindingsMap) {
      const matchedOpt = primaryRouteDimension.options?.find((o: any) => 
        (typeof o === 'string' ? o : (o.label || o.name || o.id)) === selectedMainIssue
      );
      const bindingKey = matchedOpt ? (matchedOpt.id || matchedOpt.label) : selectedMainIssue;
      if (primaryRouteDimension.childBindingsMap[bindingKey]) {
        return primaryRouteDimension.childBindingsMap[bindingKey];
      }
      for (const [k, v] of Object.entries(primaryRouteDimension.childBindingsMap)) {
        if (k === selectedMainIssue || (matchedOpt && k === matchedOpt.id)) return v;
      }
    }
    if (schemaData?.issueHierarchy?.[selectedMainIssue]?.length > 0) {
      return {
        childKey: 'sub_issue',
        childLabel: 'المشكلة الفرعية',
        options: schemaData.issueHierarchy[selectedMainIssue].map((lbl: string) => ({ id: lbl, label: lbl }))
      };
    }
    return null;
  }, [primaryRouteDimension, selectedMainIssue, schemaData]);

  // الخيارات الفرعية المتاحة المتكيفة تلقائياً
  const availableSubIssues = useMemo(() => {
    if (activeChildDimension?.options && activeChildDimension.options.length > 0) {
      return activeChildDimension.options.map((o: any) => typeof o === 'string' ? o : (o.label || o.name || o.id));
    }
    if (selectedMainIssue && schemaData?.issueHierarchy?.[selectedMainIssue]?.length > 0) {
      return schemaData.issueHierarchy[selectedMainIssue];
    }
    return schemaData?.dynamicFilterDimensions?.find((d: any) => d.key === 'sub_issue')?.options || [];
  }, [activeChildDimension, selectedMainIssue, schemaData]);

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
          routeDefinitions={schemaData?.routeDefinitions || []}
          dynamicTaxonomy={schemaData?.dynamicTaxonomy || null}
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

            {/* ─── 1. الركائز الأربع الأساسية (Primary Fixed Anchors) ─── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '12px',
              marginBottom: '14px'
            }}>
              {/* أ) مسار العمل المحدد */}
              <div style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                padding: '10px 12px',
                borderRadius: '12px',
                border: `1px solid ${cardBorder}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#135d79', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Layers size={13} color="#135d79" />
                    مسار العمل المعتمد:
                  </label>
                  {selectedRouteDef?.teamName && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: isDark ? 'rgba(243, 108, 33, 0.15)' : '#fff7ed',
                      color: '#ea580c',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(243, 108, 33, 0.25)'
                    }}>
                      فريق: {selectedRouteDef.teamName}
                    </span>
                  )}
                </div>
                <select
                  value={selectedFlowId}
                  onChange={e => {
                    setSelectedFlowId(e.target.value);
                    setSelectedMainIssue('');
                    setSelectedSubIssue('');
                  }}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: `1px solid ${selectedFlowId ? '#135d79' : cardBorder}`,
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', fontWeight: 700, outline: 'none'
                  }}
                >
                  <option value="">-- كافة مسارات الإدارة --</option>
                  {schemaData?.flows?.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* ب) المبنى / الموقع المعتمد */}
              <div style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                padding: '10px 12px',
                borderRadius: '12px',
                border: `1px solid ${cardBorder}`
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 800, color: subtextColor, marginBottom: '6px' }}>
                  <Building2 size={13} color="#135d79" />
                  المبنى / الموقع:
                </label>
                <select
                  value={selectedBuilding}
                  onChange={e => setSelectedBuilding(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: `1px solid ${selectedBuilding ? '#135d79' : cardBorder}`,
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', fontWeight: 600, outline: 'none'
                  }}
                >
                  <option value="">جميع المباني المعتمدة</option>
                  {schemaData?.buildings?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* ج) الإدارة الطالبة من الهيكل المؤسسي */}
              <div style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                padding: '10px 12px',
                borderRadius: '12px',
                border: `1px solid ${cardBorder}`
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 800, color: subtextColor, marginBottom: '6px' }}>
                  <Sparkles size={13} color="#135d79" />
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
                    border: `1px solid ${selectedRequesterDept ? '#135d79' : cardBorder}`,
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', fontWeight: 600, outline: 'none'
                  }}
                >
                  <option value="">كافة الإدارات الطالبة</option>
                  {schemaData?.institutionalDepartments?.map((d: any) => (
                    <option key={d.id || d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* د) المهندس المكلف */}
              <div style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                padding: '10px 12px',
                borderRadius: '12px',
                border: `1px solid ${cardBorder}`
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 800, color: subtextColor, marginBottom: '6px' }}>
                  <Users size={13} color="#135d79" />
                  المهندس المكلف:
                </label>
                <select
                  value={selectedTech}
                  onChange={e => setSelectedTech(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: '8px',
                    border: `1px solid ${selectedTech ? '#135d79' : cardBorder}`,
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: textColor, fontSize: '12.5px', fontWeight: 600, outline: 'none'
                  }}
                >
                  <option value="">جميع الكوادر</option>
                  {schemaData?.technicians?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.fullName || t.username}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── 2. كبسولات المستدلات والأبعاد الذكية التكيفية للمسار ─── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              paddingTop: '12px',
              borderTop: `1px dashed ${cardBorder}`
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#135d79', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={14} color="#f36c21" />
                مستدلات وتصنيفات المسار:
              </span>

              {/* كبسولة المستدلة الرئيسية (مشتقة تلقائياً من المسار) */}
              {availableMainIssues.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: selectedMainIssue ? (isDark ? 'rgba(19, 93, 121, 0.25)' : '#e0f2fe') : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9'),
                  borderRadius: '24px',
                  padding: '4px 12px',
                  border: `1px solid ${selectedMainIssue ? '#135d79' : cardBorder}`,
                  gap: '6px',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: selectedMainIssue ? '#135d79' : subtextColor }}>
                    {primaryRouteDimension?.label || 'المشاكل الرئيسية'}:
                  </span>
                  <select
                    value={selectedMainIssue}
                    onChange={e => {
                      setSelectedMainIssue(e.target.value);
                      setSelectedSubIssue('');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: textColor,
                      fontSize: '12px',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">كافة الخيارات</option>
                    {availableMainIssues.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {selectedMainIssue && (
                    <button
                      onClick={() => {
                        setSelectedMainIssue('');
                        setSelectedSubIssue('');
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* كبسولة المستدلة الفرعية (تنبثق تلقائياً فقط إذا كان للخيار المختار تفريع) */}
              {activeChildDimension && availableSubIssues.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: selectedSubIssue ? (isDark ? 'rgba(243, 108, 33, 0.2)' : '#fff7ed') : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                  borderRadius: '24px',
                  padding: '4px 12px',
                  border: `1px solid ${selectedSubIssue ? '#f36c21' : cardBorder}`,
                  gap: '6px',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: selectedSubIssue ? '#ea580c' : subtextColor }}>
                    ↳ {activeChildDimension.childLabel}:
                  </span>
                  <select
                    value={selectedSubIssue}
                    onChange={e => setSelectedSubIssue(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: textColor,
                      fontSize: '12px',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">كافة الفروع</option>
                    {availableSubIssues.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {selectedSubIssue && (
                    <button
                      onClick={() => setSelectedSubIssue('')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* أي حقول ديناميكية مخصصة للمسار المختار */}
              {selectedRouteDef?.dimensions?.filter((d: any) => d.id !== 'taxonomy' && d.key !== 'main_issue' && d.id !== primaryRouteDimension?.id).map((dim: any) => (
                <div key={dim.id || dim.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: customFilters[dim.key] ? (isDark ? 'rgba(19, 93, 121, 0.25)' : '#e0f2fe') : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9'),
                  borderRadius: '24px',
                  padding: '4px 12px',
                  border: `1px solid ${customFilters[dim.key] ? '#135d79' : cardBorder}`,
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: subtextColor }}>
                    {dim.label}:
                  </span>
                  <select
                    value={customFilters[dim.key] || ''}
                    onChange={e => setCustomFilters({ ...customFilters, [dim.key]: e.target.value })}
                    style={{
                      border: 'none', background: 'transparent',
                      color: textColor, fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="">الكل</option>
                    {dim.options?.map((opt: any) => (
                      <option key={opt.id || opt.label} value={opt.label || opt.id}>{opt.label || opt.name || opt}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* زر إظهار/إخفاء الفلاتر الإضافية التكميلية */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={{
                  marginInlineStart: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${showAdvancedFilters ? '#135d79' : cardBorder}`,
                  background: showAdvancedFilters ? (isDark ? 'rgba(19, 93, 121, 0.15)' : '#f0f9ff') : 'transparent',
                  color: showAdvancedFilters ? '#135d79' : subtextColor,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Filter size={12} />
                <span>{showAdvancedFilters ? 'إخفاء الفلاتر الإضافية' : '⚙️ فلاتر المعالجة والجدولة'}</span>
              </button>
            </div>

            {/* ─── 3. الدرج القابل للطي للفلاتر الإضافية (Collapsible Secondary Filters) ─── */}
            {showAdvancedFilters && (
              <div style={{
                marginTop: '14px',
                paddingTop: '14px',
                borderTop: `1px solid ${cardBorder}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '12px'
              }}>
                {/* الأولوية */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    الأولوية:
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '12px', outline: 'none'
                    }}
                  >
                    <option value="">كافة الأولويات</option>
                    {schemaData?.priorities?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* القسم الطالب */}
                {availableRequesterDivisions.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                      القسم الطالب (الهيكل المؤسسي):
                    </label>
                    <select
                      value={selectedRequesterDiv}
                      onChange={e => setSelectedRequesterDiv(e.target.value)}
                      style={{
                        width: '100%', padding: '6px 10px', borderRadius: '8px',
                        border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                        color: textColor, fontSize: '12px', outline: 'none'
                      }}
                    >
                      <option value="">كافة الأقسام</option>
                      {availableRequesterDivisions.map((divName: string) => (
                        <option key={divName} value={divName}>{divName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* من تاريخ */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    من تاريخ:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{
                      width: '100%', padding: '5px 8px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '11.5px', outline: 'none'
                    }}
                  />
                </div>

                {/* إلى تاريخ */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: subtextColor, marginBottom: '5px' }}>
                    إلى تاريخ:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{
                      width: '100%', padding: '5px 8px', borderRadius: '8px',
                      border: `1px solid ${cardBorder}`, background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor, fontSize: '11.5px', outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}
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
