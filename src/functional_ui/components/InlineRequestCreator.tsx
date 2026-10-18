/**
 * InlineRequestCreator — In-Place Creation Workspace
 * يعرض خيارات المسارات ونموذج تعبئة المعاملة في مكان الجدول مباشرة (المساحة المحددة بالأحمر)
 * دون أي نوافذ منبثقة عائمة
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  Sparkles, Plus, ChevronLeft, ArrowRight,
  Send, AlertTriangle, CheckCircle2, Loader2,
  Building2, UserCheck, ArrowRightLeft, FileText, Check
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { CinemaTicketFrame } from './CinemaTicketFrame';
import {
  getTopLevelDepartments,
  getDivisionsForDepartment,
  getTeamsForDivision,
  loadCachedOrRemoteOrgTree
} from '../../services/institutionalHierarchy.helpers';

// ── Dynamic Icon Resolver ──────────────────────────────────
const resolveIcon = (name?: string, size = 20, color = 'currentColor') => {
  if (!name) return <FileText size={size} color={color} strokeWidth={2} />;
  const emojiMap: Record<string, string> = {
    '💻': 'Monitor', '🏗️': 'Building2', '📋': 'ClipboardList', '🔧': 'Wrench',
    '📡': 'Radio', '🔒': 'Lock', '📊': 'BarChart3', '🏥': 'HeartPulse',
    '📞': 'Phone', '🖨️': 'Printer', '⚡': 'Zap', '🌐': 'Globe',
    '🗄️': 'Archive', '📱': 'Smartphone', '🔑': 'Key'
  };
  const iconName = emojiMap[name] || name;
  const IconComp = (LucideIcons as any)[iconName] || FileText;
  return <IconComp size={size} color={color} strokeWidth={2} />;
};

// ── Dark Enterprise Field Input ─────────────────────────────
function FieldInput({
  field,
  value,
  onChange,
  darkMode = true,
}: {
  field: { name: string; label: string; type: string; options?: string[]; required?: boolean };
  value: string;
  onChange: (v: string) => void;
  darkMode?: boolean;
}) {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
    background: darkMode ? '#101728' : '#ffffff',
    fontSize: '13px',
    fontFamily: "'Cairo', sans-serif",
    color: darkMode ? '#ffffff' : '#0f172a',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
  };

  if (field.type === 'scheduleEngine') {
    const allowedMode = (field.options && field.options[0]) || 'ANY';
    const [mode, setMode] = useState<'DATE_RANGE' | 'DISCRETE_DAYS' | 'HOURLY_WINDOW' | 'SINGLE_DATE'>(
      allowedMode === 'ANY' ? 'DATE_RANGE' : (allowedMode as any)
    );
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [discreteDates, setDiscreteDates] = useState<string[]>([]);
    const [discreteInput, setDiscreteInput] = useState('');
    const [hourlyDate, setHourlyDate] = useState('');
    const [timeFrom, setTimeFrom] = useState('09:00');
    const [timeTo, setTimeTo] = useState('13:00');
    const [singleDate, setSingleDate] = useState('');

    React.useEffect(() => {
      if (mode === 'DATE_RANGE') {
        if (!startDate) { onChange(''); return; }
        if (!endDate) { onChange(`تاريخ البدء: ${startDate}`); return; }
        const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const total = diff > 0 ? diff : 1;
        onChange(`فترة متصلة من ${startDate} إلى ${endDate} (إجمالي: ${total} يوم)`);
      } else if (mode === 'DISCRETE_DAYS') {
        if (discreteDates.length === 0) { onChange(''); return; }
        onChange(`أيام متفرقة: ${discreteDates.join(', ')} (إجمالي: ${discreteDates.length} يوم)`);
      } else if (mode === 'HOURLY_WINDOW') {
        if (!hourlyDate) { onChange(''); return; }
        const [h1, m1] = timeFrom.split(':').map(Number);
        const [h2, m2] = timeTo.split(':').map(Number);
        const diffMin = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
        const hrs = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        onChange(`إذن خروج: ${hourlyDate} من ${timeFrom} إلى ${timeTo} (المدة: ${hrs}س ${mins}د)`);
      } else if (mode === 'SINGLE_DATE') {
        onChange(singleDate ? `تاريخ محدد: ${singleDate}` : '');
      }
    }, [mode, startDate, endDate, discreteDates, hourlyDate, timeFrom, timeTo, singleDate]);

    const addDiscrete = () => {
      if (discreteInput && !discreteDates.includes(discreteInput)) {
        setDiscreteDates([...discreteDates, discreteInput]);
        setDiscreteInput('');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: darkMode ? '#0e1628' : '#f8fafc', padding: '14px', borderRadius: '10px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0' }}>
        {allowedMode === 'ANY' && (
          <div style={{ display: 'flex', gap: '6px', background: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#e2e8f0', padding: '3px', borderRadius: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'DATE_RANGE', label: '📆 فترة متصلة' },
              { id: 'DISCRETE_DAYS', label: '🗓️ أيام متفرقة' },
              { id: 'HOURLY_WINDOW', label: '⏱️ إذن خروج' },
              { id: 'SINGLE_DATE', label: '📅 موعد محدد' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id as any)}
                style={{
                  flex: 1, minWidth: '75px', padding: '6px 8px', borderRadius: '6px',
                  border: 'none', background: mode === tab.id ? '#2563eb' : 'transparent',
                  color: mode === tab.id ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                  fontWeight: mode === tab.id ? 800 : 600, fontSize: '11px',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'DATE_RANGE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>من تاريخ</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={base} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>إلى تاريخ</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={base} />
              </div>
            </div>
            {startDate && endDate && (
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: darkMode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)', color: darkMode ? '#38bdf8' : '#2563eb', fontSize: '11.5px', fontWeight: 800, textAlign: 'center' }}>
                ✨ إجمالي أيام الفترة: {Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} يوم
              </div>
            )}
          </div>
        )}

        {mode === 'DISCRETE_DAYS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="date" value={discreteInput} onChange={e => setDiscreteInput(e.target.value)} style={{ ...base, flex: 1 }} />
              <button type="button" onClick={addDiscrete} style={{ padding: '0 14px', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> إضافة
              </button>
            </div>
            {discreteDates.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {discreteDates.map(d => (
                  <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', background: darkMode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)', color: darkMode ? '#38bdf8' : '#2563eb', fontSize: '11px', fontWeight: 700 }}>
                    {d}
                    <button type="button" onClick={() => setDiscreteDates(discreteDates.filter(x => x !== d))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontSize: '12px' }}>✕</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>الأيام المحددة: {discreteDates.length}</div>
          </div>
        )}

        {mode === 'HOURLY_WINDOW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>تاريخ اليوم</label>
              <input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} style={base} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>من الساعة</label>
                <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={base} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>إلى الساعة</label>
                <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} style={base} />
              </div>
            </div>
          </div>
        )}

        {mode === 'SINGLE_DATE' && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>التاريخ المطلوب</label>
            <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} style={base} />
          </div>
        )}
      </div>
    );
  }

  const borderDefault = darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
  const focusBorder = darkMode ? '#38bdf8' : '#2563eb';

  if (field.type === 'delegateUser') {
    return (
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="ابحث بالاسم أو الرقم الوظيفي للزميل البديل..."
          style={{ ...base, paddingInlineStart: '36px' }}
          onFocus={e => { e.target.style.borderColor = focusBorder; e.target.style.boxShadow = `0 0 0 1px ${focusBorder}`; }}
          onBlur={e => { e.target.style.borderColor = borderDefault; e.target.style.boxShadow = 'none'; }}
        />
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '12px', color: '#64748b', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          <UserCheck size={16} />
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder={`أدخل ${field.label}...`}
        style={{ ...base, resize: 'vertical' }}
        onFocus={e => { e.target.style.borderColor = focusBorder; e.target.style.boxShadow = `0 0 0 1px ${focusBorder}`; }}
        onBlur={e => { e.target.style.borderColor = borderDefault; e.target.style.boxShadow = 'none'; }}
      />
    );
  }

  if (field.type === 'select') {
    const opts = field.options || [];
    const disabled = opts.length === 0;
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          ...base,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.65 : 1,
        }}
        onFocus={e => { e.target.style.borderColor = focusBorder; e.target.style.boxShadow = `0 0 0 1px ${focusBorder}`; }}
        onBlur={e => { e.target.style.borderColor = borderDefault; e.target.style.boxShadow = 'none'; }}
      >
        <option value="" style={{ background: darkMode ? '#101728' : '#ffffff', color: darkMode ? '#94a3b8' : '#64748b' }}>
          {disabled ? `لا توجد خيارات متاحة (${field.label})` : `اختر ${field.label}...`}
        </option>
        {opts.map(opt => {
          const optVal = typeof opt === 'string' ? opt : (opt as any).label || (opt as any).name || (opt as any).id;
          const optLabel = typeof opt === 'string' ? opt : (opt as any).label || (opt as any).name;
          return (
            <option key={optVal} value={optVal} style={{ background: darkMode ? '#101728' : '#ffffff', color: darkMode ? '#ffffff' : '#0f172a' }}>
              {optLabel}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={`أدخل ${field.label}...`}
      style={base}
      onFocus={e => { e.target.style.borderColor = focusBorder; e.target.style.boxShadow = `0 0 0 1px ${focusBorder}`; }}
      onBlur={e => { e.target.style.borderColor = borderDefault; e.target.style.boxShadow = 'none'; }}
    />
  );
}

// ══════════════════════════════════════════════════════════════
// INLINE REQUEST CREATOR (يظهر مباشرة في مساحة العمل دون نوافذ عائمة)
// ══════════════════════════════════════════════════════════════
export interface InlineRequestCreatorProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function InlineRequestCreator({ onCancel, onSuccess }: InlineRequestCreatorProps) {
  const { requests, canCreateRequest, darkMode } = useHub();

  const [selectedFlow, setSelectedFlow] = useState<typeof requests[0] | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Organizational Structure & Dynamic Fields Store ──
  const [orgTree, setOrgTree] = useState<any>(null);
  const [allDynamicFields, setAllDynamicFields] = useState<any[]>([]);

  useEffect(() => {
    loadCachedOrRemoteOrgTree().then(tree => {
      if (tree) setOrgTree(tree);
    });
    try {
      const stored = localStorage.getItem('litc_dynamic_fields');
      if (stored) setAllDynamicFields(JSON.parse(stored));
    } catch {}

    const handleSync = () => {
      try {
        const stored = localStorage.getItem('litc_dynamic_fields');
        if (stored) setAllDynamicFields(JSON.parse(stored));
        const treeCached = localStorage.getItem('litc_org_tree');
        if (treeCached) setOrgTree(JSON.parse(treeCached));
      } catch {}
    };
    window.addEventListener('litc_settings_updated', handleSync);
    return () => window.removeEventListener('litc_settings_updated', handleSync);
  }, []);

  // Compute departmental hierarchy levels dynamically from real Org Tree
  const deptOptions = useMemo(() => {
    if (!orgTree) return [];
    return getTopLevelDepartments(orgTree).map(d => d.name);
  }, [orgTree]);

  const divisionOptions = useMemo(() => {
    if (!orgTree || !formData.department) return [];
    return getDivisionsForDepartment(orgTree, formData.department).map(d => d.name);
  }, [orgTree, formData.department]);

  const teamOptions = useMemo(() => {
    if (!orgTree || !formData.division) return [];
    return getTeamsForDivision(orgTree, formData.division).map(t => t.name);
  }, [orgTree, formData.division]);

  const handleFieldChange = (name: string, val: string) => {
    setFormData(prev => {
      const next = { ...prev, [name]: val };
      // Cascade clear on higher-level changes
      if (name === 'department') {
        next.division = '';
        next.team = '';
      } else if (name === 'division') {
        next.team = '';
      }
      return next;
    });
  };

  const handleSelectFlow = (flow: typeof requests[0]) => {
    setSelectedFlow(flow);
    setFormData({});
    setStatus('idle');
    setErrorMsg('');
  };

  const handleSubmit = async () => {
    if (!selectedFlow) return;
    const allRequired = selectedFlow.fields.every(f => {
      if (!f.required) return true;
      if (f.name === 'division' && divisionOptions.length === 0) return true;
      if (f.name === 'team' && teamOptions.length === 0) return true;
      return !!formData[f.name]?.trim();
    });
    if (!allRequired) {
      setErrorMsg('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('litc_token') || localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const flowAny = selectedFlow as any;
      const res = await fetch('/api/v1/functional/requests', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          routeId: selectedFlow.id,
          flowDefinitionId: selectedFlow.id,
          title: selectedFlow.title,
          departmentId: selectedFlow.targetDepartmentId,
          divisionId: flowAny.targetDivisionId || undefined,
          teamId: flowAny.targetTeamId || undefined,
          targetDepartmentName: flowAny.targetDepartmentName || undefined,
          targetDivisionName: flowAny.targetDivisionName || undefined,
          targetTeamName: flowAny.targetTeamName || undefined,
          description: formData.description?.trim() || Object.entries(formData).map(([k, v]) => `${k}: ${v}`).join('\n') || selectedFlow.title,
          fields: formData,
          routingMetadata: {
            formData,
            targetDepartmentName: flowAny.targetDepartmentName,
            targetDivisionName: flowAny.targetDivisionName,
            targetTeamName: flowAny.targetTeamName,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        window.dispatchEvent(new CustomEvent('litc_request_created'));
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setErrorMsg(data.error || data.message || 'حدث خطأ غير متوقع');
        setStatus('error');
      }
    } catch {
      setErrorMsg('تعذر الاتصال بالخادم — يرجى المحاولة مجدداً');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Recursive renderer for child dynamic fields
  const renderChildFields = (parentId: string, parentVal: string, level = 1): React.ReactNode => {
    if (!parentVal) return null;
    const parentDef = allDynamicFields.find(df => df.id === parentId || df.name === parentId);
    if (!parentDef || !parentDef.childBindings || parentDef.childBindings.length === 0) return null;

    let selectedOptId = '';
    let selectedOptLabel = parentVal;
    if (Array.isArray(parentDef.options)) {
      const optObj = parentDef.options.find((o: any) =>
        (typeof o === 'string' && o === parentVal) ||
        (typeof o === 'object' && (o.id === parentVal || o.label === parentVal))
      );
      if (optObj) {
        selectedOptId = typeof optObj === 'object' ? optObj.id : optObj;
        selectedOptLabel = typeof optObj === 'object' ? optObj.label : optObj;
      }
    }

    const matchingBindings = parentDef.childBindings.filter((b: any) => {
      const trig = b.triggerValue?.trim();
      return trig === parentVal || trig === selectedOptId || trig === selectedOptLabel;
    });

    if (matchingBindings.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
        {matchingBindings.map((b: any) => {
          const childDef = allDynamicFields.find(df => df.id === b.childFieldId);
          if (!childDef) return null;
          const childFieldName = `dyn_${childDef.id}`;
          const childVal = formData[childFieldName] || '';
          const childOpts = (childDef.options || [])
            .filter((o: any) => typeof o === 'string' || o.isActive !== false)
            .map((o: any) => typeof o === 'string' ? o : o.label);

          return (
            <div
              key={childDef.id}
              style={{
                marginInlineStart: `${level * 14}px`,
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.06)' : 'rgba(37, 99, 235, 0.04)',
                border: darkMode ? '1.5px dashed rgba(56, 189, 248, 0.35)' : '1.5px dashed rgba(37, 99, 235, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#38bdf8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>↳</span>
                  <span>{childDef.name}</span>
                </label>
                <span style={{ fontSize: '10px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b' }}>
                  مستدلة فرعية مرتبطة بـ ({parentVal})
                </span>
              </div>
              <FieldInput
                field={{
                  name: childFieldName,
                  label: childDef.name,
                  type: 'select',
                  options: childOpts,
                  required: false,
                }}
                value={childVal}
                onChange={v => handleFieldChange(childFieldName, v)}
                darkMode={darkMode}
              />
              {renderChildFields(childDef.id, childVal, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const flowColor = selectedFlow?.color || '#38bdf8';
  const blockingStatus = selectedFlow ? canCreateRequest(selectedFlow.id) : { allowed: true };

  return (
    <div
      style={{
        backgroundColor: darkMode ? '#111827' : '#ffffff',
        borderRadius: '8px',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.35)' : '0 4px 20px rgba(30, 58, 82, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
      }}
    >
      {/* ── Main Workspace Content ── */}
      <div style={{ padding: '22px' }}>
        {/* VIEW 1: ROUTE SELECTION (عند عدم اختيار مسار) */}
        {!selectedFlow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ── Route Options Grid ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '14px',
              }}
            >
              {requests.map((flow) => {
                const fColor = flow.color || '#38bdf8';
                const block = canCreateRequest(flow.id);
                const targetDept = (flow as any).targetDepartmentName || 'إدارة تقنية المعلومات';

                return (
                  <CinemaTicketFrame
                    key={flow.id}
                    accentColor={fColor}
                    cornerCutout={12}
                    notchRadius={5}
                    numNotches={2}
                    dashIndent={14}
                    showDashedLines={false}
                    contentPadding="14px 16px"
                    role="button"
                    tabIndex={block.allowed ? 0 : -1}
                    onClick={() => block.allowed && handleSelectFlow(flow)}
                    style={{
                      width: '100%',
                      cursor: block.allowed ? 'pointer' : 'not-allowed',
                      opacity: block.allowed ? 1 : 0.55,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: `${fColor}18`,
                          border: `1.5px solid ${fColor}50`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: fColor,
                        }}
                      >
                        {resolveIcon(flow.icon, 22, fColor)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: darkMode ? '#ffffff' : '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: "'Tajawal', sans-serif",
                          }}
                        >
                          {flow.title}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: darkMode ? '#94a3b8' : '#64748b',
                            marginTop: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Building2 size={12} color={darkMode ? '#60a5fa' : '#2563eb'} />
                          <span>{targetDept}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '10.5px',
                            color: fColor,
                            fontWeight: 700,
                            marginTop: '4px',
                          }}
                        >
                          {!block.allowed ? block.message : `${flow.fields.length} حقول مطلوبة`}
                        </div>
                      </div>
                      {block.allowed && (
                        <ChevronLeft size={18} color={fColor} style={{ flexShrink: 0, opacity: 0.7 }} />
                      )}
                    </div>
                  </CinemaTicketFrame>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: FORM FOR SELECTED ROUTE */}
        {selectedFlow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Flow Info Bar with Change Route Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '8px',
                backgroundColor: `${flowColor}12`,
                border: `1.5px solid ${flowColor}35`,
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: `${flowColor}25`,
                    border: `1.2px solid ${flowColor}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: flowColor,
                  }}
                >
                  {resolveIcon(selectedFlow.icon, 20, flowColor)}
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                    {selectedFlow.title}
                  </div>
                  <div style={{ fontSize: '11px', color: flowColor, fontWeight: 700, marginTop: '2px' }}>
                    🎯 جهة التوجيه المعتمدة: {(selectedFlow as any).targetDepartmentName || 'إدارة تقنية المعلومات'}
                    {(selectedFlow as any).targetDivisionName && ` ← ${(selectedFlow as any).targetDivisionName}`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFlow(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  color: darkMode ? '#cbd5e1' : '#334155',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: "'Cairo', sans-serif",
                  boxShadow: darkMode ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <ArrowRightLeft size={13} color={darkMode ? '#60a5fa' : '#2563eb'} />
                <span>تغيير مسار الطلب</span>
              </button>
            </div>

            {/* Success State */}
            {status === 'success' && (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    border: '1.5px solid rgba(16, 185, 129, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={32} color="#34d399" />
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#34d399', fontFamily: "'Tajawal', sans-serif" }}>
                  تم تقديم المعاملة بنجاح!
                </div>
                <div style={{ fontSize: '12.5px', color: darkMode ? '#cbd5e1' : '#475569' }}>
                  تم تسجيل الطلب وإحالته للإدارة المختصة للاعتماد والمتابعة. جارٍ العودة لسجل المعاملات...
                </div>
              </div>
            )}

            {/* Form Fields */}
            {status !== 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedFlow.fields.map((field) => {
                  let fieldToRender = { ...field };

                  // Handle cascading hierarchy options from real Org Tree
                  if (field.name === 'department') {
                    fieldToRender.options = deptOptions.length > 0 ? deptOptions : field.options;
                  } else if (field.name === 'division') {
                    fieldToRender.options = divisionOptions;
                  } else if (field.name === 'team') {
                    fieldToRender.options = teamOptions;
                  }

                  const hasExplicitTeamField = selectedFlow.fields.some(f => f.name === 'team');
                  const isDivisionField = field.name === 'division';
                  const dynamicFieldId = field.name.startsWith('dyn_') ? field.name.replace('dyn_', '') : null;

                  return (
                    <React.Fragment key={field.name}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '12.5px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e293b' }}>
                            {fieldToRender.label}
                          </label>
                          {fieldToRender.required && (
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: darkMode ? '#38bdf8' : '#2563eb', backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                              مطلوب
                            </span>
                          )}
                        </div>
                        <FieldInput
                          field={fieldToRender}
                          value={formData[field.name] || ''}
                          onChange={v => handleFieldChange(field.name, v)}
                          darkMode={darkMode}
                        />

                        {/* If dynamic field has child bindings for the selected option, render child fields below */}
                        {dynamicFieldId && renderChildFields(dynamicFieldId, formData[field.name])}

                        {/* If taxonomy main has subIssues */}
                        {field.name === 'taxonomyMain' && (() => {
                          const mainTax = (selectedFlow as any).formConfig?.taxonomy?.find(
                            (t: any) => t.label === formData.taxonomyMain || t.id === formData.taxonomyMain
                          );
                          if (!mainTax?.subIssues?.length) return null;
                          return (
                            <div style={{
                              marginInlineStart: '14px',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.04)',
                              border: darkMode ? '1px dashed rgba(56, 189, 248, 0.3)' : '1px dashed rgba(37, 99, 235, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#38bdf8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>↳</span>
                                  <span>التصنيف الفرعي للمشكلة</span>
                                </label>
                                <span style={{ fontSize: '9.5px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>
                                  تابع لـ ({formData.taxonomyMain})
                                </span>
                              </div>
                              <FieldInput
                                field={{
                                  name: 'taxonomySub',
                                  label: 'التصنيف الفرعي',
                                  type: 'select',
                                  options: mainTax.subIssues.filter((s: any) => s.isActive !== false).map((s: any) => s.label),
                                  required: false,
                                }}
                                value={formData.taxonomySub || ''}
                                onChange={v => handleFieldChange('taxonomySub', v)}
                                darkMode={darkMode}
                              />
                            </div>
                          );
                        })()}
                      </div>

                      {/* If division is selected and team is NOT in fields, but units/teams exist in org tree */}
                      {isDivisionField && !hasExplicitTeamField && teamOptions.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginInlineStart: '12px', padding: '10px 14px', borderRadius: '8px', background: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#38bdf8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>👥</span>
                              <span>الوحدة / الفريق التابع له (اختياري)</span>
                            </label>
                            <span style={{ fontSize: '9.5px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b' }}>
                              مستخرج من الهيكل المؤسسي
                            </span>
                          </div>
                          <FieldInput
                            field={{
                              name: 'team',
                              label: 'الوحدة / الفريق التابع له',
                              type: 'select',
                              options: teamOptions,
                              required: false,
                            }}
                            value={formData.team || ''}
                            onChange={v => handleFieldChange('team', v)}
                            darkMode={darkMode}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {errorMsg && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form Buttons */}
                <div
                  style={{
                    paddingTop: '16px',
                    borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFlow(null)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                      color: darkMode ? '#94a3b8' : '#64748b',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    إلغاء والعودة
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      padding: '10px 26px',
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, ${flowColor} 0%, #2563eb 100%)`,
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: `0 4px 16px ${flowColor}40`,
                      fontFamily: "'Cairo', sans-serif",
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>جاري الإرسال والاعتماد...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>إرسال المعاملة والاعتماد</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
