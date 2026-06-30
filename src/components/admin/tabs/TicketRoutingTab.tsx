import React, { useState, useEffect } from 'react';
import type { OrgDepartment, OrgDivision } from './OperationalStructureTab';
import type { DynamicCustomField } from './DynamicFieldsTab';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
export interface IndicatorOption {
  id: string;
  label: string;
  isActive: boolean;
}

export interface SubIssueIndicator {
  id: string;
  parentMainIssueId: string;
  label: string;
  options: IndicatorOption[];
  isActive: boolean;
}

export interface MainIssueIndicator {
  id: string;
  label: string;
  subIssues: SubIssueIndicator[];
  isActive: boolean;
}

export interface RouteFormConfig {
  showDescription: boolean;
  mandatoryDescription: boolean;
  showAttachments: boolean;
  mandatoryAttachments: boolean;
  attachmentTypes: string[];
  maxAttachmentMB: number;
  taxonomy: MainIssueIndicator[]; // Updated to hierarchical schema
  customFieldIds: string[];
  routeDynamicFields: { fieldId: string; isRequired: boolean }[];
}

export interface TicketRouteDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  targetDivisionId: string;
  targetDivisionName: string;
  formConfig: RouteFormConfig;
  isActive: boolean;
  captured_historical_data?: any; // Prepared for future snapshots
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════
export const ROUTES_KEY = 'litc_ticket_routes';

const ICONS = ['💻','🏗️','📋','🔧','📡','🔒','📊','🏥','📞','🖨️','⚡','🌐','🗄️','📱','🔑'];
const COLORS = ['#007AFF','#5856D6','#FF9500','#FF3B30','#34C759','#AF52DE','#FF6B35','#00C7BE','#30B0C7','#636567'];

const A = {
  bg: '#F5F5F7', surface: '#FFFFFF', text: '#1D1D1F', textSub: '#6E6E73', textTer: '#AEAEB2',
  sep: 'rgba(0,0,0,0.08)', radius: '14px', radiusSm: '10px',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  shadowCard: '0 2px 8px rgba(0,0,0,0.06)',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
  accent: '#FF6B35', accentBg: '#FFF3ED', blue: '#007AFF', green: '#34C759', red: '#FF3B30', purple: '#5856D6',
};

