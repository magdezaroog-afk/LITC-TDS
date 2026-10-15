import React, { useState, useEffect } from 'react';
import { DynamicCustomField } from '../../pages/admin/tabs/DynamicFieldsTab';
import { loadRoutes, type TicketRouteDefinition } from '../../services/ticketRouting.helpers';
import { loadCachedOrRemoteOrgTree, getTopLevelDepartments } from '../../services/institutionalHierarchy.helpers';

interface TicketCreatorFormProps {
  customFields: DynamicCustomField[];
  allowedRouteIds?: string[];
  concurrencyPolicy?: 'ALLOW_MULTIPLE' | 'PREVENT_CONCURRENT';
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
    // loadRoutes may return a Promise or a plain array depending on implementation
    const result = loadRoutes();
    if (result && typeof (result as any).then === 'function') {
      (result as any as Promise<TicketRouteDefinition[]>).then(routes => setSavedRoutes(routes));
    } else {
      setSavedRoutes(result as unknown as TicketRouteDefinition[]);
    }

    loadCachedOrRemoteOrgTree().then(tree => {
      if (tree) {
        setOrgDepartments(getTopLevelDepartments(tree));
      }
    }).catch(() => {});

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
    const rules = (routeDef?.formConfig || {}) as any;

    const maxSizeMB: number | undefined = rules.maxAttachmentMB;
    const allowedExts: string[] = rules.attachmentTypes || [];

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
            <textarea style={{ ...inputStyle, height: '100px', resize: 'none' } as any} placeholder="الرجاء وصف المشكلة بدقة..." />
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
                      if (isLocked) return;
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
                    onMouseEnter={e => { if (!isLocked) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${route.color}15`; e.currentTarget.style.borderColor = route.color + '60'; } }}
                    onMouseLeave={e => { if (!isLocked) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = route.color + '30'; } }}
                  >
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isLocked ? '#e2e8f0' : `linear-gradient(135deg, ${route.color}, ${route.color}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: isLocked ? 'none' : `0 4px 12px ${route.color}30` }}>
                      {isLocked ? '🔒' : route.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isLocked ? '#94a3b8' : '#1e293b' }}>{route.name}</div>
                      {route.description && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>{route.description}</div>}
                      <div style={{ fontSize: '10px', color: isLocked ? '#94a3b8' : route.color, marginTop: '4px', fontWeight: 700 }}>
                        {isLocked ? '⛔ لديك طلب مفتوح' : `← ${route.targetDepartmentName}`}
                      </div>
                    </div>
                    <div style={{ color: isLocked ? '#cbd5e1' : route.color, fontSize: '20px', fontWeight: 300 }}>‹</div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (() => {
        const route = savedRoutes.find(r => r.id === selectedRouteId)!;
        if (!route) return null;
        const taxEntry = route.formConfig.taxonomy?.find((tx: any) => tx.id === routeSelectedTaxMain && tx.isActive);

        if (routeSubmitSuccess) {
          return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}>✓</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>تم إرسال طلبك بنجاح!</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.5 }}>تم توجيه طلبك إلى <strong style={{ color: '#334155' }}>{route.targetDepartmentName}</strong></div>
              <button onClick={() => { setSelectedRouteId(null); setRouteSubmitSuccess(false); }}
                style={{ padding: '12px 28px', borderRadius: '12px', background: `linear-gradient(135deg, ${route.color}, ${route.color}CC)`, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                ← إرسال طلب آخر
              </button>
            </div>
          );
        }

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={() => setSelectedRouteId(null)}
                style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.04)', border: 'none', fontSize: '12px', cursor: 'pointer', color: '#64748b', fontWeight: 600 }}>← رجوع</button>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg, ${route.color}, ${route.color}BB)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px' }}>{route.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{route.name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>← {route.targetDepartmentName}</div>
              </div>
            </div>

            {/* Description */}
            {route.formConfig.showDescription && (
              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                  وصف المشكلة {route.formConfig.mandatoryDescription && <span style={{ color: '#ef4444' }}>*</span>}
                </div>
                <textarea style={{ width: '100%', height: '90px', resize: 'none', padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.08)', fontSize: '12px', background: 'rgba(248,250,252,0.8)', color: '#334155', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' } as any}
                  placeholder="اكتب تفاصيل المشكلة هنا..."
                  value={routeDescription}
                  onChange={e => setRouteDescription(e.target.value)} />
              </div>
            )}

            {/* Attachments */}
            {route.formConfig.showAttachments && (
              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                  المرفقات {route.formConfig.mandatoryAttachments && <span style={{ color: '#ef4444' }}>*</span>}
                </div>
                <input type="file" multiple onChange={handleFileChange} style={{ display: 'block', fontSize: '12px' }} />
                {fileError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '8px' }}>⚠️ {fileError}</div>}
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16,185,129,0.06)', borderRadius: '8px', marginTop: '6px', fontSize: '11px' }}>
                    <span>✅ {f.name}</span>
                    <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => {
                if (route.formConfig.mandatoryDescription && !routeDescription.trim()) { alert('وصف المشكلة إلزامي لهذا المسار.'); return; }
                if (route.formConfig.mandatoryAttachments && selectedFiles.length === 0) { alert('المرفق إلزامي لهذا المسار.'); return; }

                const newTicket = {
                  id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
                  routeId: route.id,
                  routeName: route.name,
                  routeIcon: route.icon,
                  routeColor: route.color,
                  title: route.name,
                  description: routeDescription,
                  status: 'NEW',
                  currentHandler: route.targetDepartmentName,
                  created_at: new Date().toISOString(),
                };

                const existing = JSON.parse(localStorage.getItem('litc_user_active_tickets') || '[]');
                existing.push(newTicket);
                localStorage.setItem('litc_user_active_tickets', JSON.stringify(existing));
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('litc_settings_updated'));
                setRouteSubmitSuccess(true);
              }}
              style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${route.color}, ${route.color}CC)`, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', fontSize: '14px', marginTop: '4px' }}
            >
              إرسال الطلب {route.icon}
            </button>
          </div>
        );
      })()}
    </aside>
  );
};
