/**
 * LITC Enterprise OS v43 - Dynamic Form-Aware Analytics Engine
 * =============================================================
 * محرك التحليلات والمقارنة الذكي للإدارات:
 * - يستمد فلاتره وأبعاده ديناميكياً من نماذج التذاكر ومسارات العمل.
 * - يتيح استعراض الإدارة الأصلية أو أي إدارة مصرح بها من قبل مدير النظام.
 * - يدمج محرك المقارنة والمفاضلة متعدد الأبعاد.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, Filter, RefreshCw, Download, Calendar, 
  Building2, Users, CheckCircle2, Clock, AlertCircle, 
  Layers, ArrowRightLeft, Sparkles, ChevronDown, X, SlidersHorizontal
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

export const DynamicFormAwareAnalytics: React.FC = () => {
  // ─── 1. الإدارات المصرح بها ─────────────────────────────────────────
  const [accessibleDepts, setAccessibleDepts] = useState<AccessibleDept[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // ─── 2. المخطط والفلاتر الديناميكية ─────────────────────────────────
  const [schemaData, setSchemaData] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState<boolean>(true);

  // ─── 3. قيم الفلاتر المحددة ─────────────────────────────────────────
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedMainIssue, setSelectedMainIssue] = useState<string>('');
  const [selectedSubIssue, setSelectedSubIssue] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({});

  // ─── 4. نمط العرض: مؤشرات عامة أو محرك مقارنة ───────────────────────
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMPARISON'>('OVERVIEW');

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
      setSelectedBuilding('');
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
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        buildingId: selectedBuilding || undefined,
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
  }, [selectedDeptId, startDate, endDate, selectedBuilding, selectedPriority, selectedState, selectedTech, selectedMainIssue, selectedSubIssue, customFilters]);

  useEffect(() => {
    if (selectedDeptId) {
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData, selectedDeptId]);

  // حساب عدد الفلاتر النشطة
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBuilding) count++;
    if (selectedPriority) count++;
    if (selectedState) count++;
    if (selectedTech) count++;
    if (selectedMainIssue) count++;
    if (selectedSubIssue) count++;
    if (startDate || endDate) count++;
    count += Object.values(customFilters).filter(Boolean).length;
    return count;
  }, [selectedBuilding, selectedPriority, selectedState, selectedTech, selectedMainIssue, selectedSubIssue, startDate, endDate, customFilters]);

  const clearAllFilters = () => {
    setSelectedBuilding('');
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

  return (
    <div style={{
      fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
      direction: 'rtl',
      lineHeight: 1.7,
      color: '#1e293b'
    }}>
      {/* ─── الترويسة الرئيسية ───────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '24px',
        padding: '24px 28px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)'
          }}>
            <BarChart3 size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                محرك التحليلات والمقارنة والتقارير الذكي
              </h2>
              {isAdmin && (
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #fde68a'
                }}>
                  رؤية قيادية شاملة (Admin)
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              استخراج فوري للمؤشرات ومقارنة الأداء مشتقة ديناميكياً من نماذج وبلاغات الإدارات
            </p>
          </div>
        </div>

        {/* محدد الإدارة المستهدفة */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>الإدارة المستهدفة:</span>
          <select
            value={selectedDeptId || ''}
            onChange={e => setSelectedDeptId(Number(e.target.value))}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              background: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              minWidth: '260px'
            }}
          >
            {accessibleDepts.map(d => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName} {d.isNative ? '(إدارتك)' : '(تفويض رقابي)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── أزرار التبديل بين اللوحة العامة ومحرك المقارنة ──────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          background: '#e2e8f0',
          padding: '4px',
          borderRadius: '14px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              background: activeTab === 'OVERVIEW' ? '#ffffff' : 'transparent',
              color: activeTab === 'OVERVIEW' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'OVERVIEW' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <BarChart3 size={18} color={activeTab === 'OVERVIEW' ? '#0284c7' : 'currentColor'} />
            المؤشرات العامة والتحليل
          </button>

          <button
            onClick={() => setActiveTab('COMPARISON')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              background: activeTab === 'COMPARISON' ? '#ffffff' : 'transparent',
              color: activeTab === 'COMPARISON' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'COMPARISON' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <ArrowRightLeft size={18} color={activeTab === 'COMPARISON' ? '#0284c7' : 'currentColor'} />
            محرك المقارنة والمفاضلة
          </button>
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchAnalyticsData}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* ─── المحتوى بحسب التبويب المختار ────────────────────────────── */}
      {activeTab === 'COMPARISON' ? (
        <MultiDimensionalComparator
          departmentId={selectedDeptId || 0}
          departmentName={currentDeptObj?.departmentName || ''}
          technicians={schemaData?.technicians || []}
          buildings={schemaData?.buildings || []}
          canExport={currentDeptObj?.canExport ?? true}
        />
      ) : (
        <>
          {/* ─── شريط الفلاتر الديناميكي المستمد من النماذج ───────────────── */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} color="#0284c7" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  فلاتر النماذج والأبعاد المشتقة
                </h4>
                {activeFiltersCount > 0 && (
                  <span style={{
                    background: '#e0f2fe',
                    color: '#0284c7',
                    fontSize: '12px',
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
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <X size={14} />
                  إلغاء تفعيل الفلاتر
                </button>
              )}
            </div>

            {/* شبكة حقول الفلترة التوليدية */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px'
            }}>
              {/* 1. المبنى */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  المبنى / الموقع:
                </label>
                <select
                  value={selectedBuilding}
                  onChange={e => setSelectedBuilding(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">جميع المباني</option>
                  {schemaData?.buildings?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. المشكلة الرئيسية (Taxonomy) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  المشكلة الرئيسية:
                </label>
                <select
                  value={selectedMainIssue}
                  onChange={e => setSelectedMainIssue(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">كافة المشاكل الرئيسية</option>
                  {schemaData?.dynamicFilterDimensions?.find((d: any) => d.key === 'main_issue')?.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* 3. المشكلة الفرعية (Sub Issue) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  المشكلة الفرعية:
                </label>
                <select
                  value={selectedSubIssue}
                  onChange={e => setSelectedSubIssue(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">كافة المشاكل الفرعية</option>
                  {schemaData?.dynamicFilterDimensions?.find((d: any) => d.key === 'sub_issue')?.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* 4. الأولوية */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  الأولوية:
                </label>
                <select
                  value={selectedPriority}
                  onChange={e => setSelectedPriority(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">جميع الأولويات</option>
                  <option value="CRITICAL">حرجة للغاية</option>
                  <option value="HIGH">عالية</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="LOW">منخفضة</option>
                </select>
              </div>

              {/* 5. الفني المسند إليه */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  الفني المسند:
                </label>
                <select
                  value={selectedTech}
                  onChange={e => setSelectedTech(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">كافة الفنيين</option>
                  {schemaData?.technicians?.map((tech: any) => (
                    <option key={tech.id} value={tech.id}>{tech.fullName || tech.username}</option>
                  ))}
                </select>
              </div>

              {/* 6. من تاريخ */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  من تاريخ:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* 7. إلى تاريخ */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  إلى تاريخ:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* ─── بطاقات مؤشرات الأداء (Live KPI Cards) ──────────────────── */}
          {loadingData ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#0284c7' }}>
              <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '15px', fontWeight: 700 }}>جاري استخراج المؤشرات وتحليل البيانات...</div>
            </div>
          ) : error ? (
            <div style={{ padding: '18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', color: '#b91c1c' }}>
              {error}
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {/* 1. إجمالي الطلبات */}
                <div style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>إجمالي التذاكر المطابقة</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
                    {analyticsData?.kpis?.totalTickets || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>ضمن نطاق الفلاتر المحددة</div>
                </div>

                {/* 2. التذاكر المنجزة */}
                <div style={{
                  background: '#f0fdf4',
                  padding: '20px',
                  borderRadius: '18px',
                  border: '1px solid #bbf7d0',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.05)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>تم إنجازها وإغلاقها</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d' }}>
                    {analyticsData?.kpis?.closedTickets || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>
                    نسبة الإغلاق: {analyticsData?.kpis?.closeRate || 0}%
                  </div>
                </div>

                {/* 3. قيد المعالجة */}
                <div style={{
                  background: '#fffbeb',
                  padding: '20px',
                  borderRadius: '18px',
                  border: '1px solid #fde68a',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.05)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', marginBottom: '6px' }}>قيد الإجراء لدى الفنيين</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#b45309' }}>
                    {analyticsData?.kpis?.inProgressTickets || 0}
                  </div>
                  <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px' }}>تذاكر تحت المتابعة الميدانية</div>
                </div>

                {/* 4. زمن الحل */}
                <div style={{
                  background: '#f8fafc',
                  padding: '20px',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>متوسط زمن المعالجة والحل</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284c7' }}>
                    {analyticsData?.kpis?.avgResolutionTimeHours || 0} <span style={{ fontSize: '14px', fontWeight: 500 }}>ساعة</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>من الاستلام حتى الإغلاق</div>
                </div>

                {/* 5. الالتزام بـ SLA */}
                <div style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>نسبة الالتزام باتفاقية الخدمة</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
                    {analyticsData?.kpis?.slaCompliance || 0}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>ضمن الحدود الزمنية القياسية</div>
                </div>
              </div>

              {/* ─── شبكة المخططات والتوزيع الإحصائي ─────────────────────── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                {/* مخطط 1: توزيع المشاكل الرئيسية */}
                <div style={{
                  background: '#fff',
                  padding: '22px',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    توزيع المشاكل والأعطال الأكثر تكراراً
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {analyticsData?.mainIssueDistribution?.map((issue: any) => (
                      <div key={issue.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{issue.name}</span>
                          <span style={{ color: '#64748b' }}>{issue.count} تذكرة ({issue.percentage}%)</span>
                        </div>
                        <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${issue.percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* مخطط 2: أداء الفنيين والكادر */}
                <div style={{
                  background: '#fff',
                  padding: '22px',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    كفاءة وإنجاز الكادر الفني للقسم
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analyticsData?.technicianLeaderboard?.map((tech: any) => (
                      <div key={tech.techId} style={{
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700
                          }}>
                            {tech.techName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{tech.techName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>إنجاز {tech.closed} من أصل {tech.totalAssigned}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>{tech.completionRate}%</div>
                          <div style={{ fontSize: '11px', color: '#eab308' }}>★ {tech.averageRating}</div>
                        </div>
                      </div>
                    ))}
                    {(!analyticsData?.technicianLeaderboard || analyticsData.technicianLeaderboard.length === 0) && (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        لا توجد تذاكر مسندة لفنيين محددين في هذا النطاق
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DynamicFormAwareAnalytics;