const STYLE_ID = 'ticket-routing-tab-styles';
const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.95);} to { opacity:1; transform:scale(1);} }
    .route-card { transition:all 0.2s cubic-bezier(0.28,0.11,0.32,1); animation:fadeSlideIn 0.3s both; }
    .route-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.12) !important; }
    .route-action-btn { transition:all 0.15s ease; cursor:pointer; }
    .route-action-btn:hover { opacity:0.75; transform:scale(0.97); }
    .route-action-btn:active { transform:scale(0.93); }
    .wizard-step { animation:scaleIn 0.25s both; }
    .icon-option { cursor:pointer; transition:all 0.15s ease; border-radius:10px; padding:6px 10px; }
    .icon-option:hover { transform:scale(1.2); }
    .color-dot { cursor:pointer; transition:transform 0.15s ease; }
    .color-dot:hover { transform:scale(1.15); }
    .tr-input { width:100%; padding:10px 12px; border:1.5px solid rgba(0,0,0,0.1); border-radius:10px; background:#F5F5F7; font-family:inherit; font-size:13px; color:#1D1D1F; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
    .tr-input:focus { border-color:#FF6B35; background:#fff; }
    .tr-checkbox { cursor:pointer; width:16px; height:16px; }
    .tr-tag { display:inline-flex; align-items:center; gap:4px; background:rgba(255,107,53,0.12); color:#FF6B35; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:600; }
    .step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; transition:all 0.25s ease; }
  `;
  document.head.appendChild(style);
};

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════
const defaultFormConfig = (): RouteFormConfig => ({
  showDescription: true, mandatoryDescription: true,
  showAttachments: true, mandatoryAttachments: false,
  attachmentTypes: ['PDF','PNG','JPG'], maxAttachmentMB: 5,
  taxonomy: [], customFieldIds: [], routeDynamicFields: [],
});

const loadDepartments = (): OrgDepartment[] => {
  try { const s = localStorage.getItem('mockDepartments'); return s ? JSON.parse(s) : []; } catch { return []; }
};
const loadDynamicFields = (): DynamicCustomField[] => {
  try { const s = localStorage.getItem('litc_dynamic_fields'); return s ? JSON.parse(s) : []; } catch { return []; }
};
export const loadRoutes = (): TicketRouteDefinition[] => {
  try { 
    const s = localStorage.getItem(ROUTES_KEY); 
    if (!s) return [];
    const parsed = JSON.parse(s);
    return parsed.map((r: any) => ({
      ...r,
      formConfig: {
        ...r.formConfig,
        routeDynamicFields: r.formConfig.routeDynamicFields || (r.formConfig.customFieldIds || []).map((id: string) => ({ fieldId: id, isRequired: true }))
      }
    }));
  } catch { return []; }
};
const saveRoutes = (routes: TicketRouteDefinition[]) => {
  localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
};

// ═══════════════════════════════════════════════════════════
// Wizard State
// ═══════════════════════════════════════════════════════════
type WizardStep = 1 | 2 | 3;
interface WizardState {
  name: string; description: string; icon: string; color: string;
  targetDepartmentId: string; targetDepartmentName: string;
  targetDivisionId: string; targetDivisionName: string;
  formConfig: RouteFormConfig;
}
const defaultWizard = (): WizardState => ({
  name: '', description: '', icon: '💻', color: '#007AFF',
  targetDepartmentId: '', targetDepartmentName: '',
  targetDivisionId: '', targetDivisionName: '',
  formConfig: defaultFormConfig(),
});

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
export const TicketRoutingTab: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);

  const [routes, setRoutes] = useState<TicketRouteDefinition[]>(loadRoutes);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicCustomField[]>([]);
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [wizard, setWizard] = useState<WizardState>(defaultWizard());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setDepartments(loadDepartments());
    setDynamicFields(loadDynamicFields());
  }, [view]);

  const persistRoutes = (updated: TicketRouteDefinition[]) => { setRoutes(updated); saveRoutes(updated); };
  const setW = (patch: Partial<WizardState>) => setWizard(prev => ({ ...prev, ...patch }));
  const setFC = (patch: Partial<RouteFormConfig>) => setWizard(prev => ({ ...prev, formConfig: { ...prev.formConfig, ...patch } }));

  const openCreate = () => { setEditingId(null); setWizard(defaultWizard()); setWizardStep(1); setView('wizard'); };
  const openEdit = (route: TicketRouteDefinition) => {
    setEditingId(route.id);
    setWizard({ name:route.name, description:route.description, icon:route.icon, color:route.color, targetDepartmentId:route.targetDepartmentId, targetDepartmentName:route.targetDepartmentName, targetDivisionId:route.targetDivisionId, targetDivisionName:route.targetDivisionName, formConfig: { ...route.formConfig, taxonomy:[...route.formConfig.taxonomy], customFieldIds:[...route.formConfig.customFieldIds], routeDynamicFields: [...(route.formConfig.routeDynamicFields || [])] } });
    setWizardStep(1); setView('wizard');
  };
  const cancelWizard = () => { setView('list'); setEditingId(null); };

  const saveRoute = () => {
    if (!wizard.name.trim() || !wizard.targetDepartmentId) return;
    const now = new Date().toISOString();
    
    if (editingId) {
      // Update existing route: preserve the ID and other absolute properties, update wizard content
      persistRoutes(routes.map(r => r.id === editingId ? { ...r, ...wizard, updatedAt: now } : r));
    } else {
      // Create new route: Generate a strict unique ID (UUID style representation)
      const uniqueSuffix = crypto.randomUUID ? crypto.randomUUID().split('-')[0] : Math.random().toString(36).substring(2, 10);
      const strictRouteId = `path_route_${uniqueSuffix}`;
      
      persistRoutes([...routes, { 
        id: strictRouteId, 
        ...wizard, 
        isActive: true, 
        createdAt: now, 
        updatedAt: now 
      }]);
    }
    
    setView('list'); 
    setEditingId(null);
  };

  const toggleActive = (id: string) => persistRoutes(routes.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));

  // --- Soft Delete (Archive) Functions for Taxonomy ---
  const toggleMainIssueStatus = (routeId: string, mainIssueId: string) => {
    persistRoutes(routes.map(route => {
      if (route.id !== routeId) return route;
      const updatedTaxonomy = route.formConfig.taxonomy.map(main => {
        if (main.id === mainIssueId) {
          // Cascading logic: If we are disabling the main issue, it implicitly hides sub-issues in the UI,
          // but we only flip the main issue's isActive flag to preserve data structure.
          return { ...main, isActive: !main.isActive };
        }
        return main;
      });
      return { ...route, formConfig: { ...route.formConfig, taxonomy: updatedTaxonomy } };
    }));
  };

  const toggleSubIssueStatus = (routeId: string, mainIssueId: string, subIssueId: string) => {
    persistRoutes(routes.map(route => {
      if (route.id !== routeId) return route;
      const updatedTaxonomy = route.formConfig.taxonomy.map(main => {
        if (main.id !== mainIssueId) return main;
        const updatedSubIssues = main.subIssues.map(sub => 
          sub.id === subIssueId ? { ...sub, isActive: !sub.isActive } : sub
        );
        return { ...main, subIssues: updatedSubIssues };
      });
      return { ...route, formConfig: { ...route.formConfig, taxonomy: updatedTaxonomy } };
    }));
  };
  
  const toggleIndicatorOptionStatus = (routeId: string, mainIssueId: string, subIssueId: string, optionId: string) => {
    persistRoutes(routes.map(route => {
      if (route.id !== routeId) return route;
      const updatedTaxonomy = route.formConfig.taxonomy.map(main => {
        if (main.id !== mainIssueId) return main;
        const updatedSubIssues = main.subIssues.map(sub => {
          if (sub.id !== subIssueId) return sub;
          const updatedOptions = sub.options.map(opt => 
            opt.id === optionId ? { ...opt, isActive: !opt.isActive } : opt
          );
          return { ...sub, options: updatedOptions };
        });
        return { ...main, subIssues: updatedSubIssues };
      });
      return { ...route, formConfig: { ...route.formConfig, taxonomy: updatedTaxonomy } };
    }));
  };
  // ---------------------------------------------------
  const deleteRoute = (id: string) => { persistRoutes(routes.filter(r => r.id !== id)); setDeleteConfirmId(null); };

  const selectedDept = departments.find(d => d.id === wizard.targetDepartmentId);
  const divisions: OrgDivision[] = selectedDept?.divisions || [];

  const toggleCustomField = (fieldId: string) => {
    const ids = wizard.formConfig.customFieldIds;
    setFC({ customFieldIds: ids.includes(fieldId) ? ids.filter(id => id !== fieldId) : [...ids, fieldId] });
  };
  const toggleAttachType = (type: string) => {
    const types = wizard.formConfig.attachmentTypes;
    setFC({ attachmentTypes: types.includes(type) ? types.filter(t => t !== type) : [...types, type] });
  };

  const step1Valid = wizard.name.trim().length > 0;
  const step2Valid = !!wizard.targetDepartmentId;

  const renderSteps = () => (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28 }}>
      {([1,2,3] as WizardStep[]).map((s, i) => {
        const done = wizardStep > s; const active = wizardStep === s;
        const labels = ['المعلومات الأساسية','الوجهة والمستدلات','إعدادات الفورم'];
        return (
          <React.Fragment key={s}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div className="step-dot" style={{ background:done?A.green:active?wizard.color:A.bg, color:(done||active)?'#fff':A.textTer, border:active?`2px solid ${wizard.color}`:done?'none':'2px solid rgba(0,0,0,0.1)' }}>
                {done?'✓':s}
              </div>
              <span style={{ fontSize:10, color:active?wizard.color:A.textTer, fontWeight:active?700:400, whiteSpace:'nowrap' }}>{labels[i]}</span>
            </div>
            {i<2 && <div style={{ flex:1, height:2, background:done?A.green:'rgba(0,0,0,0.08)', marginBottom:16, transition:'background 0.3s' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:6 }}>اسم المسار <span style={{ color:A.red }}>*</span></label>
        <input className="tr-input" placeholder="مثال: طلب دعم تقني" value={wizard.name} onChange={e => setW({ name:e.target.value })} />
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:6 }}>وصف مختصر (اختياري)</label>
        <textarea className="tr-input" placeholder="شرح بسيط لهذا المسار..." rows={2} value={wizard.description} onChange={e => setW({ description:e.target.value })} style={{ resize:'vertical', minHeight:60 }} />
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:8 }}>أيقونة المسار</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {ICONS.map(ic => (
            <div key={ic} className="icon-option" style={{ background:wizard.icon===ic?`${wizard.color}22`:A.bg, border:wizard.icon===ic?`2px solid ${wizard.color}`:'2px solid transparent', fontSize:20 }} onClick={() => setW({ icon:ic })}>{ic}</div>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:8 }}>لون المسار</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {COLORS.map(c => (
            <div key={c} className="color-dot" style={{ width:28, height:28, borderRadius:'50%', background:c, border:wizard.color===c?'3px solid white':'3px solid transparent', boxShadow:wizard.color===c?`0 0 0 2px ${c}`:'none' }} onClick={() => setW({ color:c })} />
          ))}
        </div>
      </div>
      {wizard.name && (
        <div style={{ padding:14, borderRadius:A.radiusSm, background:`${wizard.color}12`, border:`1.5px solid ${wizard.color}44`, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:wizard.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{wizard.icon}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:wizard.color }}>{wizard.name}</div>
            {wizard.description && <div style={{ fontSize:11, color:A.textSub, marginTop:2 }}>{wizard.description}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:6 }}>الإدارة التشغيلية المستقبلة <span style={{ color:A.red }}>*</span></label>
        <select className="tr-input" value={wizard.targetDepartmentId} onChange={e => { const dept=departments.find(d=>d.id===e.target.value); setW({ targetDepartmentId:e.target.value, targetDepartmentName:dept?.name||'', targetDivisionId:'', targetDivisionName:'' }); }}>
          <option value="">-- اختر الإدارة --</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {departments.length === 0 && <div style={{ fontSize:11, color:A.textTer, marginTop:4 }}>💡 أنشئ الإدارات أولاً من تبويب "الهيكل التشغيلي"</div>}
      </div>
      {divisions.length > 0 && (
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:6 }}>القسم (اختياري)</label>
          <select className="tr-input" value={wizard.targetDivisionId} onChange={e => { const div=divisions.find(d=>d.id===e.target.value); setW({ targetDivisionId:e.target.value, targetDivisionName:div?.name||'' }); }}>
            <option value="">-- أي قسم (التوجيه لكامل الإدارة) --</option>
            {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:8 }}>المستدلات الديناميكية المرفقة</label>
        {dynamicFields.length===0 ? (
          <div style={{ fontSize:11, color:A.textTer, padding:'10px 12px', background:A.bg, borderRadius:A.radiusSm }}>💡 أنشئ المستدلات من تبويب "المستدلات الديناميكية" لتتمكن من إرفاقها هنا</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {dynamicFields.map(field => (
              <label key={field.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:wizard.formConfig.customFieldIds.includes(field.id)?`${wizard.color}0D`:A.bg, borderRadius:8, cursor:'pointer', border:`1px solid ${wizard.formConfig.customFieldIds.includes(field.id)?wizard.color+'44':'transparent'}`, transition:'all 0.2s' }}>
                <input type="checkbox" className="tr-checkbox" checked={wizard.formConfig.customFieldIds.includes(field.id)} onChange={() => toggleCustomField(field.id)} />
                <span style={{ fontSize:13, fontWeight:600, color:A.text }}>{field.name}</span>
                {field.options.length>0 && <span style={{ fontSize:10, color:A.textTer }}>({field.options.slice(0,3).join(', ')}{field.options.length>3?'...':''})</span>}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ padding:14, background:A.bg, borderRadius:A.radiusSm }}>
          <div style={{ fontSize:12, fontWeight:700, color:A.text, marginBottom:10 }}>📝 الوصف</div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, cursor:'pointer', marginBottom:8 }}>
            <input type="checkbox" className="tr-checkbox" checked={wizard.formConfig.showDescription} onChange={e => setFC({ showDescription:e.target.checked })} />
            إظهار حقل الوصف
          </label>
          {wizard.formConfig.showDescription && (
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, cursor:'pointer' }}>
              <input type="checkbox" className="tr-checkbox" checked={wizard.formConfig.mandatoryDescription} onChange={e => setFC({ mandatoryDescription:e.target.checked })} />
              إجباري على الموظف
            </label>
          )}
        </div>
        <div style={{ padding:14, background:A.bg, borderRadius:A.radiusSm }}>
          <div style={{ fontSize:12, fontWeight:700, color:A.text, marginBottom:10 }}>📎 المرفقات</div>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, cursor:'pointer', marginBottom:8 }}>
            <input type="checkbox" className="tr-checkbox" checked={wizard.formConfig.showAttachments} onChange={e => setFC({ showAttachments:e.target.checked })} />
            إظهار رفع الملفات
          </label>
          {wizard.formConfig.showAttachments && (
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, cursor:'pointer' }}>
              <input type="checkbox" className="tr-checkbox" checked={wizard.formConfig.mandatoryAttachments} onChange={e => setFC({ mandatoryAttachments:e.target.checked })} />
              إجباري على الموظف
            </label>
          )}
        </div>
      </div>
      {wizard.formConfig.showAttachments && (
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:8 }}>أنواع الملفات المسموح بها</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['PDF','DOCX','PNG','JPG','ZIP','RAR','XLSX','MP4'].map(type => (
              <label key={type} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:8, background:wizard.formConfig.attachmentTypes.includes(type)?`${wizard.color}18`:A.bg, border:`1px solid ${wizard.formConfig.attachmentTypes.includes(type)?wizard.color+'55':'transparent'}`, cursor:'pointer', fontSize:12, fontWeight:600, color:wizard.formConfig.attachmentTypes.includes(type)?wizard.color:A.textSub, transition:'all 0.2s' }}>
                <input type="checkbox" className="tr-checkbox" checked={wizard.formConfig.attachmentTypes.includes(type)} onChange={() => toggleAttachType(type)} style={{ display:'none' }} />{type}
              </label>
            ))}
          </div>
          <div style={{ marginTop:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:4 }}>الحجم الأقصى (MB)</label>
            <input type="number" className="tr-input" style={{ width:80 }} min={1} max={100} value={wizard.formConfig.maxAttachmentMB} onChange={e => setFC({ maxAttachmentMB:parseInt(e.target.value)||5 })} />
          </div>
        </div>
      )}
      <div style={{ padding:16, background:'#F0F4FF', borderRadius:A.radius, border:'1px solid rgba(88,86,214,0.15)' }}>
        <div style={{ fontSize:12, fontWeight:700, color:A.purple, marginBottom:12 }}>👁️ معاينة فورم الموظف</div>
        <div style={{ background:A.surface, borderRadius:10, padding:14, display:'flex', flexDirection:'column', gap:10, boxShadow:A.shadowCard }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:10, borderBottom:`1px solid ${A.sep}` }}>
            <div style={{ width:36, height:36, borderRadius:10, background:wizard.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{wizard.icon}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:wizard.color }}>{wizard.name||'اسم المسار'}</div>
              <div style={{ fontSize:10, color:A.textSub }}>→ {wizard.targetDepartmentName||'الإدارة المستقبلة'}</div>
            </div>
          </div>
          {wizard.formConfig.routeDynamicFields && wizard.formConfig.routeDynamicFields.length>0 && (
            <div>
              <div style={{ fontSize:10, color:A.textSub, marginBottom:4, fontWeight:600 }}>بيانات إضافية *</div>
              <div style={{ padding:'6px 10px', borderRadius:6, background:A.bg, fontSize:12, color:A.textTer }}>-- حقول ديناميكية --</div>
            </div>
          )}
          {wizard.formConfig.showDescription && (
            <div>
              <div style={{ fontSize:10, color:A.textSub, marginBottom:4, fontWeight:600 }}>وصف المشكلة {wizard.formConfig.mandatoryDescription&&<span style={{ color:A.red }}>*</span>}</div>
              <div style={{ padding:'6px 10px', borderRadius:6, background:A.bg, minHeight:40, fontSize:12, color:A.textTer }}>اكتب وصف المشكلة...</div>
            </div>
          )}
          {wizard.formConfig.showAttachments && (
            <div style={{ padding:'8px 10px', border:'2px dashed rgba(0,0,0,0.1)', borderRadius:6, textAlign:'center', fontSize:11, color:A.textTer }}>📎 رفع ملف {wizard.formConfig.mandatoryAttachments&&<span style={{ color:A.red }}>*</span>}</div>
          )}
          <div style={{ padding:'8px 14px', background:wizard.color, borderRadius:8, textAlign:'center', fontSize:12, fontWeight:700, color:'#fff' }}>إرسال التذكرة 🚀</div>
        </div>
      </div>
    </div>
  );

  const renderList = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${A.sep}` }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:A.text, letterSpacing:'-0.4px' }}>مسارات التذاكر</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:A.textSub }}>Ticket Routing Engine – {routes.length} مسار مُعرَّف</p>
        </div>
        <button className="route-action-btn" onClick={openCreate} style={{ padding:'10px 22px', borderRadius:12, background:A.accent, color:'#fff', border:'none', fontSize:14, fontWeight:700, boxShadow:`0 4px 14px ${A.accent}44`, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>+</span> مسار جديد
        </button>
      </div>
      {routes.length===0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:A.textTer }}>
          <div style={{ fontSize:56, marginBottom:16 }}>⟳</div>
          <div style={{ fontSize:18, fontWeight:700, color:A.textSub, marginBottom:8 }}>لا توجد مسارات بعد</div>
          <div style={{ fontSize:13, marginBottom:24 }}>أنشئ أول مسار لتذاكرك وحدد وجهتها تلقائياً</div>
          <button className="route-action-btn" onClick={openCreate} style={{ padding:'12px 28px', borderRadius:12, background:A.accent, color:'#fff', border:'none', fontSize:14, fontWeight:700 }}>إنشاء أول مسار ✨</button>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
        {routes.map((route,idx) => (
          <div key={route.id} className="route-card" style={{ background:A.surface, borderRadius:A.radius, padding:18, boxShadow:A.shadowCard, border:`1.5px solid ${route.isActive?route.color+'33':'rgba(0,0,0,0.06)'}`, opacity:route.isActive?1:0.6, animationDelay:`${idx*0.05}s` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:route.isActive?route.color:'#ddd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{route.icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:route.isActive?A.text:A.textTer }}>{route.name}</div>
                  <div style={{ fontSize:11, color:A.textSub, marginTop:2 }}>{route.targetDepartmentName||'لا إدارة محددة'}</div>
                </div>
              </div>
              <button className="route-action-btn" onClick={() => toggleActive(route.id)} style={{ padding:'3px 10px', borderRadius:20, background:route.isActive?`${A.green}18`:A.bg, color:route.isActive?A.green:A.textTer, border:`1px solid ${route.isActive?A.green+'44':'transparent'}`, fontSize:10, fontWeight:700 }}>
                {route.isActive?'● نشط':'○ معطّل'}
              </button>
            </div>
            {route.description && <p style={{ fontSize:12, color:A.textSub, margin:'0 0 12px', lineHeight:1.5 }}>{route.description}</p>}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              {route.formConfig.customFieldIds.length>0 && <span className="tr-tag" style={{ background:`${A.purple}15`, color:A.purple }}>⬟ {route.formConfig.customFieldIds.length} مستدلة</span>}
              {route.formConfig.showAttachments && <span className="tr-tag" style={{ background:`${A.blue}15`, color:A.blue }}>📎 مرفقات</span>}
              {route.targetDivisionName && <span className="tr-tag" style={{ background:'rgba(0,0,0,0.05)', color:A.textSub }}>⊂ {route.targetDivisionName}</span>}
            </div>
            <div style={{ display:'flex', gap:8, paddingTop:10, borderTop:`1px solid ${A.sep}` }}>
              <button className="route-action-btn" onClick={() => openEdit(route)} style={{ flex:1, padding:'7px', borderRadius:8, background:A.bg, border:'none', fontSize:12, fontWeight:600, color:A.textSub }}>✏️ تعديل</button>
              {deleteConfirmId===route.id ? (
                <div style={{ display:'flex', gap:6, flex:1 }}>
                  <button className="route-action-btn" onClick={() => deleteRoute(route.id)} style={{ flex:1, padding:'7px', borderRadius:8, background:`${A.red}18`, border:'none', fontSize:11, fontWeight:700, color:A.red }}>تأكيد</button>
                  <button className="route-action-btn" onClick={() => setDeleteConfirmId(null)} style={{ flex:1, padding:'7px', borderRadius:8, background:A.bg, border:'none', fontSize:11, color:A.textSub }}>إلغاء</button>
                </div>
              ) : (
                <button className="route-action-btn" onClick={() => setDeleteConfirmId(route.id)} style={{ padding:'7px 12px', borderRadius:8, background:`${A.red}10`, border:'none', fontSize:12, color:A.red }}>🗑️</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWizard = () => (
    <div style={{ maxWidth:560, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:16, borderBottom:`1px solid ${A.sep}` }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:A.text }}>{editingId?'✏️ تعديل المسار':'✨ مسار جديد'}</h2>
          <p style={{ margin:'3px 0 0', fontSize:12, color:A.textSub }}>{wizard.name||'أدخل اسم المسار للبدء'}</p>
        </div>
        <button className="route-action-btn" onClick={cancelWizard} style={{ padding:'7px 14px', borderRadius:8, background:A.bg, border:'none', fontSize:13, color:A.textSub }}>× إلغاء</button>
      </div>
      {renderSteps()}
      <div style={{ minHeight:320 }}>
        {wizardStep===1 && renderStep1()}
        {wizardStep===2 && renderStep2()}
        {wizardStep===3 && renderStep3()}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:28, paddingTop:16, borderTop:`1px solid ${A.sep}` }}>
        {wizardStep>1 ? (
          <button className="route-action-btn" style={{ padding:'10px 20px', borderRadius:10, background:A.bg, border:'none', fontSize:13, color:A.textSub }} onClick={() => setWizardStep(prev => (prev-1) as WizardStep)}>← السابق</button>
        ) : <div />}
        {wizardStep<3 ? (
          <button className="route-action-btn"
            style={{ padding:'10px 24px', borderRadius:10, background:(wizardStep===1?step1Valid:step2Valid)?wizard.color:A.bg, color:(wizardStep===1?step1Valid:step2Valid)?'#fff':A.textTer, border:'none', fontSize:13, fontWeight:700, cursor:(wizardStep===1?step1Valid:step2Valid)?'pointer':'not-allowed' }}
            onClick={() => { if(wizardStep===1&&step1Valid) setWizardStep(2); if(wizardStep===2&&step2Valid) setWizardStep(3); }}>
            التالي →
          </button>
        ) : (
          <button className="route-action-btn"
            style={{ padding:'10px 24px', borderRadius:10, background:A.green, color:'#fff', border:'none', fontSize:13, fontWeight:700, boxShadow:`0 4px 12px ${A.green}44` }}
            onClick={saveRoute}>
            {editingId?'✓ حفظ التعديلات':'✓ حفظ المسار'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:A.font, direction:'rtl', minHeight:'100%', padding:'4px 0' }}>
      {view==='list' ? renderList() : renderWizard()}
    </div>
  );
};

export default TicketRoutingTab;
