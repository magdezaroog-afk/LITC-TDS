/**
 * InlineRequestCreator — In-Place Creation Workspace with Multi-Stage Wizard
 * & Realistic Progressive Top-to-Bottom Perforated Ticket Tear-Off Action
 * (NEXUS TDS 2026 Standards)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  Sparkles, Plus, ChevronLeft, ChevronRight, ArrowRight,
  Send, AlertTriangle, CheckCircle2, Loader2,
  Building2, UserCheck, ArrowRightLeft, FileText, Check,
  Clock, Hash, QrCode, Scissors, Eye, Layers, ShieldCheck
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
                  <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    {d}
                    <button type="button" onClick={() => setDiscreteDates(discreteDates.filter(x => x !== d))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontWeight: 900 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'HOURLY_WINDOW' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>يوم الإذن</label>
              <input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} style={base} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>من الساعة</label>
              <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={base} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>إلى الساعة</label>
              <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} style={base} />
            </div>
          </div>
        )}

        {mode === 'SINGLE_DATE' && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '4px' }}>حدد التاريخ</label>
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
// INLINE REQUEST CREATOR (المسارات دائماً بالأعلى + الفورم ذو حجم ثابت ومراحل متناسقة)
// ══════════════════════════════════════════════════════════════
export interface InlineRequestCreatorProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function InlineRequestCreator({ onCancel, onSuccess }: InlineRequestCreatorProps) {
  const { requests, canCreateRequest, darkMode, user } = useHub();

  const [selectedFlow, setSelectedFlow] = useState<typeof requests[0] | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [highlightPulse, setHighlightPulse] = useState(false);

  // ── Realistic Progressive Tearing States ──
  // 'idle' -> 'ripping' (starts at top, moves downward over 650ms) -> 'departing' (two pieces fly away) -> 'completed'
  const [tearState, setTearState] = useState<'idle' | 'ripping' | 'departing' | 'completed'>('idle');
  const [previewSerial, setPreviewSerial] = useState('');

  // ── Organizational Structure & Dynamic Fields Store ──
  const [orgTree, setOrgTree] = useState<any>(null);
  const [allDynamicFields, setAllDynamicFields] = useState<any[]>([]);
  const formTopRef = useRef<HTMLDivElement>(null);

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

    const handleFocusRoutes = () => {
      setHighlightPulse(true);
      setTimeout(() => setHighlightPulse(false), 1400);
    };

    window.addEventListener('litc_settings_updated', handleSync);
    window.addEventListener('litc_focus_routes', handleFocusRoutes);
    return () => {
      window.removeEventListener('litc_settings_updated', handleSync);
      window.removeEventListener('litc_focus_routes', handleFocusRoutes);
    };
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
    if (selectedFlow?.id === flow.id) {
      setSelectedFlow(null);
      return;
    }
    setSelectedFlow(flow);
    setFormData({});
    setCurrentStep(1);
    setStatus('idle');
    setErrorMsg('');
    setTearState('idle');
    setPreviewSerial(`REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Determine stage layout based on field count
  const totalStages = useMemo(() => {
    if (!selectedFlow) return 2;
    return selectedFlow.fields.length > 3 ? 3 : 2;
  }, [selectedFlow]);

  // Split fields between stages
  const stepFields = useMemo(() => {
    if (!selectedFlow) return { step1: [], step2: [] };
    const all = selectedFlow.fields;

    if (totalStages === 2) {
      return { step1: all, step2: [] };
    }

    const isCore = (name: string) =>
      ['department', 'division', 'team', 'title', 'subject', 'category', 'priority', 'urgency'].includes(name);

    let step1 = all.filter(f => isCore(f.name));
    let step2 = all.filter(f => !isCore(f.name));

    if (step1.length === 0) {
      step1 = all.slice(0, 2);
      step2 = all.slice(2);
    }

    return { step1, step2 };
  }, [selectedFlow, totalStages]);

  const validateCurrentStep = () => {
    if (!selectedFlow) return true;
    const currentFields = currentStep === 1 ? stepFields.step1 : stepFields.step2;

    const missingRequired = currentFields.find(f => {
      if (!f.required) return false;
      if (f.name === 'division' && divisionOptions.length === 0) return false;
      if (f.name === 'team' && teamOptions.length === 0) return false;
      return !formData[f.name]?.trim();
    });

    if (missingRequired) {
      setErrorMsg(`يرجى تعبئة الحقل الإلزامي: (${missingRequired.label})`);
      return false;
    }

    setErrorMsg('');
    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < totalStages) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ── Realistic Progressive Tearing & Submit Trigger ───────────────
  const handleTearAndSubmit = async () => {
    if (!selectedFlow || loading || tearState !== 'idle') return;

    const allRequired = selectedFlow.fields.every(f => {
      if (!f.required) return true;
      if (f.name === 'division' && divisionOptions.length === 0) return true;
      if (f.name === 'team' && teamOptions.length === 0) return true;
      return !!formData[f.name]?.trim();
    });
    if (!allRequired) {
      setErrorMsg('يرجى التأكد من تعبئة كافة الحقول المطلوبة قبل الاعتماد');
      return;
    }

    // ── Phase 1: Progressive Tear Propagation from TOP to BOTTOM (650ms) ──
    setTearState('ripping');
    setLoading(true);
    setErrorMsg('');

    // Launch backend request concurrently
    const token = sessionStorage.getItem('litc_token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const flowAny = selectedFlow as any;
    const reqPromise = fetch('/api/v1/functional/requests', {
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
    }).then(r => r.json());

    // Wait until the tear cuts completely from top to bottom
    await new Promise(r => setTimeout(r, 650));

    // ── Phase 2: Post-Cut Departure Flight (850ms) ──
    setTearState('departing');

    const [data] = await Promise.all([
      reqPromise,
      new Promise(r => setTimeout(r, 850))
    ]);

    if (data && data.success) {
      setTearState('completed');
      setStatus('success');
      window.dispatchEvent(new CustomEvent('litc_stub_landed'));
      window.dispatchEvent(new CustomEvent('litc_request_created'));

      setTimeout(() => {
        setSelectedFlow(null);
        setTearState('idle');
        setStatus('idle');
        onSuccess();
      }, 1000);
    } else {
      setTearState('idle');
      setErrorMsg(data?.error || data?.message || 'حدث خطأ غير متوقع');
      setStatus('error');
    }
    setLoading(false);
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
  const targetDeptName = (selectedFlow as any)?.targetDepartmentName || 'إدارة تقنية المعلومات';
  const targetDivName = (selectedFlow as any)?.targetDivisionName;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>

      {/* ══════════════════════════════════════════════════════════════
          1. PERMANENT ROUTE OPTIONS GRID (مربع المسارات والطلبات دائماً ثابت بالأعلى)
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px',
          padding: highlightPulse ? '4px' : '0px',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          boxShadow: highlightPulse ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none',
        }}
      >
        {requests.map((flow) => {
          const fColor = flow.color || '#38bdf8';
          const block = canCreateRequest(flow.id);
          const targetDept = (flow as any).targetDepartmentName || 'إدارة تقنية المعلومات';
          const isCurrentSelected = selectedFlow?.id === flow.id;

          return (
            <CinemaTicketFrame
              key={flow.id}
              accentColor={fColor}
              isSelected={isCurrentSelected}
              alwaysGlow={isCurrentSelected}
              cornerCutout={12}
              notchRadius={5}
              numNotches={2}
              dashIndent={14}
              showDashedLines={false}
              contentPadding="13px 16px"
              role="button"
              tabIndex={block.allowed ? 0 : -1}
              onClick={() => block.allowed && handleSelectFlow(flow)}
              style={{
                width: '100%',
                cursor: block.allowed ? 'pointer' : 'not-allowed',
                opacity: block.allowed ? 1 : 0.55,
                transform: isCurrentSelected ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: isCurrentSelected ? `${fColor}30` : `${fColor}18`,
                    border: isCurrentSelected ? `2px solid ${fColor}` : `1.5px solid ${fColor}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: fColor,
                    boxShadow: isCurrentSelected ? `0 0 12px ${fColor}50` : 'none',
                  }}
                >
                  {resolveIcon(flow.icon, 20, fColor)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div
                      style={{
                        fontSize: '13.5px',
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
                    {isCurrentSelected && (
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        backgroundColor: `${fColor}25`,
                        color: fColor,
                        border: `1px solid ${fColor}50`,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        flexShrink: 0,
                      }}>
                        ✓ محدد
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: darkMode ? '#94a3b8' : '#64748b',
                      marginTop: '2px',
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
                      fontSize: '10px',
                      color: fColor,
                      fontWeight: 700,
                      marginTop: '3px',
                    }}
                  >
                    {!block.allowed ? block.message : `${flow.fields.length} حقول مطلوبة • اضغط للتعبئة`}
                  </div>
                </div>

                {block.allowed && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isCurrentSelected ? fColor : 'transparent',
                    color: isCurrentSelected ? '#ffffff' : fColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}>
                    {isCurrentSelected ? <Check size={14} strokeWidth={3} /> : <ChevronLeft size={16} />}
                  </div>
                )}
              </div>
            </CinemaTicketFrame>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. UNIFORM-SIZED MULTI-STAGE EXPANDABLE FORM CONTAINER
          (حجم ثابت وموحد هندسياً يمنع أي قفزات أو تغير في المساحة بين المراحل)
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedFlow && (
          <motion.div
            ref={formTopRef}
            initial={{ opacity: 0, y: -16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -16, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: darkMode ? '#111827' : '#ffffff',
              borderRadius: '10px',
              border: darkMode ? `1.5px solid ${flowColor}40` : `1.5px solid ${flowColor}60`,
              boxShadow: darkMode ? `0 12px 35px -5px ${flowColor}20, 0 8px 25px rgba(0, 0, 0, 0.4)` : '0 10px 30px rgba(30, 58, 82, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              width: '100%',
            }}
          >
            {/* ── Top Bar: Active Flow Overview & Close Button ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: `${flowColor}20`,
                    border: `1.5px solid ${flowColor}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: flowColor,
                    flexShrink: 0,
                  }}
                >
                  {resolveIcon(selectedFlow.icon, 20, flowColor)}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                    نموذج طلب: {selectedFlow.title}
                  </div>
                  <div style={{ fontSize: '11px', color: flowColor, fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎯 الإحالة المعتمدة: {targetDeptName}</span>
                    {targetDivName && <span>← {targetDivName}</span>}
                  </div>
                </div>
              </div>

              {/* Step Counter Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontFamily: "'Cairo', sans-serif",
                }}>
                  المرحلة {currentStep} من {totalStages}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedFlow(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  <span>إلغاء وإغلاق</span>
                  <span>✕</span>
                </button>
              </div>
            </div>

            {/* ── Stepper Navigation Bar (مؤشر المراحل التفاعلي) ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              backgroundColor: darkMode ? '#0b1120' : '#f1f5f9',
              borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
              gap: '12px',
              overflowX: 'auto',
            }}>
              {[
                { num: 1, title: totalStages === 3 ? '1. البيانات الأساسية والتوجيه' : '1. بيانات وتفاصيل المعاملة', icon: FileText },
                ...(totalStages === 3 ? [{ num: 2, title: '2. المتطلبات التفصيلية والجدولة', icon: Layers }] : []),
                { num: totalStages, title: `${totalStages}. تذكرة المعاملة والاعتماد`, icon: Scissors },
              ].map((step, idx) => {
                const isActive = currentStep === step.num;
                const isPassed = currentStep > step.num;

                return (
                  <React.Fragment key={step.num}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isPassed) setCurrentStep(step.num);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: isPassed ? 'pointer' : 'default',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: isActive ? flowColor : (isPassed ? '#10b981' : (darkMode ? '#64748b' : '#94a3b8')),
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '12px',
                        fontFamily: "'Cairo', sans-serif",
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? flowColor : (isPassed ? '#10b981' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1')),
                        color: (isActive || isPassed) ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 900,
                        boxShadow: isActive ? `0 0 10px ${flowColor}80` : 'none',
                      }}>
                        {isPassed ? <Check size={13} strokeWidth={3} /> : step.num}
                      </div>
                      <span>{step.title}</span>
                    </button>

                    {idx < (totalStages === 3 ? 2 : 1) && (
                      <div style={{
                        flex: 1,
                        height: '2px',
                        minWidth: '20px',
                        backgroundColor: isPassed ? '#10b981' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1'),
                        transition: 'all 0.2s ease',
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Form Body: STRICT UNIFORM HEIGHT VIEWPORT (ارتفاع ثابت تماماً لا يقفز) ── */}
            <div style={{ padding: '20px 22px' }}>
              <div
                style={{
                  height: '350px',
                  minHeight: '350px',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingInlineEnd: '6px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* SUCCESS MESSAGE STATE */}
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '14px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(16, 185, 129, 0.3)',
                      padding: '20px',
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
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', fontFamily: "'Tajawal', sans-serif" }}>
                      تم تمزيق التذكرة وإرسال المعاملة بنجاح!
                    </div>
                    <div style={{ fontSize: '12.5px', color: darkMode ? '#cbd5e1' : '#475569' }}>
                      تم ترحيل المعاملة رسمياً إلى ({targetDeptName}) وأُودع الكعب في حوض المعاملات النشطة.
                    </div>
                  </motion.div>
                )}

                {/* STAGE 1: BASIC INFO & ROUTING */}
                {status !== 'success' && currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}
                  >
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.06)' : 'rgba(37, 99, 235, 0.04)',
                      border: darkMode ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(37, 99, 235, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}>
                      <Building2 size={18} color={darkMode ? '#38bdf8' : '#2563eb'} />
                      <div style={{ fontSize: '12.5px', color: darkMode ? '#cbd5e1' : '#334155' }}>
                        <strong>الجهة المستهدفة بالمعاملة:</strong> سيتم توجيه هذا الطلب رسمياً إلى <strong>{targetDeptName}</strong>
                        {targetDivName && ` (${targetDivName})`} للتنفيذ والاعتماد.
                      </div>
                    </div>

                    {stepFields.step1.map((field) => {
                      let fieldToRender = { ...field };
                      if (field.name === 'department') {
                        fieldToRender.options = deptOptions.length > 0 ? deptOptions : field.options;
                      } else if (field.name === 'division') {
                        fieldToRender.options = divisionOptions;
                      } else if (field.name === 'team') {
                        fieldToRender.options = teamOptions;
                      }

                      const dynamicFieldId = field.name.startsWith('dyn_') ? field.name.replace('dyn_', '') : null;

                      return (
                        <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e293b' }}>
                              {fieldToRender.label}
                            </label>
                            {fieldToRender.required && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: flowColor, backgroundColor: `${flowColor}15`, padding: '1px 5px', borderRadius: '4px' }}>
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
                          {dynamicFieldId && renderChildFields(dynamicFieldId, formData[field.name])}
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* STAGE 2: DETAILED REQUIREMENTS & SCHEDULE (FOR 3-STAGE FLOWS) */}
                {status !== 'success' && currentStep === 2 && totalStages === 3 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}
                  >
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}>
                      <Layers size={18} color="#f59e0b" />
                      <div style={{ fontSize: '12.5px', color: darkMode ? '#cbd5e1' : '#334155' }}>
                        يرجى إدخال المتطلبات التشغيلية وتحديد مواعيد الجدولة إن وُجدت لدقة وسرعة التنفيذ.
                      </div>
                    </div>

                    {stepFields.step2.map((field) => {
                      let fieldToRender = { ...field };
                      const dynamicFieldId = field.name.startsWith('dyn_') ? field.name.replace('dyn_', '') : null;

                      return (
                        <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e293b' }}>
                              {fieldToRender.label}
                            </label>
                            {fieldToRender.required && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: flowColor, backgroundColor: `${flowColor}15`, padding: '1px 5px', borderRadius: '4px' }}>
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
                          {dynamicFieldId && renderChildFields(dynamicFieldId, formData[field.name])}
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* STAGE FINAL: CINEMATIC PERFORATED TICKET WITH REALISTIC TOP-TO-BOTTOM TEAR */}
                {status !== 'success' && currentStep === totalStages && (
                  <motion.div
                    key="stepTicket"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, position: 'relative' }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(37, 99, 235, 0.06)',
                      border: darkMode ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(37, 99, 235, 0.15)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: darkMode ? '#38bdf8' : '#2563eb' }}>
                        <Scissors size={15} />
                        <span>معاينة التذكرة الرسمية — سيتم التمزيق من الأعلى إلى الأسفل ثم الترحيل</span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                        جاهزة للإصدار والترحيل
                      </span>
                    </div>

                    {/* ── THE CINEMATIC TICKET BOUNDARY (STUB + PERFORATION + BODY) ── */}
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'row',
                        borderRadius: '12px',
                        overflow: 'visible',
                        backgroundColor: darkMode ? '#0e172a' : '#ffffff',
                        border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.35)' : '1.5px solid #cbd5e1',
                        boxShadow: darkMode ? '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.15)' : '0 12px 30px rgba(30, 58, 82, 0.12)',
                        minHeight: '260px',
                        flex: 1,
                      }}
                    >
                      {/* ══ 1. THE RIGHT PART: TICKET STUB (كعب التذكرة الرقيق) ══ */}
                      <motion.div
                        animate={
                          tearState === 'ripping'
                            ? {
                                rotate: 1.5,
                                x: 4,
                                transformOrigin: 'bottom right',
                              }
                            : tearState === 'departing'
                            ? {
                                y: 130,
                                x: 50,
                                rotate: 6,
                                scale: 0.65,
                                opacity: 0,
                                filter: 'blur(2px)',
                              }
                            : { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
                        }
                        transition={
                          tearState === 'ripping'
                            ? { duration: 0.65, ease: 'easeOut' }
                            : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
                        }
                        style={{
                          width: '210px',
                          flexShrink: 0,
                          padding: '16px 14px',
                          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : '#f8fafc',
                          borderInlineEnd: tearState === 'departing' ? 'none' : (darkMode ? '2px dashed rgba(255, 255, 255, 0.2)' : '2px dashed #cbd5e1'),
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        {/* Top Stub Header */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: flowColor, letterSpacing: '0.06em' }}>
                              NEXUS TDS STUB
                            </span>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                          </div>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 900,
                            color: darkMode ? '#ffffff' : '#0f172a',
                            fontFamily: "'Courier New', monospace",
                            marginTop: '2px',
                            letterSpacing: '0.04em',
                          }}>
                            {previewSerial}
                          </div>
                        </div>

                        {/* Barcode Graphic Simulation */}
                        <div style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '22px', width: '100%', justifyContent: 'center' }}>
                            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2].map((w, i) => (
                              <span key={i} style={{ width: `${w * 1.5}px`, height: '100%', backgroundColor: darkMode ? '#94a3b8' : '#334155' }} />
                            ))}
                          </div>
                          <span style={{ fontSize: '8px', color: '#64748b', fontFamily: 'monospace' }}>2026-NEXUS-VERIFIED</span>
                        </div>

                        {/* Issuer & Destination Ledger Tag */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ fontSize: '10px', color: darkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                            مقدم الطلب: <strong style={{ color: darkMode ? '#ffffff' : '#0f172a' }}>{user?.name || 'الموظف'}</strong>
                          </div>
                          <div style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#38bdf8',
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <span>📥 حوض المعاملات النشطة</span>
                          </div>
                        </div>

                        {/* Floating Stub Departure Badge */}
                        {tearState === 'departing' && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(2, 132, 199, 0.92)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 800,
                            borderRadius: '8px',
                            textAlign: 'center',
                            padding: '8px',
                          }}>
                            📥 إيداع بالحوض النشط...
                          </div>
                        )}
                      </motion.div>

                      {/* ══ 2. PROGRESSIVE TOP-TO-BOTTOM TEAR LINE EFFECT ══ */}
                      {tearState === 'ripping' && (
                        <>
                          {/* Laser Rip Line running downwards */}
                          <motion.div
                            initial={{ height: '0%' }}
                            animate={{ height: '100%' }}
                            transition={{ duration: 0.65, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              insetInlineStart: '210px',
                              top: 0,
                              width: '3.5px',
                              background: 'linear-gradient(to bottom, #ef4444 0%, #f59e0b 60%, #38bdf8 100%)',
                              boxShadow: '0 0 14px #f59e0b, 0 0 25px #ef4444',
                              zIndex: 15,
                            }}
                          />
                          {/* Moving Scissor Cutter Tool running downwards */}
                          <motion.div
                            initial={{ top: '0%' }}
                            animate={{ top: '100%' }}
                            transition={{ duration: 0.65, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute',
                              insetInlineStart: '210px',
                              width: '26px',
                              height: '26px',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              backgroundColor: '#f59e0b',
                              borderRadius: '50%',
                              zIndex: 16,
                              boxShadow: '0 0 12px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.8)',
                            }}
                          >
                            <Scissors size={14} style={{ transform: 'rotate(90deg)' }} />
                          </motion.div>
                        </>
                      )}

                      {/* Static Perforation Boundary Notches (when not departing) */}
                      {tearState !== 'departing' && (
                        <div
                          style={{
                            position: 'absolute',
                            insetInlineStart: '202px',
                            top: 0,
                            bottom: 0,
                            width: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pointerEvents: 'none',
                            zIndex: 5,
                          }}
                        >
                          <div style={{
                            width: '16px',
                            height: '8px',
                            backgroundColor: darkMode ? '#111827' : '#ffffff',
                            borderBottomLeftRadius: '10px',
                            borderBottomRightRadius: '10px',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                            borderTop: 'none',
                          }} />

                          {tearState === 'idle' && (
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: darkMode ? '#1e293b' : '#e2e8f0',
                              border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: flowColor,
                            }}>
                              <Scissors size={11} />
                            </div>
                          )}

                          <div style={{
                            width: '16px',
                            height: '8px',
                            backgroundColor: darkMode ? '#111827' : '#ffffff',
                            borderTopLeftRadius: '10px',
                            borderTopRightRadius: '10px',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                            borderBottom: 'none',
                          }} />
                        </div>
                      )}

                      {/* ══ 3. THE LEFT PART: MAIN PAYLOAD BODY (متن التذكرة الواسع) ══ */}
                      <motion.div
                        animate={
                          tearState === 'ripping'
                            ? {
                                rotate: -2.5,
                                x: -8,
                                transformOrigin: 'bottom left',
                              }
                            : tearState === 'departing'
                            ? {
                                y: -160,
                                x: -75,
                                rotate: -9,
                                scale: 0.85,
                                opacity: 0,
                                filter: 'blur(3px)',
                              }
                            : { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
                        }
                        transition={
                          tearState === 'ripping'
                            ? { duration: 0.65, ease: 'easeOut' }
                            : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
                        }
                        style={{
                          flex: 1,
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          position: 'relative',
                          zIndex: 1,
                          background: darkMode
                            ? `linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)`
                            : '#ffffff',
                        }}
                      >
                        {/* Flow Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              backgroundColor: `${flowColor}20`,
                              border: `1.5px solid ${flowColor}60`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: flowColor,
                            }}>
                              {resolveIcon(selectedFlow.icon, 18, flowColor)}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                                {selectedFlow.title}
                              </div>
                              <div style={{ fontSize: '10.5px', color: flowColor, fontWeight: 700 }}>
                                🎯 جهة الاختصاص: {targetDeptName}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            fontSize: '10.5px',
                            fontWeight: 700,
                          }}>
                            <ShieldCheck size={13} />
                            <span>معتمدة وجاهزة للترحيل</span>
                          </div>
                        </div>

                        {/* Entered Payload Key-Value Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                          maxHeight: '125px',
                          overflowY: 'auto',
                        }}>
                          {selectedFlow.fields.map((f) => {
                            const val = formData[f.name];
                            if (!val) return null;
                            return (
                              <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                  {f.label}
                                </span>
                                <span style={{
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  color: darkMode ? '#ffffff' : '#0f172a',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {val}
                                </span>
                              </div>
                            );
                          })}

                          {Object.entries(formData)
                            .filter(([k]) => k.startsWith('dyn_') && !selectedFlow.fields.some(f => f.name === k))
                            .map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                <span style={{ fontSize: '10px', color: darkMode ? '#38bdf8' : '#2563eb', fontWeight: 600 }}>
                                  متطلب إضافي
                                </span>
                                <span style={{ fontSize: '11.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                                  {v}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Floating Body Departure Badge */}
                        {tearState === 'departing' && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(19, 93, 121, 0.95)',
                            color: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: 800,
                            borderRadius: '8px',
                            textAlign: 'center',
                            padding: '14px',
                          }}>
                            <span style={{ fontSize: '24px' }}>✈️</span>
                            <span>تحليق وإحالة فورية إلى: {targetDeptName}</span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Error Message Box */}
              {errorMsg && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ── Form Navigation Buttons (السابق / التالي / تمزيق التذكرة) ── */}
              {status !== 'success' && (
                <div
                  style={{
                    paddingTop: '14px',
                    marginTop: '10px',
                    borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={loading || tearState !== 'idle'}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                          color: darkMode ? '#cbd5e1' : '#475569',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      >
                        <ChevronRight size={15} />
                        <span>العودة للمرحلة السابقة</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedFlow(null)}
                      disabled={loading || tearState !== 'idle'}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: darkMode ? '#94a3b8' : '#64748b',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      إلغاء
                    </button>

                    {/* Button for intermediate stages */}
                    {currentStep < totalStages && (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        style={{
                          padding: '9px 20px',
                          borderRadius: '6px',
                          background: `linear-gradient(135deg, ${flowColor} 0%, #2563eb 100%)`,
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: `0 4px 14px ${flowColor}40`,
                          fontFamily: "'Cairo', sans-serif",
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <span>متابعة للمرحلة التالية</span>
                        <ChevronLeft size={16} />
                      </button>
                    )}

                    {/* FINAL STAGE: PROGRESSIVE TEAR & SUBMIT ACTION */}
                    {currentStep === totalStages && (
                      <button
                        type="button"
                        onClick={handleTearAndSubmit}
                        disabled={loading || tearState !== 'idle'}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '8px',
                          background: `linear-gradient(135deg, #f59e0b 0%, #f36c21 50%, #135d79 100%)`,
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 900,
                          cursor: (loading || tearState !== 'idle') ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 6px 20px rgba(243, 108, 33, 0.45)',
                          fontFamily: "'Cairo', sans-serif",
                          transform: tearState !== 'idle' ? 'scale(0.96)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {tearState === 'ripping' ? (
                          <>
                            <Scissors size={16} style={{ animation: 'bounce 0.5s infinite' }} />
                            <span>جاري القطع من الأعلى للأسفل...</span>
                          </>
                        ) : tearState === 'departing' || loading ? (
                          <>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>جاري ترحيل التذكرة وإيداع الكعب...</span>
                          </>
                        ) : (
                          <>
                            <Scissors size={16} />
                            <span>موافقة وتمزيق التذكرة للإرسال 🚀</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
