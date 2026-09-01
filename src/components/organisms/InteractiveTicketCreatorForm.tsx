import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, CheckCircle, Paperclip, UploadCloud, ChevronLeft, X, Edit3, Plus, Maximize2 } from 'lucide-react';
import { DynamicCustomField } from '../../pages/admin/tabs/DynamicFieldsTab';
import { loadRoutes, TicketRouteDefinition } from '../../pages/admin/tabs/TicketRoutingTab';
import { Robot3D } from './Robot3D';

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
  const [routeSelectedTaxMain, setRouteSelectedTaxMain] = useState<string>('');
  const [routeSelectedTaxSub, setRouteSelectedTaxSub] = useState<string>('');
  const [routeTitle, setRouteTitle] = useState<string>('');
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeFieldValues, setRouteFieldValues] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [orgDepartments, setOrgDepartments] = useState<any[]>([]);
  const [spatialBuildings, setSpatialBuildings] = useState<any[]>([]);

  useEffect(() => {
    const reloadData = () => {
      setSavedRoutes(loadRoutes());
      try {
        const s = localStorage.getItem('litc_org_tree');
        if (s) {
          const rootNode = JSON.parse(s);
          const flatten = (n: any): any[] => {
            let res = [n];
            if (n.children) n.children.forEach((c: any) => { res = res.concat(flatten(c)); });
            return res;
          };
          setOrgDepartments(flatten(rootNode).filter(n => n.type === 'إدارة' || n.type === 'مكتب'));
        }
      } catch {}

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
    const rules = routeDef?.formConfig || {};
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

  const handleSubmit = () => {
    // Basic validation mock
    if (!routeTitle.trim() || !routeDescription.trim() || !route) return;

    const newTicket = {
      id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
      routeId: route.id,
      routeName: route.name,
      routeIcon: route.icon,
      routeColor: route.color,
      title: routeTitle,
      description: routeDescription,
      status: 'NEW',
      currentHandler: route.targetDepartmentName,
      created_at: new Date().toISOString(),
      history: [
        { id: 'h1', type: 'SUBMITTED', title: 'تم تقديم الطلب بنجاح', status: 'COMPLETED', timestamp: new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }) },
        { id: 'h2', type: 'ROUTED', title: `توجيه إلى ${route.targetDepartmentName}`, status: 'ACTIVE', department: route.targetDepartmentName, timestamp: new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }) },
        { id: 'h3', type: 'ASSIGNED', title: 'إسناد للمهندس المختص', status: 'PENDING' },
        { id: 'h4', type: 'RESOLVED', title: 'إنجاز الطلب وحل المشكلة', status: 'PENDING' }
      ]
    };

    const existing = JSON.parse(localStorage.getItem('litc_user_active_tickets') || '[]');
    existing.push(newTicket);
    localStorage.setItem('litc_user_active_tickets', JSON.stringify(existing));

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('litc_settings_updated'));

    // Advance to success
    setStep('success');
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

            {/* 3D Robot Centerpiece - CTA opens routes or selects only route */}
            <Robot3D 
              onCtaClick={() => {
                if (filteredRoutes.length === 1) {
                  setSelectedRouteId(filteredRoutes[0].id);
                  setStep('details');
                } else {
                  setStep('select_route');
                }
              }}
              ctaLabel="إنشاء طلب"
            />

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
                  if (currentStep.type === 'description') {
                    if (currentStep.isReq && !routeDescription.trim()) return false;
                  }
                  if (currentStep.type === 'location') {
                    if (route.formConfig.showBuildingField && route.formConfig.mandatoryBuilding && !routeBuilding) return false;
                    if (route.formConfig.showDepartmentField && route.formConfig.mandatoryDepartment && !routeDepartment) return false;
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
                                  <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a' }}>🏛️ الإدارة {route.formConfig.mandatoryDepartment && <span style={{ color: '#ef4444' }}>*</span>}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                      {(orgDepartments || []).map(d => (
                                        <button key={d.id} onClick={() => setRouteDepartment(d.id)} style={{ padding: '8px 14px', borderRadius: '10px', background: routeDepartment === d.id ? route.color : '#f8fafc', color: routeDepartment === d.id ? '#fff' : '#334155', border: `1px solid ${routeDepartment === d.id ? route.color : '#e2e8f0'}`, cursor: 'pointer', fontSize: '13px' }}>{d.name}</button>
                                      ))}
                                    </div>
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

                                  {/* Location summary */}
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
                                      <span style={{ display: 'block', color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>الموقع والإدارة</span>
                                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px', display: 'block' }}>
                                        {routeBuilding ? (spatialBuildings?.find(b => b.id === routeBuilding)?.name || '') : ''}
                                        {routeBuilding && routeDepartment ? ' - ' : ''}
                                        {routeDepartment ? (orgDepartments?.find(d => d.id === routeDepartment)?.name || '') : ''}
                                      </span>
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
