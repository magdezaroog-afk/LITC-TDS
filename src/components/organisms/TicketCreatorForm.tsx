import React, { useState, useEffect } from 'react';
import { DynamicCustomField } from '../../pages/admin/tabs/DynamicFieldsTab';
import { loadRoutes, TicketRouteDefinition } from '../../pages/admin/tabs/TicketRoutingTab';

interface TicketCreatorFormProps {
  customFields: DynamicCustomField[];
  ticketCreateSettings: any;
  glassPanelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const TicketCreatorForm: React.FC<TicketCreatorFormProps> = ({
  customFields,
  ticketCreateSettings,
  glassPanelStyle = {},
  inputStyle = {}
}) => {
  const [savedRoutes, setSavedRoutes] = useState<TicketRouteDefinition[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeFieldValues, setRouteFieldValues] = useState<Record<string, string>>({});
  const [routeSelectedTaxMain, setRouteSelectedTaxMain] = useState<string>('');
  const [routeSelectedTaxSub, setRouteSelectedTaxSub] = useState<string>('');
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeSubmitSuccess, setRouteSubmitSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Legacy form state
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setSavedRoutes(loadRoutes());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const routeDef = savedRoutes.find(r => r.id === selectedRouteId);
    const rules = routeDef?.formConfig || {};
    const maxSizeMB = rules.maxAttachmentSizeMB || 5;
    const allowedExts = (rules.allowedExtensions || '*').split(',').map((s: string) => s.trim().toLowerCase());

    const validFiles = files.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        setFileError(`حجم الملف ${file.name} يتجاوز الحد المسموح (${maxSizeMB}MB)`);
        return false;
      }

      if (!allowedExts.includes('*')) {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExts.includes(fileExt)) {
          setFileError(`صيغة الملف ${file.name} غير مسموحة. المسموح: ${rules.allowedExtensions}`);
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
  const destinationRouteIds: string[] = ticketCreateSettings?.destinationRoutes || [];
  const visibleRoutes = destinationRouteIds.length > 0
    ? activeRoutes.filter(r => destinationRouteIds.includes(r.id))
    : activeRoutes;

  return (
    <aside style={{ ...glassPanelStyle, alignSelf: 'start' }}>
      {!selectedRouteId ? (
        visibleRoutes.length === 0 ? (
          <div>
            <h3 style={{ borderBottom: '2px solid #0052cc', display: 'inline-block', paddingBottom: '5px', marginBottom: '20px', color: '#0052cc', fontSize: '16px' }}>إنشاء بلاغ جديد</h3>
            <label style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: 'bold' }}>عنوان البلاغ</label>
            <input type="text" style={inputStyle} placeholder="وصف موجز للمشكلة..." />
            <label style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: 'bold' }}>تفاصيل البلاغ</label>
            <textarea style={{ ...inputStyle, height: '100px', resize: 'none' }} placeholder="الرجاء وصف المشكلة بدقة..." />
            <button style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg, #0052cc 0%, #0065ff 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              إرسال البلاغ فوراً
            </button>
          </div>
        ) : (
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#172b4d', fontWeight: 800 }}>🚀 إنشاء طلب خدمة جديد</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#5e6c84' }}>اختر نوع الطلب لتوجيهه للإدارة المختصة</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleRoutes.map(route => (
                <div key={route.id}
                  onClick={() => { setSelectedRouteId(route.id); setRouteFieldValues({}); setRouteDescription(''); setRouteSelectedTaxMain(''); setRouteSelectedTaxSub(''); setRouteSubmitSuccess(false); setSelectedFiles([]); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${route.color}44`, background: `${route.color}0A`, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(-3px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: route.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{route.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#172b4d' }}>{route.name}</div>
                    {route.description && <div style={{ fontSize: 11, color: '#5e6c84', marginTop: 2 }}>{route.description}</div>}
                    <div style={{ fontSize: 10, color: route.color, marginTop: 3, fontWeight: 600 }}>→ {route.targetDepartmentName}</div>
                  </div>
                  <div style={{ color: route.color, fontSize: 18 }}>›</div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (() => {
        const route = savedRoutes.find(r => r.id === selectedRouteId)!;
        if (!route) return null;
        const taxEntry = route.formConfig.taxonomy?.find(t => t.id === routeSelectedTaxMain && t.isActive);

        if (routeSubmitSuccess) {
          return (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#172b4d', marginBottom: 6 }}>تم إرسال طلبك بنجاح!</div>
              <div style={{ fontSize: 12, color: '#5e6c84', marginBottom: 20 }}>تم توجيه طلبك إلى {route.targetDepartmentName}</div>
              <button onClick={() => { setSelectedRouteId(null); setRouteSubmitSuccess(false); }}
                style={{ padding: '10px 20px', borderRadius: 10, background: route.color, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                إرسال طلب آخر
              </button>
            </div>
          );
        }

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={() => setSelectedRouteId(null)}
                style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.05)', border: 'none', fontSize: 12, cursor: 'pointer', color: '#5e6c84' }}>← رجوع</button>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: route.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{route.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: route.color }}>{route.name}</div>
                <div style={{ fontSize: 10, color: '#5e6c84' }}>→ {route.targetDepartmentName}{route.targetDivisionName ? ` › ${route.targetDivisionName}` : ''}</div>
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
                  <span style={{ fontSize: 10, color: '#AEAEB2', marginRight: 8, fontWeight: 400 }}>(الحد: {route.formConfig.maxAttachmentMB || 5}MB | {route.formConfig.attachmentTypes?.join(', ') || 'الكل'})</span>
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
              style={{ width: '100%', padding: '12px', background: `linear-gradient(90deg, ${route.color} 0%, ${route.color}CC 100%)`, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${route.color}44`, fontSize: 14, marginTop: 4 }}
            >
              إرسال الطلب {route.icon}
            </button>
          </div>
        );
      })()}
    </aside>
  );
};
