import React, { useState, useEffect } from 'react';
import { DynamicCustomField } from '../../pages/admin/tabs/DynamicFieldsTab';
import { loadRoutes, TicketRouteDefinition } from '../../pages/admin/tabs/TicketRoutingTab';

interface TicketCreatorFormProps {
  customFields: DynamicCustomField[];
  allowedRouteIds?: string[]; // Allowed Workflows
  concurrencyPolicy?: 'ALLOW_MULTIPLE' | 'PREVENT_CONCURRENT'; // Submission Concurrency Policy
  hasActiveTicketInRoute?: (routeId: string) => boolean;
  glassPanelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const TicketCreatorForm: React.FC<TicketCreatorFormProps> = ({
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={() => setSelectedRouteId(null)}
                style={{ padding: '6px 12px', borderRadius: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '12px', cursor: 'pointer', color: '#64748b', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>← رجوع</button>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: `linear-gradient(135deg, ${route.color}, ${route.color}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: `0 4px 10px ${route.color}25` }}>{route.icon}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{route.name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>← {route.targetDepartmentName}{route.targetDivisionName ? ` › ${route.targetDivisionName}` : ''}</div>
              </div>
            </div>

            {route.formConfig.taxonomy && route.formConfig.taxonomy.length > 0 && (
              <>
                <label style={{ display: 'block', fontSize: 12, color: '#5e6c84', marginBottom: 6, fontWeight: 700 }}>نوع المشكلة <span style={{ color: '#ff5630' }}>*</span></label>
                <select style={inputStyle} value={routeSelectedTaxMain} onChange={e => { setRouteSelectedTaxMain(e.target.value); setRouteSelectedTaxSub(''); }}>
                  <option value="">-- اختر نوع المشكلة --</option>
                  {route.formConfig.taxonomy.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                {taxEntry && taxEntry.subIssues && taxEntry.subIssues.length > 0 && (
                  <>
                    <label style={{ display: 'block', fontSize: 12, color: '#5e6c84', marginBottom: 6, fontWeight: 700 }}>المشكلة الفرعية</label>
                    <select style={inputStyle} value={routeSelectedTaxSub} onChange={e => setRouteSelectedTaxSub(e.target.value)}>
                      <option value="">-- اختر المشكلة الفرعية --</option>
                      {taxEntry.subIssues.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </>
                )}
              </>
            )}

            {route.formConfig.showBuildingField && (
              <div style={{ background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: route.color, marginBottom: '6px', fontWeight: 'bold' }}>
                  المبنى / الموقع <span style={{ color: '#ff5630' }}>*</span>
                </label>
                <select style={inputStyle} value={routeBuilding} onChange={e => setRouteBuilding(e.target.value)}>
                  <option value="">-- اختر المبنى --</option>
                  {spatialBuildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {route.formConfig.showDepartmentField && (
              <div style={{ background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: route.color, marginBottom: '6px', fontWeight: 'bold' }}>
                  الإدارة / المكتب <span style={{ color: '#ff5630' }}>*</span>
                </label>
                <select style={inputStyle} value={routeDepartment} onChange={e => setRouteDepartment(e.target.value)}>
                  <option value="">-- اختر الإدارة --</option>
                  {orgDepartments.map(d => (
                    <option key={d.id} value={d.id}>{d.title} ({d.type === 'department' ? 'إدارة' : 'مكتب'})</option>
                  ))}
                </select>
              </div>
            )}

            {route.formConfig.customFieldIds && route.formConfig.customFieldIds.length > 0 && customFields
              .filter(f => route.formConfig.customFieldIds.includes(f.id))
              .map(field => {
                const rdfs = route.formConfig.routeDynamicFields || (route.formConfig.customFieldIds || []).map(id => ({ fieldId: id, isRequired: true }));
                const isReq = rdfs.find(r => r.fieldId === field.id)?.isRequired;
                const opts = field.dependsOn && field.dependencyMap && routeFieldValues[field.dependsOn]
                  ? field.dependencyMap[routeFieldValues[field.dependsOn]] || field.options
                  : field.options;
                return (
                  <div key={field.id} style={{ background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: route.color, marginBottom: '6px', fontWeight: 'bold' }}>
                      {field.name} {isReq && <span style={{ color: '#ff5630' }}>*</span>}
                    </label>
                    <select style={inputStyle} value={routeFieldValues[field.id] || ''} onChange={e => setRouteFieldValues({ ...routeFieldValues, [field.id]: e.target.value })}>
                      <option value="">-- اختر --</option>
                      {opts.map((opt: any) => {
                        if (typeof opt === 'string') return <option key={opt} value={opt}>{opt}</option>;
                        if (!opt.isActive) return null;
                        return <option key={opt.id} value={opt.id}>{opt.label}</option>;
                      })}
                    </select>
                  </div>
                );
              })
            }

            {route.formConfig.showDescription && (
              <>
                <label style={{ display: 'block', fontSize: 12, color: '#5e6c84', marginBottom: 6, fontWeight: 700 }}>
                  وصف المشكلة {route.formConfig.mandatoryDescription && <span style={{ color: '#ff5630' }}>*</span>}
                </label>
                <textarea style={{ ...inputStyle as any, height: '90px', resize: 'none' }}
                  placeholder="اكتب تفاصيل المشكلة هنا..."
                  value={routeDescription}
                  onChange={e => setRouteDescription(e.target.value)} />
              </>
            )}

            {route.formConfig.showAttachments && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#5e6c84', marginBottom: 6, fontWeight: 700 }}>
                  المرفقات {route.formConfig.mandatoryAttachments && <span style={{ color: '#ff5630' }}>*</span>}
                  <span style={{ fontSize: 10, color: '#AEAEB2', marginRight: 8, fontWeight: 400 }}>(الحد: {route.formConfig.maxAttachmentMB || 'غير محدد'}MB | {route.formConfig.attachmentTypes?.join(', ') || 'الكل'})</span>
                </label>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <input type="file" multiple onChange={handleFileChange}
                    accept={route.formConfig.attachmentTypes?.map((t: string) => `.${t.toLowerCase()}`).join(',')}
                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px 16px', border: '2px dashed #c1c7d0', borderRadius: 10, background: '#fafbfc', color: '#5e6c84', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 20 }}>📁</span> اضغط لاختيار الملفات أو اسحبها هنا
                  </div>
                </div>
                {fileError && <div style={{ color: '#ff5630', fontSize: 11, padding: '8px 12px', background: '#ffebe6', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>⚠️ {fileError}</div>}
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#e3fcef', border: '1px solid #abf5d1', borderRadius: 8, fontSize: 12, animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>✅</span>
                          <span style={{ color: '#172b4d', fontWeight: 600 }}>{f.name}</span>
                          <span style={{ color: '#5e6c84', fontSize: 10 }}>({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: '#ff5630', cursor: 'pointer', fontWeight: 'bold', fontSize: 14, padding: '2px 6px', borderRadius: 4 }}>✕</button>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: '#36B37E', fontWeight: 600, textAlign: 'center', marginTop: 2 }}>📎 {selectedFiles.length} ملف مرفق بنجاح</div>
                  </div>
                )}
              </div>
            )}

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

                console.log('✅ Route Ticket Submitted:', { routeId: route.id, targetDept: route.targetDepartmentId, title: generatedTitle, description: routeDescription, customFields: routeFieldValues, attachments: selectedFiles.map(f => f.name), captured_historical_data: historicalSnapshot });
                setRouteSubmitSuccess(true);
              }}
              style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${route.color} 0%, ${route.color}CC 100%)`, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: `0 6px 20px ${route.color}30`, fontSize: '14px', marginTop: '8px', transition: 'all 0.3s', letterSpacing: '0.3px' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${route.color}40`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 20px ${route.color}30`; }}
            >
              إرسال الطلب {route.icon}
            </button>
          </div>
        );
      })()}
    </aside>
  );
};
