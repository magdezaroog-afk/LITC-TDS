import React, { useState, useEffect } from 'react';
import type { OrgDepartment, OrgDivision } from './OperationalStructureTab';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
export interface IndicatorOption { id: string; label: string; isActive: boolean; }
export interface SubIssueIndicator { id: string; parentMainIssueId: string; label: string; options: IndicatorOption[]; isActive: boolean; }
export interface MainIssueIndicator { id: string; label: string; subIssues: SubIssueIndicator[]; isActive: boolean; }

export interface ChildFieldBinding {
  childFieldId: string;
  triggerValue: string; // The ID of the option in the parent field
}

export interface DynamicFieldOption {
  id: string;
  label: string;
  isActive: boolean;
}

export interface DynamicCustomField {
  id: string;
  name: string;
  options: DynamicFieldOption[];
  childBindings?: ChildFieldBinding[];
}

export interface RouteFormConfig {
  showBuildingField?: boolean;
  mandatoryBuilding?: boolean;
  showDepartmentField?: boolean;
  mandatoryDepartment?: boolean;
  showDescription: boolean;
  mandatoryDescription: boolean;
  showAttachments: boolean;
  mandatoryAttachments: boolean;
  attachmentTypes: string[];
  maxAttachmentMB: number;
  taxonomy: MainIssueIndicator[];
  customFieldIds: string[]; // Keep for legacy / simple arrays
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
  captured_historical_data?: any;
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
    .step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; transition:all 0.25s ease; }
    
    .field-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; }
    .field-card:hover { border-color: rgba(0,122,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .option-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,122,255,0.08); color: #007AFF !important; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-right: 6px; margin-bottom: 6px; }
    .add-subfield-btn { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 1px solid rgba(0,122,255,0.3); color: #007AFF !important; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; transition: all 0.2s; }
    .add-subfield-btn:hover { background: #007AFF; color: #fff !important; }
  `;
  document.head.appendChild(style);
};

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════
const defaultFormConfig = (): RouteFormConfig => ({
  showBuildingField: false, mandatoryBuilding: false,
  showDepartmentField: false, mandatoryDepartment: false,
  showDescription: true, mandatoryDescription: true,
  showAttachments: true, mandatoryAttachments: false,
  attachmentTypes: ['PDF','PNG','JPG'], maxAttachmentMB: 5,
  taxonomy: [], customFieldIds: [], routeDynamicFields: [],
});

const loadDynamicFields = async (): Promise<DynamicCustomField[]> => {
  try {
    const { AdminAPI } = await import('../../../services/admin.api');
    const res = await AdminAPI.getDynamicFields();
    return res.success && res.fields ? res.fields : [];
  } catch { return []; }
};
const saveDynamicFields = async (fields: DynamicCustomField[]) => {
  try {
    const { AdminAPI } = await import('../../../services/admin.api');
    await AdminAPI.saveDynamicFields(fields);
    window.dispatchEvent(new Event('litc_settings_updated'));
  } catch (e) {
    console.error("Failed to save dynamic fields", e);
  }
};
export const loadRoutes = async (): Promise<TicketRouteDefinition[]> => {
  try {
    const AdminAPI = (await import('../../../services/admin.api')).AdminAPI;
    const res = await AdminAPI.getRoutes();
    if (res.success && res.routes) {
      return res.routes;
    }
    return [];
  } catch { return []; }
};
const saveRoutes = async (routes: TicketRouteDefinition[]) => {
  try {
    const { AdminAPI } = await import('../../../services/admin.api');
    await AdminAPI.saveRoutesSnapshot(routes);
    window.dispatchEvent(new Event('litc_settings_updated'));
  } catch(e) {
    console.error("Failed to save routes", e);
  }
};

// ═══════════════════════════════════════════════════════════
// Component
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

export const TicketRoutingTab: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);

  const [routes, setRoutes] = useState<TicketRouteDefinition[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicCustomField[]>([]);
  
  const [view, setView] = useState<'list' | 'wizard'>('list');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [wizard, setWizard] = useState<WizardState>(defaultWizard());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Field Builder State
  const [isBuildingField, setIsBuildingField] = useState(false);
  const [fieldDraft, setFieldDraft] = useState<Partial<DynamicCustomField>>({ name: '', options: [] });
  const [draftOptionText, setDraftOptionText] = useState('');
  const [parentContext, setParentContext] = useState<{ parentFieldId: string; triggerOptionId: string } | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [showSubFieldModal, setShowSubFieldModal] = useState(false); // When choosing existing or new

  useEffect(() => {
    loadRoutes().then(setRoutes);
    
    // Fetch departments securely via API to avoid missing/invalid localStorage data
    import('../../../services/admin.api').then(mod => {
      mod.AdminAPI.getOperationalDepartments().then(res => {
        if (res && res.departments && Array.isArray(res.departments)) {
          setDepartments(res.departments);
        } else {
          setDepartments([]);
        }
      }).catch(() => setDepartments([]));
    });

    loadDynamicFields().then(setDynamicFields);
  }, []);

  const setW = (upd: Partial<WizardState>) => setWizard(p => ({ ...p, ...upd }));
  const setFC = (upd: Partial<RouteFormConfig>) => setWizard(p => ({ ...p, formConfig: { ...p.formConfig, ...upd } }));

  const openCreate = () => { setEditingId(null); setWizard(defaultWizard()); setWizardStep(1); setView('wizard'); };
  const openEdit = (route: TicketRouteDefinition) => {
    setEditingId(route.id);
    setWizard({
      name:route.name, description:route.description, icon:route.icon, color:route.color,
      targetDepartmentId:route.targetDepartmentId, targetDepartmentName:route.targetDepartmentName,
      targetDivisionId:route.targetDivisionId, targetDivisionName:route.targetDivisionName,
      formConfig: { ...route.formConfig, routeDynamicFields: [...(route.formConfig.routeDynamicFields || [])] }
    });
    setWizardStep(1); setView('wizard');
  };

  const handleSaveRoute = () => {
    const r: TicketRouteDefinition = {
      id: editingId || `route_${Date.now()}`,
      ...wizard,
      isActive: true,
      createdAt: editingId ? (routes.find(x=>x.id===editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let updated = [...routes];
    if (editingId) updated = updated.map(x => x.id === editingId ? r : x);
    else updated.push(r);
    
    setRoutes(updated);
    saveRoutes(updated);
    setView('list');
  };

  const toggleRouteStatus = (id: string) => {
    const updated = routes.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setRoutes(updated); saveRoutes(updated);
  };
  const deleteRoute = (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا المسار؟')) return;
    const updated = routes.filter(r => r.id !== id);
    setRoutes(updated); saveRoutes(updated);
  };

  const divisions = departments.find(d => d.id === wizard.targetDepartmentId)?.divisions || [];

  const toggleAttachType = (t: string) => {
    const arr = wizard.formConfig.attachmentTypes;
    if (arr.includes(t)) setFC({ attachmentTypes: arr.filter(x => x !== t) });
    else setFC({ attachmentTypes: [...arr, t] });
  };

  // ─── Dynamic Fields Builder Logic ───
  const startBuildingField = (parentCtx: { parentFieldId: string; triggerOptionId: string } | null = null) => {
    setParentContext(parentCtx);
    setEditingFieldId(null);
    setFieldDraft({ name: '', options: [] });
    setDraftOptionText('');
    setIsBuildingField(true);
  };

  const startEditingField = (field: DynamicCustomField) => {
    setParentContext(null);
    setEditingFieldId(field.id);
    setFieldDraft({ name: field.name, options: [...field.options] });
    setDraftOptionText('');
    setIsBuildingField(true);
  };

  const deleteDynamicField = (fieldId: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذه المستدلة تماماً؟ سيتم مسحها من جميع المسارات.')) return;
    const updated = dynamicFields.filter(f => f.id !== fieldId).map(f => ({
      ...f,
      childBindings: (f.childBindings || []).filter(cb => cb.childFieldId !== fieldId)
    }));
    setDynamicFields(updated);
    saveDynamicFields(updated);
    const current = wizard.formConfig.routeDynamicFields || [];
    setFC({ routeDynamicFields: current.filter(rf => rf.fieldId !== fieldId) });
  };

  const addDraftOption = () => {
    if (!draftOptionText.trim()) return;
    setFieldDraft(prev => ({
      ...prev,
      options: [...(prev.options || []), { id: `opt_${Date.now()}`, label: draftOptionText.trim(), isActive: true }]
    }));
    setDraftOptionText('');
  };

  const removeDraftOption = (optId: string) => {
    setFieldDraft(prev => ({ ...prev, options: (prev.options || []).filter(o => o.id !== optId) }));
  };

  const updateDraftOptionLabel = (optId: string, newLabel: string) => {
    setFieldDraft(prev => ({
      ...prev,
      options: (prev.options || []).map(o => o.id === optId ? { ...o, label: newLabel } : o)
    }));
  };

  const moveDraftOption = (index: number, direction: number) => {
    setFieldDraft(prev => {
      const opts = [...(prev.options || [])];
      if (index + direction < 0 || index + direction >= opts.length) return prev;
      const temp = opts[index];
      opts[index] = opts[index + direction];
      opts[index + direction] = temp;
      return { ...prev, options: opts };
    });
  };

  const saveFieldDraft = (asSubField: boolean) => {
    if (!fieldDraft.name?.trim() || !fieldDraft.options?.length) {
      alert('الرجاء إدخال اسم المستدلة وإضافة خيار واحد على الأقل.');
      return;
    }

    if (editingFieldId) {
      const updatedFields = dynamicFields.map(f => {
        if (f.id === editingFieldId) {
          return { ...f, name: fieldDraft.name!.trim(), options: fieldDraft.options || [] };
        }
        return f;
      });
      setDynamicFields(updatedFields);
      saveDynamicFields(updatedFields);
      setIsBuildingField(false);
      setEditingFieldId(null);
      return;
    }

    const newField: DynamicCustomField = {
      id: `df_${Date.now()}`,
      name: fieldDraft.name.trim(),
      options: fieldDraft.options || [],
      childBindings: asSubField && parentContext ? [{ childFieldId: `df_${Date.now()}`, triggerValue: parentContext.triggerOptionId }] : []
    };

    // If it's a subfield, we actually just save it as a normal field, but we UPDATE the parent field's childBindings
    if (asSubField && parentContext) {
      const updatedFields = dynamicFields.map(f => {
        if (f.id === parentContext.parentFieldId) {
          return {
            ...f,
            childBindings: [...(f.childBindings || []), { childFieldId: newField.id, triggerValue: parentContext.triggerOptionId }]
          };
        }
        return f;
      });
      updatedFields.push(newField);
      setDynamicFields(updatedFields);
      saveDynamicFields(updatedFields);
    } else {
      const updatedFields = [...dynamicFields, newField];
      setDynamicFields(updatedFields);
      saveDynamicFields(updatedFields);
      
      // Also attach it to the current route as a MAIN field
      const currentRouteFields = wizard.formConfig.routeDynamicFields || [];
      setFC({ routeDynamicFields: [...currentRouteFields, { fieldId: newField.id, isRequired: true }] });
    }

    setIsBuildingField(false);
    setParentContext(null);
  };

  const attachExistingAsSubField = (childFieldId: string) => {
    if (!parentContext) return;
    const updatedFields = dynamicFields.map(f => {
      if (f.id === parentContext.parentFieldId) {
        // Prevent duplicate binding
        const existing = (f.childBindings || []).find(cb => cb.childFieldId === childFieldId && cb.triggerValue === parentContext.triggerOptionId);
        if (existing) return f;
        return {
          ...f,
          childBindings: [...(f.childBindings || []), { childFieldId, triggerValue: parentContext.triggerOptionId }]
        };
      }
      return f;
    });
    setDynamicFields(updatedFields);
    saveDynamicFields(updatedFields);
    setShowSubFieldModal(false);
    setParentContext(null);
  };

  const unlinkMainField = (fieldId: string) => {
    const current = wizard.formConfig.routeDynamicFields || [];
    setFC({ routeDynamicFields: current.filter(f => f.fieldId !== fieldId) });
  };

  const unlinkSubField = (parentFieldId: string, triggerOptionId: string, childFieldId: string) => {
    const updatedFields = dynamicFields.map(f => {
      if (f.id === parentFieldId) {
        return {
          ...f,
          childBindings: (f.childBindings || []).filter(cb => !(cb.childFieldId === childFieldId && cb.triggerValue === triggerOptionId))
        };
      }
      return f;
    });
    setDynamicFields(updatedFields);
    saveDynamicFields(updatedFields);
  };

  const getParentContextTitle = () => {
    if (editingFieldId) return 'تعديل المستدلة';
    if (!parentContext) return 'إنشاء مستدلة أساسية';
    const pField = dynamicFields.find(f => f.id === parentContext.parentFieldId);
    const pOpt = pField?.options.find(o => o.id === parentContext.triggerOptionId);
    return `مستدلة فرعية مرتبطة بـ: ${pOpt?.label || 'خيار غير معروف'}`;
  };

  // Build a map of child fields for rendering
  const getChildFieldsForOption = (parentFieldId: string, optionId: string): DynamicCustomField[] => {
    const parent = dynamicFields.find(f => f.id === parentFieldId);
    if (!parent || !parent.childBindings) return [];
    const childIds = parent.childBindings.filter(cb => cb.triggerValue === optionId).map(cb => cb.childFieldId);
    return dynamicFields.filter(f => childIds.includes(f.id));
  };


  // ─── Rendering Steps ───
  const step1Valid = wizard.name.trim().length > 0;
  const step2Valid = !!wizard.targetDepartmentId;

  const renderSteps = () => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:30 }}>
      {([1,2,3] as WizardStep[]).map((s, i) => {
        const done = wizardStep > s; const active = wizardStep === s;
        return (
          <React.Fragment key={s}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className="step-dot" style={{ background:done?A.green:active?wizard.color:A.bg, color:(done||active)?'#fff':A.textTer, border:active?`2px solid ${wizard.color}`:done?'none':'2px solid rgba(0,0,0,0.1)' }}>
                {done ? '✓' : s}
              </div>
              <span style={{ fontSize:13, fontWeight:active?700:600, color:active?A.text:A.textTer }}>
                {s===1?'الأساسيات':s===2?'الواجهة والمستدلات':'تخصيص الفورم'}
              </span>
            </div>
            {i < 2 && <div style={{ width:40, height:2, background:done?A.green:A.sep }} />}
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
    </div>
  );

  const renderStep2 = () => {
    // Current attached main fields
    const attachedMainFields = dynamicFields.filter(f => (wizard.formConfig.routeDynamicFields || []).some(rf => rf.fieldId === f.id));
    // All available fields (for picking existing ones)
    const availableToAttach = dynamicFields.filter(f => !(wizard.formConfig.routeDynamicFields || []).some(rf => rf.fieldId === f.id));

    return (
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
        
        <div style={{ borderTop: `1px solid ${A.sep}`, paddingTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 14, border: `1px solid ${A.sep}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: A.textSub, marginBottom: 4 }}>حقول الموقع في نموذج الموظف</div>
            {/* Building field */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${!!wizard.formConfig.showBuildingField ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🏢</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل "المبنى والموقع"</div>
                  <div style={{ fontSize: 11, color: A.textTer }}>يطلب من الموظف تحديد مكانه</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!!wizard.formConfig.showBuildingField && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryBuilding ? A.red : A.textSub, fontWeight: 600, background: wizard.formConfig.mandatoryBuilding ? '#fef2f2' : '#f8fafc', padding: '3px 8px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryBuilding ? '#fecaca' : A.sep}`, transition: 'all 0.2s' }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={!!wizard.formConfig.mandatoryBuilding} onChange={e => setFC({ mandatoryBuilding: e.target.checked })} />
                    {wizard.formConfig.mandatoryBuilding ? '🔴 إلزامي' : '⚪ اختياري'}
                  </label>
                )}
                <div onClick={() => setFC({ showBuildingField: !wizard.formConfig.showBuildingField })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showBuildingField ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showBuildingField ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>
            {/* Department field */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${!!wizard.formConfig.showDepartmentField ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🏛️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل "الإدارة أو المكتب"</div>
                  <div style={{ fontSize: 11, color: A.textTer }}>يطلب من الموظف تحديد إدارته</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!!wizard.formConfig.showDepartmentField && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryDepartment ? A.red : A.textSub, fontWeight: 600, background: wizard.formConfig.mandatoryDepartment ? '#fef2f2' : '#f8fafc', padding: '3px 8px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryDepartment ? '#fecaca' : A.sep}`, transition: 'all 0.2s' }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={!!wizard.formConfig.mandatoryDepartment} onChange={e => setFC({ mandatoryDepartment: e.target.checked })} />
                    {wizard.formConfig.mandatoryDepartment ? '🔴 إلزامي' : '⚪ اختياري'}
                  </label>
                )}
                <div onClick={() => setFC({ showDepartmentField: !wizard.formConfig.showDepartmentField })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showDepartmentField ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showDepartmentField ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <label style={{ fontSize:14, fontWeight:700, color:A.text, margin:0 }}>المستدلات الديناميكية للمسار</label>
            {!isBuildingField && (
              <div style={{ display:'flex', gap:8 }}>
                <button className="route-action-btn" onClick={() => startBuildingField()} style={{ padding:'6px 12px', background:wizard.color, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:600 }}>+ مستدلة جديدة</button>
              </div>
            )}
          </div>

          {isBuildingField ? (
            <div className="field-card" style={{ border: `2px solid ${wizard.color}55` }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:A.text }}>{getParentContextTitle()}</div>
              <input className="tr-input" placeholder="اسم المستدلة (مثال: نوع العطل)" value={fieldDraft.name} onChange={e => setFieldDraft(p => ({ ...p, name: e.target.value }))} style={{ marginBottom:10 }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(fieldDraft.options || []).map((o, idx) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f5f5f7', padding: '6px 12px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={() => moveDraftOption(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: 0, fontSize: 10, color: A.textSub }}>▲</button>
                      <button onClick={() => moveDraftOption(idx, 1)} disabled={idx === (fieldDraft.options?.length || 0) - 1} style={{ background: 'none', border: 'none', cursor: idx === (fieldDraft.options?.length || 0) - 1 ? 'default' : 'pointer', opacity: idx === (fieldDraft.options?.length || 0) - 1 ? 0.3 : 1, padding: 0, fontSize: 10, color: A.textSub }}>▼</button>
                    </div>
                    <input 
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: A.text }} 
                      value={o.label}
                      onChange={e => updateDraftOptionLabel(o.id, e.target.value)}
                    />
                    <button onClick={() => removeDraftOption(o.id)} style={{ background: 'none', border: 'none', color: A.red, cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '4px 8px' }}>حذف</button>
                  </div>
                ))}

                <div style={{ display:'flex', gap:6, marginTop: 4 }}>
                  <input className="tr-input" placeholder="إضافة خيار جديد..." value={draftOptionText} onChange={e => setDraftOptionText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDraftOption()} style={{ flex: 1 }} />
                  <button onClick={addDraftOption} style={{ background:A.bg, border:`1px solid ${A.sep}`, borderRadius:8, padding:'0 14px', cursor:'pointer', fontWeight:600, color: A.text }}>إضافة خيار</button>
                </div>
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={() => { setIsBuildingField(false); setParentContext(null); setEditingFieldId(null); }} style={{ padding:'8px 16px', background:A.bg, color:A.textSub, border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}>إلغاء</button>
                <button onClick={() => saveFieldDraft(!!parentContext)} style={{ padding:'8px 16px', background:wizard.color, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}>{editingFieldId ? 'حفظ التعديلات' : 'حفظ المستدلة'}</button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {attachedMainFields.length === 0 ? (
                <div style={{ fontSize:12, color:A.textTer, textAlign:'center', padding:20, background:A.bg, borderRadius:12 }}>لا توجد مستدلات مرتبطة بهذا المسار بعد.</div>
              ) : (
                attachedMainFields.map(field => (
                  <div key={field.id} className="field-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:A.text }}>{field.name}</div>
                        {/* Required toggle for this dynamic field */}
                        {(() => {
                          const rf = (wizard.formConfig.routeDynamicFields || []).find(r => r.fieldId === field.id);
                          const isReq = rf?.isRequired ?? true;
                          return (
                            <div onClick={() => {
                              const updated = (wizard.formConfig.routeDynamicFields || []).map(r => r.fieldId === field.id ? { ...r, isRequired: !r.isRequired } : r);
                              setFC({ routeDynamicFields: updated });
                            }} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: isReq ? A.red : A.textSub, fontWeight: 600, background: isReq ? '#fef2f2' : '#f8fafc', padding: '2px 8px', borderRadius: 6, border: `1px solid ${isReq ? '#fecaca' : A.sep}`, transition: 'all 0.2s', userSelect: 'none' }}>
                              {isReq ? '🔴 إلزامي' : '⚪ اختياري'}
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => startEditingField(field)} style={{ background:'none', border:'none', color:A.blue, fontSize:12, cursor:'pointer', fontWeight:600 }}>تعديل</button>
                        <button onClick={() => unlinkMainField(field.id)} style={{ background:'none', border:'none', color:A.accent, fontSize:12, cursor:'pointer', fontWeight:600 }}>حذف القائمة</button>
                        <button onClick={() => deleteDynamicField(field.id)} style={{ background:'none', border:'none', color:A.red, fontSize:12, cursor:'pointer', fontWeight:600 }}>حذف نهائي</button>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {field.options.map(opt => {
                        const children = getChildFieldsForOption(field.id, opt.id);
                        return (
                          <div key={opt.id} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            <div style={{ display:'flex', alignItems:'center' }}>
                              <div className="option-tag" style={{ margin:0 }}>
                                {opt.label}
                                <button className="add-subfield-btn" onClick={() => { setParentContext({ parentFieldId: field.id, triggerOptionId: opt.id }); setShowSubFieldModal(true); }} title="إضافة مستدلة فرعية">+</button>
                              </div>
                            </div>
                            {/* Render Subfields inside a neat nested box */}
                            {children.length > 0 && (
                              <div style={{ marginRight: 20, padding: '10px 14px', background: A.bg, borderRadius: 10, borderRight: `3px solid ${wizard.color}66` }}>
                                {children.map(cf => (
                                  <div key={cf.id} style={{ marginBottom: 8, lastChild: { marginBottom: 0 } }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>↳ مستدلة فرعية: {cf.name}</div>
                                      <div style={{ display:'flex', gap:6 }}>
                                        <button onClick={() => startEditingField(cf)} style={{ background:'none', border:'none', color:A.blue, fontSize:11, cursor:'pointer', padding:0, fontWeight:600 }}>تعديل</button>
                                        <button onClick={() => unlinkSubField(field.id, opt.id, cf.id)} style={{ background:'none', border:'none', color:A.accent, fontSize:11, cursor:'pointer', padding:0, fontWeight:600 }}>حذف القائمة</button>
                                        <button onClick={() => deleteDynamicField(cf.id)} style={{ background:'none', border:'none', color:A.red, fontSize:11, cursor:'pointer', padding:0, fontWeight:600 }}>حذف نهائي</button>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      {cf.options.map(co => (
                                        <span key={co.id} style={{ fontSize: 11, background: '#fff', color: A.textSub, padding: '3px 8px', borderRadius: 6, border: `1px solid ${A.sep}`, fontWeight: 600 }}>{co.label}</span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Box to link existing main field */}
              {availableToAttach.length > 0 && (
                <div style={{ marginTop:10, padding:14, background:A.bg, borderRadius:12 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:A.textSub, marginBottom:8 }}>ربط مستدلة محفوظة مسبقاً:</div>
                  <select className="tr-input" onChange={e => {
                    if (e.target.value) {
                      const current = wizard.formConfig.routeDynamicFields || [];
                      setFC({ routeDynamicFields: [...current, { fieldId: e.target.value, isRequired: true }] });
                      e.target.value = '';
                    }
                  }}>
                    <option value="">-- اختر مستدلة محفوظة --</option>
                    {availableToAttach.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Subfield Modal Overlay */}
          {showSubFieldModal && parentContext && (
            <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
              <div style={{ background:'#fff', width:400, borderRadius:20, padding:24, boxShadow:A.shadow, animation:'scaleIn 0.2s both' }}>
                <h3 style={{ margin:'0 0 16px 0', fontSize:16, color:A.text }}>ربط مستدلة فرعية</h3>
                <p style={{ fontSize:13, color:A.textSub, marginBottom:20 }}>هل تريد إنشاء مستدلة فرعية جديدة أم ربط واحدة محفوظة مسبقاً؟</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <button onClick={() => { setShowSubFieldModal(false); startBuildingField(parentContext); }} style={{ padding:'12px', background:wizard.color, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>إنشاء مستدلة فرعية جديدة</button>
                  <div style={{ height:1, background:A.sep, margin:'8px 0' }} />
                  <select className="tr-input" onChange={e => { if(e.target.value) { attachExistingAsSubField(e.target.value); } }}>
                    <option value="">-- أو اختر مستدلة محفوظة لربطها --</option>
                    {dynamicFields.filter(f => f.id !== parentContext.parentFieldId).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop:24, textAlign:'center' }}>
                  <button onClick={() => { setShowSubFieldModal(false); setParentContext(null); }} style={{ padding:'8px 16px', background:A.bg, color:A.textSub, border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>إلغاء</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', flexDirection: 'column', gap: 10 }}>
        {/* Description Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: 12, border: `1px solid ${wizard.formConfig.showDescription ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل وصف المشكلة</div>
              <div style={{ fontSize: 11, color: A.textTer }}>مربع نص يكتب فيه الموظف تفاصيل المشكلة</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {wizard.formConfig.showDescription && (
              <div onClick={() => setFC({ mandatoryDescription: !wizard.formConfig.mandatoryDescription })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryDescription ? A.red : A.textSub, fontWeight: 600, background: wizard.formConfig.mandatoryDescription ? '#fef2f2' : '#f8fafc', padding: '3px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryDescription ? '#fecaca' : A.sep}`, transition: 'all 0.2s', userSelect: 'none' }}>
                {wizard.formConfig.mandatoryDescription ? '🔴 إلزامي' : '⚪ اختياري'}
              </div>
            )}
            <div onClick={() => setFC({ showDescription: !wizard.formConfig.showDescription })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showDescription ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showDescription ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>
        {/* Attachments Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: 12, border: `1px solid ${wizard.formConfig.showAttachments ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📎</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل رفع المرفقات</div>
              <div style={{ fontSize: 11, color: A.textTer }}>يتيح للموظف رفع ملفات وصور مع الطلب</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {wizard.formConfig.showAttachments && (
              <div onClick={() => setFC({ mandatoryAttachments: !wizard.formConfig.mandatoryAttachments })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryAttachments ? A.red : A.textSub, fontWeight: 600, background: wizard.formConfig.mandatoryAttachments ? '#fef2f2' : '#f8fafc', padding: '3px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryAttachments ? '#fecaca' : A.sep}`, transition: 'all 0.2s', userSelect: 'none' }}>
                {wizard.formConfig.mandatoryAttachments ? '🔴 إلزامي' : '⚪ اختياري'}
              </div>
            )}
            <div onClick={() => setFC({ showAttachments: !wizard.formConfig.showAttachments })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showAttachments ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showAttachments ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
          </div>
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
      {/* ═══════ INTERACTIVE LIVE PREVIEW ═══════ */}
      <div style={{ padding:20, background:'linear-gradient(135deg, #667eea15, #764ba220, #f093fb10)', borderRadius:16, border:'1px solid rgba(88,86,214,0.12)', position:'relative', overflow:'hidden' }}>
        {/* Decorative animated dots */}
        <div style={{ position:'absolute', top:8, left:16, display:'flex', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#FF5F57' }} />
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#FEBC2E' }} />
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#28C840' }} />
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:A.purple, marginBottom:16, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>👁️</span> معاينة تفاعلية مباشرة
          <span style={{ fontSize:9, padding:'3px 8px', borderRadius:20, background:'rgba(88,86,214,0.1)', color:A.purple, fontWeight:600 }}>LIVE</span>
        </div>

        {/* Phone-style mockup frame */}
        <div style={{ maxWidth:380, margin:'0 auto', background:'#FFFFFF', borderRadius:24, boxShadow:'0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)', overflow:'hidden', border:'1px solid rgba(0,0,0,0.06)' }}>
          {/* Phone notch bar */}
          <div style={{ padding:'10px 16px 8px', background:`linear-gradient(135deg, ${wizard.color}, ${wizard.color}CC)`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{wizard.icon || '📋'}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>{wizard.name || 'اسم المسار'}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.8)', marginTop:1 }}>→ {wizard.targetDepartmentName || 'الإدارة المستقبلة'}</div>
              </div>
            </div>
            <div style={{ width:24, height:24, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, cursor:'pointer' }}>✕</div>
          </div>

          {/* Form body */}
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

            {/* ── Dynamic Fields with Child Bindings ── */}
            {(() => {
              const rdfs = wizard.formConfig.routeDynamicFields || [];
              if (rdfs.length === 0) return null;

              // Gather all fields and render with interactive child discovery
              const visitedIds = new Set<string>();
              const renderFieldChain = (fieldId: string, isRequired: boolean, depth: number = 0): React.ReactNode => {
                // Guard against circular references and excessive depth
                if (visitedIds.has(fieldId) || depth > 5) return null;
                visitedIds.add(fieldId);
                const field = dynamicFields.find(f => f.id === fieldId);
                if (!field) return null;

                const activeOpts = field.options.filter(o => o.isActive);
                const hasChildren = field.childBindings && field.childBindings.length > 0;

                return (
                  <div key={fieldId} style={{
                    marginRight: depth > 0 ? 16 : 0,
                    borderRight: depth > 0 ? `2px solid ${wizard.color}30` : 'none',
                    paddingRight: depth > 0 ? 12 : 0,
                    animation: depth > 0 ? 'dftFade 0.3s both' : 'none',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                      <div style={{
                        width:22, height:22, borderRadius:6,
                        background: depth === 0 ? `${wizard.color}15` : `${A.purple}12`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:11
                      }}>
                        {depth === 0 ? '📋' : '🔗'}
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color:A.text }}>{field.name}</span>
                      {isRequired && <span style={{ fontSize:10, color:A.red, fontWeight:700 }}>*</span>}
                      {hasChildren && (
                        <span style={{ fontSize:8, padding:'2px 6px', borderRadius:10, background:`${A.blue}15`, color:A.blue, fontWeight:600, marginRight:'auto' }}>
                          تفرعات
                        </span>
                      )}
                    </div>
                    <div style={{
                      padding:'10px 12px', borderRadius:10,
                      background:'#F8F9FC',
                      border:'1.5px solid #E8ECF4',
                      fontSize:12, color:A.textTer,
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      transition:'border-color 0.2s'
                    }}>
                      <span>-- اختر {field.name} --</span>
                      <span style={{ fontSize:10, transform:'rotate(-90deg)', color:'#C0C4CC' }}>‹</span>
                    </div>

                    {/* Show sample options as chips */}
                    {activeOpts.length > 0 && (
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
                        {activeOpts.slice(0, 4).map(opt => (
                          <span key={opt.id} style={{
                            fontSize:9, padding:'3px 8px', borderRadius:12,
                            background:`${wizard.color}08`, color:wizard.color,
                            border:`1px solid ${wizard.color}20`, fontWeight:500
                          }}>
                            {opt.label}
                          </span>
                        ))}
                        {activeOpts.length > 4 && (
                          <span style={{ fontSize:9, padding:'3px 8px', borderRadius:12, background:'#f0f0f0', color:A.textTer }}>
                            +{activeOpts.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Render child bindings */}
                    {hasChildren && (
                      <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:10 }}>
                        {field.childBindings!.map(binding => {
                          const triggerOpt = activeOpts.find(o => o.id === binding.triggerValue);
                          return (
                            <div key={binding.childFieldId}>
                              <div style={{ fontSize:9, color:A.textTer, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                                <span style={{ color:A.blue }}>↳</span>
                                عند اختيار: <span style={{ fontWeight:600, color:A.blue }}>{triggerOpt ? triggerOpt.label : binding.triggerValue}</span>
                              </div>
                              {renderFieldChain(binding.childFieldId, true, depth + 1)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <div style={{ width:18, height:18, borderRadius:5, background:`${wizard.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>📊</div>
                    <span style={{ fontSize:11, fontWeight:700, color:A.text }}>البيانات المطلوبة</span>
                    <div style={{ flex:1, height:1, background:A.sep, marginRight:4 }} />
                  </div>
                  {rdfs.map(rdf => renderFieldChain(rdf.fieldId, rdf.isRequired, 0))}
                </div>
              );
            })()}

            {/* ── Building / Department Fields ── */}
            {(wizard.formConfig.showBuildingField || wizard.formConfig.showDepartmentField) && (
              <div style={{ display: 'grid', gridTemplateColumns: wizard.formConfig.showBuildingField && wizard.formConfig.showDepartmentField ? '1fr 1fr' : '1fr', gap: 8 }}>
                {wizard.formConfig.showBuildingField && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🏢</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: A.text }}>المبنى والموقع</span>
                      {wizard.formConfig.mandatoryBuilding && <span style={{ fontSize: 9, color: A.red, fontWeight: 700 }}>*</span>}
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: '#F8F9FC', border: '1.5px solid #E8ECF4', fontSize: 11, color: A.textTer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>-- اختر الموقع --</span><span style={{ fontSize: 9, transform: 'rotate(-90deg)', color: '#C0C4CC' }}>‹</span>
                    </div>
                  </div>
                )}
                {wizard.formConfig.showDepartmentField && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🏛️</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: A.text }}>الإدارة</span>
                      {wizard.formConfig.mandatoryDepartment && <span style={{ fontSize: 9, color: A.red, fontWeight: 700 }}>*</span>}
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: '#F8F9FC', border: '1.5px solid #E8ECF4', fontSize: 11, color: A.textTer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>-- اختر الإدارة --</span><span style={{ fontSize: 9, transform: 'rotate(-90deg)', color: '#C0C4CC' }}>‹</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {wizard.formConfig.showDescription && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'#FFF3E0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✏️</div>
                  <span style={{ fontSize:12, fontWeight:600, color:A.text }}>وصف المشكلة</span>
                  {wizard.formConfig.mandatoryDescription && <span style={{ fontSize:10, color:A.red, fontWeight:700 }}>*</span>}
                </div>
                <div style={{
                  padding:'10px 12px', borderRadius:10,
                  background:'#F8F9FC', border:'1.5px solid #E8ECF4',
                  minHeight:60, fontSize:12, color:A.textTer,
                  lineHeight:1.6
                }}>
                  اكتب وصفاً تفصيلياً للمشكلة...
                </div>
              </div>
            )}

            {/* ── Attachments Field ── */}
            {wizard.formConfig.showAttachments && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:'#E8F5E9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>📎</div>
                  <span style={{ fontSize:12, fontWeight:600, color:A.text }}>المرفقات</span>
                  {wizard.formConfig.mandatoryAttachments && <span style={{ fontSize:10, color:A.red, fontWeight:700 }}>*</span>}
                </div>
                <div style={{
                  padding:'14px 12px', borderRadius:10,
                  background:'#FAFBFE',
                  border:'2px dashed #D0D5E0',
                  textAlign:'center',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6
                }}>
                  <div style={{ fontSize:24, opacity:0.5 }}>☁️</div>
                  <div style={{ fontSize:11, color:A.textSub, fontWeight:500 }}>اسحب الملفات هنا أو انقر للرفع</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center', marginTop:4 }}>
                    {wizard.formConfig.attachmentTypes.map(t => (
                      <span key={t} style={{ fontSize:8, padding:'2px 6px', borderRadius:6, background:'#E8ECF4', color:A.textSub, fontWeight:600 }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:A.textTer }}>الحجم الأقصى: {wizard.formConfig.maxAttachmentMB} MB</div>
                </div>
              </div>
            )}

            {/* ── Submit Button ── */}
            <div style={{
              padding:'12px 16px', marginTop:4,
              background:`linear-gradient(135deg, ${wizard.color}, ${wizard.color}DD)`,
              borderRadius:12, textAlign:'center',
              fontSize:13, fontWeight:700, color:'#fff',
              boxShadow:`0 4px 16px ${wizard.color}40`,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              cursor:'pointer', transition:'transform 0.15s',
            }}>
              <span>إرسال الطلب</span>
              <span style={{ fontSize:16 }}>🚀</span>
            </div>
          </div>

          {/* Phone bottom bar */}
          <div style={{ height:4, width:100, margin:'8px auto 12px', borderRadius:4, background:'rgba(0,0,0,0.12)' }} />
        </div>
      </div>
    </div>
  );

  const renderList = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {routes.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:A.textTer }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🛤️</div>
          <div style={{ fontSize:16, fontWeight:600, color:A.textSub }}>لا توجد مسارات تذاكر</div>
          <div style={{ fontSize:13, marginTop:8 }}>قم ببناء المسار الأول لتوجيه طلبات الموظفين</div>
          <button className="route-action-btn" onClick={openCreate} style={{ marginTop:24, background:A.blue, color:'#fff', border:'none', padding:'10px 24px', borderRadius:10, fontSize:14, fontWeight:700, boxShadow:`0 4px 12px ${A.blue}40` }}>+ مسار جديد</button>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="route-action-btn" onClick={openCreate} style={{ background:A.blue, color:'#fff', border:'none', padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700, boxShadow:`0 4px 12px ${A.blue}40` }}>+ إنشاء مسار</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
            {routes.map(r => (
              <div key={r.id} className="route-card" style={{ background:A.surface, borderRadius:A.radius, padding:20, boxShadow:A.shadowCard, border:`1px solid ${A.sep}`, borderLeft:`4px solid ${r.color}`, opacity:r.isActive?1:0.6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ display:'flex', gap:12 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:`${r.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{r.icon}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:A.text }}>{r.name}</div>
                      <div style={{ fontSize:12, color:A.textSub, marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:r.isActive?A.green:A.red }} />
                        {r.isActive?'نشط':'متوقف'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="route-action-btn" onClick={() => openEdit(r)} style={{ background:A.bg, border:'none', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚙️</button>
                    <button className="route-action-btn" onClick={() => deleteRoute(r.id)} style={{ background:'#FFF0F0', color:A.red, border:'none', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🗑</button>
                  </div>
                </div>
                <div style={{ background:A.bg, padding:10, borderRadius:8, fontSize:12, color:A.textSub, display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span>الإدارة:</span><strong style={{ color:A.text }}>{r.targetDepartmentName}</strong></div>
                  {r.targetDivisionName && <div style={{ display:'flex', justifyContent:'space-between' }}><span>القسم:</span><strong style={{ color:A.text }}>{r.targetDivisionName}</strong></div>}
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span>المستدلات:</span><strong style={{ color:A.text }}>{(r.formConfig.routeDynamicFields||[]).length} حقول</strong></div>
                </div>
                <div style={{ marginTop:14, borderTop:`1px solid ${A.sep}`, paddingTop:14, display:'flex', gap:8 }}>
                  <button className="route-action-btn" onClick={() => toggleRouteStatus(r.id)} style={{ flex:1, padding:'8px', background:r.isActive?`${A.red}15`:`${A.green}15`, color:r.isActive?A.red:A.green, border:'none', borderRadius:8, fontSize:12, fontWeight:700 }}>
                    {r.isActive ? 'إيقاف المسار' : 'تفعيل المسار'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'fadeSlideIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: A.text, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>منشئ مسارات التذاكر 🛤️</h2>
          <p style={{ fontSize: 14, color: A.textSub, margin: 0 }}>تصميم تدفق الطلبات، ربط الإدارات، وبناء المستدلات الديناميكية</p>
        </div>
      </div>

      {view === 'list' ? renderList() : (
        <div style={{ background: A.surface, borderRadius: A.radius, padding: 30, boxShadow: A.shadowCard, border: `1px solid ${A.sep}` }}>
          {renderSteps()}
          {wizardStep===1 && renderStep1()}
          {wizardStep===2 && renderStep2()}
          {wizardStep===3 && renderStep3()}

          <div style={{ marginTop:30, paddingTop:20, borderTop:`1px solid ${A.sep}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button className="route-action-btn" style={{ padding:'10px 20px', borderRadius:10, background:A.bg, border:'none', fontSize:13, color:A.textSub }} onClick={() => setView('list')}>إلغاء</button>
            <div style={{ display:'flex', gap:10 }}>
              {wizardStep>1 ? (
                <button className="route-action-btn" style={{ padding:'10px 20px', borderRadius:10, background:A.bg, border:'none', fontSize:13, color:A.textSub }} onClick={() => setWizardStep(prev => (prev-1) as WizardStep)}>← السابق</button>
              ) : <div/>}
              {wizardStep<3 ? (
                <button className="route-action-btn" 
                  style={{ padding:'10px 24px', borderRadius:10, background:(wizardStep===1?step1Valid:step2Valid)?wizard.color:A.bg, color:(wizardStep===1?step1Valid:step2Valid)?'#fff':A.textTer, border:'none', fontSize:13, fontWeight:700, cursor:(wizardStep===1?step1Valid:step2Valid)?'pointer':'not-allowed' }}
                  onClick={() => { if(wizardStep===1&&step1Valid) setWizardStep(2); if(wizardStep===2&&step2Valid) setWizardStep(3); }}>
                  التالي →
                </button>
              ) : (
                <button className="route-action-btn" style={{ padding:'10px 24px', borderRadius:10, background:wizard.color, color:'#fff', border:'none', fontSize:13, fontWeight:700 }} onClick={handleSaveRoute}>
                  {editingId ? 'حفظ التعديلات ✔' : 'إنشاء المسار 🚀'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
