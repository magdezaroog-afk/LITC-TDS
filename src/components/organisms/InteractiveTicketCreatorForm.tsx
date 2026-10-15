import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, CheckCircle, Paperclip, UploadCloud, ChevronLeft, X, Edit3, Plus, Maximize2 } from 'lucide-react';
import { DynamicCustomField } from '../../pages/admin/tabs/DynamicFieldsTab';
import { loadRoutes, type TicketRouteDefinition, type RouteFormConfig } from '../../services/ticketRouting.helpers';
import {
  getTopLevelDepartments,
  getDivisionsForDepartment,
  getTeamsForDivision,
  loadCachedOrRemoteOrgTree,
  type InstitutionalNode
} from '../../services/institutionalHierarchy.helpers';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

interface GlassSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  routeColor?: string;
}

const GlassSelect: React.FC<GlassSelectProps> = ({ value, onChange, options, placeholder, routeColor = '#3b82f6' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOpt = options.find(o => o.id === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', direction: 'rtl' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: '10px',
          border: `1.5px solid ${isOpen ? routeColor : 'rgba(255,255,255,0.12)'}`,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: selectedOpt ? '#fff' : 'rgba(255,255,255,0.4)',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? `0 0 0 3px ${routeColor}20` : 'none',
        }}
      >
        <span>{selectedOpt ? selectedOpt.label : placeholder}</span>
        <span style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '10px', opacity: 0.6 }}>▼</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 9999,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              padding: '6px'
            }}
          >
            {options.length === 0 ? (
              <div style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center' }}>لا توجد خيارات</div>
            ) : (
              options.map(opt => {
                const isSelected = opt.id === value;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)',
                      background: isSelected ? routeColor : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <span style={{ fontSize: '11px' }}>✓</span>}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TicketCreatorFormProps {
  customFields: DynamicCustomField[];
  allowedRouteIds?: string[];
  concurrencyPolicy?: 'ALLOW_MULTIPLE' | 'PREVENT_CONCURRENT';
  hasActiveTicketInRoute?: (routeId: string) => boolean | string;
  glassPanelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const InteractiveTicketCreatorForm: React.FC<TicketCreatorFormProps> = ({
  customFields,
  allowedRouteIds = [],
  concurrencyPolicy = 'ALLOW_MULTIPLE',
  hasActiveTicketInRoute,
  glassPanelStyle = {},
  inputStyle = {}
}) => {
  const [savedRoutes, setSavedRoutes] = useState<TicketRouteDefinition[]>([]);
  const [step, setStep] = useState<'greeting' | 'select_route' | 'details' | 'success'>('greeting');
  const [showRoutes, setShowRoutes] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ambiguousMatches, setAmbiguousMatches] = useState<any[] | null>(null);
  const [journeyStepIndex, setJourneyStepIndex] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);

  useEffect(() => {
    if (journeyStepIndex > maxStepReached) setMaxStepReached(journeyStepIndex);
  }, [journeyStepIndex, maxStepReached]);
  
  // Selection States
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeBuilding, setRouteBuilding] = useState<string>('');
  const [routeDepartment, setRouteDepartment] = useState<string>('');
  const [routeDivision, setRouteDivision] = useState<string>('');
  const [routeTeam, setRouteTeam] = useState<string>('');
  const [orgTree, setOrgTree] = useState<InstitutionalNode | null>(null);
  const [routeSelectedTaxMain, setRouteSelectedTaxMain] = useState<string>('');
  const [routeSelectedTaxSub, setRouteSelectedTaxSub] = useState<string>('');
  const [routeTitle, setRouteTitle] = useState<string>('');
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeFieldValues, setRouteFieldValues] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ─── Smart Scheduling Engine State & Calculations ───
  const [scheduleType, setScheduleType] = useState<'DATE_RANGE' | 'DISCRETE_DAYS' | 'HOURLY_WINDOW' | 'SINGLE_DATE'>('DATE_RANGE');
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleEndDate, setScheduleEndDate] = useState('');
  const [discreteDays, setDiscreteDays] = useState<string[]>([]);
  const [discreteDayInput, setDiscreteDayInput] = useState('');
  const [hourlyDate, setHourlyDate] = useState('');
  const [hourlyTimeFrom, setHourlyTimeFrom] = useState('');
  const [hourlyTimeTo, setHourlyTimeTo] = useState('');
  const [singleDate, setSingleDate] = useState('');

  // ─── Delegate Colleague State ───
  const [routeDelegateUserName, setRouteDelegateUserName] = useState('');

  // Helper calculations for Smart Scheduling
  const getContinuousDaysCount = () => {
    if (!scheduleStartDate || !scheduleEndDate) return 0;
    const d1 = new Date(scheduleStartDate);
    const d2 = new Date(scheduleEndDate);
    const diff = d2.getTime() - d1.getTime();
    if (diff < 0) return -1;
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const getHourlyDuration = () => {
    if (!hourlyTimeFrom || !hourlyTimeTo) return { hours: 0, minutes: 0, isValid: true };
    const [h1, m1] = hourlyTimeFrom.split(':').map(Number);
    const [h2, m2] = hourlyTimeTo.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) return { hours: 0, minutes: 0, isValid: false };
    return { hours: Math.floor(diff / 60), minutes: diff % 60, isValid: true };
  };

  const [orgDepartments, setOrgDepartments] = useState<InstitutionalNode[]>([]);
  const [spatialBuildings, setSpatialBuildings] = useState<any[]>([]);

  // Dynamically computed hierarchy options based on tree
  const availableDivisions = React.useMemo(() => {
    if (!orgTree || !routeDepartment) return [];
    return getDivisionsForDepartment(orgTree, routeDepartment);
  }, [orgTree, routeDepartment]);

  const availableTeams = React.useMemo(() => {
    if (!orgTree || !routeDivision) return [];
    return getTeamsForDivision(orgTree, routeDivision);
  }, [orgTree, routeDivision]);

  useEffect(() => {
    const reloadData = async () => {
      setSavedRoutes(await loadRoutes());
      try {
        const tree = await loadCachedOrRemoteOrgTree();
        if (tree) {
          setOrgTree(tree);
          setOrgDepartments(getTopLevelDepartments(tree));
        }
      } catch (err) {
        console.warn('Failed to load institutional tree:', err);
      }

      try {
        const b = localStorage.getItem('litc_buildings_tree');
        if (b) setSpatialBuildings(JSON.parse(b));
      } catch {}
    };

    reloadData();

    // Listen to updates from other tabs
    window.addEventListener('storage', reloadData);
    // Listen to updates from same tab
    window.addEventListener('litc_settings_updated', reloadData);

    return () => {
      window.removeEventListener('storage', reloadData);
      window.removeEventListener('litc_settings_updated', reloadData);
    };
  }, []);


  // NLP Smart Search Logic
  const handleSmartSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 2) {
      const query = searchQuery.trim().toLowerCase();
      const matches: any[] = [];
      
      savedRoutes.forEach(r => {
        let score = 0;
        if (r.name.toLowerCase().includes(query)) score += 5;
        if (r.description && r.description.toLowerCase().includes(query)) score += 3;
        
        if (r.formConfig.taxonomy) {
          r.formConfig.taxonomy.forEach(t => {
            if (t.label.toLowerCase().includes(query)) {
              matches.push({ routeId: r.id, taxMain: t.id, taxSub: '', label: `مسار ${r.name} - ${t.label}`, score: score + 10 });
            }
            if (t.subIssues) {
              t.subIssues.forEach(s => {
                if (s.label.toLowerCase().includes(query)) {
                  matches.push({ routeId: r.id, taxMain: t.id, taxSub: s.id, label: `مسار ${r.name} - ${t.label} - ${s.label}`, score: score + 15 });
                }
              });
            }
          });
        }
        
        if (score > 0 && matches.findIndex(m => m.routeId === r.id) === -1) {
          matches.push({ routeId: r.id, label: `مسار ${r.name}`, score });
        }
      });
      
      matches.sort((a, b) => b.score - a.score);
      
      if (matches.length > 0) {
        if (matches.length === 1 || matches[0].score > (matches[1]?.score || 0) + 5) {
          // Unambiguous
          const m = matches[0];
          setSelectedRouteId(m.routeId);
          if (m.taxMain) setRouteSelectedTaxMain(m.taxMain);
          if (m.taxSub) setRouteSelectedTaxSub(m.taxSub);
          setJourneyStepIndex(0);
          setStep('details');
        } else {
          // Ambiguous
          setAmbiguousMatches(matches.slice(0, 3));
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const routeDef = savedRoutes.find(r => r.id === selectedRouteId);
    const rules = (routeDef?.formConfig || {}) as RouteFormConfig;
    const maxSizeMB = rules.maxAttachmentMB;
    const allowedExts = rules.attachmentTypes || [];

    const validFiles = files.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (maxSizeMB !== undefined && fileSizeMB > maxSizeMB) {
        setFileError(`حجم الملف ${file.name} يتجاوز الحد المسموح (${maxSizeMB}MB)`);
        return false;
      }
      if (allowedExts.length > 0 && !allowedExts.includes('*')) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const lowerAllowedExts = allowedExts.map((s: string) => s.trim().toLowerCase());
        if (!lowerAllowedExts.includes(fileExt)) {
          setFileError(`صيغة الملف غير مسموحة. المسموح: ${allowedExts.join(', ')}`);
          return false;
        }
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!routeTitle.trim() || !route) return;

    try {
      const { AdminAPI } = await import('../../services/admin.api');

      // Build fields record from routeFieldValues and Smart Scheduling Engine
      const fieldsRecord: Record<string, string> = { ...routeFieldValues };
      if (route.formConfig.showScheduleEngine || route.formConfig.showDateRange) {
        fieldsRecord['schedule_type'] = scheduleType;
        if (scheduleType === 'DATE_RANGE') {
          const days = getContinuousDaysCount();
          fieldsRecord['schedule_start_date'] = scheduleStartDate;
          fieldsRecord['schedule_end_date'] = scheduleEndDate;
          fieldsRecord['schedule_total_days'] = String(days > 0 ? days : 1);
          fieldsRecord['date_range'] = `من ${scheduleStartDate} إلى ${scheduleEndDate} (إجمالي: ${days > 0 ? days : 1} يوم)`;
          fieldsRecord['date_start'] = scheduleStartDate;
          if (scheduleEndDate) fieldsRecord['date_end'] = scheduleEndDate;
        } else if (scheduleType === 'DISCRETE_DAYS') {
          fieldsRecord['schedule_discrete_days'] = discreteDays.join(', ');
          fieldsRecord['schedule_total_days'] = String(discreteDays.length);
          fieldsRecord['date_range'] = `أيام متفرقة: ${discreteDays.join(', ')} (إجمالي: ${discreteDays.length} يوم)`;
        } else if (scheduleType === 'HOURLY_WINDOW') {
          const dur = getHourlyDuration();
          fieldsRecord['schedule_hourly_date'] = hourlyDate;
          fieldsRecord['schedule_time_from'] = hourlyTimeFrom;
          fieldsRecord['schedule_time_to'] = hourlyTimeTo;
          fieldsRecord['schedule_total_hours'] = `${dur.hours}س و ${dur.minutes}د`;
          fieldsRecord['date_range'] = `إذن خروج: ${hourlyDate} من ${hourlyTimeFrom} إلى ${hourlyTimeTo} (المدة: ${dur.hours}س و ${dur.minutes}د)`;
        } else if (scheduleType === 'SINGLE_DATE') {
          fieldsRecord['schedule_single_date'] = singleDate;
          fieldsRecord['date_range'] = `تاريخ محدد: ${singleDate}`;
        }
      }
      if (route.formConfig.showDelegateUser && routeDelegateUserName.trim()) {
        fieldsRecord['delegate_user'] = routeDelegateUserName.trim();
      }

      if (routeDepartment) {
        const deptNode = orgDepartments.find(d => d.id === routeDepartment || d.name === routeDepartment);
        fieldsRecord['requester_department'] = deptNode?.name || routeDepartment;
      }
      if (routeDivision) {
        const divNode = availableDivisions.find(div => div.id === routeDivision || div.name === routeDivision);
        fieldsRecord['requester_division'] = divNode?.name || routeDivision;
      }
      if (routeTeam) {
        const teamNode = availableTeams.find(t => t.id === routeTeam || t.name === routeTeam);
        fieldsRecord['requester_team'] = teamNode?.name || routeTeam;
      }

      await AdminAPI.submitTicketRequest({
        routeId: route.id,
        title: routeTitle.trim(),
        description: routeDescription.trim() || routeTitle.trim(),
        taxonomyMain: routeSelectedTaxMain || undefined,
        taxonomySub: routeSelectedTaxSub || undefined,
        buildingId: routeBuilding || undefined,
        departmentId: routeDepartment || undefined,
        fields: fieldsRecord,
      });

      window.dispatchEvent(new Event('litc_settings_updated'));
      setStep('success');
    } catch (e: any) {
      console.error(e);
      alert(`حدث خطأ أثناء إرسال الطلب: ${e?.message || 'خطأ في الاتصال بالخادم'}`);
    }
  };

  const activeRoutes = savedRoutes.filter(r => r.isActive);
  const visibleRoutes = allowedRouteIds.length > 0
    ? activeRoutes.filter(r => allowedRouteIds.includes(r.id))
    : activeRoutes;

  const filteredRoutes = visibleRoutes;

  const containerStyle: React.CSSProperties = {
    overflow: 'hidden',
    position: 'relative',
    minHeight: '500px',
    display: 'flex',
    flexDirection: 'column'
  };

  const route = savedRoutes.find(r => r.id === selectedRouteId);
  const taxEntry = route?.formConfig.taxonomy?.find(t => t.id === routeSelectedTaxMain && t.isActive);

  useEffect(() => {
    if (route) {
      const mode = route.formConfig.scheduleMode;
      if (mode && mode !== 'ANY') {
        setScheduleType(mode as any);
      } else {
        setScheduleType('DATE_RANGE');
      }
    }
  }, [selectedRouteId, route?.formConfig?.scheduleMode]);

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        
        {/* STEP 1: GREETING & EXPLORATION */}
        {step === 'greeting' && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ padding: '50px 40px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, position: 'relative', overflow: 'hidden' }}
          >
            {/* Ambient glow blobs */}
            <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(109,40,217,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '20px', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            {/* Enterprise Interactive Centerpiece - CTA opens routes or selects only route */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '16px 0 24px',
                zIndex: 1
              }}
            >
              <div 
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(99,102,241,0.15) 100%)',
                  border: '1.5px solid rgba(99,102,241,0.25)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 12px 28px rgba(37,99,235,0.12)'
                }}
              >
                <Plus size={44} style={{ color: '#2563eb' }} />
              </div>
              <button
                onClick={() => {
                  if (filteredRoutes.length === 1) {
                    setSelectedRouteId(filteredRoutes[0].id);
                    setStep('details');
                  } else {
                    setStep('select_route');
                  }
                }}
                style={{
                  padding: '12px 32px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <span>إنشاء طلب جديد</span>
                <ChevronLeft size={18} />
              </button>
            </motion.div>

            {/* Status chip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(109,40,217,0.08)', border: '1px solid rgba(109,40,217,0.2)', borderRadius: '50px', marginBottom: '16px' }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block', boxShadow: '0 0 6px #7c3aed' }} />
              <span style={{ fontSize: '12px', color: '#6d28d9', fontWeight: 600 }}>المساعد الذكي جاهز لمساعدتك</span>
            </motion.div>

            <h2 style={{ fontSize: '26px', color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.5px', fontWeight: 800 }}>
              مرحباً، كيف يمكنني مساعدتك اليوم؟
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '380px', margin: '0 0 32px 0', lineHeight: 1.6 }}>
              انقر على إنشاء طلب للبدء في توجيه طلبك للقسم المختص فوراً.
            </p>
          </motion.div>
        )}

        {/* STEP 1.5: SELECT ROUTE */}
        {step === 'select_route' && (
          <motion.div
            key="select_route"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, padding: '24px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <button 
                onClick={() => setStep('greeting')}
                style={{ background: '#fff', border: '1px solid #e2e8f0', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.2px' }}>اختر نوع الطلب</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>حدد المسار المناسب لطلبك من الخيارات أدناه</span>
              </div>
            </div>

            {/* Dynamic Routes as Premium Cards */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', overflowY: 'auto', padding: '10px 0' }}>
              {filteredRoutes.map((r, idx) => {
                const lockStatus = hasActiveTicketInRoute ? hasActiveTicketInRoute(r.id) : false;
                  const isLocked = !!lockStatus;
                  const lockMessage = typeof lockStatus === 'string' ? lockStatus : 'لديكم طلب مفتوح';
                
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={!isLocked ? { scale: 1.03, y: -4, boxShadow: `0 16px 30px ${r.color}20` } : {}}
                    whileTap={!isLocked ? { scale: 0.97 } : {}}
                    onClick={() => {
                      if(isLocked) return;
                      setSelectedRouteId(r.id);
                      setStep('details');
                    }}
                    style={{
                      background: isLocked ? 'rgba(248,250,252,0.8)' : 'rgba(255,255,255,0.9)',
                      border: `1px solid ${isLocked ? 'rgba(0,0,0,0.05)' : r.color + '20'}`,
                      borderRadius: '20px',
                      padding: '24px 16px',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      backdropFilter: 'blur(8px)',
                      boxShadow: isLocked ? 'none' : `0 6px 20px ${r.color}10, 0 1px 3px rgba(0,0,0,0.04)`,
                      opacity: isLocked ? 0.6 : 1,
                    }}
                  >
                    {/* Icon ring */}
                    <div style={{ 
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: isLocked ? '#e2e8f0' : `conic-gradient(from 0deg, ${r.color}40, ${r.color}10, ${r.color}40)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '16px',
                      boxShadow: isLocked ? 'none' : `0 0 0 6px ${r.color}08, 0 4px 10px ${r.color}25`
                    }}>
                      <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: isLocked ? '#f1f5f9' : `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        {isLocked ? '🔒' : (r.icon || '📝')}
                      </div>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: isLocked ? '#94a3b8' : '#1e293b', textAlign: 'center', lineHeight: 1.3 }}>
                      {r.name}
                    </span>
                    {!isLocked && r.description && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'center', lineHeight: 1.3 }}>{r.description}</span>
                    )}
                    {isLocked && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', fontWeight: 600 }}>لديك طلب مفتوح</span>}

                  </motion.div>
                );
              })}
              {filteredRoutes.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '30px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', color: '#64748b', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  لا توجد مسارات متاحة حالياً.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: CONVERSATIONAL DETAILS FORM */}
        {step === 'details' && route && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{
              display: 'flex', flexDirection: 'column', height: '100%', flex: 1,
              background: 'transparent',
              borderRadius: '20px',
              overflow: 'hidden',
              
              
            }}
          >
            {/* Header */}
            <div style={{ padding: '14px 20px', background: `linear-gradient(135deg, ${route.color}15, rgba(0,0,0,0.02))`, backdropFilter: 'blur(16px)', borderBottom: `1px solid rgba(0,0,0,0.06)`, display: 'flex', alignItems: 'center', gap: '14px', zIndex: 10 }}>
              <button 
                onClick={() => setStep('greeting')}
                style={{ background: '#fff', border: '1px solid #e2e8f0', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.2px' }}>{route.name}</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>يتم توجيه الطلب إلى: {route.targetDepartmentName}</span>
              </div>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${route.color}22`, color: route.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: `1px solid ${route.color}35` }}>
                {route.icon}
              </div>
            </div>

            {/* Form Body - Step-by-Step UI */}
            <div style={{ padding: '20px 24px', overflow: 'hidden', flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
              
              {(() => {
                // Compute Journey Steps dynamically
                const journeySteps: any[] = [];
                
                if (route.formConfig.taxonomy && route.formConfig.taxonomy.length > 0) {
                  journeySteps.push({ id: 'taxonomy', type: 'taxonomy', label: 'التصنيف' });
                }
                
                const activeFieldIds = route.formConfig.routeDynamicFields 
                    ? route.formConfig.routeDynamicFields.map(rdf => rdf.fieldId) 
                    : (route.formConfig.customFieldIds || []);
                const rdfs = route.formConfig.routeDynamicFields || (route.formConfig.customFieldIds || []).map(id => ({ fieldId: id, isRequired: true }));

                let activeCustomFields = customFields.filter(f => activeFieldIds.includes(f.id));
                let addedNew = true;
                while (addedNew) {
                  addedNew = false;
                  const currentIds = activeCustomFields.map(f => f.id);
                  activeCustomFields.forEach(field => {
                    if (field.childBindings && field.childBindings.length > 0) {
                      const selectedVal = routeFieldValues[field.id];
                      if (selectedVal) {
                        field.childBindings.forEach(binding => {
                          const triggers = binding.triggerValue.split(',').map(t => t.trim());
                          if (triggers.includes(selectedVal)) {
                            const childField = customFields.find(f => f.id === binding.childFieldId);
                            if (childField && !currentIds.includes(childField.id)) {
                              activeCustomFields.push(childField);
                              currentIds.push(childField.id);
                              addedNew = true;
                            }
                          }
                        });
                      }
                    }
                  });
                }
                
                activeCustomFields.forEach(cf => {
                  const isReq = rdfs.find(r => r.fieldId === cf.id)?.isRequired;
                  journeySteps.push({ id: cf.id, type: 'custom', field: cf, isReq, label: cf.name });
                });

                journeySteps.push({ id: 'title', type: 'title', label: 'عنوان الطلب' });

                if (route.formConfig.showScheduleEngine || route.formConfig.showDateRange) {
                  journeySteps.push({
                    id: 'scheduleEngine',
                    type: 'scheduleEngine',
                    label: route.formConfig.scheduleLabel || route.formConfig.dateRangeLabel || 'الجدولة الزمنية',
                    isReq: !!(route.formConfig.mandatorySchedule || route.formConfig.mandatoryDateRange),
                    mode: route.formConfig.scheduleMode || 'ANY'
                  });
                }

                if (route.formConfig.showDelegateUser) {
                  journeySteps.push({
                    id: 'delegateUser',
                    type: 'delegateUser',
                    label: route.formConfig.delegateUserLabel || 'الموظف البديل',
                    isReq: !!route.formConfig.mandatoryDelegateUser
                  });
                }

                if (route.formConfig.showDescription !== false) {
                  journeySteps.push({ id: 'description', type: 'description', label: 'التفاصيل', isReq: route.formConfig.mandatoryDescription !== false });
                }

                if (route.formConfig.showBuildingField || route.formConfig.showDepartmentField) {
                  journeySteps.push({ id: 'location', type: 'location', label: 'الموقع والإدارة' });
                }

                if (route.formConfig.showAttachments !== false) {
                  journeySteps.push({ id: 'attachments', type: 'attachments', label: 'المرفقات', isReq: route.formConfig.mandatoryAttachments === true });
                }

                journeySteps.push({ id: 'review', type: 'review', label: 'مراجعة وإرسال' });

                const currentStep = journeySteps[journeyStepIndex];
                if (!currentStep) return null;
                
                const validateCurrentStep = () => {
                  if (currentStep.type === 'taxonomy') {
                    if (!routeSelectedTaxMain) return false;
                  }
                  if (currentStep.type === 'custom') {
                    if (currentStep.isReq && !routeFieldValues[currentStep.id]) return false;
                  }
                  if (currentStep.type === 'title') {
                    if (!routeTitle.trim()) return false;
                  }
                  if (currentStep.type === 'scheduleEngine') {
                    if (currentStep.isReq) {
                      if (scheduleType === 'DATE_RANGE') {
                        if (!scheduleStartDate || !scheduleEndDate) return false;
                        if (new Date(scheduleEndDate) < new Date(scheduleStartDate)) return false;
                      } else if (scheduleType === 'DISCRETE_DAYS') {
                        if (discreteDays.length === 0) return false;
                      } else if (scheduleType === 'HOURLY_WINDOW') {
                        if (!hourlyDate || !hourlyTimeFrom || !hourlyTimeTo) return false;
                        const [h1, m1] = hourlyTimeFrom.split(':').map(Number);
                        const [h2, m2] = hourlyTimeTo.split(':').map(Number);
                        if (h2 * 60 + m2 <= h1 * 60 + m1) return false;
                      } else if (scheduleType === 'SINGLE_DATE') {
                        if (!singleDate) return false;
                      }
                    }
                  }
                  if (currentStep.type === 'delegateUser') {
                    if (currentStep.isReq && !routeDelegateUserName.trim()) return false;
                  }
                  if (currentStep.type === 'description') {
                    if (currentStep.isReq && !routeDescription.trim()) return false;
                  }
                  if (currentStep.type === 'location') {
                    if (route.formConfig.showBuildingField && route.formConfig.mandatoryBuilding && !routeBuilding) return false;
                    if (route.formConfig.showDepartmentField) {
                      if (route.formConfig.mandatoryDepartment && !routeDepartment) return false;
                      const level = route.formConfig.departmentSelectionLevel || 'DEPT_ONLY';
                      if ((level === 'DEPT_AND_DIV' || level === 'FULL_HIERARCHY') && route.formConfig.mandatoryDivision && availableDivisions.length > 0 && !routeDivision) {
                        return false;
                      }
                      if (level === 'FULL_HIERARCHY' && route.formConfig.mandatoryTeam && availableTeams.length > 0 && !routeTeam) {
                        return false;
                      }
                    }
                  }
                  if (currentStep.type === 'attachments') {
                    if (currentStep.isReq && selectedFiles.length === 0) return false;
                  }
                  return true;
                };

                const canProceed = validateCurrentStep();

                return (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Stepper Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      {journeySteps.map((js, idx) => {
                        const isLast = idx === journeySteps.length - 1;
                        const isPast = idx < journeyStepIndex;
                        const isCurrent = idx === journeyStepIndex;
                        // You can jump to any step you've reached before, provided the current step is valid (if jumping forward)
                        const canJump = idx <= maxStepReached && (idx < journeyStepIndex || validateCurrentStep());
                        
                        return (
                          <div key={js.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <div 
                               onClick={() => {
                                 if (canJump) {
                                   setJourneyStepIndex(idx);
                                 }
                               }}
                               style={{ 
                                 cursor: canJump ? 'pointer' : 'default',
                                 padding: isLast ? '6px 12px' : '0',
                                 width: isLast ? 'auto' : '26px', 
                                 height: isLast ? 'auto' : '26px', 
                                 borderRadius: isLast ? '14px' : '50%', 
                                 background: isPast ? route.color : isCurrent ? '#fff' : '#f8fafc',
                                 border: `2px solid ${isPast || isCurrent ? route.color : '#e2e8f0'}`,
                                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                 color: isPast ? '#fff' : isCurrent ? route.color : '#94a3b8',
                                 fontSize: '12px', fontWeight: 700,
                                 transition: 'all 0.2s',
                                 boxShadow: (isCurrent || (canJump && !isCurrent)) ? `0 2px 10px ${route.color}20` : 'none',
                                 opacity: (!isCurrent && !canJump) ? 0.6 : 1
                               }}
                               onMouseEnter={e => { if(canJump) e.currentTarget.style.transform = 'scale(1.05)' }}
                               onMouseLeave={e => { if(canJump) e.currentTarget.style.transform = 'scale(1)' }}
                             >
                               {isPast ? <CheckCircle size={isLast ? 14 : 14} /> : (isLast ? <CheckCircle size={14} /> : (idx + 1))}
                               {isLast && <span>مراجعة وإرسال</span>}
                             </div>
                             {!isLast && <div style={{ width: '16px', height: '2px', background: isPast ? route.color : '#e2e8f0' }} />}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStep.id}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 50 }}
                          transition={{ duration: 0.3 }}
                          style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingRight: '10px' }}
                        >
                          <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${route.color}20`, padding: '24px', boxShadow: `0 4px 20px ${route.color}15` }}>
                            
                            {currentStep.type === 'taxonomy' && (
                              <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a' }}>اختر تصنيف المشكلة</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                  {route.formConfig.taxonomy.filter(t => t.isActive).map(t => {
                                    const isSelected = routeSelectedTaxMain === t.id;
                                    return (
                                      <button key={t.id} onClick={() => { setRouteSelectedTaxMain(t.id); setRouteSelectedTaxSub(''); }} style={{ padding: '10px 16px', borderRadius: '12px', background: isSelected ? route.color : '#f8fafc', color: isSelected ? '#fff' : '#334155', border: `1px solid ${isSelected ? route.color : '#e2e8f0'}`, cursor: 'pointer', fontWeight: 600 }}>{t.label}</button>
                                    );
                                  })}
                                </div>
                                
                                {taxEntry && taxEntry.subIssues && taxEntry.subIssues.length > 0 && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569' }}>التصنيف الفرعي</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                      {taxEntry.subIssues.filter(s => s.isActive).map(s => {
                                        const isSelected = routeSelectedTaxSub === s.id;
                                        return (
                                          <button key={s.id} onClick={() => setRouteSelectedTaxSub(s.id)} style={{ padding: '8px 14px', borderRadius: '10px', background: isSelected ? route.color : '#f8fafc', color: isSelected ? '#fff' : '#334155', border: `1px solid ${isSelected ? route.color : '#e2e8f0'}`, cursor: 'pointer', fontSize: '13px' }}>{s.label}</button>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            )}

                            {currentStep.type === 'custom' && (
                              <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a' }}>{currentStep.field.name} {currentStep.isReq && <span style={{ color: '#ef4444' }}>*</span>}</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {(() => {
                                    const opts = currentStep.field.dependsOn && currentStep.field.dependencyMap && routeFieldValues[currentStep.field.dependsOn]
                                      ? currentStep.field.dependencyMap[routeFieldValues[currentStep.field.dependsOn]] || currentStep.field.options
                                      : currentStep.field.options;
                                    
                                    return opts.map((opt: any) => {
                                      const optValue = typeof opt === 'string' ? opt : opt.id;
                                      const optLabel = typeof opt === 'string' ? opt : opt.label;
                                      if (typeof opt !== 'string' && !opt.isActive) return null;
                                      const isSelected = routeFieldValues[currentStep.id] === optValue;
                                      return (
                                        <button key={optValue} onClick={() => setRouteFieldValues({ ...routeFieldValues, [currentStep.id]: optValue })} style={{ padding: '10px 16px', borderRadius: '12px', background: isSelected ? route.color : '#f8fafc', color: isSelected ? '#fff' : '#334155', border: `1px solid ${isSelected ? route.color : '#e2e8f0'}`, cursor: 'pointer', fontWeight: 600 }}>{optLabel}</button>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            )}

                            {currentStep.type === 'title' && (
                              <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a' }}>عنوان الطلب <span style={{ color: '#ef4444' }}>*</span></h4>
                                <input type="text" value={routeTitle} onChange={e => setRouteTitle(e.target.value)} placeholder="اكتب ملخصاً قصيراً لمشكلتك أو طلبك..." style={{ ...inputStyle, width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }} />
                              </div>
                            )}

                            {currentStep.type === 'scheduleEngine' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                    🗓️ {currentStep.label} {currentStep.isReq && <span style={{ color: '#ef4444' }}>*</span>}
                                  </h4>
                                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                    حدد النمط الزمني المناسب لطلبك مع حساب تلقائي ودقيق للأيام والساعات.
                                  </p>
                                </div>

                                {/* Mode Selector Tabs (when mode is ANY or not restricted) */}
                                {(!currentStep.mode || currentStep.mode === 'ANY') && (
                                  <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
                                    {[
                                      { id: 'DATE_RANGE', label: '📆 فترة متصلة (أيام)', icon: '📆' },
                                      { id: 'DISCRETE_DAYS', label: '🗓️ أيام متفرقة', icon: '🗓️' },
                                      { id: 'HOURLY_WINDOW', label: '⏱️ إذن خروج (ساعات)', icon: '⏱️' },
                                      { id: 'SINGLE_DATE', label: '📅 تاريخ محدد', icon: '📅' },
                                    ].map(tab => (
                                      <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setScheduleType(tab.id as any)}
                                        style={{
                                          flex: 1,
                                          minWidth: '120px',
                                          padding: '8px 12px',
                                          borderRadius: '8px',
                                          border: 'none',
                                          background: scheduleType === tab.id ? '#ffffff' : 'transparent',
                                          color: scheduleType === tab.id ? route.color : '#64748b',
                                          fontWeight: scheduleType === tab.id ? 700 : 500,
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          boxShadow: scheduleType === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}
                                      >
                                        {tab.label}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Sub-View 1: Continuous Date Range with Live Counter */}
                                {(scheduleType === 'DATE_RANGE' || currentStep.mode === 'DATE_RANGE') && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                      <div>
                                        <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>من تاريخ (بداية الفترة)</label>
                                        <input
                                          type="date"
                                          value={scheduleStartDate}
                                          onChange={e => setScheduleStartDate(e.target.value)}
                                          style={{ ...inputStyle, width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>إلى تاريخ (نهاية الفترة)</label>
                                        <input
                                          type="date"
                                          value={scheduleEndDate}
                                          onChange={e => setScheduleEndDate(e.target.value)}
                                          style={{ ...inputStyle, width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                        />
                                      </div>
                                    </div>

                                    {/* Live calculation badge */}
                                    {(() => {
                                      const days = getContinuousDaysCount();
                                      if (days > 0) {
                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#15803d', fontSize: '13px', fontWeight: 700 }}>
                                            <span style={{ fontSize: '16px' }}>🟢</span>
                                            <span>إجمالي المدة المحسوبة: {days} {days === 1 ? 'يوم' : days === 2 ? 'يومان' : days <= 10 ? 'أيام' : 'يوماً'}</span>
                                          </div>
                                        );
                                      }
                                      if (days === -1) {
                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>
                                            <span>⚠️</span>
                                            <span>تنبيه: تاريخ النهاية يسبق تاريخ البداية. يرجى تصحيح النطاق الزمني.</span>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                          💡 اختر تاريخ البداية والنهاية لحساب إجمالي عدد أيام الطلب تلقائياً.
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Sub-View 2: Discrete Days Selection with Chips and Total Counter */}
                                {(scheduleType === 'DISCRETE_DAYS' || currentStep.mode === 'DISCRETE_DAYS') && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>إضافة يوم محدد إلى قائمة الأيام المتفرقة</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <input
                                        type="date"
                                        value={discreteDayInput}
                                        onChange={e => setDiscreteDayInput(e.target.value)}
                                        style={{ ...inputStyle, flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (discreteDayInput && !discreteDays.includes(discreteDayInput)) {
                                            setDiscreteDays([...discreteDays, discreteDayInput].sort());
                                            setDiscreteDayInput('');
                                          }
                                        }}
                                        disabled={!discreteDayInput || discreteDays.includes(discreteDayInput)}
                                        style={{
                                          padding: '10px 18px',
                                          borderRadius: '10px',
                                          background: (!discreteDayInput || discreteDays.includes(discreteDayInput)) ? '#cbd5e1' : route.color,
                                          color: '#ffffff',
                                          fontWeight: 700,
                                          fontSize: '12px',
                                          border: 'none',
                                          cursor: (!discreteDayInput || discreteDays.includes(discreteDayInput)) ? 'not-allowed' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px'
                                        }}
                                      >
                                        <Plus size={14} />
                                        <span>إضافة يوم</span>
                                      </button>
                                    </div>

                                    {/* Chips for discrete days */}
                                    {discreteDays.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                          {discreteDays.map(d => (
                                            <div
                                              key={d}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                background: '#ffffff',
                                                border: `1.5px solid ${route.color}50`,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#1e293b'
                                              }}
                                            >
                                              <span>🗓️ {d}</span>
                                              <button
                                                type="button"
                                                onClick={() => setDiscreteDays(discreteDays.filter(x => x !== d))}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                                              >
                                                <X size={13} />
                                              </button>
                                            </div>
                                          ))}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#15803d', fontSize: '13px', fontWeight: 700 }}>
                                          <span style={{ fontSize: '16px' }}>🟢</span>
                                          <span>إجمالي الأيام المحددة: {discreteDays.length} {discreteDays.length === 1 ? 'يوم' : discreteDays.length === 2 ? 'يومان' : discreteDays.length <= 10 ? 'أيام' : 'يوماً متفرقاً'}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                        لم يتم إضافة أي أيام بعد. اختر التاريخ واضغط "إضافة يوم".
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Sub-View 3: Hourly Permission Window (إذن خروج) */}
                                {(scheduleType === 'HOURLY_WINDOW' || currentStep.mode === 'HOURLY_WINDOW') && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                      <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>تاريخ يوم الإذن</label>
                                      <input
                                        type="date"
                                        value={hourlyDate}
                                        onChange={e => setHourlyDate(e.target.value)}
                                        style={{ ...inputStyle, width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                      />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                      <div>
                                        <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>من الساعة (وقت الخروج)</label>
                                        <input
                                          type="time"
                                          value={hourlyTimeFrom}
                                          onChange={e => setHourlyTimeFrom(e.target.value)}
                                          style={{ ...inputStyle, width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>إلى الساعة (وقت العودة)</label>
                                        <input
                                          type="time"
                                          value={hourlyTimeTo}
                                          onChange={e => setHourlyTimeTo(e.target.value)}
                                          style={{ ...inputStyle, width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                        />
                                      </div>
                                    </div>

                                    {/* Live calculation for duration */}
                                    {(() => {
                                      const dur = getHourlyDuration();
                                      if (hourlyTimeFrom && hourlyTimeTo) {
                                        if (dur.isValid && (dur.hours > 0 || dur.minutes > 0)) {
                                          return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)', color: '#1d4ed8', fontSize: '13px', fontWeight: 700 }}>
                                              <span style={{ fontSize: '16px' }}>⏱️</span>
                                              <span>إجمالي مدة الاستئذان: {dur.hours} ساعة و {dur.minutes} دقيقة</span>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>
                                            <span>⚠️</span>
                                            <span>وقت العودة يجب أن يكون بعد وقت الخروج.</span>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                          💡 حدد وقت الخروج والعودة لحساب مدة الإذن بالساعات والدقائق تلقائياً.
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Sub-View 4: Single Specific Date */}
                                {(scheduleType === 'SINGLE_DATE' || currentStep.mode === 'SINGLE_DATE') && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>التاريخ المحدد للطلب</label>
                                    <input
                                      type="date"
                                      value={singleDate}
                                      onChange={e => setSingleDate(e.target.value)}
                                      style={{ ...inputStyle, width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {currentStep.type === 'delegateUser' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                    👤 {currentStep.label} {currentStep.isReq && <span style={{ color: '#ef4444' }}>*</span>}
                                  </h4>
                                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                    حدد الزميل البديل الذي سيتولى متابعة الأعمال أو تسليم المهام أثناء فترة طلبك.
                                  </p>
                                </div>
                                <input
                                  type="text"
                                  value={routeDelegateUserName}
                                  onChange={e => setRouteDelegateUserName(e.target.value)}
                                  placeholder="اكتب اسم الموظف البديل أو المستلم للمهام..."
                                  style={{ ...inputStyle, width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: '#f8fafc' }}
                                />
                              </div>
                            )}

                            {currentStep.type === 'description' && (
                              <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a' }}>تفاصيل الطلب {currentStep.isReq && <span style={{ color: '#ef4444' }}>*</span>}</h4>
                                <textarea value={routeDescription} onChange={e => setRouteDescription(e.target.value)} placeholder="يرجى كتابة كافة التفاصيل التي تساعدنا في معالجة طلبك بدقة..." style={{ ...inputStyle, width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc', minHeight: '120px', resize: 'vertical' }} />
                              </div>
                            )}

                            {currentStep.type === 'location' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {route.formConfig.showBuildingField && (
                                  <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a' }}>🏢 الموقع {route.formConfig.mandatoryBuilding && <span style={{ color: '#ef4444' }}>*</span>}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                      {(spatialBuildings || []).map(b => (
                                        <button key={b.id} onClick={() => setRouteBuilding(b.id)} style={{ padding: '8px 14px', borderRadius: '10px', background: routeBuilding === b.id ? route.color : '#f8fafc', color: routeBuilding === b.id ? '#fff' : '#334155', border: `1px solid ${routeBuilding === b.id ? route.color : '#e2e8f0'}`, cursor: 'pointer', fontSize: '13px' }}>{b.name}</button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {route.formConfig.showDepartmentField && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    {/* Level 1: Department / High Administration / Office */}
                                    <div>
                                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a' }}>
                                        🏛️ الإدارة أو المكتب {route.formConfig.mandatoryDepartment && <span style={{ color: '#ef4444' }}>*</span>}
                                      </h4>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(orgDepartments || []).map(d => {
                                          const isSelected = routeDepartment === d.id || routeDepartment === d.name;
                                          return (
                                            <button
                                              key={d.id}
                                              onClick={() => {
                                                setRouteDepartment(d.id);
                                                setRouteDivision('');
                                                setRouteTeam('');
                                              }}
                                              style={{
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                background: isSelected ? route.color : '#f8fafc',
                                                color: isSelected ? '#fff' : '#334155',
                                                border: `1.5px solid ${isSelected ? route.color : '#e2e8f0'}`,
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: isSelected ? 700 : 500,
                                                boxShadow: isSelected ? `0 2px 8px ${route.color}30` : 'none',
                                                transition: 'all 0.15s ease'
                                              }}
                                            >
                                              {d.name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Level 2: Division under Department */}
                                    {(route.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' || route.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY') && routeDepartment && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ padding: '16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.15)' }}
                                      >
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span>📂 القسم التابع له</span>
                                          {route.formConfig.mandatoryDivision && <span style={{ color: '#ef4444' }}>*</span>}
                                        </h4>
                                        {availableDivisions.length === 0 ? (
                                          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>لا توجد أقسام مسجلة تحت هذه الإدارة حالياً.</div>
                                        ) : (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {availableDivisions.map(div => {
                                              const isSelected = routeDivision === div.id || routeDivision === div.name;
                                              return (
                                                <button
                                                  key={div.id}
                                                  onClick={() => {
                                                    setRouteDivision(div.id);
                                                    setRouteTeam('');
                                                  }}
                                                  style={{
                                                    padding: '7px 12px',
                                                    borderRadius: '8px',
                                                    background: isSelected ? '#2563eb' : '#ffffff',
                                                    color: isSelected ? '#fff' : '#1e293b',
                                                    border: `1.5px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                                                    transition: 'all 0.15s ease'
                                                  }}
                                                >
                                                  {div.name}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}

                                    {/* Level 3: Team / Unit under Division */}
                                    {route.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' && routeDivision && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ padding: '16px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.04)', border: '1px solid rgba(124, 58, 237, 0.15)' }}
                                      >
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span>👥 الوحدة أو الفريق</span>
                                          {route.formConfig.mandatoryTeam && <span style={{ color: '#ef4444' }}>*</span>}
                                        </h4>
                                        {availableTeams.length === 0 ? (
                                          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>لا توجد وحدات أو فرق مسجلة تحت هذا القسم حالياً.</div>
                                        ) : (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {availableTeams.map(t => {
                                              const isSelected = routeTeam === t.id || routeTeam === t.name;
                                              return (
                                                <button
                                                  key={t.id}
                                                  onClick={() => setRouteTeam(t.id)}
                                                  style={{
                                                    padding: '7px 12px',
                                                    borderRadius: '8px',
                                                    background: isSelected ? '#7c3aed' : '#ffffff',
                                                    color: isSelected ? '#fff' : '#1e293b',
                                                    border: `1.5px solid ${isSelected ? '#7c3aed' : '#cbd5e1'}`,
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: isSelected ? 700 : 500,
                                                    boxShadow: isSelected ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
                                                    transition: 'all 0.15s ease'
                                                  }}
                                                >
                                                  {t.name}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {currentStep.type === 'attachments' && (
                              <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#0f172a' }}>المرفقات {currentStep.isReq && <span style={{ color: '#ef4444' }}>*</span>}</h4>
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', border: '2px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc', cursor: 'pointer' }}>
                                  <UploadCloud size={30} color={route.color} style={{ marginBottom: '10px' }} />
                                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>اسحب الملفات أو انقر للرفع</span>
                                  <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{route.formConfig.maxAttachmentMB || 5}MB</span>
                                  <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                                </label>
                                {fileError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px' }}>{fileError}</div>}
                                {selectedFiles.map((file, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#ecfdf5', borderRadius: '8px', marginTop: '10px', border: '1px solid #a7f3d0' }}>
                                    <span>{file.name}</span>
                                    <button onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {currentStep.type === 'review' && (
                              <div>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <CheckCircle color={route.color} /> مراجعة نهائية قبل الإرسال
                                </h4>
                                
                                <div style={{ display: 'grid', gap: '12px' }}>
                                  
                                  {/* Route / Taxonomy summary */}
                                  <div 
                                    onClick={() => {
                                      const idx = journeySteps.findIndex(s => s.type === 'taxonomy');
                                      if(idx !== -1) setJourneyStepIndex(idx);
                                    }}
                                    style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = route.color; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                  >
                                    <div style={{ position: 'absolute', left: '16px', top: '16px', color: route.color }}><Edit3 size={16} /></div>
                                    <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>المسار والتصنيف</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px', display: 'block' }}>
                                      {route.name}
                                      {routeSelectedTaxMain ? ` - ${route.formConfig.taxonomy?.find(t => t.id === routeSelectedTaxMain)?.label || ''}` : ''}
                                      {routeSelectedTaxSub ? ` / ${route.formConfig.taxonomy?.find(t => t.id === routeSelectedTaxMain)?.subIssues?.find(s => s.id === routeSelectedTaxSub)?.label}` : ''}
                                    </span>
                                  </div>

                                  {/* Title summary */}
                                  <div 
                                    onClick={() => setJourneyStepIndex(journeySteps.findIndex(s => s.type === 'title'))}
                                    style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = route.color; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                  >
                                    <div style={{ position: 'absolute', left: '16px', top: '16px', color: route.color }}><Edit3 size={16} /></div>
                                    <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>عنوان الطلب</span>
                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{routeTitle}</span>
                                  </div>

                                  {/* Smart Scheduling Engine summary */}
                                  {(route.formConfig.showScheduleEngine || route.formConfig.showDateRange) && (
                                    <div 
                                      onClick={() => {
                                        const idx = journeySteps.findIndex(s => s.type === 'scheduleEngine');
                                        if (idx !== -1) setJourneyStepIndex(idx);
                                      }}
                                      style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = route.color; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      <div style={{ position: 'absolute', left: '16px', top: '16px', color: route.color }}><Edit3 size={16} /></div>
                                      <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
                                        🗓️ {route.formConfig.scheduleLabel || route.formConfig.dateRangeLabel || 'الجدولة الزمنية'}
                                      </span>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {scheduleType === 'DATE_RANGE' && (
                                          <>
                                            <span>من {scheduleStartDate || '--'} إلى {scheduleEndDate || '--'}</span>
                                            {getContinuousDaysCount() > 0 && (
                                              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                                                🟢 {getContinuousDaysCount()} يوم
                                              </span>
                                            )}
                                          </>
                                        )}
                                        {scheduleType === 'DISCRETE_DAYS' && (
                                          <>
                                            <span>{discreteDays.join('، ') || 'لم يتم اختيار أيام'}</span>
                                            {discreteDays.length > 0 && (
                                              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                                                🟢 {discreteDays.length} يوم متفرق
                                              </span>
                                            )}
                                          </>
                                        )}
                                        {scheduleType === 'HOURLY_WINDOW' && (
                                          <>
                                            <span>{hourlyDate || '--'} | من {hourlyTimeFrom || '--'} إلى {hourlyTimeTo || '--'}</span>
                                            {getHourlyDuration().isValid && (getHourlyDuration().hours > 0 || getHourlyDuration().minutes > 0) && (
                                              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#1d4ed8', fontSize: '11px', fontWeight: 700 }}>
                                                ⏱️ {getHourlyDuration().hours}س و {getHourlyDuration().minutes}د
                                              </span>
                                            )}
                                          </>
                                        )}
                                        {scheduleType === 'SINGLE_DATE' && (
                                          <span>{singleDate || '--'}</span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Delegate User summary */}
                                  {route.formConfig.showDelegateUser && routeDelegateUserName && (
                                    <div 
                                      onClick={() => {
                                        const idx = journeySteps.findIndex(s => s.type === 'delegateUser');
                                        if (idx !== -1) setJourneyStepIndex(idx);
                                      }}
                                      style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = route.color; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      <div style={{ position: 'absolute', left: '16px', top: '16px', color: route.color }}><Edit3 size={16} /></div>
                                      <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
                                        👤 {route.formConfig.delegateUserLabel || 'الموظف البديل'}
                                      </span>
                                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{routeDelegateUserName}</span>
                                    </div>
                                  )}

                                  {/* Description summary */}
                                  {routeDescription && (
                                    <div 
                                      onClick={() => setJourneyStepIndex(journeySteps.findIndex(s => s.type === 'description'))}
                                      style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = route.color; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      <div style={{ position: 'absolute', left: '16px', top: '16px', color: route.color }}><Edit3 size={16} /></div>
                                      <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>تفاصيل الطلب</span>
                                      <span style={{ color: '#334155', fontSize: '13px', whiteSpace: 'pre-wrap', display: 'block', lineHeight: 1.6 }}>{routeDescription}</span>
                                    </div>
                                  )}

                                  {/* Location & Organization summary */}
                                  {(routeBuilding || routeDepartment) && (
                                    <div 
                                      onClick={() => {
                                        const idx = journeySteps.findIndex(s => s.type === 'location');
                                        if(idx !== -1) setJourneyStepIndex(idx);
                                      }}
                                      style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = route.color; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                      <div style={{ position: 'absolute', left: '16px', top: '16px', color: route.color }}><Edit3 size={16} /></div>
                                      <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>الموقع والتبعية الإدارية</span>
                                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {routeBuilding && (
                                          <span style={{ color: '#475569', fontSize: '13px' }}>
                                            🏢 {spatialBuildings?.find(b => b.id === routeBuilding)?.name || routeBuilding}
                                          </span>
                                        )}
                                        {routeDepartment && (
                                          <span style={{ color: '#1e293b' }}>
                                            🏛️ {orgDepartments?.find(d => d.id === routeDepartment || d.name === routeDepartment)?.name || routeDepartment}
                                            {routeDivision ? ` ➔ 📂 ${availableDivisions.find(div => div.id === routeDivision || div.name === routeDivision)?.name || routeDivision}` : ''}
                                            {routeTeam ? ` ➔ 👥 ${availableTeams.find(t => t.id === routeTeam || t.name === routeTeam)?.name || routeTeam}` : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Attachments Section (Interactive) */}
                                  <div style={{ marginTop: '8px', background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700 }}>المرفقات ({selectedFiles.length})</span>
                                          <label style={{ color: '#fff', background: route.color, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: `0 4px 10px ${route.color}30` }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                              <Plus size={14} /> إضافة مرفق
                                              <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                                          </label>
                                      </div>
                                      
                                      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', flexWrap: 'nowrap' }}>
                                          {selectedFiles.map((f, i) => {
                                              const isImg = f.type.startsWith('image/');
                                              const url = isImg ? URL.createObjectURL(f) : '';
                                              return (
                                                  <div key={i} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '10px', border: '1px solid #cbd5e1', overflow: 'hidden', flexShrink: 0, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                                      {isImg ? (
                                                          <div 
                                                            style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }} 
                                                            onClick={() => setPreviewImage(url)}
                                                            onMouseEnter={e => { const overlay = e.currentTarget.querySelector('.overlay'); if(overlay) (overlay as any).style.opacity = '1'; }}
                                                            onMouseLeave={e => { const overlay = e.currentTarget.querySelector('.overlay'); if(overlay) (overlay as any).style.opacity = '0'; }}
                                                          >
                                                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: 0, transition: 'opacity 0.2s' }}>
                                                              <Maximize2 size={20} />
                                                            </div>
                                                          </div>
                                                      ) : (
                                                          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '10px', textAlign: 'center', padding: '8px' }}>
                                                              <Paperclip size={24} style={{ marginBottom: '6px', color: route.color }} />
                                                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', whiteSpace: 'nowrap', fontWeight: 500 }}>{f.name}</span>
                                                          </div>
                                                      )}
                                                      <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                                          <X size={14} />
                                                      </button>
                                                  </div>
                                              );
                                          })}
                                          {selectedFiles.length === 0 && (
                                            <div style={{ width: '100%', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#fff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                              لا توجد مرفقات حالياً. يمكنك رفع ملفات أو صور إضافية من هنا.
                                            </div>
                                          )}
                                      </div>
                                  </div>

                                </div>
                              </div>
                            )}

                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    <div style={{ padding: '20px 0 0', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                      <button 
                        onClick={() => setJourneyStepIndex(prev => Math.max(0, prev - 1))}
                        style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: 600, cursor: journeyStepIndex > 0 ? 'pointer' : 'not-allowed', opacity: journeyStepIndex > 0 ? 1 : 0 }}
                      >السابق</button>

                      {currentStep.type === 'review' ? (
                        <button onClick={handleSubmit} style={{ padding: '12px 28px', background: `linear-gradient(135deg, ${route.color}, ${route.color}CC)`, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 15px ${route.color}40`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          إرسال الطلب <CheckCircle size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setJourneyStepIndex(prev => prev + 1)}
                          disabled={!canProceed}
                          style={{ padding: '12px 28px', background: canProceed ? route.color : '#e2e8f0', color: canProceed ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                        >
                          التالي <ChevronLeft size={16} />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })()}

            </div>
          </motion.div>
        )}

        {/* IMAGE PREVIEW MODAL */}
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            >
              <img src={previewImage} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
              <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                <X size={24} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3: SUCCESS */}

        {step === 'success' && route && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, justifyContent: 'center' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '24px', boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}
            >
              <CheckCircle size={40} strokeWidth={2.5} />
            </motion.div>
            
            <h2 style={{ fontSize: '28px', color: '#0f172a', margin: '0 0 12px 0' }}>تم استلام طلبك بنجاح!</h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '400px', margin: '0 0 40px 0', lineHeight: 1.6 }}>
              سيقوم فريق <strong>{route.targetDepartmentName}</strong> بمراجعة طلبك ({routeTitle}) في أقرب وقت ممكن.
            </p>

            <button 
              onClick={() => {
                setRouteTitle('');
                setRouteDescription('');
                setSelectedFiles([]);
                setRouteSelectedTaxMain('');
                setRouteSelectedTaxSub('');
                setSelectedRouteId(null);
                setStep('greeting');
              }}
              style={{ 
                padding: '14px 32px', borderRadius: '12px', background: '#ffffff', color: '#334155', border: '1px solid #e2e8f0', 
                fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              تقديم طلب آخر
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
