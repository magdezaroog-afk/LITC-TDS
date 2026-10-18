/**
 * RequestSheet — Premium 2-Step Cinema Ticket Form
 * Step 1: اختيار المسار من المسارات التي أنشأها الأدمن
 * Step 2: تعبئة الفورم وإرسال الطلب بتصميم التذكرة السينمائية الأفقية
 */

import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  X, Send, ChevronLeft, CheckCircle2,
  AlertTriangle, LayoutGrid, FileText, ArrowRight,
  Building2, Users, Layers, Loader2,
  Calendar, Clock, Plus, Trash2, UserCheck, Sparkles, Ticket, ShieldCheck
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { useState, useEffect } from 'react';
import { CinemaTicketFrame } from './CinemaTicketFrame';

// ── Dynamic Icon resolver ─────────────────────────────────────
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

const PALETTE = [
  { accent: '#38bdf8', soft: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.25)' },
  { accent: '#60a5fa', soft: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
  { accent: '#34d399', soft: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  { accent: '#fbbf24', soft: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  { accent: '#a78bfa', soft: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  { accent: '#f87171', soft: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
];

// ── Dark Field Renderer ───────────────────────────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: { name: string; label: string; type: string; options?: string[]; required?: boolean };
  value: string;
  onChange: (v: string) => void;
}) {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: '#101728',
    fontSize: '13px',
    fontFamily: "'Cairo', sans-serif",
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
  };

  // ─── 1. Smart Schedule Engine ───────────────────────────────
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

    useEffect(() => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#0e1628', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {allowedMode === 'ANY' && (
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px', flexWrap: 'wrap' }}>
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
                  color: mode === tab.id ? '#ffffff' : '#94a3b8',
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
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>من تاريخ</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={base} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>إلى تاريخ</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={base} />
              </div>
            </div>
            {startDate && endDate && (
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '11.5px', fontWeight: 800, textAlign: 'center' }}>
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
                  <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>
                    {d}
                    <button type="button" onClick={() => setDiscreteDates(discreteDates.filter(x => x !== d))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, fontSize: '12px' }}>✕</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>الأيام المحددة: {discreteDates.length}</div>
          </div>
        )}

        {mode === 'HOURLY_WINDOW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>تاريخ اليوم</label>
              <input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} style={base} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>من الساعة</label>
                <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={base} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>إلى الساعة</label>
                <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} style={base} />
              </div>
            </div>
          </div>
        )}

        {mode === 'SINGLE_DATE' && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>التاريخ المطلوب</label>
            <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} style={base} />
          </div>
        )}
      </div>
    );
  }

  // ─── 2. Delegate User ───────────────────────────────────────
  if (field.type === 'delegateUser') {
    return (
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="ابحث بالاسم أو الرقم الوظيفي للزميل البديل..."
          style={{ ...base, paddingInlineStart: '36px' }}
          onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 1px #38bdf8'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.boxShadow = 'none'; }}
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
        onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 1px #38bdf8'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.boxShadow = 'none'; }}
      />
    );
  }

  if (field.type === 'select' && field.options?.length) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...base, cursor: 'pointer' }}
        onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 1px #38bdf8'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.boxShadow = 'none'; }}
      >
        <option value="" style={{ background: '#101728', color: '#94a3b8' }}>
          اختر {field.label}...
        </option>
        {field.options.map(opt => (
          <option key={opt} value={opt} style={{ background: '#101728', color: '#ffffff' }}>
            {opt}
          </option>
        ))}
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
      onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 1px #38bdf8'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN REQUEST SHEET MODAL COMPONENT (HORIZONTAL CINEMA TICKET)
