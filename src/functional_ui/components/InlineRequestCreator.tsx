/**
 * InlineRequestCreator — Unified Ticket Architecture (NEXUS TDS 2026 Standards)
 * - Identical Luxury Ticket Silhouette from Stage 1 to Final Stage
 * - Main Selectors as Modern Lists -> Sub-Issues & Sub-Options as Visual Interactive Icons/Chips
 * - Technical Support Taxonomy Sub-Issues fully rendered as icon buttons
 * - Dynamic Admin Stage Configuration (1 stage, 2 stages, or N custom stages)
 * - Zero Stacking Clipping (Dropdown floats above KPI cards)
 * - Realistic Progressive Top-to-Bottom Tear Animation
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  Sparkles, Plus, ChevronLeft, ChevronRight, ArrowRight,
  Send, AlertTriangle, CheckCircle2, Loader2,
  Building2, UserCheck, ArrowRightLeft, FileText, Check,
  Clock, Hash, QrCode, Scissors, Eye, Layers, ShieldCheck,
  Search, Wrench, Monitor, Cpu, HardDrive, Wifi, Printer,
  HelpCircle, Settings, Laptop, Radio, AlertCircle,
  Ticket, ChevronDown, Calendar, CalendarDays, Paperclip, Download
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { RouteFormStage, isDelegateFieldVisible, getOptionBehavior, OptionBehaviorRule, getOptionIcon } from '../../services/ticketRouting.helpers';
import {
  getTopLevelDepartments,
  getDivisionsForDepartment,
  getTeamsForDivision,
  loadCachedOrRemoteOrgTree
} from '../../services/institutionalHierarchy.helpers';
import { renderRouteIcon } from '../../services/ticketIconLibrary';
import { EmployeeDelegatePicker } from './EmployeeDelegatePicker';

// ── Dynamic Icon Resolver ──────────────────────────────────
const resolveIcon = (name?: string, size = 20, color = 'currentColor') => {
  return renderRouteIcon(name, size, color, 2);
};

// ── Sub-Issue Smart Icon Resolver ──────────────────────────
const resolveSubIssueIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('شاشة') || l.includes('عرض') || l.includes('screen')) return <Monitor size={15} />;
  if (l.includes('طابع') || l.includes('ورق') || l.includes('حبر') || l.includes('printer')) return <Printer size={15} />;
  if (l.includes('شبك') || l.includes('انترنت') || l.includes('واي فاي') || l.includes('network') || l.includes('wifi')) return <Wifi size={15} />;
  if (l.includes('نظام') || l.includes('برنامج') || l.includes('ويندوز') || l.includes('software')) return <Laptop size={15} />;
  if (l.includes('قرص') || l.includes('تخزين') || l.includes('ذاكرة') || l.includes('ram')) return <HardDrive size={15} />;
  if (l.includes('معالج') || l.includes('بطء') || l.includes('تعليق')) return <Cpu size={15} />;
  if (l.includes('عطل') || l.includes('صيانة') || l.includes('قطع')) return <Wrench size={15} />;
  return <Sparkles size={15} />;
};

// ── 2026 Modern Popover Select (المستدلة الرئيسية تظهر كاختيار من قائمة) ──
function ModernSelect({
  label,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  darkMode = true,
}: {
  label: string;
  options: (string | { id?: string; label?: string; name?: string; icon?: string })[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  darkMode?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOpts = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        const icon = getOptionIcon({ id: opt, label: opt });
        return { value: opt, label: opt, icon };
      }
      const v = opt.id || opt.name || opt.label || '';
      const l = opt.label || opt.name || opt.id || '';
      const icon = opt.icon || getOptionIcon({ id: v, label: l });
      return { value: v, label: l, icon };
    });
  }, [options]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const selectedItem = normalizedOpts.find(o => o.value === value || o.label === value);

  const filteredOpts = normalizedOpts.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        disabled={disabled || normalizedOpts.length === 0}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '7px',
          border: isOpen
            ? '1.5px solid #38bdf8'
            : (darkMode ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #cbd5e1'),
          backgroundColor: darkMode ? '#101728' : '#ffffff',
          color: selectedItem
            ? (darkMode ? '#ffffff' : '#0f172a')
            : (darkMode ? '#94a3b8' : '#64748b'),
          fontSize: '12px',
          fontWeight: selectedItem ? 700 : 500,
          fontFamily: "'Cairo', sans-serif",
          cursor: (disabled || normalizedOpts.length === 0) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          textAlign: 'right',
          outline: 'none',
          boxShadow: isOpen ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {selectedItem?.icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', color: darkMode ? '#38bdf8' : '#2563eb', flexShrink: 0 }}>
              {resolveIcon(selectedItem.icon, 15)}
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedItem
              ? selectedItem.label
              : (normalizedOpts.length === 0 ? `لا توجد خيارات متاحة (${label})` : `اختر من القائمة: ${label}...`)}
          </span>
        </div>
        <ChevronLeft
          size={14}
          style={{
            transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: '#64748b',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Floating Popover (Always high z-index and floats over KPI cards) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              insetInlineStart: 0,
              width: '100%',
              minWidth: '220px',
              maxHeight: '210px',
              backgroundColor: darkMode ? '#0f172a' : '#ffffff',
              border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.45)' : '1.5px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: darkMode
                ? '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(56, 189, 248, 0.25)'
                : '0 14px 35px rgba(30, 58, 82, 0.22)',
              zIndex: 99999,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {normalizedOpts.length > 5 && (
              <div style={{ padding: '6px 8px', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث سريع..."
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    borderRadius: '5px',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                    color: darkMode ? '#ffffff' : '#0f172a',
                    fontSize: '11px',
                    fontFamily: "'Cairo', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            )}

            <div style={{ overflowY: 'auto', maxHeight: '170px', padding: '4px' }}>
              {filteredOpts.length === 0 ? (
                <div style={{ padding: '8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                  لا توجد نتائج مطابقة
                </div>
              ) : (
                filteredOpts.map(opt => {
                  const isSelected = value === opt.value || value === opt.label;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.label);
                        setIsOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: isSelected
                          ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                          : 'transparent',
                        color: isSelected
                          ? (darkMode ? '#38bdf8' : '#2563eb')
                          : (darkMode ? '#cbd5e1' : '#334155'),
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 800 : 500,
                        fontFamily: "'Cairo', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'right',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {opt.icon && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#94a3b8' : '#64748b'), flexShrink: 0 }}>
                            {resolveIcon(opt.icon, 15)}
                          </span>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && <Check size={13} color={darkMode ? '#38bdf8' : '#2563eb'} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  darkMode = true,
  allFormData,
}: {
  field: {
    name: string;
    label: string;
    type: string;
    options?: string[];
    required?: boolean;
    displayMode?: string;
    placeholder?: string;
  };
  value: string;
  onChange: (v: string) => void;
  darkMode?: boolean;
  allFormData?: Record<string, string>;
}) {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '7px',
    border: darkMode ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #cbd5e1',
    background: darkMode ? '#101728' : '#ffffff',
    fontSize: '12px',
    fontFamily: "'Cairo', sans-serif",
    color: darkMode ? '#ffffff' : '#0f172a',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
  };

  const focusBorder = darkMode ? '#38bdf8' : '#2563eb';
  const borderDefault = darkMode ? 'rgba(255, 255, 255, 0.14)' : '#cbd5e1';

  // 1. SELECT TYPES -> ROUTE TO MODERN SELECT OR CHIPS
  if (field.type === 'select') {
    const isChips = (field as any).displayMode === 'chips';
    const opts = (field.options || []).map(opt => {
      if (typeof opt === 'string') {
        const icon = getOptionIcon({ id: opt, label: opt });
        return { value: opt, label: opt, icon };
      }
      const v = (opt as any).id || (opt as any).name || (opt as any).label || '';
      const l = (opt as any).label || (opt as any).name || (opt as any).id || '';
      const icon = (opt as any).icon || getOptionIcon({ id: v, label: l });
      return { value: v, label: l, icon };
    });

    if (isChips) {
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px',
          width: '100%',
          marginTop: '6px'
        }}>
          {opts.map(opt => {
            const isSelected = value === opt.value || value === opt.label;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(isSelected ? '' : opt.label)}
                style={{
                  position: 'relative',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: isSelected
                    ? '2px solid #38bdf8'
                    : (darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0'),
                  backgroundColor: isSelected
                    ? (darkMode ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.08)')
                    : (darkMode ? 'rgba(16, 23, 40, 0.7)' : '#ffffff'),
                  color: isSelected
                    ? (darkMode ? '#38bdf8' : '#2563eb')
                    : (darkMode ? '#e2e8f0' : '#1e293b'),
                  fontFamily: "'Cairo', sans-serif",
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected
                    ? (darkMode ? '0 4px 18px rgba(56, 189, 248, 0.25)' : '0 4px 16px rgba(37, 99, 235, 0.15)')
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '9px',
                      backgroundColor: isSelected
                        ? (darkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)')
                        : (darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#94a3b8' : '#64748b'),
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {resolveIcon(opt.icon, 18, isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#94a3b8' : '#64748b'))}
                  </div>
                  {isSelected && (
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: darkMode ? '#38bdf8' : '#2563eb',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                    }}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 600, lineHeight: 1.4 }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <ModernSelect
        label={field.label}
        options={opts}
        value={value}
        onChange={onChange}
        required={field.required}
        darkMode={darkMode}
      />
    );
  }

  // 2. SCHEDULE ENGINE
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

    // Automatically adapt schedule engine mode based on the user's selected request type
    React.useEffect(() => {
      if (allowedMode === 'ANY' && allFormData) {
        const textBlob = Object.values(allFormData).join(' ').toLowerCase();
        if (textBlob.includes('إذن') || textBlob.includes('خروج') || textBlob.includes('تأخير') || textBlob.includes('ساعي') || textBlob.includes('ساعة')) {
          setMode('HOURLY_WINDOW');
        } else if (textBlob.includes('إجازة') || textBlob.includes('تكليف')) {
          setMode('DATE_RANGE');
        }
      }
    }, [allFormData, allowedMode]);

    React.useEffect(() => {
      if (mode === 'DATE_RANGE') {
        if (!startDate) { onChange(''); return; }
        if (!endDate) { onChange(`تاريخ البدء: ${startDate}`); return; }
        const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const total = diff > 0 ? diff : 1;
        onChange(`فترة متصلة من ${startDate} إلى ${endDate} (${total} يوم)`);
      } else if (mode === 'DISCRETE_DAYS') {
        if (discreteDates.length === 0) { onChange(''); return; }
        onChange(`أيام متفرقة: ${discreteDates.join(', ')} (${discreteDates.length} يوم)`);
      } else if (mode === 'HOURLY_WINDOW') {
        if (!hourlyDate) { onChange(''); return; }
        const [h1, m1] = timeFrom.split(':').map(Number);
        const [h2, m2] = timeTo.split(':').map(Number);
        const diffMin = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
        const hrs = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        onChange(`إذن خروج: ${hourlyDate} (${timeFrom} - ${timeTo})`);
      } else if (mode === 'SINGLE_DATE') {
        onChange(singleDate ? `تاريخ محدد: ${singleDate}` : '');
      }
    }, [mode, startDate, endDate, discreteDates, hourlyDate, timeFrom, timeTo, singleDate]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {allowedMode === 'ANY' && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'DATE_RANGE', label: 'فترة متصلة', icon: 'Calendar' },
              { id: 'DISCRETE_DAYS', label: 'أيام متفرقة', icon: 'CalendarDays' },
              { id: 'HOURLY_WINDOW', label: 'إذن خروج ساعي', icon: 'Clock' },
              { id: 'SINGLE_DATE', label: 'موعد محدد', icon: 'Calendar' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id as any)}
                style={{
                  padding: '4px 9px', borderRadius: '5px',
                  border: mode === tab.id ? '1.5px solid #38bdf8' : (darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #cbd5e1'),
                  background: mode === tab.id ? 'rgba(56, 189, 248, 0.18)' : (darkMode ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                  color: mode === tab.id ? '#38bdf8' : (darkMode ? '#94a3b8' : '#64748b'),
                  fontWeight: mode === tab.id ? 800 : 600, fontSize: '10.5px',
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {resolveIcon(tab.icon, 12, mode === tab.id ? '#38bdf8' : (darkMode ? '#94a3b8' : '#64748b'))}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {mode === 'DATE_RANGE' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={base} />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={base} />
          </div>
        )}

        {mode === 'HOURLY_WINDOW' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
            <input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} style={base} />
            <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={base} />
            <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} style={base} />
          </div>
        )}

        {mode === 'SINGLE_DATE' && (
          <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} style={base} />
        )}

        {mode === 'DISCRETE_DAYS' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="date" value={discreteInput} onChange={e => setDiscreteInput(e.target.value)} style={{ ...base, flex: 1 }} />
            <button
              type="button"
              onClick={() => {
                if (discreteInput && !discreteDates.includes(discreteInput)) {
                  setDiscreteDates([...discreteDates, discreteInput]);
                  setDiscreteInput('');
                }
              }}
              style={{ padding: '0 10px', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
            >
              +
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. DELEGATE USER (دليل موظفي الشركة الذكي للبحث والفلترة الفورية للموظف المكلف)
  if (field.type === 'delegateUser') {
    return (
      <EmployeeDelegatePicker
        value={value}
        onChange={val => onChange(val)}
        required={field.required}
        placeholder="ابحث باسم الموظف المكلف، الرقم الوظيفي، أو الإدارة..."
        accentColor={focusBorder || '#135d79'}
      />
    );
  }

  // 4. TEXTAREA
  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder={(field as any).placeholder || `أدخل ${field.label}...`}
        style={{ ...base, resize: 'none' }}
        onFocus={e => { e.target.style.borderColor = focusBorder; e.target.style.boxShadow = `0 0 0 1px ${focusBorder}`; }}
        onBlur={e => { e.target.style.borderColor = borderDefault; e.target.style.boxShadow = 'none'; }}
      />
    );
  }

  // 5. FILE / ATTACHMENT (حل جذري وشامل للمرفقات: قراءة حقيقية للملف وتمريره للباك إند وقاعدة البيانات)
  if (field.type === 'file' || field.type === 'attachment') {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>(() => {
      if (!value) return '';
      try {
        const p = JSON.parse(value);
        return p.fileName || p.name || value;
      } catch {
        return value;
      }
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChosen = (f: File) => {
      setIsProcessing(true);
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const meta = {
          name: f.name,
          fileName: f.name,
          sizeBytes: f.size,
          sizeMB,
          mimeType: f.type || 'application/octet-stream',
          base64: base64Data,
          uploadedAt: new Date().toISOString(),
        };
        setFileName(`${f.name} (${sizeMB} MB)`);
        onChange(JSON.stringify(meta));
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setIsProcessing(false);
      };
      reader.readAsDataURL(f);
    };

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleFileChosen(e.target.files[0]);
            }
          }}
        />

        {fileName ? (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: darkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
              border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.4)' : '1.5px solid rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{ fontSize: '15px' }}>📎</span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: darkMode ? '#ffffff' : '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '220px',
                }}
              >
                {fileName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: darkMode ? '#38bdf8' : '#2563eb',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                تغيير
              </button>
              <button
                type="button"
                onClick={() => {
                  setFileName('');
                  onChange('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
                title="إزالة المرفق"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChosen(e.dataTransfer.files[0]);
              }
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: isDragging
                ? '2px dashed #38bdf8'
                : (darkMode ? '1.5px dashed rgba(255, 255, 255, 0.2)' : '1.5px dashed #cbd5e1'),
              backgroundColor: isDragging
                ? (darkMode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.05)')
                : (darkMode ? 'rgba(16, 23, 40, 0.6)' : '#f8fafc'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: darkMode ? '#38bdf8' : '#2563eb',
              }}
            >
              <Plus size={15} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: darkMode ? '#ffffff' : '#0f172a' }}>
                استعراض ورفع مرفق
              </div>
              <div style={{ fontSize: '9.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                انقر هنا لاختيار الملف من الجهاز أو اسحبه هنا
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. STANDARD INPUTS (Text, Number, Date)
  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={(field as any).placeholder || `أدخل ${field.label}...`}
      style={base}
      onFocus={e => { e.target.style.borderColor = focusBorder; e.target.style.boxShadow = `0 0 0 1px ${focusBorder}`; }}
      onBlur={e => { e.target.style.borderColor = borderDefault; e.target.style.boxShadow = 'none'; }}
    />
  );
}

// ══════════════════════════════════════════════════════════════
// INLINE REQUEST CREATOR (التصميم الموحد: هيكل تذكرة ثابت من البداية للنهاية)
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
  const [isDispenserOpen, setIsDispenserOpen] = useState(false);

  // ── Realistic Progressive Tearing States ──
  const [tearState, setTearState] = useState<'idle' | 'dispensing' | 'ripping' | 'departing' | 'completed'>('idle');
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
      setIsDispenserOpen(true);
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

  const effectiveDynamicFields = useMemo(() => {
    const map = new Map<string, any>();
    allDynamicFields.forEach(df => { if (df?.id) map.set(df.id, df); });
    const flowFields = (selectedFlow as any)?.formConfig?.dynamicFields || [];
    flowFields.forEach((df: any) => { if (df?.id) map.set(df.id, { ...map.get(df.id), ...df }); });
    return Array.from(map.values());
  }, [allDynamicFields, selectedFlow]);

  const handleFieldChange = (name: string, val: string) => {
    setFormData(prev => {
      const next = { ...prev, [name]: val };
      if (name === 'department') {
        next.division = '';
        next.team = '';
      } else if (name === 'division') {
        next.team = '';
      } else if (name === 'taxonomyMain') {
        // Cascade clear sub-issue if main changes
        next.taxonomySub = '';
      } else if (name.startsWith('dyn_')) {
        const parentId = name.replace('dyn_', '');
        const parentDef = effectiveDynamicFields.find(df => df.id === parentId);
        if (parentDef?.childBindings) {
          parentDef.childBindings.forEach((b: any) => {
            delete next[`dyn_${b.childFieldId}`];
          });
        }
      }
      return next;
    });
  };

  // ── Cascading Child Fields Renderer for Dynamic Fields ──
  const renderCascadingChildFields = (parentId: string, parentVal: string, level = 1): React.ReactNode => {
    if (!parentVal) return null;
    const parentDef = effectiveDynamicFields.find(df => df.id === parentId || df.name === parentId);
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
      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
        {matchingBindings.map((b: any) => {
          const childDef = effectiveDynamicFields.find(df => df.id === b.childFieldId);
          if (!childDef) return null;
          const childFieldName = `dyn_${childDef.id}`;
          const childVal = formData[childFieldName] || '';
          const childOpts = (childDef.options || [])
            .filter((o: any) => typeof o === 'string' || o.isActive !== false)
            .map((o: any) => {
              if (typeof o === 'string') return o;
              return {
                id: o.id || o.label,
                label: o.label || o.id,
                icon: o.icon || getOptionIcon({ id: o.id, label: o.label })
              };
            });

          return (
            <div
              key={childDef.id}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.04)',
                border: darkMode ? '1.5px dashed rgba(56, 189, 248, 0.35)' : '1.5px dashed rgba(37, 99, 235, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 800, color: darkMode ? '#38bdf8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>↳</span>
                  <span>{childDef.name}</span>
                </label>
                <span style={{ fontSize: '9.5px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b' }}>
                  مستدلة فرعية تابعة لـ ({parentVal})
                </span>
              </div>
              <FieldInput
                field={{
                  name: childFieldName,
                  label: childDef.name,
                  type: 'select',
                  options: childOpts,
                  required: false,
                  displayMode: childDef.displayMode || 'chips',
                }}
                value={childVal}
                onChange={v => handleFieldChange(childFieldName, v)}
                darkMode={darkMode}
                allFormData={formData}
              />
              {renderCascadingChildFields(childDef.id, childVal, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const handleSelectFlow = (flow: typeof requests[0]) => {
    setSelectedFlow(flow);
    setIsDispenserOpen(true);
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

  // ── Smart Dynamic Stages Architecture (Supports Admin Custom Configuration or Logical Standards) ──
  const adminStages = (selectedFlow as any)?.formConfig?.stages as RouteFormStage[] | undefined;

  const totalStages = useMemo(() => {
    if (!selectedFlow) return 2;
    // If Admin defined custom stages in route builder:
    if (adminStages && adminStages.length > 0) {
      return adminStages.length + 1; // Stages + Final Ticket Review
    }
    // Default standard criteria:
    return selectedFlow.fields.length > 3 ? 3 : 2;
  }, [selectedFlow, adminStages]);

  const currentStageDefinition = useMemo(() => {
    if (!selectedFlow) return null;
    if (adminStages && adminStages.length > 0) {
      if (currentStep <= adminStages.length) {
        return adminStages[currentStep - 1];
      }
      return { id: 'final', title: 'مراجعة التذكرة والاعتماد', fieldNames: [] };
    }
    return null;
  }, [selectedFlow, adminStages, currentStep]);

  const currentOptionBehavior = useMemo(() => {
    return getOptionBehavior(formData, (selectedFlow as any)?.formConfig);
  }, [formData, selectedFlow]);

  // Fields mapping per stage
  const stageFieldsToRender = useMemo(() => {
    if (!selectedFlow) return [];
    const isDelegateVis = isDelegateFieldVisible(formData, (selectedFlow as any)?.formConfig);
    const all = selectedFlow.fields.filter(f => {
      if (f.name === 'delegateUser') return isDelegateVis;
      if (f.name === 'attachment' && currentOptionBehavior.attachmentRule === 'HIDDEN') return false;
      if (f.name === 'description' && currentOptionBehavior.descriptionRule === 'HIDDEN') return false;
      return true;
    }).map(f => {
      if (f.name === 'attachment') {
        const isReq = currentOptionBehavior.attachmentRule === 'REQUIRED';
        return {
          ...f,
          required: isReq,
          label: isReq ? 'المستند والتقرير الطبي / المرفق المطلوب (إلزامي)' : f.label,
        };
      }
      if (f.name === 'description') {
        const isReq = currentOptionBehavior.descriptionRule === 'REQUIRED';
        return {
          ...f,
          required: isReq,
          label: isReq ? 'توضيح سبب المعاملة / التفاصيل (إلزامي)' : f.label,
        };
      }
      return f;
    });

    // 1. If Admin configured custom stages:
    if (adminStages && adminStages.length > 0) {
      if (currentStep > adminStages.length) return []; // Final review
      const cfg = adminStages[currentStep - 1];
      return all.filter(f => cfg.fieldNames.includes(f.name));
    }

    // 2. Default Standard Criteria:
    if (totalStages === 2) {
      return currentStep === 1 ? all : [];
    }

    // 3 Stages Default:
    // Stage 1: Routing & Core Classification (department, division, team, taxonomyMain, title)
    // Stage 2: Details & Operational Requirements (dyn_..., scheduleEngine, description, etc.)
    const isCore = (name: string) =>
      ['department', 'division', 'team', 'title', 'subject', 'category', 'taxonomyMain', 'priority'].includes(name);

    if (currentStep === 1) {
      let s1 = all.filter(f => isCore(f.name));
      if (s1.length === 0) s1 = all.slice(0, 2);
      return s1;
    }
    if (currentStep === 2) {
      let s2 = all.filter(f => !isCore(f.name));
      if (s2.length === 0) s2 = all.slice(2);
      return s2;
    }
    return [];
  }, [selectedFlow, adminStages, currentStep, totalStages, formData, currentOptionBehavior]);

  const validateCurrentStep = () => {
    if (!selectedFlow) return true;
    const currentFields = stageFieldsToRender;

    const missingRequired = currentFields.find(f => {
      if (!f.required) return false;
      if (f.name === 'delegateUser' && !isDelegateFieldVisible(formData, (selectedFlow as any)?.formConfig)) return false;
      if (f.name === 'attachment' && currentOptionBehavior.attachmentRule !== 'REQUIRED') return false;
      if (f.name === 'description' && currentOptionBehavior.descriptionRule !== 'REQUIRED') return false;
      if (f.name === 'division' && divisionOptions.length === 0) return false;
      if (f.name === 'team' && teamOptions.length === 0) return false;
      return !formData[f.name]?.trim();
    });

    if (missingRequired) {
      setErrorMsg(`يرجى تحديد أو إدخال: (${missingRequired.label})`);
      return false;
    }

    // Taxonomy Sub-Issue validation if main issue has active sub-issues
    if (formData.taxonomyMain) {
      const mainTax = (selectedFlow as any).formConfig?.taxonomy?.find(
        (t: any) => t.label === formData.taxonomyMain || t.id === formData.taxonomyMain
      );
      const activeSubs = mainTax?.subIssues?.filter((s: any) => s.isActive !== false) || [];
      if (activeSubs.length > 0 && !formData.taxonomySub) {
        setErrorMsg('يرجى اختيار المشكلة الفرعية المناسبة قبل المتابعة');
        return false;
      }
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

  // ── Progressive Top-to-Bottom Tear & Flight ──────────────────
  const handleTearAndSubmit = async () => {
    if (!selectedFlow || loading || tearState !== 'idle') return;

    const allRequired = selectedFlow.fields.every(f => {
      let isReq = f.required;
      if (f.name === 'delegateUser') isReq = isDelegateFieldVisible(formData, (selectedFlow as any)?.formConfig);
      if (f.name === 'attachment') isReq = currentOptionBehavior.attachmentRule === 'REQUIRED';
      if (f.name === 'description') isReq = currentOptionBehavior.descriptionRule === 'REQUIRED';
      if (!isReq) return true;
      if (f.name === 'division' && divisionOptions.length === 0) return true;
      if (f.name === 'team' && teamOptions.length === 0) return true;
      return !!formData[f.name]?.trim();
    });
    if (!allRequired) {
      setErrorMsg('يرجى التأكد من تعبئة كافة الحقول المطلوبة قبل الاعتماد');
      return;
    }

    // Step 1: Start physical extrusion from machine slot
    setTearState('dispensing');
    setLoading(true);
    setErrorMsg('');

    const token = sessionStorage.getItem('litc_token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let attachmentObj: any = null;
    if (formData.attachment) {
      try {
        attachmentObj = JSON.parse(formData.attachment);
      } catch {
        attachmentObj = { fileName: formData.attachment, name: formData.attachment };
      }
    }

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
        taxonomyMain: formData.taxonomyMain || undefined,
        taxonomySub: formData.taxonomySub || undefined,
        description: formData.description?.trim() || Object.entries(formData).filter(([k]) => k !== 'attachment').map(([k, v]) => `${k}: ${v}`).join('\n') || selectedFlow.title,
        fields: formData,
        attachments: attachmentObj ? [attachmentObj] : [],
        routingMetadata: {
          formData,
          fields: formData,
          dynamicFields: formData,
          attachments: attachmentObj ? [attachmentObj] : [],
          targetDepartmentName: flowAny.targetDepartmentName,
          targetDivisionName: flowAny.targetDivisionName,
          targetTeamName: flowAny.targetTeamName,
        },
      }),
    }).then(r => r.json());

    // Allow 800ms to visibly slide out of the slot mouth
    await new Promise(r => setTimeout(r, 800));
    setTearState('ripping');
    // Allow 650ms for laser cutter tear
    await new Promise(r => setTimeout(r, 650));
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

  const flowColor = selectedFlow?.color || '#38bdf8';
  const targetDeptName = (selectedFlow as any)?.targetDepartmentName || 'إدارة تقنية المعلومات';
  const targetDivName = (selectedFlow as any)?.targetDivisionName;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px', position: 'relative', width: '100%' }}>

      {/* ══════════════════════════════════════════════════════════════
          1. THE SMART TICKET DISPENSER CONSOLE (ماكينة استخراج التذاكر الذكية)
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '100%',
          maxWidth: isDispenserOpen && selectedFlow ? '940px' : (isDispenserOpen ? '760px' : '680px'),
          borderRadius: '16px',
          background: darkMode
            ? 'linear-gradient(180deg, #162032 0%, #0d1527 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
          border: darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1',
          boxShadow: darkMode
            ? '0 12px 36px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 8px 24px rgba(30, 58, 82, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
          padding: '14px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 45,
          transition: 'max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
        }}
      >
        {/* Machine Header Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: tearState !== 'idle' ? '#f59e0b' : (isDispenserOpen ? '#38bdf8' : '#10b981'),
              boxShadow: tearState !== 'idle' ? '0 0 12px #f59e0b' : (isDispenserOpen ? '0 0 10px #38bdf8' : '0 0 10px #10b981'),
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: darkMode ? '#cbd5e1' : '#475569', letterSpacing: '0.04em' }}>
              ماكينة التذاكر الذكية • NEXUS TICKET DISPENSER
            </span>
          </div>

          <span style={{
            fontSize: '9.5px',
            color: tearState !== 'idle' ? '#f59e0b' : (isDispenserOpen ? '#38bdf8' : '#10b981'),
            fontWeight: 800,
            backgroundColor: tearState !== 'idle' ? 'rgba(245, 158, 11, 0.15)' : (isDispenserOpen ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.1)'),
            padding: '2px 8px',
            borderRadius: '9999px',
            border: tearState !== 'idle' ? '1px solid rgba(245, 158, 11, 0.35)' : (isDispenserOpen ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)'),
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {tearState === 'dispensing' ? '⚡ جاري استخراج التذكرة...' : (tearState === 'ripping' ? '✂️ قص التذكرة...' : (isDispenserOpen ? 'لوحة إعداد المسار نشطة' : 'جاهزة للاستخراج'))}
          </span>
        </div>

        {/* Center Prominent Button: إنشاء طلب جديد */}
        <button
          type="button"
          onClick={() => {
            if (isDispenserOpen && !selectedFlow) {
              setIsDispenserOpen(false);
            } else if (isDispenserOpen && selectedFlow) {
              setSelectedFlow(null);
              setIsDispenserOpen(false);
            } else {
              setIsDispenserOpen(true);
            }
          }}
          disabled={tearState !== 'idle'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '10px 28px',
            borderRadius: '12px',
            background: isDispenserOpen
              ? 'linear-gradient(135deg, #0284c7 0%, #1e3a52 100%)'
              : 'linear-gradient(135deg, #135d79 0%, #1e3a52 50%, #f36c21 100%)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            color: '#ffffff',
            fontSize: '14.5px',
            fontWeight: 800,
            fontFamily: "'Tajawal', sans-serif",
            cursor: tearState !== 'idle' ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 20px rgba(243, 108, 33, 0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
            transform: isDispenserOpen ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Ticket size={17} strokeWidth={2.4} />
          <span>
            {isDispenserOpen
              ? (selectedFlow ? 'إلغاء وإعادة التعيين' : 'إغلاق الماكينة')
              : 'إنشاء طلب جديد • سحب تذكرة'}
          </span>
          <ChevronDown
            size={16}
            style={{
              transform: isDispenserOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>

        {/* ── CONSOLE WORKSPACE BAY (مربع اختيار نوع الطلب ومسار الحقول المحددة من الإدارة) ── */}
        <AnimatePresence>
          {isDispenserOpen && tearState === 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                overflow: 'hidden',
                backgroundColor: darkMode ? '#0e172a' : '#ffffff',
                borderRadius: '12px',
                border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.25)' : '1.5px solid #cbd5e1',
                padding: '16px',
                boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              {!selectedFlow ? (
                /* ── Phase 1: مربع اختيار نوع الطلب من المسارات المتاحة ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: darkMode ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#38bdf8" />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                        اختر نوع الخدمة / المعاملة لبدء إعداد المسار:
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {requests.length} مسارات متاحة
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '12px',
                  }}>
                    {requests.map(flow => {
                      const fColor = flow.color || '#38bdf8';
                      const block = canCreateRequest(flow.id);
                      const targetDept = (flow as any).targetDepartmentName || 'إدارة تقنية المعلومات';

                      return (
                        <div
                          key={flow.id}
                          onClick={() => block.allowed && handleSelectFlow(flow)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                            cursor: block.allowed ? 'pointer' : 'not-allowed',
                            opacity: block.allowed ? 1 : 0.6,
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                          onMouseEnter={e => {
                            if (block.allowed) {
                              e.currentTarget.style.backgroundColor = `${fColor}15`;
                              e.currentTarget.style.borderColor = `${fColor}50`;
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (block.allowed) {
                              e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc';
                              e.currentTarget.style.borderColor = darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0';
                              e.currentTarget.style.transform = 'none';
                            }
                          }}
                        >
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: `${fColor}20`,
                            border: `1.5px solid ${fColor}50`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: fColor,
                            flexShrink: 0,
                          }}>
                            {resolveIcon(flow.icon, 18, fColor)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                              {flow.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {targetDept} • {flow.fields.length} حقول
                            </div>
                          </div>
                          <ChevronLeft size={16} color={fColor} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── Phase 2: خيارات المسار التي تم تحديدها من قبل الإدارة ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Step Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    paddingBottom: '10px',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '7px',
                        backgroundColor: `${flowColor}20`,
                        border: `1.5px solid ${flowColor}60`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: flowColor,
                        flexShrink: 0,
                      }}>
                        {resolveIcon(selectedFlow.icon, 17, flowColor)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                          {selectedFlow.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: flowColor, fontWeight: 700 }}>
                          🎯 جهة الاختصاص: {targetDeptName} {targetDivName && `← ${targetDivName}`}
                        </div>
                      </div>
                    </div>

                    {/* Step Indicators */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {Array.from({ length: totalStages }).map((_, idx) => {
                        const stepNum = idx + 1;
                        const isActive = currentStep === stepNum;
                        const isPassed = currentStep > stepNum;
                        const stageTitle = adminStages && adminStages[idx]
                          ? adminStages[idx].title
                          : (stepNum === 1 ? 'الأساسيات والتوجيه' : (stepNum === totalStages ? 'تذكرة الاعتماد' : 'المتطلبات والجدولة'));

                        return (
                          <div
                            key={stepNum}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10.5px',
                              fontWeight: isActive ? 800 : 600,
                              color: isActive ? flowColor : (isPassed ? '#10b981' : '#64748b'),
                              backgroundColor: isActive ? `${flowColor}15` : 'transparent',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            <span style={{
                              width: '14px', height: '14px', borderRadius: '50%',
                              backgroundColor: isActive ? flowColor : (isPassed ? '#10b981' : '#334155'),
                              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900
                            }}>
                              {isPassed ? '✓' : stepNum}
                            </span>
                            <span>{stageTitle}</span>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setSelectedFlow(null)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background: 'none',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          color: darkMode ? '#94a3b8' : '#64748b',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginInlineStart: '4px',
                        }}
                      >
                        تغيير المسار ✕
                      </button>
                    </div>
                  </div>

                  {/* Form Fields: Stages 1 & 2 */}
                  {status !== 'success' && currentStep < totalStages && (
                    <motion.div
                      key={`step_${currentStep}`}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: stageFieldsToRender.length > 1 ? 'repeat(auto-fit, minmax(230px, 1fr))' : '1fr',
                        gap: '12px',
                        alignItems: 'start',
                        overflow: 'visible',
                      }}
                    >
                      {stageFieldsToRender.map((field) => {
                        let fieldToRender = { ...field };
                        if (field.name === 'department') {
                          fieldToRender.options = deptOptions.length > 0 ? deptOptions : field.options;
                        } else if (field.name === 'division') {
                          fieldToRender.options = divisionOptions;
                        } else if (field.name === 'team') {
                          fieldToRender.options = teamOptions;
                        }

                        const isFullWidthField =
                          (fieldToRender as any).displayMode === 'chips' ||
                          fieldToRender.type === 'scheduleEngine' ||
                          fieldToRender.type === 'file' ||
                          fieldToRender.type === 'attachment' ||
                          fieldToRender.type === 'textarea';

                        return (
                          <React.Fragment key={field.name}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              position: 'relative',
                              gridColumn: isFullWidthField ? '1 / -1' : undefined
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '11.5px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e3a52' }}>
                                  {fieldToRender.label}
                                </label>
                                {fieldToRender.required && (
                                  <span style={{ fontSize: '8.5px', fontWeight: 700, color: flowColor, backgroundColor: `${flowColor}15`, padding: '1px 5px', borderRadius: '3px' }}>
                                    مطلوب
                                  </span>
                                )}
                              </div>
                              <FieldInput
                                field={fieldToRender}
                                value={formData[field.name] || ''}
                                onChange={v => handleFieldChange(field.name, v)}
                                darkMode={darkMode}
                                allFormData={formData}
                              />
                            </div>

                            {/* ── CRITICAL FEATURE: TAXONOMY SUB-ISSUES RENDERED AS VISUAL CARDS GRID ── */}
                            {field.name === 'taxonomyMain' && formData.taxonomyMain && (() => {
                              const mainTax = (selectedFlow as any).formConfig?.taxonomy?.find(
                                (t: any) => t.label === formData.taxonomyMain || t.id === formData.taxonomyMain
                              );
                              if (!mainTax?.subIssues?.length) return null;
                              const activeSubs = mainTax.subIssues.filter((s: any) => s.isActive !== false);
                              if (activeSubs.length === 0) return null;

                              return (
                                <div
                                  style={{
                                    gridColumn: '1 / -1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.04)',
                                    border: darkMode ? '1.5px dashed rgba(56, 189, 248, 0.35)' : '1.5px dashed rgba(37, 99, 235, 0.3)',
                                    animation: 'fadeIn 0.2s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#38bdf8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>↳</span>
                                      <span>المشاكل والخيارات الفرعية التابعة لـ ({formData.taxonomyMain}):</span>
                                    </span>
                                    <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}>
                                      انقر لتحديد الخيار المطلوب
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                      gap: '10px',
                                      width: '100%',
                                    }}
                                  >
                                    {activeSubs.map((sub: any) => {
                                      const subLabel = typeof sub === 'string' ? sub : sub.label || sub.name;
                                      const subIcon = (typeof sub === 'object' && sub.icon) ? sub.icon : getOptionIcon({ label: subLabel });
                                      const isSelected = formData.taxonomySub === subLabel;
                                      return (
                                        <button
                                          key={subLabel}
                                          type="button"
                                          onClick={() => handleFieldChange('taxonomySub', isSelected ? '' : subLabel)}
                                          style={{
                                            position: 'relative',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            border: isSelected
                                              ? '2px solid #38bdf8'
                                              : (darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0'),
                                            backgroundColor: isSelected
                                              ? (darkMode ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.08)')
                                              : (darkMode ? 'rgba(16, 23, 40, 0.7)' : '#ffffff'),
                                            color: isSelected
                                              ? (darkMode ? '#38bdf8' : '#2563eb')
                                              : (darkMode ? '#e2e8f0' : '#1e3a52'),
                                            fontFamily: "'Cairo', sans-serif",
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            textAlign: 'right',
                                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            boxShadow: isSelected
                                              ? (darkMode ? '0 4px 18px rgba(56, 189, 248, 0.25)' : '0 4px 16px rgba(37, 99, 235, 0.15)')
                                              : '0 1px 3px rgba(0,0,0,0.04)',
                                            transform: isSelected ? 'translateY(-2px)' : 'none',
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <div
                                              style={{
                                                width: '34px',
                                                height: '34px',
                                                borderRadius: '9px',
                                                backgroundColor: isSelected
                                                  ? (darkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)')
                                                  : (darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#94a3b8' : '#64748b'),
                                                transition: 'all 0.2s ease',
                                              }}
                                            >
                                              {resolveIcon(subIcon, 18, isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#94a3b8' : '#64748b'))}
                                            </div>
                                            {isSelected && (
                                              <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                backgroundColor: darkMode ? '#38bdf8' : '#2563eb',
                                                color: '#ffffff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                              }}>
                                                <Check size={11} strokeWidth={3} />
                                              </div>
                                            )}
                                          </div>
                                          <span style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 600, lineHeight: 1.4 }}>
                                            {subLabel}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* ── Cascading Child Fields for Dynamic Fields (المستدلات الفرعية المتسلسلة) ── */}
                            {field.name.startsWith('dyn_') && formData[field.name] && (
                              renderCascadingChildFields(field.name.replace('dyn_', ''), formData[field.name])
                            )}

                            {/* ── Conditional Option Custom Inputs (حقول مخصصة مشروطة بخيار المستدلة) ── */}
                            {formData[field.name] && (() => {
                              const selectedVal = formData[field.name];
                              const cfg = (selectedFlow as any).formConfig;
                              let conditionalInputs: any[] = [];

                              if (field.name.startsWith('dyn_')) {
                                const dynId = field.name.replace('dyn_', '');
                                const dynField = (cfg?.dynamicFields || []).find((df: any) => df.id === dynId);
                                const matchedOpt = dynField?.options?.find((o: any) => o.label === selectedVal || o.id === selectedVal);
                                if (matchedOpt) {
                                  conditionalInputs = cfg?.optionCustomInputs?.[matchedOpt.id] || matchedOpt.customInputs || [];
                                }
                                if (conditionalInputs.length === 0 && cfg?.optionCustomInputs?.[selectedVal]) {
                                  conditionalInputs = cfg.optionCustomInputs[selectedVal];
                                }
                              } else if (field.name === 'taxonomyMain') {
                                const mainTax = cfg?.taxonomy?.find((t: any) => t.label === selectedVal || t.id === selectedVal);
                                conditionalInputs = cfg?.optionCustomInputs?.[mainTax?.id] || mainTax?.customInputs || cfg?.optionCustomInputs?.[selectedVal] || [];
                              }

                              if (!conditionalInputs || conditionalInputs.length === 0) return null;

                              return (
                                <div
                                  style={{
                                    gridColumn: '1 / -1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.05)' : 'rgba(37, 99, 235, 0.04)',
                                    border: darkMode ? '1.5px dashed rgba(56, 189, 248, 0.35)' : '1.5px dashed rgba(37, 99, 235, 0.3)',
                                    animation: 'fadeIn 0.2s ease',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#38bdf8' : '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>↳</span>
                                      <span>بيانات ومتطلبات خاصة باختيار «{selectedVal}»:</span>
                                    </span>
                                    <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                      {conditionalInputs.length} حقول إضافية
                                    </span>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {conditionalInputs.map((ci: any) => (
                                      <div key={ci.name || ci.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <label style={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e3a52' }}>
                                            {ci.label}
                                          </label>
                                          {ci.required && (
                                            <span style={{ fontSize: '8.5px', fontWeight: 700, color: flowColor, backgroundColor: `${flowColor}15`, padding: '1px 5px', borderRadius: '3px' }}>
                                              مطلوب
                                            </span>
                                          )}
                                        </div>
                                        <FieldInput
                                          field={{
                                            name: ci.name || ci.id,
                                            label: ci.label,
                                            type: ci.type || 'text',
                                            required: !!ci.required,
                                            placeholder: ci.placeholder
                                          }}
                                          value={formData[ci.name || ci.id] || ''}
                                          onChange={v => handleFieldChange(ci.name || ci.id, v)}
                                          darkMode={darkMode}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </React.Fragment>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Stage 3: مراجعة تفاصيل التذكرة قبل الاعتماد والإصدار - تصميم تذكرة طيران مؤسسية فاخرة */}
                  {currentStep === totalStages && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Executive Status Banner */}
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1.5px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: '#34d399' }}>
                          <ShieldCheck size={18} />
                          <span>اكتملت بيانات المعاملة الرسمية: جاهزة للمصادقة وتوليد القيد الرقمي</span>
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : '#ffffff',
                          border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                          fontSize: '11px',
                          color: darkMode ? '#38bdf8' : '#0284c7',
                          fontWeight: 800,
                        }}>
                          <Hash size={13} />
                          <span>{previewSerial}</span>
                        </div>
                      </div>

                      {/* Luxury Perforated Ticket Card */}
                      <div style={{
                        position: 'relative',
                        borderRadius: '14px',
                        backgroundColor: darkMode ? '#101728' : '#ffffff',
                        border: darkMode ? '1.5px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #cbd5e1',
                        boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(30,58,82,0.08)',
                        overflow: 'hidden',
                      }}>
                        {/* Top Header Strip with Flow Color */}
                        <div style={{
                          height: '4px',
                          width: '100%',
                          backgroundColor: flowColor,
                        }} />

                        {/* Ticket Header */}
                        <div style={{
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: darkMode ? '1px dashed rgba(255,255,255,0.12)' : '1px dashed #e2e8f0',
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '9px',
                              backgroundColor: `${flowColor}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: flowColor,
                            }}>
                              {resolveIcon(selectedFlow.icon, 20, flowColor)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                                {selectedFlow.title}
                              </span>
                              <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                {selectedFlow.description || 'طلب إلكتروني موثق'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                              color: darkMode ? '#38bdf8' : '#2563eb',
                              fontSize: '10.5px',
                              fontWeight: 800,
                            }}>
                              {(selectedFlow as any).targetRole || 'موجه للإدارة'}
                            </span>
                          </div>
                        </div>

                        {/* Highlights Bento Row (Taxonomy, Schedule, Delegate, Attachment) */}
                        <div style={{
                          padding: '14px 18px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                          gap: '10px',
                        }}>
                          {/* 1. Taxonomy Main & Sub */}
                          {formData.taxonomyMain && (
                            <div style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(37, 99, 235, 0.05)',
                              border: darkMode ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(37, 99, 235, 0.15)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}>
                              <span style={{ fontSize: '10px', color: darkMode ? '#38bdf8' : '#2563eb', fontWeight: 700 }}>
                                التصنيف المعتمد والنوع:
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '26px', height: '26px', borderRadius: '7px',
                                  backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: darkMode ? '#38bdf8' : '#2563eb',
                                }}>
                                  {resolveIcon(getOptionIcon({ label: formData.taxonomyMain }), 15)}
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                                  {formData.taxonomyMain}
                                </span>
                              </div>
                              {formData.taxonomySub && (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginTop: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                  border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: darkMode ? '#38bdf8' : '#0284c7',
                                }}>
                                  {resolveIcon(getOptionIcon({ label: formData.taxonomySub }), 13)}
                                  <span>{formData.taxonomySub}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. Schedule Engine / Date Window */}
                          {formData.scheduleEngine && (
                            <div style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(217, 119, 6, 0.06)',
                              border: darkMode ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(217, 119, 6, 0.15)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}>
                              <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>
                                الجدولة والمدة الزمنية:
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '26px', height: '26px', borderRadius: '7px',
                                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#f59e0b',
                                }}>
                                  <Clock size={15} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                                  {formData.scheduleEngine}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 3. Delegate Colleague */}
                          {formData.delegateUser && (
                            <div style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.06)',
                              border: darkMode ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(79, 70, 229, 0.15)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}>
                              <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 700 }}>
                                الزميل المكلف / البديل:
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '26px', height: '26px', borderRadius: '7px',
                                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#818cf8',
                                }}>
                                  <UserCheck size={15} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                                  {formData.delegateUser}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 4. Uploaded Attachment */}
                          {formData.attachment && (() => {
                            let attName = formData.attachment;
                            let attSize = '';
                            try {
                              const parsed = JSON.parse(formData.attachment);
                              attName = parsed.fileName || parsed.name || formData.attachment;
                              attSize = parsed.sizeMB ? `${parsed.sizeMB} MB` : '';
                            } catch {}

                            return (
                              <div style={{
                                padding: '12px 14px',
                                borderRadius: '10px',
                                backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
                                border: darkMode ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                              }}>
                                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                                  المستند والمرفق المعتمد:
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: '26px', height: '26px', borderRadius: '7px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#10b981', flexShrink: 0
                                  }}>
                                    <FileText size={15} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {attName}
                                    </span>
                                    {attSize && (
                                      <span style={{ fontSize: '9.5px', color: '#64748b' }}>{attSize} • جاهز للرفع والأرشفة</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Perforated Divider */}
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          padding: '0 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <div style={{
                            flex: 1,
                            borderBottom: darkMode ? '1.5px dashed rgba(255,255,255,0.14)' : '1.5px dashed #cbd5e1'
                          }} />
                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Scissors size={12} />
                            <span>قسيمة تفاصيل المعاملة</span>
                          </span>
                          <div style={{
                            flex: 1,
                            borderBottom: darkMode ? '1.5px dashed rgba(255,255,255,0.14)' : '1.5px dashed #cbd5e1'
                          }} />
                        </div>

                        {/* Detailed Form Fields Grid */}
                        <div style={{
                          padding: '16px 18px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '10px',
                        }}>
                          {selectedFlow.fields.map(f => {
                            if (['taxonomyMain', 'taxonomySub', 'scheduleEngine', 'delegateUser', 'attachment'].includes(f.name)) return null;
                            const val = formData[f.name];
                            if (!val) return null;
                            return (
                              <div
                                key={f.name}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f1f5f9',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  gridColumn: f.type === 'textarea' ? '1 / -1' : undefined
                                }}
                              >
                                <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>{f.label}</span>
                                <span style={{ fontSize: '11.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', whiteSpace: 'pre-wrap' }}>{val}</span>
                              </div>
                            );
                          })}

                          {/* Dynamic Fields & Conditional Options */}
                          {(() => {
                            const cfg = (selectedFlow as any).formConfig;
                            const optionInputsMap = cfg?.optionCustomInputs || {};
                            const allOptionInputs: any[] = Object.values(optionInputsMap).flat();
                            (cfg?.dynamicFields || []).forEach((df: any) => {
                              (df.options || []).forEach((opt: any) => {
                                if (opt.customInputs) allOptionInputs.push(...opt.customInputs);
                              });
                            });

                            return allOptionInputs.map((ci: any) => {
                              const val = formData[ci.name || ci.id];
                              if (!val) return null;
                              return (
                                <div
                                  key={ci.name || ci.id}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.04)' : 'rgba(37, 99, 235, 0.03)',
                                    border: darkMode ? '1px solid rgba(56, 189, 248, 0.12)' : '1px solid rgba(37, 99, 235, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                  }}
                                >
                                  <span style={{ fontSize: '10px', color: darkMode ? '#38bdf8' : '#2563eb', fontWeight: 600 }}>↳ {ci.label}</span>
                                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>{String(val)}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {errorMsg && (
                    <div style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <AlertTriangle size={13} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Navigation Buttons Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    paddingTop: '10px',
                    gap: '8px',
                  }}>
                    <div>
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                            color: darkMode ? '#cbd5e1' : '#475569',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: "'Cairo', sans-serif",
                          }}
                        >
                          <ChevronRight size={13} />
                          <span>السابق</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {currentStep < totalStages && (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          style={{
                            padding: '7px 18px',
                            borderRadius: '6px',
                            background: `linear-gradient(135deg, ${flowColor} 0%, #2563eb 100%)`,
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: `0 4px 12px ${flowColor}35`,
                            fontFamily: "'Cairo', sans-serif",
                          }}
                        >
                          <span>متابعة للمرحلة التالية</span>
                          <ChevronLeft size={14} />
                        </button>
                      )}

                      {currentStep === totalStages && (
                        <button
                          type="button"
                          onClick={handleTearAndSubmit}
                          disabled={loading || tearState !== 'idle'}
                          style={{
                            padding: '8px 24px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #f36c21 50%, #135d79 100%)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 900,
                            cursor: (loading || tearState !== 'idle') ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            boxShadow: '0 6px 18px rgba(243, 108, 33, 0.4)',
                            fontFamily: "'Cairo', sans-serif",
                          }}
                        >
                          <Scissors size={15} />
                          <span>إرسال واعتماد الطلب • استخراج التذكرة 🚀</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Physical Dispenser Slit Mouth (فتحة خروج التذاكر) */}
        <div style={{
          width: '92%',
          height: '11px',
          borderRadius: '5.5px',
          backgroundColor: '#050914',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: tearState === 'dispensing'
            ? 'inset 0 3px 6px rgba(0, 0, 0, 0.95), 0 0 20px #f36c21, 0 0 30px #38bdf8'
            : 'inset 0 3px 6px rgba(0, 0, 0, 0.95), 0 0 10px rgba(56, 189, 248, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          marginTop: '2px',
          transition: 'box-shadow 0.3s ease',
        }}>
          {/* Laser guide line inside slot */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '6%',
            right: '6%',
            height: '2px',
            transform: 'translateY(-50%)',
            background: tearState === 'dispensing'
              ? 'linear-gradient(90deg, transparent, #f36c21, #f59e0b, #38bdf8, transparent)'
              : (isDispenserOpen
                ? 'linear-gradient(90deg, transparent, #38bdf8, transparent)'
                : 'linear-gradient(90deg, transparent, #10b981, transparent)'),
            boxShadow: tearState === 'dispensing'
              ? '0 0 12px #f36c21, 0 0 18px #38bdf8'
              : (isDispenserOpen ? '0 0 8px #38bdf8' : '0 0 6px #10b981'),
          }} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. THE EMITTED PRINTED TICKET (خروج التذكرة الفعلي من شق الماكينة)
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {tearState !== 'idle' && selectedFlow && (
          <motion.div
            initial={{ opacity: 0, y: -180, scaleY: 0.2 }}
            animate={{
              opacity: 1,
              y: 0,
              scaleY: 1,
              transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
            }}
            exit={{
              opacity: 0,
              y: tearState === 'departing' ? -100 : -40,
              scale: 0.85,
              transition: { duration: 0.35, ease: 'easeInOut' }
            }}
            style={{
              width: '100%',
              maxWidth: '940px',
              margin: '-4px auto 0',
              position: 'relative',
              zIndex: 35,
              transformOrigin: 'top center',
            }}
          >
            {/* Top cutter laser line during reverse cutting */}
            {tearState === 'ripping' && (
              <motion.div
                initial={{ width: '0%', left: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.65, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '-2px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #ef4444, #f59e0b, #38bdf8)',
                  boxShadow: '0 0 16px #f59e0b, 0 0 25px #ef4444',
                  zIndex: 60,
                  borderRadius: '2px',
                }}
              />
            )}

            {/* Cinema Ticket Split: Stub on Right + Verified Payload on Left */}
            <div
              className="enterprise-ticket-split"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                borderRadius: '12px',
                overflow: 'visible',
                backgroundColor: darkMode ? '#0e172a' : '#ffffff',
                border: darkMode ? `1.5px solid ${flowColor}50` : `1.5px solid ${flowColor}70`,
                boxShadow: darkMode
                  ? `0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px ${flowColor}25`
                  : '0 12px 30px rgba(30, 58, 82, 0.12)',
                minHeight: '260px',
                width: '100%',
              }}
            >
              {/* STUB ON RIGHT */}
              <motion.div
                className="ticket-stub-col"
                animate={
                  tearState === 'ripping'
                    ? { rotate: 1.5, x: 4, transformOrigin: 'bottom right' }
                    : tearState === 'departing'
                    ? { y: 130, x: 50, rotate: 6, scale: 0.65, opacity: 0, filter: 'blur(2px)' }
                    : { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
                }
                transition={
                  tearState === 'ripping'
                    ? { duration: 0.65, ease: 'easeOut' }
                    : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
                }
                style={{
                  width: '215px',
                  flexShrink: 0,
                  padding: '16px 14px',
                  backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.96)' : '#f8fafc',
                  borderInlineEnd: tearState === 'departing' ? 'none' : (darkMode ? '2px dashed rgba(255, 255, 255, 0.18)' : '2px dashed #cbd5e1'),
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>NEXUS TDS STUB</span>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', letterSpacing: '0.03em', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
                    {previewSerial || 'REQ-2026-TDS'}
                  </div>
                </div>

                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '15px', letterSpacing: '2px', color: darkMode ? '#cbd5e1' : '#334155' }}>
                    ||||| | |||| ||| |||
                  </div>
                  <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '2px', letterSpacing: '0.05em' }}>
                    NEXUS-VERIFIED-2026
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginBottom: '2px' }}>
                    مقدم الطلب: <span style={{ color: darkMode ? '#f8fafc' : '#0f172a', fontWeight: 700 }}>{user?.name || 'مساحة الإدارة'}</span>
                  </div>
                  <div style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'center',
                  }}>
                    <span>📥 حوض المعاملات النشطة</span>
                  </div>
                </div>
              </motion.div>

              {/* Perforation Seam */}
              <div style={{
                width: '1px',
                borderInlineStart: darkMode ? '2px dashed rgba(255, 255, 255, 0.18)' : '2px dashed #cbd5e1',
                position: 'relative',
              }} />

              {/* BODY PAYLOAD */}
              <motion.div
                animate={
                  tearState === 'ripping'
                    ? { rotate: -2, x: -6, transformOrigin: 'bottom left' }
                    : tearState === 'departing'
                    ? { y: -150, x: -60, rotate: -8, scale: 0.85, opacity: 0, filter: 'blur(3px)' }
                    : { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
                }
                transition={
                  tearState === 'ripping'
                    ? { duration: 0.65, ease: 'easeOut' }
                    : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
                }
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '7px', backgroundColor: `${flowColor}20`, border: `1.5px solid ${flowColor}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: flowColor }}>
                        {resolveIcon(selectedFlow.icon, 17, flowColor)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                          {selectedFlow.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: flowColor, fontWeight: 700 }}>
                          🎯 جهة الاختصاص: {targetDeptName}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                      تذكرة صادرة وموثقة ✓
                    </span>
                  </div>

                  {/* Summary grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc' }}>
                    {selectedFlow.fields.map(f => {
                      const val = formData[f.name];
                      if (!val) return null;
                      return (
                        <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600 }}>{f.label}</span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>{val}</span>
                        </div>
                      );
                    })}
                    {formData.taxonomySub && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 600 }}>المشكلة المحددة</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>⚡ {formData.taxonomySub}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Departure Overlay */}
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
                    zIndex: 20,
                  }}>
                    <span style={{ fontSize: '24px' }}>✈️</span>
                    <span>تحليق وإحالة فورية إلى: {targetDeptName}</span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
