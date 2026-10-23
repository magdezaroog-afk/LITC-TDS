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
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  Sparkles, Plus, ChevronLeft, ChevronRight, ArrowRight,
  Send, AlertTriangle, CheckCircle2, Loader2,
  Building2, UserCheck, ArrowRightLeft, FileText, Check,
  Clock, Hash, QrCode, Scissors, Eye, Layers, ShieldCheck,
  Search, Wrench, Monitor, Cpu, HardDrive, Wifi, Printer,
  HelpCircle, Settings, Laptop, Radio, AlertCircle,
  Ticket, ChevronDown, Calendar, CalendarDays, Paperclip, Download, X,
  Users, Landmark, MapPin
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
          minHeight: '44px',
          padding: '8px 12px',
          borderRadius: '10px',
          border: isOpen
            ? '1.5px solid #38bdf8'
            : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
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
          boxShadow: isOpen ? '0 0 16px rgba(56, 189, 248, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {selectedItem?.icon && (
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(37, 99, 235, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: darkMode ? '#38bdf8' : '#2563eb',
              flexShrink: 0
            }}>
              {resolveIcon(selectedItem.icon, 14)}
            </div>
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
              maxHeight: '260px',
              backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.97)' : '#ffffff',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.45)' : '1.5px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: darkMode
                ? '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 20px rgba(56, 189, 248, 0.25)'
                : '0 18px 40px rgba(30, 58, 82, 0.22)',
              zIndex: 999999,
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
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                    color: darkMode ? '#ffffff' : '#0f172a',
                    fontSize: '11.5px',
                    fontFamily: "'Cairo', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            )}

            <div style={{ overflowY: 'auto', maxHeight: '210px', padding: '6px' }}>
              {filteredOpts.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
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
                        padding: '8px 10px',
                        borderRadius: '8px',
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
                        transition: 'background-color 0.15s',
                        marginBottom: '2px',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {opt.icon && (
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: isSelected
                              ? (darkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)')
                              : (darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#94a3b8' : '#64748b'),
                            flexShrink: 0
                          }}>
                            {resolveIcon(opt.icon, 14)}
                          </div>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.label}
                        </span>
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
                          flexShrink: 0,
                        }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
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
    minHeight: '42px',
    padding: '9px 12px',
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
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'flex-start',
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
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  width: '84px',
                  outline: 'none',
                  textAlign: 'center',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                {/* Orbital Circular Disc - NO OUTER SQUARE BOX! */}
                <div style={{
                  position: 'relative',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected
                    ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                    : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                  border: isSelected
                    ? '2px solid #38bdf8'
                    : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                  boxShadow: isSelected
                    ? (darkMode ? '0 0 20px rgba(56, 189, 248, 0.45)' : '0 4px 14px rgba(37, 99, 235, 0.2)')
                    : '0 2px 6px rgba(0,0,0,0.04)',
                  color: isSelected
                    ? (darkMode ? '#38bdf8' : '#2563eb')
                    : (darkMode ? '#cbd5e1' : '#475569'),
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  {resolveIcon(opt.icon, 22, isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'))}

                  {/* Floating Selected Check Badge */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      insetInlineEnd: '-2px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: darkMode ? '#38bdf8' : '#2563eb',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Floating Label - completely unboxed */}
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected
                    ? (darkMode ? '#38bdf8' : '#2563eb')
                    : (darkMode ? '#e2e8f0' : '#1e293b'),
                  fontFamily: "'Cairo', sans-serif",
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                  maxWidth: '84px',
                }}>
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

// ── In-Place Taxonomy Selector (المشاكل الرئيسية والفرعية في نفس المكان بدون نزول الشاشة) ──
function InPlaceTaxonomySelector({
  selectedFlow,
  mainValue,
  subValue,
  onSelectMain,
  onSelectSub,
  darkMode = true,
  flowColor = '#38bdf8',
}: {
  selectedFlow: any;
  mainValue: string;
  subValue: string;
  onSelectMain: (val: string) => void;
  onSelectSub: (val: string) => void;
  darkMode?: boolean;
  flowColor?: string;
}) {
  const taxonomyList = useMemo(() => {
    return (selectedFlow?.formConfig?.taxonomy || []).filter((t: any) => t.isActive !== false);
  }, [selectedFlow]);

  const selectedMainObj = useMemo(() => {
    if (!mainValue) return null;
    return taxonomyList.find((t: any) => t.label === mainValue || t.id === mainValue);
  }, [taxonomyList, mainValue]);

  const activeSubIssues = useMemo(() => {
    if (!selectedMainObj?.subIssues) return [];
    return selectedMainObj.subIssues.filter((s: any) => s.isActive !== false);
  }, [selectedMainObj]);

  const [isEditing, setIsEditing] = useState<'main' | 'sub' | false>(false);

  const viewMode = useMemo(() => {
    if (!mainValue || isEditing === 'main') return 'main';
    if (activeSubIssues.length > 0 && (!subValue || isEditing === 'sub')) return 'sub';
    return 'summary';
  }, [mainValue, subValue, activeSubIssues.length, isEditing]);

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        borderRadius: '12px',
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
        border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.25)' : '1.5px solid #cbd5e1',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(19, 93, 121, 0.05)',
        minHeight: '140px',
        boxSizing: 'border-box',
        transition: 'all 0.25s ease',
      }}
    >
      {/* ── STEP 1: المشاكل الرئيسية ── */}
      {viewMode === 'main' && (
        <motion.div
          key="tax_main"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                backgroundColor: `${flowColor}20`, color: flowColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Wrench size={13} />
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                حدد نوع المشكلة أو الطلب الفني:
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {taxonomyList.length} تصنيفات رئيسية
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start', paddingTop: '4px' }}>
            {taxonomyList.map((item: any) => {
              const label = item.label || item.id;
              const icon = item.icon || getOptionIcon({ label });
              const isSelected = mainValue === label;

              return (
                <button
                  key={item.id || label}
                  type="button"
                  onClick={() => {
                    onSelectMain(label);
                    onSelectSub('');
                    const subs = item?.subIssues?.filter((s: any) => s.isActive !== false) || [];
                    if (subs.length > 0) {
                      setIsEditing('sub');
                    } else {
                      setIsEditing(false);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    width: '88px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    position: 'relative',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                    boxShadow: isSelected
                      ? (darkMode ? '0 0 18px rgba(56, 189, 248, 0.45)' : '0 4px 14px rgba(37, 99, 235, 0.2)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                    transition: 'all 0.2s ease',
                  }}>
                    {resolveIcon(icon, 22, isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'))}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: '#38bdf8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e293b'),
                    fontFamily: "'Cairo', sans-serif",
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '88px',
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── STEP 2: المشاكل الفرعية في نفس المكان تماماً ── */}
      {viewMode === 'sub' && (
        <motion.div
          key="tax_sub"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: darkMode ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e2e8f0', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsEditing('main');
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: darkMode ? '#38bdf8' : '#2563eb',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                <ArrowRight size={13} />
                <span>المشاكل الرئيسية</span>
              </button>
              <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                ↳ حدد المشكلة الفرعية لـ ({mainValue}):
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {activeSubIssues.length} خيارات فرعية
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start', paddingTop: '4px' }}>
            {activeSubIssues.map((sub: any) => {
              const subLabel = typeof sub === 'string' ? sub : sub.label || sub.name;
              const subIcon = (typeof sub === 'object' && sub.icon) ? sub.icon : resolveSubIssueIcon(subLabel);
              const isSelected = subValue === subLabel;

              return (
                <button
                  key={subLabel}
                  type="button"
                  onClick={() => {
                    onSelectSub(subLabel);
                    setIsEditing(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    width: '84px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                    boxShadow: isSelected
                      ? (darkMode ? '0 0 16px rgba(56, 189, 248, 0.45)' : '0 4px 12px rgba(37, 99, 235, 0.2)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                    transition: 'all 0.2s ease',
                  }}>
                    {typeof subIcon === 'string'
                      ? resolveIcon(subIcon, 20, isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'))
                      : subIcon}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: '#38bdf8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e3a52'),
                    fontFamily: "'Cairo', sans-serif",
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '84px',
                  }}>
                    {subLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── STEP 3: الملخص المكتمل المدمج في نفس المكان ── */}
      {viewMode === 'summary' && (
        <motion.div
          key="tax_summary"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '4px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(37, 99, 235, 0.1)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              color: darkMode ? '#38bdf8' : '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle2 size={19} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                المشكلة المحددة:
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                <span>{mainValue}</span>
                {subValue && (
                  <span style={{ color: darkMode ? '#38bdf8' : '#2563eb' }}> ← {subValue}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeSubIssues.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditing('sub')}
                style={{
                  padding: '5px 10px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  color: darkMode ? '#cbd5e1' : '#334155',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                تغيير الفرعية
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditing('main')}
              style={{
                padding: '5px 10px', borderRadius: '6px',
                backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: darkMode ? '#38bdf8' : '#2563eb',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              تغيير الكل
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── In-Place Org Hierarchy Selector (الإدارات والأقسام والوحدات كأيقونات في نفس المكان تماماً) ──
function InPlaceOrgHierarchySelector({
  orgTree,
  department,
  division,
  team,
  onSelectDepartment,
  onSelectDivision,
  onSelectTeam,
  darkMode = true,
  flowColor = '#38bdf8',
}: {
  orgTree: any;
  department: string;
  division: string;
  team: string;
  onSelectDepartment: (val: string) => void;
  onSelectDivision: (val: string) => void;
  onSelectTeam: (val: string) => void;
  darkMode?: boolean;
  flowColor?: string;
}) {
  const departments = useMemo(() => {
    return getTopLevelDepartments(orgTree);
  }, [orgTree]);

  const divisions = useMemo(() => {
    if (!department) return [];
    return getDivisionsForDepartment(orgTree, department);
  }, [orgTree, department]);

  const teams = useMemo(() => {
    if (!division) return [];
    return getTeamsForDivision(orgTree, division);
  }, [orgTree, division]);

  const [activeLevel, setActiveLevel] = useState<'dept' | 'div' | 'team' | 'done'>('dept');

  useEffect(() => {
    if (!department) {
      setActiveLevel('dept');
    } else if (divisions.length > 0 && !division) {
      setActiveLevel('div');
    } else if (teams.length > 0 && !team) {
      setActiveLevel('team');
    } else {
      setActiveLevel('done');
    }
  }, [department, division, team, divisions.length, teams.length]);

  const resolveDeptIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('تقنية') || n.includes('معلومات') || n.includes('it')) return <Laptop size={18} />;
    if (n.includes('بشرية') || n.includes('موارد') || n.includes('موظف')) return <Users size={18} />;
    if (n.includes('مالي') || n.includes('حسابات') || n.includes('خزينة')) return <Landmark size={18} />;
    if (n.includes('قانون') || n.includes('شؤون')) return <ShieldCheck size={18} />;
    if (n.includes('خدمات') || n.includes('مشتريات') || n.includes('صيانة')) return <Wrench size={18} />;
    return <Building2 size={18} />;
  };

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        borderRadius: '12px',
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
        border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.25)' : '1.5px solid #cbd5e1',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(19, 93, 121, 0.05)',
        minHeight: '140px',
        boxSizing: 'border-box',
        transition: 'all 0.25s ease',
      }}
    >
      {/* ── LEVEL 1: الإدارات والمكاتب ── */}
      {activeLevel === 'dept' && (
        <motion.div
          key="org_dept"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                backgroundColor: `${flowColor}20`, color: flowColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Building2 size={13} />
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                اختر الإدارة أو المكتب التابع له:
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {departments.length} إدارات متاحة
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', paddingTop: '4px' }}>
            {departments.map((d: any) => {
              const isSelected = department === d.name;
              return (
                <button
                  key={d.id || d.name}
                  type="button"
                  onClick={() => {
                    onSelectDepartment(d.name);
                    onSelectDivision('');
                    onSelectTeam('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    width: '94px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    position: 'relative',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                    boxShadow: isSelected
                      ? (darkMode ? '0 0 18px rgba(56, 189, 248, 0.45)' : '0 4px 14px rgba(37, 99, 235, 0.2)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                    transition: 'all 0.2s ease',
                  }}>
                    {resolveDeptIcon(d.name)}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: '#38bdf8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e293b'),
                    fontFamily: "'Cairo', sans-serif",
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '94px',
                  }}>
                    {d.name}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── LEVEL 2: الأقسام في نفس المكان ── */}
      {activeLevel === 'div' && (
        <motion.div
          key="org_div"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: darkMode ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e2e8f0', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveLevel('dept')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: darkMode ? '#38bdf8' : '#2563eb',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                <ArrowRight size={13} />
                <span>الإدارات</span>
              </button>
              <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                ↳ حدد القسم التابع لـ ({department}):
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {divisions.length} أقسام
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', paddingTop: '4px' }}>
            {divisions.map((divItem: any) => {
              const isSelected = division === divItem.name;
              return (
                <button
                  key={divItem.id || divItem.name}
                  type="button"
                  onClick={() => {
                    onSelectDivision(divItem.name);
                    onSelectTeam('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    width: '88px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                    boxShadow: isSelected
                      ? (darkMode ? '0 0 16px rgba(56, 189, 248, 0.45)' : '0 4px 12px rgba(37, 99, 235, 0.2)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                    transition: 'all 0.2s ease',
                  }}>
                    <Layers size={18} />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: '#38bdf8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e293b'),
                    fontFamily: "'Cairo', sans-serif",
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '88px',
                  }}>
                    {divItem.name}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── LEVEL 3: الوحدات والفرق في نفس المكان ── */}
      {activeLevel === 'team' && (
        <motion.div
          key="org_team"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: darkMode ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e2e8f0', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveLevel('div')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: darkMode ? '#38bdf8' : '#2563eb',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                <ArrowRight size={13} />
                <span>الأقسام</span>
              </button>
              <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                ↳ حدد الوحدة أو الفريق التابع لـ ({division}):
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {teams.length} وحدات
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', paddingTop: '4px' }}>
            {teams.map((teamItem: any) => {
              const isSelected = team === teamItem.name;
              return (
                <button
                  key={teamItem.id || teamItem.name}
                  type="button"
                  onClick={() => {
                    onSelectTeam(teamItem.name);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    width: '84px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    position: 'relative',
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                    boxShadow: isSelected
                      ? (darkMode ? '0 0 16px rgba(56, 189, 248, 0.45)' : '0 4px 12px rgba(37, 99, 235, 0.2)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                    transition: 'all 0.2s ease',
                  }}>
                    <UserCheck size={17} />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: '#38bdf8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e293b'),
                    fontFamily: "'Cairo', sans-serif",
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '84px',
                  }}>
                    {teamItem.name}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── LEVEL 4: الملخص المكتمل المدمج في نفس المكان ── */}
      {activeLevel === 'done' && (
        <motion.div
          key="org_done"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '4px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(37, 99, 235, 0.1)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              color: darkMode ? '#38bdf8' : '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={19} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                الهيكل التنظيمي المعتمد:
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                <span>{department}</span>
                {division && <span style={{ color: darkMode ? '#38bdf8' : '#2563eb' }}> ← {division}</span>}
                {team && <span style={{ color: '#10b981' }}> ← {team}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {teams.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveLevel('team')}
                style={{
                  padding: '5px 10px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  color: darkMode ? '#cbd5e1' : '#334155',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                تغيير الوحدة
              </button>
            )}
            {divisions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveLevel('div')}
                style={{
                  padding: '5px 10px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  color: darkMode ? '#cbd5e1' : '#334155',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                تغيير القسم
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveLevel('dept')}
              style={{
                padding: '5px 10px', borderRadius: '6px',
                backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: darkMode ? '#38bdf8' : '#2563eb',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              تغيير الإدارة
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── In-Place Building Selector (المباني كأيقونات في نفس المكان بدون نزول الشاشة) ──
function InPlaceBuildingSelector({
  options,
  value,
  onChange,
  darkMode = true,
  flowColor = '#38bdf8',
  required = false,
}: {
  options: (string | { id?: string; label?: string; name?: string })[];
  value: string;
  onChange: (v: string) => void;
  darkMode?: boolean;
  flowColor?: string;
  required?: boolean;
}) {
  const normalizedOpts = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') return { value: opt, label: opt };
      const v = opt.id || opt.name || opt.label || '';
      const l = opt.label || opt.name || opt.id || '';
      return { value: v, label: l };
    });
  }, [options]);

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        borderRadius: '12px',
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
        border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.25)' : '1.5px solid #cbd5e1',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(19, 93, 121, 0.05)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            backgroundColor: `${flowColor}20`, color: flowColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Building2 size={13} />
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
            حدد المبنى أو الموقع:
          </span>
        </div>
        {required && (
          <span style={{ fontSize: '8.5px', fontWeight: 700, color: flowColor, backgroundColor: `${flowColor}15`, padding: '1px 5px', borderRadius: '3px' }}>
            مطلوب
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', paddingTop: '4px' }}>
        {normalizedOpts.map(opt => {
          const isSelected = value === opt.value || value === opt.label;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(isSelected ? '' : opt.label)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                width: '88px',
                outline: 'none',
                textAlign: 'center',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected
                  ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                  : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                border: isSelected
                  ? '2px solid #38bdf8'
                  : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                boxShadow: isSelected
                  ? (darkMode ? '0 0 16px rgba(56, 189, 248, 0.45)' : '0 4px 12px rgba(37, 99, 235, 0.2)')
                  : '0 2px 6px rgba(0,0,0,0.04)',
                color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                transition: 'all 0.2s ease',
              }}>
                <Building2 size={20} />
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    backgroundColor: '#38bdf8', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}>
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isSelected ? 800 : 600,
                color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e293b'),
                fontFamily: "'Cairo', sans-serif",
                lineHeight: 1.3,
                wordBreak: 'break-word',
                maxWidth: '88px',
              }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── In-Place Dynamic Cascade Selector (المستدلات والتصنيفات الفرعية في نفس المكان تماماً بدون نزول للشاشة) ──
function InPlaceDynamicCascadeSelector({
  parentDef,
  formData,
  onFieldChange,
  effectiveDynamicFields,
  darkMode = true,
  flowColor = '#38bdf8',
}: {
  parentDef: any;
  formData: Record<string, string>;
  onFieldChange: (name: string, val: string) => void;
  effectiveDynamicFields: any[];
  darkMode?: boolean;
  flowColor?: string;
}) {
  const parentFieldName = `dyn_${parentDef.id}`;
  const parentVal = formData[parentFieldName] || '';

  const parentOpts = useMemo(() => {
    return (parentDef.options || [])
      .filter((o: any) => typeof o === 'string' || o.isActive !== false)
      .map((o: any) => {
        if (typeof o === 'string') {
          return { id: o, label: o, icon: getOptionIcon({ id: o, label: o }) };
        }
        return {
          id: o.id || o.label,
          label: o.label || o.id,
          icon: o.icon || getOptionIcon({ id: o.id, label: o.label }),
        };
      });
  }, [parentDef.options]);

  const matchingBindings = useMemo(() => {
    if (!parentVal || !parentDef.childBindings) return [];
    return parentDef.childBindings.filter((b: any) => {
      const trig = b.triggerValue?.trim();
      return trig === parentVal || parentOpts.some(po => (po.id === trig || po.label === trig) && (po.id === parentVal || po.label === parentVal));
    });
  }, [parentVal, parentDef.childBindings, parentOpts]);

  const childDef = useMemo(() => {
    if (matchingBindings.length === 0) return null;
    return effectiveDynamicFields.find(df => df.id === matchingBindings[0].childFieldId) || null;
  }, [matchingBindings, effectiveDynamicFields]);

  const childFieldName = childDef ? `dyn_${childDef.id}` : '';
  const childVal = childDef ? (formData[childFieldName] || '') : '';

  const childOpts = useMemo(() => {
    if (!childDef) return [];
    return (childDef.options || [])
      .filter((o: any) => typeof o === 'string' || o.isActive !== false)
      .map((o: any) => {
        if (typeof o === 'string') {
          return { id: o, label: o, icon: getOptionIcon({ id: o, label: o }) };
        }
        return {
          id: o.id || o.label,
          label: o.label || o.id,
          icon: o.icon || getOptionIcon({ id: o.id, label: o.label }),
        };
      });
  }, [childDef]);

  const [isEditing, setIsEditing] = useState<'parent' | 'child' | false>(false);

  const viewMode = useMemo(() => {
    if (isEditing === 'parent') return 'parent';
    if (!parentVal) return 'parent';
    if (childDef) {
      if (isEditing === 'child') return 'child';
      if (!childVal) return 'child';
      return 'summary';
    }
    return 'summary';
  }, [parentVal, childDef, childVal, isEditing]);

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        borderRadius: '12px',
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
        border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.25)' : '1.5px solid #cbd5e1',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(19, 93, 121, 0.05)',
        minHeight: '140px',
        boxSizing: 'border-box',
        transition: 'all 0.25s ease',
      }}
    >
      {/* ── LEVEL 1: الخيارات الرئيسية في نفس المكان ── */}
      {viewMode === 'parent' && (
        <motion.div
          key="dyn_cascade_parent"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                backgroundColor: `${flowColor}20`, color: flowColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={13} />
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                {parentDef.name}:
              </span>
            </div>
            {parentDef.isRequired && (
              <span style={{ fontSize: '8.5px', fontWeight: 700, color: flowColor, backgroundColor: `${flowColor}15`, padding: '1px 5px', borderRadius: '3px' }}>
                مطلوب
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start', paddingTop: '4px' }}>
            {parentOpts.map((opt: any) => {
              const isSelected = parentVal === opt.label || parentVal === opt.id;
              return (
                <button
                  key={opt.id || opt.label}
                  type="button"
                  onClick={() => {
                    onFieldChange(parentFieldName, opt.label);
                    if (childFieldName) onFieldChange(childFieldName, '');
                    setIsEditing(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    width: '88px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    position: 'relative',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                    boxShadow: isSelected
                      ? (darkMode ? '0 0 18px rgba(56, 189, 248, 0.45)' : '0 4px 14px rgba(37, 99, 235, 0.2)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                    transition: 'all 0.2s ease',
                  }}>
                    {resolveIcon(opt.icon, 22, isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'))}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: '#38bdf8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e3a52'),
                    fontFamily: "'Cairo', sans-serif",
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '88px',
                  }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── LEVEL 2: المستدلة الفرعية في نفس المكان تماماً ── */}
      {viewMode === 'child' && childDef && (
        <motion.div
          key="dyn_cascade_child"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: darkMode ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e2e8f0', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsEditing('parent')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: darkMode ? '#38bdf8' : '#2563eb',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                <ArrowRight size={13} />
                <span>{parentDef.name}</span>
              </button>
              <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                {childDef.name} ({parentVal}):
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
              {childOpts.length} خيارات متاحة
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start', paddingTop: '4px' }}>
            {childOpts.map((opt: any) => {
              const isSelected = childVal === opt.label || childVal === opt.id;
              return (
                <button
                  key={opt.id || opt.label}
                  type="button"
                  onClick={() => {
                    onFieldChange(childFieldName, opt.label);
                    setIsEditing(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    width: '84px',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected
                      ? (darkMode ? 'rgba(56, 189, 248, 0.22)' : 'rgba(37, 99, 235, 0.12)')
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    border: isSelected
                      ? '2px solid #38bdf8'
                      : (darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #cbd5e1'),
                    boxShadow: isSelected
                      ? (darkMode ? '0 0 16px rgba(56, 189, 248, 0.45)' : '0 4px 12px rgba(37, 99, 235, 0.2)')
                      : '0 2px 6px rgba(0,0,0,0.04)',
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'),
                    transition: 'all 0.2s ease',
                  }}>
                    {resolveIcon(opt.icon, 20, isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#cbd5e1' : '#475569'))}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '-2px', insetInlineEnd: '-2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: '#38bdf8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? (darkMode ? '#38bdf8' : '#2563eb') : (darkMode ? '#e2e8f0' : '#1e3a52'),
                    fontFamily: "'Cairo', sans-serif",
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    maxWidth: '84px',
                  }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── LEVEL 3: الملخص المكتمل المدمج في نفس المكان ── */}
      {viewMode === 'summary' && (
        <motion.div
          key="dyn_cascade_summary"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '4px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(37, 99, 235, 0.1)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              color: darkMode ? '#38bdf8' : '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle2 size={19} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                {parentDef.name}:
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                <span>{parentVal}</span>
                {childVal && (
                  <span style={{ color: darkMode ? '#38bdf8' : '#2563eb' }}> ← {childVal}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {childDef && (
              <button
                type="button"
                onClick={() => setIsEditing('child')}
                style={{
                  padding: '5px 10px', borderRadius: '6px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  color: darkMode ? '#cbd5e1' : '#334155',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                تغيير الفرع
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditing('parent')}
              style={{
                padding: '5px 10px', borderRadius: '6px',
                backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: darkMode ? '#38bdf8' : '#2563eb',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              تغيير الكل
            </button>
          </div>
        </motion.div>
      )}
    </div>
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
    const hasDept = selectedFlow.fields.some(sf => sf.name === 'department');
    const hasTaxMain = selectedFlow.fields.some(sf => sf.name === 'taxonomyMain');

    const all = selectedFlow.fields.filter(f => {
      if (f.name === 'delegateUser') return isDelegateVis;
      if (f.name === 'attachment' && currentOptionBehavior.attachmentRule === 'HIDDEN') return false;
      if (f.name === 'description' && currentOptionBehavior.descriptionRule === 'HIDDEN') return false;
      // InPlaceOrgHierarchySelector handles division and team in place if department is present
      if (hasDept && (f.name === 'division' || f.name === 'team')) return false;
      // InPlaceTaxonomySelector handles taxonomySub in place if taxonomyMain is present
      if (hasTaxMain && f.name === 'taxonomySub') return false;
      // InPlaceDynamicCascadeSelector handles child dynamic fields in place within the parent field
      if (f.name.startsWith('dyn_')) {
        const dynId = f.name.replace('dyn_', '');
        const isBoundAsChild = effectiveDynamicFields.some(df =>
          df.childBindings?.some((b: any) => b.childFieldId === dynId)
        );
        if (isBoundAsChild) return false;
      }
      if (f.name === 'division' && divisionOptions.length === 0) return false;
      if (f.name === 'team' && teamOptions.length === 0) return false;
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
    // Stage 1: Routing & Core Classification (department, building, division, team, taxonomyMain, cascading dynamic fields, title)
    // Stage 2: Details & Operational Requirements (remaining fields, scheduleEngine, description, etc.)
    const isCore = (name: string) => {
      if (['department', 'building', 'division', 'team', 'title', 'subject', 'category', 'taxonomyMain', 'priority'].includes(name)) return true;
      if (name.startsWith('dyn_')) {
        const dId = name.replace('dyn_', '');
        const dDef = effectiveDynamicFields.find(df => df.id === dId);
        if (dDef?.childBindings && dDef.childBindings.length > 0) return true;
      }
      return false;
    };

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
  }, [selectedFlow, adminStages, currentStep, totalStages, formData, currentOptionBehavior, divisionOptions.length, teamOptions.length, effectiveDynamicFields]);

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

    // Dynamic Cascade Child validation:
    for (const f of currentFields) {
      if (f.name.startsWith('dyn_')) {
        const dynId = f.name.replace('dyn_', '');
        const pDef = effectiveDynamicFields.find(df => df.id === dynId);
        if (pDef?.childBindings && formData[f.name]) {
          const matching = pDef.childBindings.filter((b: any) => b.triggerValue === formData[f.name]);
          for (const b of matching) {
            const childDef = effectiveDynamicFields.find(df => df.id === b.childFieldId);
            if (childDef && !formData[`dyn_${childDef.id}`]?.trim()) {
              setErrorMsg(`يرجى تحديد (${childDef.name}) التابعة لـ (${formData[f.name]})`);
              return false;
            }
          }
        }
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

    setTearState('dispensing');
    await new Promise(r => setTimeout(r, 750));

    setTearState('ripping');
    await new Promise(r => setTimeout(r, 350));

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
        setIsDispenserOpen(false);
        setTearState('idle');
        setStatus('idle');
        onSuccess();
      }, 300);
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

      {/* ═══ 1. FREE-FLOATING ORBITAL SERVICE ROUTE ICONS (مباشرة تحت رسالة الترحيب بحركة عائمة مميزة وتفاعل هوفر فاخر) ═══ */}
      {!selectedFlow && tearState === 'idle' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '4px 0 16px',
          }}
        >
          <style>{`
            @keyframes orbitalFloat {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-8px);
              }
            }
            .service-floating-disc {
              animation: orbitalFloat 3.2s ease-in-out infinite;
              transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            .service-floating-disc:hover {
              animation-play-state: paused !important;
              transform: translateY(-12px) scale(1.08) !important;
            }
          `}</style>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
              padding: '6px 4px',
            }}
          >
            {requests.map((flow, idx) => {
              const fColor = flow.color || '#38bdf8';
              const block = canCreateRequest(flow.id);
              const targetDept = (flow as any).targetDepartmentName || 'إدارة تقنية المعلومات';

              return (
                <button
                  key={flow.id}
                  type="button"
                  disabled={!block.allowed}
                  onClick={() => block.allowed && handleSelectFlow(flow)}
                  className="service-floating-disc"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px',
                    cursor: block.allowed ? 'pointer' : 'not-allowed',
                    opacity: block.allowed ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    width: '125px',
                    outline: 'none',
                    textAlign: 'center',
                    animationDelay: `${idx * 0.22}s`,
                  }}
                  onMouseEnter={e => {
                    if (block.allowed) {
                      const disc = e.currentTarget.querySelector('.service-icon-disc') as HTMLElement;
                      if (disc) {
                        disc.style.boxShadow = `0 14px 34px ${fColor}55, 0 0 20px ${fColor}40`;
                        disc.style.borderColor = fColor;
                      }
                    }
                  }}
                  onMouseLeave={e => {
                    if (block.allowed) {
                      const disc = e.currentTarget.querySelector('.service-icon-disc') as HTMLElement;
                      if (disc) {
                        disc.style.boxShadow = `0 4px 18px ${fColor}25`;
                        disc.style.borderColor = `${fColor}55`;
                      }
                    }
                  }}
                >
                  {/* Free-Floating Orbital Circular Disc */}
                  <div
                    className="service-icon-disc"
                    style={{
                      position: 'relative',
                      width: '66px',
                      height: '66px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: darkMode ? `${fColor}18` : `${fColor}12`,
                      border: `2px solid ${fColor}55`,
                      color: fColor,
                      boxShadow: `0 4px 18px ${fColor}25`,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {resolveIcon(flow.icon, 30, fColor)}
                  </div>

                  {/* Free-Floating Typography Labels */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: darkMode ? '#ffffff' : '#0f172a',
                        fontFamily: "'Tajawal', sans-serif",
                        lineHeight: 1.3,
                        textAlign: 'center',
                      }}
                    >
                      {flow.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: darkMode ? '#94a3b8' : '#64748b',
                        lineHeight: 1.2,
                        textAlign: 'center',
                        maxWidth: '115px',
                      }}
                    >
                      {targetDept}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ 2. CONSOLE WORKSPACE BAY (لوحة إعداد المعاملة المنظمة) ═══ */}
      <AnimatePresence>
        {selectedFlow && tearState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              maxWidth: '940px',
              overflow: 'visible',
              backgroundColor: darkMode ? '#0e172a' : '#ffffff',
              borderRadius: '16px',
              border: darkMode ? '1.5px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #cbd5e1',
              padding: '20px 22px',
              boxShadow: darkMode ? '0 16px 40px rgba(0,0,0,0.5)' : '0 8px 30px rgba(19, 93, 121, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              zIndex: 45,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Step Header: 2-Tier Linear/Stripe Enterprise Segmented Stepper */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    paddingBottom: '12px',
                    width: '100%',
                  }}>
                    {/* Tier 1: Service Identity & Change Route Action */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '9px',
                          backgroundColor: `${flowColor}20`,
                          border: `1.5px solid ${flowColor}60`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: flowColor,
                          flexShrink: 0,
                          boxShadow: `0 2px 8px ${flowColor}25`,
                        }}>
                          {resolveIcon(selectedFlow.icon, 19, flowColor)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: darkMode ? '#ffffff' : '#0f172a',
                            fontFamily: "'Tajawal', sans-serif",
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {selectedFlow.title}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: flowColor,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <span>🎯</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              جهة الاختصاص: {targetDeptName} {targetDivName && `← ${targetDivName}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedFlow(null)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          color: darkMode ? '#cbd5e1' : '#475569',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          flexShrink: 0,
                          fontFamily: "'Cairo', sans-serif",
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <X size={13} />
                        <span>تغيير المسار</span>
                      </button>
                    </div>

                    {/* Tier 2: Linear-Style Segmented Stepper */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${totalStages}, 1fr)`,
                        gap: '6px',
                        width: '100%',
                      }}>
                        {Array.from({ length: totalStages }).map((_, idx) => {
                          const stepNum = idx + 1;
                          const isPassed = currentStep > stepNum;
                          const isActive = currentStep === stepNum;
                          return (
                            <div
                              key={stepNum}
                              style={{
                                height: '4px',
                                borderRadius: '9999px',
                                backgroundColor: isPassed
                                  ? '#10b981'
                                  : (isActive ? flowColor : (darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0')),
                                boxShadow: isActive ? `0 0 10px ${flowColor}` : 'none',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Current Step Label & Meta */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        fontWeight: 700,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 900,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            backgroundColor: `${flowColor}20`,
                            color: flowColor,
                            border: `1px solid ${flowColor}40`,
                            flexShrink: 0,
                          }}>
                            المرحلة {currentStep} من {totalStages}
                          </span>
                          <span style={{
                            color: darkMode ? '#ffffff' : '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {adminStages && adminStages[currentStep - 1]
                              ? adminStages[currentStep - 1].title
                              : (currentStep === 1 ? 'البيانات الأساسية والتوجيه' : (currentStep === totalStages ? 'مراجعة التذكرة والاعتماد النهائي' : 'المتطلبات والجدولة'))}
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#64748b', flexShrink: 0 }}>
                          {currentStep === totalStages ? '⚡ الخطوة الأخيرة' : `متبقي ${totalStages - currentStep} مراحل`}
                        </span>
                      </div>
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
                        gridTemplateColumns: stageFieldsToRender.length > 1 ? 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))' : '1fr',
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

                        // 1. IN-PLACE TAXONOMY SELECTOR
                        if (field.name === 'taxonomyMain') {
                          return (
                            <React.Fragment key="taxonomyMain">
                              <InPlaceTaxonomySelector
                                selectedFlow={selectedFlow}
                                mainValue={formData.taxonomyMain || ''}
                                subValue={formData.taxonomySub || ''}
                                onSelectMain={val => handleFieldChange('taxonomyMain', val)}
                                onSelectSub={val => handleFieldChange('taxonomySub', val)}
                                darkMode={darkMode}
                                flowColor={flowColor}
                              />
                            </React.Fragment>
                          );
                        }

                        // 2. IN-PLACE ORG HIERARCHY SELECTOR (Department -> Division -> Team)
                        if (field.name === 'department') {
                          return (
                            <React.Fragment key="department">
                              <InPlaceOrgHierarchySelector
                                orgTree={orgTree}
                                department={formData.department || ''}
                                division={formData.division || ''}
                                team={formData.team || ''}
                                onSelectDepartment={val => handleFieldChange('department', val)}
                                onSelectDivision={val => handleFieldChange('division', val)}
                                onSelectTeam={val => handleFieldChange('team', val)}
                                darkMode={darkMode}
                                flowColor={flowColor}
                              />
                            </React.Fragment>
                          );
                        }

                        // 3. IN-PLACE BUILDING SELECTOR
                        if (field.name === 'building') {
                          return (
                            <React.Fragment key="building">
                              <InPlaceBuildingSelector
                                options={field.options || ['المبنى الرئيسي (طرابلس)', 'مبنى بنغازي', 'مبنى العمليات والتحكم', 'مبنى الإدارة العامة']}
                                value={formData.building || ''}
                                onChange={val => handleFieldChange('building', val)}
                                darkMode={darkMode}
                                flowColor={flowColor}
                                required={field.required}
                              />
                            </React.Fragment>
                          );
                        }

                        // 4. IN-PLACE DYNAMIC CASCADE SELECTOR (المستدلات والتصنيفات الفرعية في نفس المكان تماماً)
                        if (field.name.startsWith('dyn_')) {
                          const dynId = field.name.replace('dyn_', '');
                          const dynDef = effectiveDynamicFields.find(df => df.id === dynId);
                          if (dynDef && dynDef.childBindings && dynDef.childBindings.length > 0) {
                            return (
                              <React.Fragment key={field.name}>
                                <InPlaceDynamicCascadeSelector
                                  parentDef={dynDef}
                                  formData={formData}
                                  onFieldChange={handleFieldChange}
                                  effectiveDynamicFields={effectiveDynamicFields}
                                  darkMode={darkMode}
                                  flowColor={flowColor}
                                />
                              </React.Fragment>
                            );
                          }
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
                    paddingTop: '14px',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          style={{
                            minHeight: '42px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                            color: darkMode ? '#cbd5e1' : '#475569',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontFamily: "'Cairo', sans-serif",
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ChevronRight size={15} />
                          <span>السابق</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {currentStep < totalStages && (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          style={{
                            minHeight: '42px',
                            padding: '10px 22px',
                            borderRadius: '8px',
                            background: '#135d79',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(19, 93, 121, 0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                            fontFamily: "'Cairo', sans-serif",
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>متابعة للمرحلة التالية ({currentStep + 1}/{totalStages})</span>
                          <ChevronLeft size={16} />
                        </button>
                      )}

                      {currentStep === totalStages && (
                        <button
                          type="button"
                          onClick={handleTearAndSubmit}
                          disabled={loading || tearState !== 'idle'}
                          style={{
                            minHeight: '42px',
                            padding: '10px 26px',
                            borderRadius: '8px',
                            background: '#135d79',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: (loading || tearState !== 'idle') ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 16px rgba(19, 93, 121, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                            fontFamily: "'Cairo', sans-serif",
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Send size={15} />
                          <span>تأكيد وإرسال الطلب</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════
            3. PHYSICAL DISPENSER SLOT & REALISTIC FLYING RECEIPT (FIXED CENTER SPOTLIGHT)
            ══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {tearState !== 'idle' && selectedFlow && typeof document !== 'undefined' && createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 99999999,
                backgroundColor: 'rgba(3, 7, 18, 0.88)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                boxSizing: 'border-box',
                pointerEvents: 'all',
              }}
            >
              {/* Upper Status HUD in Spotlight */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: "'Cairo', sans-serif",
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={14} color="#38bdf8" />
                <span>
                  {tearState === 'dispensing' && 'جاري طباعة واستخراج التذكرة الرسمية...'}
                  {tearState === 'ripping' && 'قطع واعتماد التذكرة بالليزر...'}
                  {tearState === 'departing' && 'تحويل التذكرة إلى حوض المعاملات...'}
                  {tearState === 'completed' && 'تم إدراج المعاملة بنجاح'}
                </span>
              </div>

              {/* Metallic Dispenser Slit Mouth (فتحة خروج الفاتورة من الماكينة) */}
              <div
                style={{
                  width: '360px',
                  maxWidth: '92vw',
                  height: '14px',
                  borderRadius: '7px',
                  backgroundColor: '#030712',
                  border: '1.5px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: tearState === 'ripping'
                    ? 'inset 0 4px 8px rgba(0, 0, 0, 0.95), 0 0 25px #ef4444, 0 0 35px #f59e0b'
                    : 'inset 0 4px 8px rgba(0, 0, 0, 0.95), 0 0 20px #135d79, 0 0 25px #38bdf8',
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 2,
                  transition: 'box-shadow 0.25s ease',
                }}
              >
                {/* Laser Guide / Indicator Beam inside mouth */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '5%',
                    right: '5%',
                    height: '2.5px',
                    transform: 'translateY(-50%)',
                    background: tearState === 'ripping'
                      ? 'linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)'
                      : 'linear-gradient(90deg, transparent, #38bdf8, #10b981, transparent)',
                    boxShadow: tearState === 'ripping' ? '0 0 14px #ef4444' : '0 0 10px #38bdf8',
                  }}
                />

                {/* Guillotine Blade Laser Flash (قص التذكرة من الماكينة) */}
                {tearState === 'ripping' && (
                  <motion.div
                    initial={{ width: '0%', left: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, #ffffff, #ef4444, #f59e0b)',
                      boxShadow: '0 0 18px #ffffff, 0 0 25px #ef4444',
                      zIndex: 10,
                    }}
                  />
                )}
              </div>

              {/* The Physical Receipt / Ticket (التذكرة/الفاتورة المعتمدة الخارجة والمقصوصة) */}
              <motion.div
                initial={{ y: -240, opacity: 0 }}
                animate={
                  tearState === 'dispensing'
                    ? {
                        y: [-200, 0],
                        opacity: [0.6, 1],
                        scale: 1,
                        rotate: 0,
                        transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                      }
                    : tearState === 'ripping'
                    ? {
                        y: [0, 16],
                        rotate: [0, -1.8],
                        scale: 1,
                        opacity: 1,
                        transition: { duration: 0.35, ease: 'easeOut' },
                      }
                    : tearState === 'departing'
                    ? {
                        y: [16, 440],
                        x: [0, 140],
                        scale: [1, 0.36],
                        rotate: [-1.8, 8],
                        opacity: [1, 0.95, 0],
                        filter: ['blur(0px)', 'blur(0px)', 'blur(2px)'],
                        transition: { duration: 0.85, ease: [0.25, 0.8, 0.25, 1] },
                      }
                    : { y: 0, opacity: 1 }
                }
                style={{
                  width: '340px',
                  maxWidth: '90vw',
                  marginTop: '-3px',
                  position: 'relative',
                  zIndex: 1,
                  transformOrigin: 'top center',
                  borderRadius: '0 0 14px 14px',
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.35)' : '1.5px solid #cbd5e1',
                  borderTop: 'none',
                  boxShadow: darkMode
                    ? '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 25px rgba(19, 93, 121, 0.3)'
                    : '0 18px 40px rgba(19, 93, 121, 0.16), 0 2px 8px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  fontFamily: "'Cairo', sans-serif",
                }}
              >
                {/* Serrated Cut Edge Top (حافة القص المسننة كالفاتورة الحقيقية) */}
                <div
                  style={{
                    height: '8px',
                    width: '100%',
                    background: darkMode ? 'rgba(56, 189, 248, 0.2)' : '#e2e8f0',
                    clipPath:
                      'polygon(0% 0%, 4% 8px, 8% 0%, 12% 8px, 16% 0%, 20% 8px, 24% 0%, 28% 8px, 32% 0%, 36% 8px, 40% 0%, 44% 8px, 48% 0%, 52% 8px, 56% 0%, 60% 8px, 64% 0%, 68% 8px, 72% 0%, 76% 8px, 80% 0%, 84% 8px, 88% 0%, 92% 8px, 96% 0%, 100% 8px, 100% 100%, 0% 100%)',
                    marginBottom: '6px',
                  }}
                />

                {/* Receipt Content Header */}
                <div style={{ padding: '8px 18px 10px', textAlign: 'center', borderBottom: darkMode ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: '#135d79',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Layers size={13} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#135d79', letterSpacing: '0.02em', fontFamily: "'Tajawal', sans-serif" }}>
                      المؤسسة الليبية لتقنية الاتصالات
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    تذكرة معاملة إلكترونية معتمدة • NEXUS TDS
                  </div>
                </div>

                {/* Barcode & Serial Box */}
                <div style={{
                  margin: '10px 16px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '16px',
                    letterSpacing: '3px',
                    fontWeight: 300,
                    color: darkMode ? '#38bdf8' : '#135d79',
                    fontFamily: 'monospace',
                    marginBottom: '2px',
                  }}>
                    |||| | |||||| || | |||| |||
                  </div>
                  <div style={{
                    fontSize: '12.5px',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    fontFamily: 'monospace',
                    color: darkMode ? '#ffffff' : '#0f172a',
                  }}>
                    {previewSerial || 'REQ-2026-TDS'}
                  </div>
                </div>

                {/* Service & Details */}
                <div style={{ padding: '6px 18px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        backgroundColor: `${flowColor}20`,
                        border: `1.5px solid ${flowColor}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: flowColor,
                        flexShrink: 0,
                      }}
                    >
                      {resolveIcon(selectedFlow.icon, 16, flowColor)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                        {selectedFlow.title}
                      </div>
                      <div style={{ fontSize: '10px', color: flowColor, fontWeight: 700 }}>
                        🎯 جهة الاختصاص: {targetDeptName}
                      </div>
                    </div>
                  </div>

                  {/* Summary Rows */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f1f5f9',
                    fontSize: '11px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>مقدم الطلب:</span>
                      <span style={{ fontWeight: 800, color: darkMode ? '#f8fafc' : '#0f172a' }}>
                        {user?.name || 'مساحة الموظف'}
                      </span>
                    </div>

                    {formData.taxonomyMain && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>التصنيف:</span>
                        <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                          {formData.taxonomyMain} {formData.taxonomySub ? `← ${formData.taxonomySub}` : ''}
                        </span>
                      </div>
                    )}

                    {formData.department && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>الجهة:</span>
                        <span style={{ fontWeight: 700 }}>
                          {formData.department}
                        </span>
                      </div>
                    )}

                    {formData.scheduleEngine && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>الجدولة:</span>
                        <span style={{ fontWeight: 700 }}>
                          {formData.scheduleEngine}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', paddingTop: '4px', borderTop: darkMode ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px dashed #cbd5e1' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>تاريخ القيد:</span>
                      <span style={{ fontWeight: 700, fontSize: '10px', color: '#94a3b8' }}>
                        23-10-2026 • معتمد وموثق
                      </span>
                    </div>
                  </div>

                  {/* Stamp of Certification */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#10b981',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                    <span>جاهزة للتحويل والإدراج في حوض المعاملات</span>
                  </div>
                </div>

                {/* Bottom Serrated Jagged Edge */}
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    background: darkMode ? 'rgba(56, 189, 248, 0.2)' : '#e2e8f0',
                    clipPath:
                      'polygon(0% 100%, 4% 0%, 8% 100%, 12% 0%, 16% 100%, 20% 0%, 24% 100%, 28% 0%, 32% 100%, 36% 0%, 40% 100%, 44% 0%, 48% 100%, 52% 0%, 56% 100%, 60% 0%, 64% 100%, 68% 0%, 72% 100%, 76% 0%, 80% 100%, 84% 0%, 88% 100%, 92% 0%, 96% 100%, 100% 0%, 100% 100%, 0% 100%)',
                  }}
                />
              </motion.div>
            </motion.div>,
            document.body
          )}
        </AnimatePresence>
      </div>
  );
}

