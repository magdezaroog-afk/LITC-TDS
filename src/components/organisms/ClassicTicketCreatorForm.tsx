import React, { useState, useEffect } from 'react';
import { DynamicCustomField } from '../../pages/admin/tabs/DynamicFieldsTab';
import { loadRoutes, TicketRouteDefinition } from '../../pages/admin/tabs/TicketRoutingTab';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;

interface TicketCreatorFormProps {
  customFields: DynamicCustomField[];
  allowedRouteIds?: string[]; // Allowed Workflows
  concurrencyPolicy?: 'ALLOW_MULTIPLE' | 'PREVENT_CONCURRENT'; // Submission Concurrency Policy
  hasActiveTicketInRoute?: (routeId: string) => boolean;
  glassPanelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const ClassicTicketCreatorForm: React.FC<TicketCreatorFormProps> = ({
  customFields,
  allowedRouteIds = [],
  concurrencyPolicy = 'ALLOW_MULTIPLE',
  hasActiveTicketInRoute,
  glassPanelStyle = {},
  inputStyle = {}
}) => {
  const [savedRoutes, setSavedRoutes] = useState<TicketRouteDefinition[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeFieldValues, setRouteFieldValues] = useState<Record<string, string>>({});
  const [routeBuilding, setRouteBuilding] = useState<string>('');
  const [routeDepartment, setRouteDepartment] = useState<string>('');
  const [routeSelectedTaxMain, setRouteSelectedTaxMain] = useState<string>('');
  const [routeSelectedTaxSub, setRouteSelectedTaxSub] = useState<string>('');
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeSubmitSuccess, setRouteSubmitSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [orgDepartments, setOrgDepartments] = useState<any[]>([]);
  const [spatialBuildings, setSpatialBuildings] = useState<any[]>([]);

  useEffect(() => {
    setSavedRoutes(loadRoutes());
    
    // Load Org Tree and flatten for dropdown
    try {
      const s = localStorage.getItem('litc_org_tree');
      if (s) {
        const rootNode = JSON.parse(s);
        const flatten = (n: any): any[] => {
          let res = [n];
          if (n.children) n.children.forEach((c: any) => { res = res.concat(flatten(c)); });
          return res;
        };
        // Filter to only include Departments (إدارة) or Offices (مكتب)
        setOrgDepartments(flatten(rootNode).filter(n => n.type === 'إدارة' || n.type === 'مكتب'));
      }
    } catch {}

    // Load Buildings
    try {
      const b = localStorage.getItem('litc_buildings_tree');
      if (b) setSpatialBuildings(JSON.parse(b));
    } catch {}

  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const routeDef = savedRoutes.find(r => r.id === selectedRouteId);
    const rules = routeDef?.formConfig || {};
    
    // Completely dynamic configuration from workflow settings (no defaults like 5 or '*')
    const maxSizeMB = rules.maxAttachmentMB; 
    const allowedExts = rules.attachmentTypes || [];

    const validFiles = files.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      
      // Strict size check only if defined
      if (maxSizeMB !== undefined && fileSizeMB > maxSizeMB) {
        setFileError(`حجم الملف ${file.name} يتجاوز الحد المسموح (${maxSizeMB}MB)`);
        return false;
      }

      // Strict extension check only if defined
      if (allowedExts.length > 0 && !allowedExts.includes('*')) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const lowerAllowedExts = allowedExts.map((s: string) => s.trim().toLowerCase());
        
        if (!lowerAllowedExts.includes(fileExt)) {
          setFileError(`صيغة الملف ${file.name} غير مسموحة. المسموح: ${allowedExts.join(', ')}`);
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

  const activeRoutes = savedRoutes.filter(r => r.isActive);
  const visibleRoutes = allowedRouteIds.length > 0
    ? activeRoutes.filter(r => allowedRouteIds.includes(r.id))
    : activeRoutes;

  return (
    <aside style={{ ...glassPanelStyle, alignSelf: 'start', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 4px 30px rgba(0,0,0,0.03)' }}>
      {!selectedRouteId ? (
        visibleRoutes.length === 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📝</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>إنشاء بلاغ جديد</h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>أرسل بلاغك مباشرة</p>
              </div>
            </div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 700 }}>عنوان البلاغ</label>
            <input type="text" style={inputStyle} placeholder="وصف موجز للمشكلة..." />
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 700 }}>تفاصيل البلاغ</label>
            <textarea style={{ ...inputStyle, height: '100px', resize: 'none' }} placeholder="الرجاء وصف المشكلة بدقة..." />
            <button style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              إرسال البلاغ فوراً
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>🚀</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>إنشاء طلب جديد</h3>
              </div>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>اختر نوع الطلب لتوجيهه للإدارة المختصة</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleRoutes.map(route => {
                const isLocked = concurrencyPolicy === 'PREVENT_CONCURRENT' && hasActiveTicketInRoute && hasActiveTicketInRoute(route.id);
                
                return (
                  <div key={route.id}
                    onClick={() => { 
                      if(isLocked) return;
                      setSelectedRouteId(route.id); 
                      setRouteFieldValues({}); 
                      setRouteBuilding('');
                      setRouteDepartment('');
                      setRouteDescription(''); 
                      setRouteSelectedTaxMain(''); 
                      setRouteSelectedTaxSub(''); 
                      setRouteSubmitSuccess(false); 
                      setSelectedFiles([]); 
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px', border: `1.5px solid ${isLocked ? '#e2e8f0' : route.color + '30'}`, background: isLocked ? '#f8fafc' : `${route.color}08`, cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.6 : 1, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    onMouseEnter={e => { if(!isLocked) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${route.color}15`; e.currentTarget.style.borderColor = route.color + '60'; } }}
                    onMouseLeave={e => { if(!isLocked) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = route.color + '30'; } }}
                  >
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isLocked ? '#e2e8f0' : `linear-gradient(135deg, ${route.color}, ${route.color}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: isLocked ? 'none' : `0 4px 12px ${route.color}30` }}>
                      {isLocked ? '🔒' : route.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isLocked ? '#94a3b8' : '#1e293b' }}>{route.name}</div>
                      {route.description && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>{route.description}</div>}
                      <div style={{ fontSize: '10px', color: isLocked ? '#94a3b8' : route.color, marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isLocked ? '⛔ لديك طلب مفتوح' : <><span>←</span> {route.targetDepartmentName}</>}
                      </div>
                    </div>
                    <div style={{ color: isLocked ? '#cbd5e1' : route.color, fontSize: '20px', fontWeight: 300, transition: 'transform 0.2s' }}>‹</div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (() => {
        const route = savedRoutes.find(r => r.id === selectedRouteId)!;
        if (!route) return null;
        const taxEntry = route.formConfig.taxonomy?.find(t => t.id === routeSelectedTaxMain && t.isActive);

        if (routeSubmitSuccess) {
          return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}>✓</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>تم إرسال طلبك بنجاح!</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.5 }}>تم توجيه طلبك إلى <strong style={{ color: '#334155' }}>{route.targetDepartmentName}</strong></div>
              <button onClick={() => { setSelectedRouteId(null); setRouteSubmitSuccess(false); }}
                style={{ padding: '12px 28px', borderRadius: '12px', background: `linear-gradient(135deg, ${route.color}, ${route.color}CC)`, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${route.color}30`, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                ← إرسال طلب آخر
              </button>
            </div>
          );
        }

        return (
          <div>
            {/* ── Premium Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={() => setSelectedRouteId(null)}
                style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.04)', border: 'none', fontSize: '12px', cursor: 'pointer', color: '#64748b', fontWeight: 600, transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'scale(1)'; }}>← رجوع</button>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg, ${route.color}, ${route.color}BB)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', boxShadow: `0 4px 14px ${route.color}30` }}>{route.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{route.name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>← {route.targetDepartmentName}{route.targetDivisionName ? ` › ${route.targetDivisionName}` : ''}</div>
              </div>
            </div>

            {/* ── Taxonomy Section ── */}
            {route.formConfig.taxonomy && route.formConfig.taxonomy.length > 0 && (
              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: `${route.color}12`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>🏷️</span>
                  نوع المشكلة <span style={{ color: '#ef4444' }}>*</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {route.formConfig.taxonomy.filter(t => t.isActive).map(t => (
                    <div key={t.id}
                      onClick={() => { setRouteSelectedTaxMain(t.id); setRouteSelectedTaxSub(''); }}
                      style={{
                        padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        background: routeSelectedTaxMain === t.id ? `${route.color}15` : 'rgba(0,0,0,0.03)',
                        border: `1.5px solid ${routeSelectedTaxMain === t.id ? route.color : 'transparent'}`,
                        color: routeSelectedTaxMain === t.id ? route.color : '#64748b',
                        boxShadow: routeSelectedTaxMain === t.id ? `0 2px 8px ${route.color}20` : 'none',
                      }}
                      onMouseEnter={e => { if (routeSelectedTaxMain !== t.id) { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                      onMouseLeave={e => { if (routeSelectedTaxMain !== t.id) { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                    >
                      {routeSelectedTaxMain === t.id && <span style={{ marginLeft: '4px' }}>✓</span>} {t.label}
                    </div>
                  ))}
                </div>
                {taxEntry && taxEntry.subIssues && taxEntry.subIssues.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>↳ المشكلة الفرعية</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {taxEntry.subIssues.filter(s => s.isActive).map(s => (
                        <div key={s.id}
                          onClick={() => setRouteSelectedTaxSub(s.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s',
                            background: routeSelectedTaxSub === s.id ? `${route.color}12` : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${routeSelectedTaxSub === s.id ? route.color + '60' : 'transparent'}`,
                            color: routeSelectedTaxSub === s.id ? route.color : '#94a3b8',
                          }}
                        >
                          {routeSelectedTaxSub === s.id && '✓ '}{s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Building / Department ── */}
            {(route.formConfig.showBuildingField || route.formConfig.showDepartmentField) && (
              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: '10px' }}>
                {route.formConfig.showBuildingField && (
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px' }}>🏢</span> الموقع <span style={{ color: '#ef4444', fontSize: '10px' }}>*</span>
                    </div>
                    <select style={{ ...inputStyle, width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', background: 'rgba(248,250,252,0.8)', color: '#334155', outline: 'none', transition: 'border-color 0.2s' }} value={routeBuilding} onChange={e => setRouteBuilding(e.target.value)}
                      onFocus={e => e.currentTarget.style.borderColor = route.color}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'}>
                      <option value="">-- اختر --</option>
                      {spatialBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                {route.formConfig.showDepartmentField && (
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px' }}>🏛️</span> الإدارة <span style={{ color: '#ef4444', fontSize: '10px' }}>*</span>
                    </div>
                    <select style={{ ...inputStyle, width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', background: 'rgba(248,250,252,0.8)', color: '#334155', outline: 'none', transition: 'border-color 0.2s' }} value={routeDepartment} onChange={e => setRouteDepartment(e.target.value)}
                      onFocus={e => e.currentTarget.style.borderColor = route.color}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'}>
                      <option value="">-- اختر --</option>
                      {orgDepartments.map(d => <option key={d.id} value={d.id}>{d.title} ({d.type === 'department' ? 'إدارة' : 'مكتب'})</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* ── Dynamic Fields as Interactive Pills ── */}
            {(() => {
              const activeFieldIds = route.formConfig.routeDynamicFields 
                ? route.formConfig.routeDynamicFields.map(rdf => rdf.fieldId) 
                : (route.formConfig.customFieldIds || []);
              
              let activeCustomFields = customFields.filter(f => activeFieldIds.includes(f.id));

              // Recursively add triggered child fields
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

              if (activeCustomFields.length === 0) return null;

              return activeCustomFields.map((field, fieldIdx) => {
                const rdfs = route.formConfig.routeDynamicFields || (route.formConfig.customFieldIds || []).map(id => ({ fieldId: id, isRequired: true }));
                const isReq = rdfs.find(r => r.fieldId === field.id)?.isRequired;
                const opts = field.dependsOn && field.dependencyMap && routeFieldValues[field.dependsOn]
                  ? field.dependencyMap[routeFieldValues[field.dependsOn]] || field.options
                  : field.options;
                const activeOpts = opts.filter((opt: any) => typeof opt === 'string' || opt.isActive);
                const isChildField = !activeFieldIds.includes(field.id);

                return (
                  <div key={field.id} style={{
                    marginBottom: '14px', padding: '14px', borderRadius: '14px',
                    background: isChildField ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(12px)',
                    border: isChildField ? '1px solid rgba(139,92,246,0.12)' : '1px solid rgba(0,0,0,0.04)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    marginRight: isChildField ? '12px' : '0',
                    borderRight: isChildField ? `3px solid ${route.color}40` : 'none',
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                      <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: isChildField ? `${route.color}15` : `${route.color}10`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        {isChildField ? '🔗' : '📋'}
                      </span>
                      {field.name} {isReq && <span style={{ color: '#ef4444' }}>*</span>}
                      {isChildField && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '6px', background: `${route.color}10`, color: route.color, fontWeight: 500, marginRight: 'auto' }}>فرعي</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {activeOpts.map((opt: any) => {
                        const optId = typeof opt === 'string' ? opt : opt.id;
                        const optLabel = typeof opt === 'string' ? opt : opt.label;
                        const isSelected = routeFieldValues[field.id] === optId;
                        return (
                          <div key={optId}
                            onClick={() => {
                              const newValues = { ...routeFieldValues, [field.id]: isSelected ? '' : optId };
                              // Clear child fields when parent changes
                              if (!isSelected && field.childBindings) {
                                field.childBindings.forEach(b => { delete newValues[b.childFieldId]; });
                              }
                              setRouteFieldValues(newValues);
                            }}
                            style={{
                              padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.2s ease',
                              background: isSelected ? `${route.color}15` : 'rgba(0,0,0,0.03)',
                              border: `1.5px solid ${isSelected ? route.color : 'transparent'}`,
                              color: isSelected ? route.color : '#64748b',
                              boxShadow: isSelected ? `0 2px 10px ${route.color}18` : 'none',
                              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            }}
                            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'scale(1)'; } }}
                          >
                            {isSelected && <span style={{ marginLeft: '4px' }}>✓</span>} {optLabel}
                          </div>
                        );
                      })}
                    </div>
                    {routeFieldValues[field.id] && (
                      <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ✅ تم الاختيار
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {/* ── Description ── */}
            {route.formConfig.showDescription && (
              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#FFF3E0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✏️</span>
                  وصف المشكلة {route.formConfig.mandatoryDescription && <span style={{ color: '#ef4444' }}>*</span>}
                </div>
                <textarea style={{ ...(inputStyle as any), width: '100%', height: '90px', resize: 'none', padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', background: 'rgba(248,250,252,0.8)', color: '#334155', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                  placeholder="اكتب تفاصيل المشكلة هنا..."
                  value={routeDescription}
                  onChange={e => setRouteDescription(e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = route.color}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'} />
              </div>
            )}

            {/* ── Attachments ── */}
            {route.formConfig.showAttachments && (
              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#E8F5E9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>📎</span>
                  المرفقات {route.formConfig.mandatoryAttachments && <span style={{ color: '#ef4444' }}>*</span>}
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 400, marginRight: 'auto' }}>{route.formConfig.attachmentTypes?.join(' · ') || 'الكل'} | {route.formConfig.maxAttachmentMB || '?'}MB</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type="file" multiple onChange={handleFileChange}
                    accept={route.formConfig.attachmentTypes?.map((t: string) => `.${t.toLowerCase()}`).join(',')}
                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }} />
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '20px', border: '2px dashed rgba(0,0,0,0.1)', borderRadius: '12px',
                    background: 'rgba(248,250,252,0.6)', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = route.color; e.currentTarget.style.background = `${route.color}05`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.background = 'rgba(248,250,252,0.6)'; }}>
                    <span style={{ fontSize: '24px', opacity: 0.5 }}>☁️</span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>اسحب الملفات أو انقر للرفع</span>
                  </div>
                </div>
                {fileError && <div style={{ color: '#ef4444', fontSize: '11px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', marginTop: '8px' }}>⚠️ {fileError}</div>}
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                    {selectedFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>✅</span>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{f.name}</span>
                          <span style={{ color: '#94a3b8', fontSize: '10px' }}>({(f.size / 1024 / 1024).toFixed(1)}MB)</span>
                        </div>
                        <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '2px 6px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Submit Button ── */}
            <button
              onClick={() => {
                if (route.formConfig.mandatoryDescription && !routeDescription.trim()) { alert('وصف المشكلة إلزامي لهذا المسار.'); return; }
                if (route.formConfig.mandatoryAttachments && selectedFiles.length === 0) { alert('المرفق إلزامي لهذا المسار.'); return; }
                
                const rdfs = route.formConfig.routeDynamicFields || (route.formConfig.customFieldIds || []).map(id => ({ fieldId: id, isRequired: true }));
                const missingFields = rdfs.filter(r => r.isRequired && !routeFieldValues[r.fieldId]);
                if (missingFields.length > 0) {
                  const firstMissing = customFields.find(f => f.id === missingFields[0].fieldId);
                  alert(`يرجى إدخال الحقل الإلزامي: ${firstMissing?.name}`);
                  return;
                }

                const generatedTitle = Object.values(routeFieldValues).filter(Boolean).join(' - ') || route.name;
                
                const historicalSnapshot = {
                  mainIssueLabel: taxEntry?.label || routeSelectedTaxMain,
                  subIssueLabel: taxEntry?.subIssues?.find(s => s.id === routeSelectedTaxSub)?.label || routeSelectedTaxSub,
                  customFieldsLabels: Object.keys(routeFieldValues).reduce((acc, fieldId) => {
                    const field = customFields.find(f => f.id === fieldId);
                    const selectedOpt = field?.options?.find((o: any) => o.id === routeFieldValues[fieldId]);
                    acc[field?.name || fieldId] = selectedOpt?.label || routeFieldValues[fieldId];
                    return acc;
                  }, {} as Record<string, string>)
                };

                 const newTicket = {
                  id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
                  routeId: route.id,
                  routeName: route.name,
                  routeIcon: route.icon,
                  routeColor: route.color,
                  title: generatedTitle,
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

                setRouteSubmitSuccess(true);
              }}
              style={{
                width: '100%', padding: '14px',
                background: `linear-gradient(135deg, ${route.color}, ${route.color}CC)`,
                color: '#fff', border: 'none', borderRadius: '14px',
                fontWeight: 800, cursor: 'pointer',
                boxShadow: `0 6px 20px ${route.color}30`,
                fontSize: '14px', marginTop: '4px',
                transition: 'all 0.3s', letterSpacing: '0.3px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${route.color}40`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 20px ${route.color}30`; }}
            >
              <span>إرسال الطلب</span> <span>{route.icon}</span>
            </button>
          </div>
        );
      })()}
    </aside>
  );
};