// ══════════════════════════════════════════════════════════════
export function RequestSheet() {
  const {
    requestOpen, setRequestOpen,
    activeRequest, setActiveRequest,
    requests, canCreateRequest,
  } = useHub();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFlow, setSelectedFlow] = useState<typeof requests[0] | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset when sheet closes
  useEffect(() => {
    if (!requestOpen) {
      setTimeout(() => {
        setStep(1);
        setSelectedFlow(null);
        setFormData({});
        setStatus('idle');
        setErrorMsg('');
        setActiveRequest(null);
      }, 300);
    }
  }, [requestOpen]);

  // If a flow is pre-selected (from quick action card click), jump to step 2
  useEffect(() => {
    if (requestOpen && activeRequest) {
      setSelectedFlow(activeRequest);
      setStep(2);
    }
  }, [requestOpen, activeRequest]);

  const handleSelectFlow = (flow: typeof requests[0]) => {
    setSelectedFlow(flow);
    setFormData({});
    setStatus('idle');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedFlow) return;
    const allRequired = selectedFlow.fields.every(f => !f.required || formData[f.name]?.trim());
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
        setTimeout(() => setRequestOpen(false), 2000);
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

  const blockingStatus = selectedFlow ? canCreateRequest(selectedFlow.id) : { allowed: true };
  const flowColor = selectedFlow?.color || '#38bdf8';

  return (
    <AnimatePresence>
      {requestOpen && (
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRequestOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 8, 16, 0.84)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 261,
            }}
          />

          {/* ══════════════════════════════════════════════════════════════════
              HORIZONTAL CINEMA TICKET CREATION MODAL (قالب إنشاء تذكرة أفقية)
             ══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            style={{
              position: 'relative',
              width: '980px',
              maxWidth: '96vw',
              height: '530px',
              maxHeight: '88vh',
              zIndex: 262,
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            <CinemaTicketFrame
              accentColor={flowColor}
              alwaysGlow={true}
              cornerCutout={14}
              notchRadius={5.5}
              numNotches={3}
              dashIndent={20}
              customFill="#0b1222"
              contentPadding="0px"
              style={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
              }}
            >
              {/* ──────────────────────────────────────────────────────────
                  1. RIGHT COLUMN: TICKET STUB (قسيمة تعريف المسار)
                 ────────────────────────────────────────────────────────── */}
              <div
                style={{
                  width: '330px',
                  flexShrink: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  boxSizing: 'border-box',
                  background: 'linear-gradient(180deg, rgba(21, 30, 48, 0.5) 0%, rgba(13, 20, 36, 0.3) 100%)',
                  borderLeft: '1.5px dashed rgba(255, 255, 255, 0.14)',
                }}
              >
                <div>
                  {/* Top Badge & Step */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: `${flowColor}20`,
                          border: `1.2px solid ${flowColor}55`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {resolveIcon(selectedFlow?.icon, 20, flowColor)}
                      </div>
                      <div>
                        <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>
                          قسيمة الإجراء • ROUTE
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                          {step === 1 ? 'اختيار المسار' : 'تقديم المعاملة'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        color: flowColor,
                        backgroundColor: `${flowColor}15`,
                        border: `1px solid ${flowColor}35`,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {step === 1 ? '1 / 2' : '2 / 2'}
                    </span>
                  </div>

                  {/* Flow Title */}
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#ffffff',
                      fontFamily: "'Tajawal', sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {step === 1 ? 'دليل المسارات التشغيلية' : (selectedFlow?.title || 'تعبئة بيانات المعاملة')}
                  </h3>

                  {step === 2 && selectedFlow && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ color: '#94a3b8', marginBottom: '3px' }}>🎯 جهة التوجيه المعتمدة:</div>
                        <div style={{ color: flowColor, fontWeight: 700 }}>
                          {(selectedFlow as any).targetDepartmentName || 'إدارة تقنية المعلومات'}
                          {(selectedFlow as any).targetDivisionName && ` ← ${(selectedFlow as any).targetDivisionName}`}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>الحقول المطلوبة:</span>
                        <span style={{ color: '#ffffff', fontWeight: 800 }}>{selectedFlow.fields.length} حقل</span>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6, margin: '10px 0 0' }}>
                      اختر المسار التشغيلي المناسب للبدء في تعبئة البيانات والاعتماد الإلكتروني المباشر.
                    </p>
                  )}
                </div>

                {/* Stub Footer: Back Button or Note */}
                <div>
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setSelectedFlow(null);
                        setActiveRequest(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s',
                        marginBottom: '10px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      <ChevronLeft size={14} />
                      <span>تغيير مسار الطلب</span>
                    </button>
                  )}

                  <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
                    بوابة الموظف المركزية • نظام TdS
                  </div>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────
                  2. LEFT COLUMN: MAIN FORM BODY (متن نموذج المعاملة)
                 ────────────────────────────────────────────────────────── */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px 26px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Body Top Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: flowColor, fontWeight: 800, letterSpacing: '0.04em' }}>
                      NEXUS TDS • TICKETING DYNAMIC SYSTEM • نموذج تسجيل إلكتروني
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', fontFamily: "'Tajawal', sans-serif" }}>
                      {step === 1 ? 'اختر مسار المعاملة المطلوبة' : selectedFlow?.title}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRequestOpen(false)}
                    title="إغلاق النافذة"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                      e.currentTarget.style.color = '#f87171';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Body Center: Fields or Route Picker */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* STEP 1: ROUTE PICKER & DEFINITION IN THE CENTER OF SCREEN */}
                  {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* ── THE REQUESTED DEFINITION BANNER IN THE CENTER OF THE SCREEN ── */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(56, 189, 248, 0.18)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#38bdf8',
                              flexShrink: 0,
                            }}
                          >
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: "'Cairo', sans-serif" }}>
                              انقر على أيقونة المسار لبدء تقديم المعاملة فوراً:
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: "'Cairo', sans-serif" }}>
                              اختر المسار التشغيلي المعتمد لفتح نموذج الإدخال وإحالة المعاملة للإدارة المختصة
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#38bdf8',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontFamily: "'Cairo', sans-serif",
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {requests.length} مسارات معتمدة
                        </span>
                      </div>

                      {/* ── THE ROUTE OPTIONS AND ICONS GRID IN THE CENTER OF SCREEN ── */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {requests.map((flow) => {
                          const fColor = flow.color || '#38bdf8';
                          const block = canCreateRequest(flow.id);
                          const targetDept = (flow as any).targetDepartmentName || 'إدارة تقنية المعلومات';

                          return (
                            <div
                              key={flow.id}
                              onClick={() => block.allowed && handleSelectFlow(flow)}
                              style={{
                                padding: '14px 16px',
                                borderRadius: '10px',
                                backgroundColor: '#101728',
                                border: `1.2px solid ${block.allowed ? `${fColor}35` : 'rgba(255, 255, 255, 0.08)'}`,
                                cursor: block.allowed ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: block.allowed ? 1 : 0.5,
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                              onMouseEnter={(e) => {
                                if (!block.allowed) return;
                                e.currentTarget.style.borderColor = fColor;
                                e.currentTarget.style.boxShadow = `0 0 16px ${fColor}35, 0 4px 14px rgba(0,0,0,0.4)`;
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                                e.currentTarget.style.backgroundColor = '#131e34';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = `${fColor}35`;
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.backgroundColor = '#101728';
                              }}
                            >
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '10px',
                                  backgroundColor: `${fColor}18`,
                                  border: `1.2px solid ${fColor}45`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  color: fColor,
                                }}
                              >
                                {resolveIcon(flow.icon, 20, fColor)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '13.5px',
                                  fontWeight: 800,
                                  color: '#ffffff',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontFamily: "'Tajawal', sans-serif",
                                }}>
                                  {flow.title}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  color: '#94a3b8',
                                  marginTop: '3px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  <span>🏢</span>
                                  <span>{targetDept}</span>
                                </div>
                                <div style={{
                                  fontSize: '10px',
                                  color: fColor,
                                  fontWeight: 700,
                                  marginTop: '4px',
                                }}>
                                  {!block.allowed ? block.message : `${flow.fields.length} حقول مطلوبة`}
                                </div>
                              </div>
                              {block.allowed && (
                                <ChevronLeft size={16} color={fColor} style={{ flexShrink: 0, opacity: 0.7 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: FORM FIELDS */}
                  {step === 2 && selectedFlow && (
                    <>
                      {/* Success Feedback */}
                      {status === 'success' && (
                        <div
                          style={{
                            padding: '36px 20px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(16, 185, 129, 0.18)',
                              border: '1.5px solid rgba(16, 185, 129, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CheckCircle2 size={28} color="#34d399" />
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                            تم تقديم المعاملة بنجاح!
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            سيتم توجيه طلبك للإدارة المختصة واعتماده إلكترونياً.
                          </div>
                        </div>
                      )}

                      {/* Dynamic Form Inputs */}
                      {status !== 'success' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {selectedFlow.fields.map((field) => (
                            <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0' }}>
                                  {field.label}
                                </label>
                                {field.required && (
                                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                                    مطلوب
                                  </span>
                                )}
                              </div>
                              <FieldInput
                                field={field}
                                value={formData[field.name] || ''}
                                onChange={v => setFormData(prev => ({ ...prev, [field.name]: v }))}
                              />
                            </div>
                          ))}

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
                                gap: '6px',
                              }}
                            >
                              <AlertTriangle size={14} />
                              <span>{errorMsg}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Body Footer: Submit Actions */}
                {step === 2 && selectedFlow && status !== 'success' && (
                  <div
                    style={{
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '10px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setRequestOpen(false)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      إلغاء
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{
                        padding: '9px 22px',
                        borderRadius: '6px',
                        background: `linear-gradient(135deg, ${flowColor} 0%, #2563eb 100%)`,
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: `0 4px 14px ${flowColor}40`,
                        fontFamily: "'Cairo', sans-serif",
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>جاري الإرسال...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>إرسال المعاملة والاعتماد</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </CinemaTicketFrame>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
