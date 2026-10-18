import React, { useState, useEffect } from 'react';
import type { OrgDepartment, OrgDivision } from './OperationalStructureTab';
import * as LucideIcons from 'lucide-react';
import {
  type IndicatorOption,
  type SubIssueIndicator,
  type MainIssueIndicator,
  type ChildFieldBinding,
  type DynamicFieldOption,
  type DynamicCustomField,
  type RouteFormConfig,
  type RouteFormStage,
  type TicketRouteDefinition,
  defaultFormConfig,
  normalizeRoute,
  loadRoutes,
  saveRoutes,
  loadDynamicFields,
  saveDynamicFields,
} from '../../../services/ticketRouting.helpers';

export type {
  IndicatorOption,
  SubIssueIndicator,
  MainIssueIndicator,
  ChildFieldBinding,
  DynamicFieldOption,
  DynamicCustomField,
  RouteFormConfig,
  RouteFormStage,
  TicketRouteDefinition,
};

// ═══════════════════════════════════════════════════════════
// Constants & Styling
// ═══════════════════════════════════════════════════════════
const ICONS = ['Monitor', 'Building2', 'ClipboardList', 'Wrench', 'Radio', 'Lock', 'BarChart3', 'HeartPulse', 'Phone', 'Printer', 'Zap', 'Globe', 'Archive', 'Smartphone', 'Key'];
const COLORS = ['#007AFF','#5856D6','#FF9500','#FF3B30','#34C759','#AF52DE','#FF6B35','#00C7BE','#30B0C7','#636567'];

const renderIcon = (name: string, size: number = 24, color?: string) => {
  const emojiMap: Record<string, string> = {
    '💻': 'Monitor', '🏗️': 'Building2', '📋': 'ClipboardList', '🔧': 'Wrench',
    '📡': 'Radio', '🔒': 'Lock', '📊': 'BarChart3', '🏥': 'HeartPulse',
    '📞': 'Phone', '🖨️': 'Printer', '⚡': 'Zap', '🌐': 'Globe',
    '🗄️': 'Archive', '📱': 'Smartphone', '🔑': 'Key'
  };
  const iconName = emojiMap[name] || name;
  const IconComp = (LucideIcons as any)[iconName] || LucideIcons.FileQuestion;
  return <IconComp size={size} color={color || 'currentColor'} strokeWidth={2.5} />;
};

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
    @keyframes toastIn { from { opacity:0; transform:translateY(-20px) scale(0.95);} to { opacity:1; transform:translateY(0) scale(1);} }
    @keyframes toastOut { from { opacity:1; transform:translateY(0) scale(1);} to { opacity:0; transform:translateY(-16px) scale(0.95);} }
    @keyframes spin { from { transform:rotate(0deg);} to { transform:rotate(360deg);} }
    @keyframes dftFade { from { opacity:0; transform:translateY(6px);} to { opacity:1; transform:translateY(0);} }
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
    .tr-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:99999; display:flex; align-items:center; gap:10px; padding:12px 20px; border-radius:14px; font-size:13px; font-weight:600; box-shadow:0 8px 32px rgba(0,0,0,0.18); animation:toastIn 0.3s cubic-bezier(0.28,0.11,0.32,1) both; min-width:220px; max-width:400px; }
    .tr-toast.success { background:#1C1C1E; color:#fff; border:1px solid rgba(52,199,89,0.3); }
    .tr-toast.error { background:#1C1C1E; color:#fff; border:1px solid rgba(255,59,48,0.4); }
    .tr-toast.loading { background:#1C1C1E; color:#fff; border:1px solid rgba(255,255,255,0.12); }
  `;
  document.head.appendChild(style);
};

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════
type WizardStep = 1 | 2 | 3;
interface WizardState {
  name: string; description: string; icon: string; color: string;
  targetDepartmentId: string; targetDepartmentName: string;
  targetDivisionId: string; targetDivisionName: string;
  targetTeamId?: string; targetTeamName?: string;
  managerId: string; managerName: string;
  formConfig: RouteFormConfig;
}
const defaultWizard = (): WizardState => ({
  name: '', description: '', icon: 'Monitor', color: '#007AFF',
  targetDepartmentId: '', targetDepartmentName: '',
  targetDivisionId: '', targetDivisionName: '',
  targetTeamId: '', targetTeamName: '',
  managerId: '', managerName: '',
  formConfig: defaultFormConfig(),
});

// ─── Toast Component ─────────────────────────────────────────────────────────
interface ToastState { message: string; type: 'success' | 'error' | 'loading'; visible: boolean; }

export const TicketRoutingTab: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);

  const [routes, setRoutes] = useState<TicketRouteDefinition[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicCustomField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  
  const showToast = (message: string, type: ToastState['type'], duration = 3000) => {
    setToast({ message, type, visible: true });
    if (type !== 'loading') {
      setTimeout(() => setToast(t => ({ ...t, visible: false })), duration);
    }
  };

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

  // Flow Manager Selection State
  const [candidateManagers, setCandidateManagers] = useState<any[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  useEffect(() => {
    if (!wizard.targetDepartmentId) {
      setCandidateManagers([]);
      return;
    }
    setIsLoadingCandidates(true);
    const query = new URLSearchParams({
      departmentId: wizard.targetDepartmentId,
      ...(wizard.targetDivisionId ? { divisionId: wizard.targetDivisionId } : {}),
      ...(wizard.targetTeamId ? { teamId: wizard.targetTeamId } : {})
    });
    const token = localStorage.getItem('litc_token');
    fetch(`/api/v1/flow-governance/candidate-managers?${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.candidates)) {
          setCandidateManagers(res.candidates);
          // If wizard already has a managerId, ensure its managerName is filled from candidate list
          if (wizard.managerId) {
            const current = res.candidates.find((c: any) => String(c.id) === String(wizard.managerId));
            if (current && !wizard.managerName) {
              setW({ managerName: current.name });
            }
          } else {
            // Pre-select suggested manager only if no manager is currently selected
            const suggested = res.candidates.find((c: any) => c.isSuggested);
            if (suggested) {
              setW({ managerId: String(suggested.id), managerName: suggested.name });
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingCandidates(false));
  }, [wizard.targetDepartmentId, wizard.targetDivisionId, wizard.targetTeamId]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      loadRoutes(),
      loadDynamicFields(),
      import('../../../services/admin.api').then(mod =>
        mod.AdminAPI.getOperationalDepartments()
          .then(res => (res?.departments && Array.isArray(res.departments) ? res.departments : []))
          .catch(() => [])
      ),
    ]).then(([fetchedRoutes, fetchedFields, fetchedDepts]) => {
      setRoutes(fetchedRoutes);
      setDynamicFields(fetchedFields);
      setDepartments(fetchedDepts);
    }).catch(() => {
      showToast('فشل في تحميل البيانات، تحقق من اتصالك بالسيرفر', 'error');
    }).finally(() => setIsLoading(false));
  }, []);

  const setW = (upd: Partial<WizardState>) => setWizard(p => ({ ...p, ...upd }));
  const setFC = (upd: Partial<RouteFormConfig>) => setWizard(p => ({ ...p, formConfig: { ...p.formConfig, ...upd } }));

  const openCreate = () => { setEditingId(null); setWizard(defaultWizard()); setWizardStep(1); setView('wizard'); };
  const openEdit = (route: TicketRouteDefinition) => {
    const r = normalizeRoute(route);
    setEditingId(r.id);
    setWizard({
      name: r.name, description: r.description, icon: r.icon, color: r.color,
      targetDepartmentId: r.targetDepartmentId, targetDepartmentName: r.targetDepartmentName,
      targetDivisionId: r.targetDivisionId, targetDivisionName: r.targetDivisionName,
      targetTeamId: r.targetTeamId || '', targetTeamName: r.targetTeamName || '',
      managerId: r.managerId ? String(r.managerId) : '', managerName: r.managerName || '',
      formConfig: { ...r.formConfig, routeDynamicFields: [...(r.formConfig.routeDynamicFields || [])] }
    });
    setWizardStep(1); setView('wizard');
  };

  const handleSaveRoute = async () => {
    setIsSaving(true);
    showToast('جارٍ الحفظ...', 'loading');
    const r: TicketRouteDefinition = {
      id: editingId || `route_${Date.now()}`,
      ...wizard,
      managerId: wizard.managerId ? String(wizard.managerId) : undefined,
      managerName: wizard.managerName || undefined,
      isActive: true,
      createdAt: editingId ? (routes.find(x=>x.id===editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let updated = [...routes];
    if (editingId) updated = updated.map(x => x.id === editingId ? r : x);
    else updated.push(r);

    try {
      const normalizedRoutes = await saveRoutes(updated);
      setRoutes(normalizedRoutes); // ✅ Use server-returned normalized routes
      setView('list');
      showToast(editingId ? '✅ تم تحديث المسار بنجاح' : '✅ تم إنشاء المسار بنجاح', 'success');
    } catch (err: any) {
      showToast(`❌ فشل الحفظ: ${err?.message || 'خطأ في الاتصال بالخادم'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRouteStatus = async (id: string) => {
    const route = routes.find(r => r.id === id);
    const updated = routes.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    showToast('جارٍ التحديث...', 'loading');
    try {
      const normalizedRoutes = await saveRoutes(updated);
      setRoutes(normalizedRoutes);
      showToast(route?.isActive ? '⏸ تم إيقاف المسار' : '✅ تم تفعيل المسار', 'success');
    } catch (err: any) {
      showToast(`❌ فشل تحديث حالة المسار: ${err?.message || 'خطأ في الاتصال'}`, 'error');
    }
  };

  const deleteRoute = async (id: string) => {
    const route = routes.find(r => r.id === id);
    if (!window.confirm(`هل أنت متأكد من حذف مسار "${route?.name || ''}"؟`)) return;
    const updated = routes.filter(r => r.id !== id);
    showToast('جارٍ الحذف...', 'loading');
    try {
      const normalizedRoutes = await saveRoutes(updated);
      setRoutes(normalizedRoutes);
      showToast('🗑 تم حذف المسار بنجاح', 'success');
    } catch (err: any) {
      showToast(`❌ فشل حذف المسار: ${err?.message || 'خطأ في الاتصال'}`, 'error');
    }
  };

  const duplicateRoute = async (route: TicketRouteDefinition) => {
    showToast('جارٍ استنساخ المسار...', 'loading');
    try {
      const clonedRoute: TicketRouteDefinition = {
        ...JSON.parse(JSON.stringify(route)),
        id: `route_${Date.now()}`,
        name: `${route.name} (نسخة)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [clonedRoute, ...routes];
      const normalizedRoutes = await saveRoutes(updated);
      setRoutes(normalizedRoutes);
      showToast('✅ تم استنساخ المسار بنجاح ويمكنك تعديل تفاصيله الآن', 'success');
    } catch (err: any) {
      showToast(`❌ فشل استنساخ المسار: ${err?.message || 'خطأ في الاتصال'}`, 'error');
    }
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
    let autoName = '';
    if (parentCtx) {
      const parent = dynamicFields.find(f => f.id === parentCtx.parentFieldId);
      const opt = parent?.options.find(o => o.id === parentCtx.triggerOptionId);
      autoName = opt?.label || 'مستدلة فرعية';
    }
    setFieldDraft({ name: autoName, options: [] });
    setDraftOptionText('');
    setIsBuildingField(true);
  };

  const startEditingField = (field: DynamicCustomField, parentCtx: { parentFieldId: string; triggerOptionId: string } | null = null) => {
    setParentContext(parentCtx);
    setEditingFieldId(field.id);
    setFieldDraft({ name: field.name, options: [...field.options] });
    setDraftOptionText('');
    setIsBuildingField(true);
  };

  const deleteDynamicField = async (fieldId: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذه المستدلة تماماً؟ سيتم مسحها من جميع المسارات.')) return;
    const updated = dynamicFields.filter(f => f.id !== fieldId).map(f => ({
      ...f,
      childBindings: (f.childBindings || []).filter(cb => cb.childFieldId !== fieldId)
    }));
    const result = await saveDynamicFields(updated);
    if (result.success) {
      setDynamicFields(updated);
      const current = wizard.formConfig.routeDynamicFields || [];
      setFC({ routeDynamicFields: current.filter(rf => rf.fieldId !== fieldId) });
      showToast('🗑 تم حذف المستدلة', 'success');
    } else {
      showToast(`❌ ${result.error || 'فشل في حذف المستدلة'}`, 'error');
    }
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

  const saveFieldDraft = async (asSubField: boolean) => {
    let finalName = (fieldDraft.name || '').trim();
    if (asSubField && parentContext && (!finalName || finalName === 'مستدلة فرعية')) {
      const parent = dynamicFields.find(f => f.id === parentContext.parentFieldId);
      const opt = parent?.options.find(o => o.id === parentContext.triggerOptionId);
      if (opt?.label) finalName = opt.label;
    }
    if (!finalName || !fieldDraft.options?.length) {
      showToast(asSubField ? 'الرجاء إضافة خيار فرعي واحد على الأقل.' : 'الرجاء إدخال اسم المستدلة وإضافة خيار واحد على الأقل.', 'error');
      return;
    }

    if (editingFieldId) {
      const updatedFields = dynamicFields.map(f => {
        if (f.id === editingFieldId) {
          return { ...f, name: finalName, options: fieldDraft.options || [] };
        }
        return f;
      });
      const result = await saveDynamicFields(updatedFields);
      if (result.success) {
        setDynamicFields(updatedFields);
        showToast('✅ تم تحديث المستدلة بنجاح', 'success');
      } else {
        showToast(`❌ ${result.error || 'فشل في تحديث المستدلة'}`, 'error');
      }
      setIsBuildingField(false);
      setEditingFieldId(null);
      return;
    }

    const newField: DynamicCustomField = {
      id: `df_${Date.now()}`,
      name: finalName,
      options: fieldDraft.options || [],
      childBindings: []
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
      const result = await saveDynamicFields(updatedFields);
      if (result.success) {
        setDynamicFields(updatedFields);
        showToast('✅ تم إضافة المستدلة الفرعية بنجاح', 'success');
      } else {
        showToast(`❌ ${result.error || 'فشل في حفظ المستدلة الفرعية'}`, 'error');
      }
    } else {
      const updatedFields = [...dynamicFields, newField];
      const result = await saveDynamicFields(updatedFields);
      if (result.success) {
        setDynamicFields(updatedFields);
        // Also attach it to the current route as a MAIN field
        const currentRouteFields = wizard.formConfig.routeDynamicFields || [];
        setFC({ routeDynamicFields: [...currentRouteFields, { fieldId: newField.id, isRequired: true }] });
        showToast('✅ تم إنشاء المستدلة وربطها بالمسار', 'success');
      } else {
        showToast(`❌ ${result.error || 'فشل في حفظ المستدلة'}`, 'error');
      }
    }

    setIsBuildingField(false);
    setParentContext(null);
  };

  const attachExistingAsSubField = async (childFieldId: string) => {
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
    const result = await saveDynamicFields(updatedFields);
    if (result.success) {
      setDynamicFields(updatedFields);
      showToast('✅ تم ربط المستدلة الفرعية', 'success');
    } else {
      showToast(`❌ ${result.error || 'فشل في ربط المستدلة'}`, 'error');
    }
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
    if (editingFieldId) return parentContext ? 'تعديل خيارات المستدلة الفرعية' : 'تعديل المستدلة';
    if (!parentContext) return 'إنشاء مستدلة أساسية';
    const pField = dynamicFields.find(f => f.id === parentContext.parentFieldId);
    const pOpt = pField?.options.find(o => o.id === parentContext.triggerOptionId);
    return `إضافة خيارات فرعية تابعة لـ: «${pOpt?.label || fieldDraft.name || 'خيار'}»`;
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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:28, background: '#F8FAFC', padding: '10px 16px', borderRadius: 16, border: `1px solid ${A.sep}` }}>
      {([1,2,3] as WizardStep[]).map((s, i) => {
        const done = wizardStep > s; const active = wizardStep === s;
        return (
          <React.Fragment key={s}>
            <div 
              onClick={() => setWizardStep(s)}
              className="route-action-btn"
              title="انقر للانتقال مباشرة إلى هذه الخطوة"
              style={{ 
                display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                padding: '8px 14px', borderRadius: 12,
                background: active ? '#FFFFFF' : 'transparent',
                boxShadow: active ? '0 2px 10px rgba(0,0,0,0.06)' : 'none',
                border: active ? `1.5px solid ${wizard.color}50` : '1.5px solid transparent',
                transition: 'all 0.2s',
              }}>
              <div className="step-dot" style={{ 
                background: done ? A.green : active ? wizard.color : '#E2E8F0', 
                color: (done || active) ? '#fff' : A.textSub, 
                border: active ? `2px solid ${wizard.color}` : 'none',
                width: 26, height: 26, fontSize: 11
              }}>
                {done ? '✓' : s}
              </div>
              <span style={{ fontSize:13, fontWeight: active ? 800 : 600, color: active ? wizard.color : A.textSub }}>
                {s === 1 ? '1. الأساسيات' : s === 2 ? '2. الواجهة والمستدلات' : '3. تخصيص حقول الفورم ⚡'}
              </span>
            </div>
            {i < 2 && <div style={{ width:24, height:2, background: done ? A.green : '#E2E8F0' }} />}
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
            <div key={ic} className="icon-option" style={{ background:wizard.icon===ic?`${wizard.color}22`:A.bg, border:wizard.icon===ic?`2px solid ${wizard.color}`:'2px solid transparent', fontSize:20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: wizard.icon===ic ? wizard.color : A.textSub }} onClick={() => setW({ icon:ic })}>
              {renderIcon(ic, 24)}
            </div>
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

    const selectedDept = departments.find(d => String(d.id) === String(wizard.targetDepartmentId));
    const divisions = selectedDept?.divisions || [];
    const selectedDiv = divisions.find(d => String(d.id) === String(wizard.targetDivisionId));
    const teams = selectedDiv?.teams || [];

    return (
      <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:6 }}>الإدارة التشغيلية المستقبلة <span style={{ color:A.red }}>*</span></label>
          <select className="tr-input" value={wizard.targetDepartmentId} onChange={e => { const dept=departments.find(d=>String(d.id)===e.target.value); setW({ targetDepartmentId:e.target.value, targetDepartmentName:dept?.name||'', targetDivisionId:'', targetDivisionName:'', targetTeamId:'', targetTeamName:'' }); }}>
            <option value="">-- اختر الإدارة التشغيلية --</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {departments.length === 0 && <div style={{ fontSize:11, color:A.textTer, marginTop:4 }}>💡 أنشئ الإدارات أولاً من تبويب "الهيكل التشغيلي"</div>}
        </div>
        {divisions.length > 0 && (
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:6 }}>القسم التابع للإدارة (اختياري)</label>
            <select className="tr-input" value={wizard.targetDivisionId} onChange={e => { const div=divisions.find(d=>String(d.id)===e.target.value); setW({ targetDivisionId:e.target.value, targetDivisionName:div?.name||'', targetTeamId:'', targetTeamName:'' }); }}>
              <option value="">-- توجيه للإدارة بالكامل دون حصر في قسم --</option>
              {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
        {teams.length > 0 && (
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:A.textSub, display:'block', marginBottom:6 }}>الوحدة / الفريق التابع للقسم (اختياري)</label>
            <select className="tr-input" value={wizard.targetTeamId || ''} onChange={e => { const tm=teams.find((t: any)=>String(t.id)===e.target.value); setW({ targetTeamId:e.target.value, targetTeamName:tm?.name||'' }); }}>
              <option value="">-- توجيه للقسم بالكامل دون حصر في وحدة --</option>
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* ─── قائد خصائص المسار (Flow Manager Delegation) ─── */}
        {wizard.targetDepartmentId && (
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 14, border: `1.5px solid ${wizard.managerId ? wizard.color + '60' : A.sep}`, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: A.text, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span>🛡️ قائد خصائص المسار (المسؤول المخول بحوكمة الاستقبال)</span>
                <span style={{ color: A.red }}>*</span>
              </label>
              {isLoadingCandidates && <span style={{ fontSize: 11, color: wizard.color, fontWeight: 600 }}>جاري استخراج الأسماء الهرمية...</span>}
            </div>
            <p style={{ fontSize: 11, color: A.textSub, margin: '0 0 10px 0', lineHeight: 1.5 }}>
              يُمنح هذا الموظف صلاحية إدارة تبويب خصائص هذا المسار، مصفوفة الصلاحيات (سحب، إغلاق، تحويل)، وقواعد الأتمتة الشرطية.
            </p>
            <select
              className="tr-input"
              value={wizard.managerId || ''}
              onChange={e => {
                const cand = candidateManagers.find(c => String(c.id) === e.target.value);
                setW({ managerId: e.target.value, managerName: cand?.name || '' });
              }}
              style={{ background: '#fff', fontWeight: 600 }}
            >
              <option value="">-- اختر قائد خصائص المسار من الهيكل الموجه له --</option>
              {wizard.managerId && !candidateManagers.some(c => String(c.id) === String(wizard.managerId)) && (
                <option value={wizard.managerId}>
                  {wizard.managerName ? `⭐ ${wizard.managerName} (المسؤول المحدد)` : `مستخدم #${wizard.managerId}`}
                </option>
              )}
              {candidateManagers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.isSuggested ? `⭐ ${c.name} (${c.hierarchyRole} - المقترح الأول)` : `${c.name} (${c.hierarchyRole})`}
                </option>
              ))}
            </select>
            {candidateManagers.length === 0 && !isLoadingCandidates && (
              <div style={{ fontSize: 11, color: A.red, marginTop: 6 }}>⚠️ لم يتم العثور على موظفين مسجلين تحت هذه الجهة في الهيكل التشغيلي.</div>
            )}
          </div>
        )}

        {/* ─── سياسات وحوكمة استقبال الطلبات (Request Reception & Submission Governance) ─── */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 14, border: `1.5px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>سياسات وضوابط استقبال الطلبات (سقف التذاكر المسموح بها للموظف)</div>
                <div style={{ fontSize: 11, color: A.textSub }}>التحكم في فتح تذكرة جديدة مع وجود تذكرة جارية، وسقف الطلبات المفتوحة واشتراط التقييم</div>
              </div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `${wizard.color}18`, color: wizard.color, fontWeight: 700 }}>
              حوكمة استباقية
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {/* أ) السماح بفتح طلب آخر مع وجود طلب مفتوح */}
            <div style={{ padding: '12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                فتح طلب جديد مع وجود طلب مفتوح
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                هل يستطيع الموظف تقديم طلب جديد إذا كان لديه طلب مفتوح بالفعل في هذا المسار؟
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFC({ allowMultipleOpenTickets: true })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${wizard.formConfig.allowMultipleOpenTickets !== false ? wizard.color : A.sep}`,
                    background: wizard.formConfig.allowMultipleOpenTickets !== false ? `${wizard.color}18` : '#fff',
                    color: wizard.formConfig.allowMultipleOpenTickets !== false ? wizard.color : A.textSub
                  }}
                >
                  ✓ مسموح دائماً
                </button>
                <button
                  type="button"
                  onClick={() => setFC({ allowMultipleOpenTickets: false })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${wizard.formConfig.allowMultipleOpenTickets === false ? A.red : A.sep}`,
                    background: wizard.formConfig.allowMultipleOpenTickets === false ? '#fef2f2' : '#fff',
                    color: wizard.formConfig.allowMultipleOpenTickets === false ? A.red : A.textSub
                  }}
                >
                  ✕ حظر حتى إغلاق المفتوح
                </button>
              </div>
            </div>

            {/* ب) أقصى عدد للطلبات المفتوحة المتزامنة */}
            <div style={{ padding: '12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                أقصى عدد للطلبات المفتوحة المتزامنة
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                الحد الأقصى للتذاكر الجارية للموظف الواحد في هذا المسار (0 = غير محدود)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="tr-input"
                  style={{ width: 90, fontSize: 13, fontWeight: 700 }}
                  value={wizard.formConfig.maxConcurrentOpenTickets || 0}
                  onChange={e => setFC({ maxConcurrentOpenTickets: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <span style={{ fontSize: 11.5, color: A.textSub }}>
                  {(wizard.formConfig.maxConcurrentOpenTickets || 0) === 0 ? 'غير محدود (أي عدد)' : `حد أقصى ${wizard.formConfig.maxConcurrentOpenTickets} طلبات`}
                </span>
              </div>
            </div>

            {/* ج) إلزامية تقييم الطلبات السابقة المنجزة */}
            <div style={{ padding: '12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                إلزامية تقييم الطلبات السابقة المنجزة
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                إلزام الموظف بتقييم طلباته المكتملة قبل السماح بتقديم طلب جديد
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFC({ requireRatingBeforeNewTicket: false })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${!wizard.formConfig.requireRatingBeforeNewTicket ? wizard.color : A.sep}`,
                    background: !wizard.formConfig.requireRatingBeforeNewTicket ? `${wizard.color}18` : '#fff',
                    color: !wizard.formConfig.requireRatingBeforeNewTicket ? wizard.color : A.textSub
                  }}
                >
                  اختياري
                </button>
                <button
                  type="button"
                  onClick={() => setFC({ requireRatingBeforeNewTicket: true })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${wizard.formConfig.requireRatingBeforeNewTicket ? A.accent : A.sep}`,
                    background: wizard.formConfig.requireRatingBeforeNewTicket ? `${A.accent}18` : '#fff',
                    color: wizard.formConfig.requireRatingBeforeNewTicket ? A.accent : A.textSub
                  }}
                >
                  إلزامي للتقييم
                </button>
              </div>
            </div>

            {/* د) الحد الأقصى للطلبات غير المقيمة المسموح بها */}
            <div style={{ padding: '12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                سقف الطلبات غير المقيمة المسموح بها
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                عدد التذاكر المكتملة دون تقييم قبل المنع التلقائي (0 = منع فوري عند أول طلب)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={0}
                  max={20}
                  className="tr-input"
                  style={{ width: 90, fontSize: 13, fontWeight: 700 }}
                  value={wizard.formConfig.maxUnratedTicketsAllowed || 0}
                  onChange={e => setFC({ maxUnratedTicketsAllowed: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <span style={{ fontSize: 11.5, color: A.textSub }}>
                  {(wizard.formConfig.maxUnratedTicketsAllowed || 0) === 0 ? 'منع فوري عند أول تذكرة غير مقيمة' : `سماح حتى ${wizard.formConfig.maxUnratedTicketsAllowed} تذاكر`}
                </span>
              </div>
            </div>
          </div>
        </div>
        
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${!!wizard.formConfig.showDepartmentField ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🏛️</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل "التبعية المؤسسية لمقدم الطلب"</div>
                    <div style={{ fontSize: 11, color: A.textTer }}>تحديد موقع الموظف في الهيكل المؤسسي (إدارة / قسم / وحدة)</div>
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

              {/* عمق التدرج الهرمي المطلوب عند التفعيل */}
              {!!wizard.formConfig.showDepartmentField && (
                <div style={{ padding: '12px 14px', background: `${wizard.color}08`, borderRadius: 10, border: `1px solid ${wizard.color}25`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>
                    مستوى التدرج التنظيمي المطلوب من الموظف:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {/* المستوى 1 */}
                    <div 
                      onClick={() => setFC({ departmentSelectionLevel: 'DEPT_ONLY' })}
                      style={{
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `1.5px solid ${(!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? wizard.color : A.sep}`,
                        boxShadow: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? `0 2px 8px ${wizard.color}20` : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>🏛️</span> الإدارة / المكتب فقط
                      </div>
                      <div style={{ fontSize: 10, color: A.textTer, marginTop: 4 }}>
                        المستوى الأول فقط (إدارة عليا / إدارة / مكتب)
                      </div>
                    </div>

                    {/* المستوى 2 */}
                    <div 
                      onClick={() => setFC({ departmentSelectionLevel: 'DEPT_AND_DIV' })}
                      style={{
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `1.5px solid ${wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? wizard.color : A.sep}`,
                        boxShadow: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? `0 2px 8px ${wizard.color}20` : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>📂</span> الإدارة ➔ ثم القسم
                      </div>
                      <div style={{ fontSize: 10, color: A.textTer, marginTop: 4 }}>
                        يختار الإدارة ثم القسم التابع لها في الهيكل
                      </div>
                    </div>

                    {/* المستوى 3 */}
                    <div 
                      onClick={() => setFC({ departmentSelectionLevel: 'FULL_HIERARCHY' })}
                      style={{
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? '#fff' : 'rgba(255,255,255,0.6)',
                        border: `1.5px solid ${wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? wizard.color : A.sep}`,
                        boxShadow: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? `0 2px 8px ${wizard.color}20` : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>👥</span> الإدارة ➔ القسم ➔ الوحدة
                      </div>
                      <div style={{ fontSize: 10, color: A.textTer, marginTop: 4 }}>
                        تسلسل ثلاثي كامل حتى مستوى الوحدة أو الفريق
                      </div>
                    </div>
                  </div>

                  {/* إلزامية المستويات الفرعية */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4, flexWrap: 'wrap' }}>
                    {(wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' || wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY') && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: A.textSub }}>
                        <input 
                          type="checkbox" 
                          checked={!!wizard.formConfig.mandatoryDivision} 
                          onChange={e => setFC({ mandatoryDivision: e.target.checked })} 
                        />
                        <span>إلزامية تحديد القسم</span>
                      </label>
                    )}
                    {wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: A.textSub }}>
                        <input 
                          type="checkbox" 
                          checked={!!wizard.formConfig.mandatoryTeam} 
                          onChange={e => setFC({ mandatoryTeam: e.target.checked })} 
                        />
                        <span>إلزامية تحديد الوحدة/الفريق</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
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
              {parentContext ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', background: `${wizard.color}12`, borderRadius: 12, border: `1px solid ${wizard.color}35`, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>↳</span>
                    <div>
                      <div style={{ fontSize: 11, color: A.textSub, fontWeight: 600 }}>المستدلة الفرعية ترث اسم الخيار تلقائياً:</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: wizard.color }}>{fieldDraft.name}</div>
                    </div>
                  </div>
                  {dynamicFields.filter(f => f.id !== parentContext.parentFieldId).length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: A.textSub }}>أو</span>
                      <select 
                        style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: `1px solid ${A.sep}`, background: '#fff', color: A.text, outline: 'none', cursor: 'pointer' }}
                        onChange={e => { if (e.target.value) { attachExistingAsSubField(e.target.value); } }}
                      >
                        <option value="">-- ربط مستدلة محفوظة بدلاً من الإنشاء --</option>
                        {dynamicFields.filter(f => f.id !== parentContext.parentFieldId).map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <input className="tr-input" placeholder="اسم المستدلة (مثال: نوع العطل)" value={fieldDraft.name} onChange={e => setFieldDraft(p => ({ ...p, name: e.target.value }))} style={{ marginBottom:10 }} />
              )}
              
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
                                <button className="add-subfield-btn" onClick={() => startBuildingField({ parentFieldId: field.id, triggerOptionId: opt.id })} title="إضافة خيارات فرعية لهذا الخيار">+</button>
                              </div>
                            </div>
                            {/* Render Subfields inside a neat nested box */}
                            {children.length > 0 && (
                              <div style={{ marginRight: 20, padding: '10px 14px', background: A.bg, borderRadius: 10, borderRight: `3px solid ${wizard.color}66` }}>
                                {children.map(cf => (
                                  <div key={cf.id} style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>↳ مستدلة فرعية: {cf.name}</div>
                                      <div style={{ display:'flex', gap:6 }}>
                                        <button onClick={() => startEditingField(cf, { parentFieldId: field.id, triggerOptionId: opt.id })} style={{ background:'none', border:'none', color:A.blue, fontSize:11, cursor:'pointer', padding:0, fontWeight:600 }}>تعديل</button>
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
        {/* Building Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: 12, border: `1px solid ${wizard.formConfig.showBuildingField ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🏢</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل موقع / مبنى العمل</div>
              <div style={{ fontSize: 11, color: A.textTer }}>إلزام أو إتاحة اختيار المبنى أو الموقع الذي تقع فيه المشكلة</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {wizard.formConfig.showBuildingField && (
              <div onClick={() => setFC({ mandatoryBuilding: !wizard.formConfig.mandatoryBuilding })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryBuilding ? A.red : A.textSub, fontWeight: 600, background: wizard.formConfig.mandatoryBuilding ? '#fef2f2' : '#f8fafc', padding: '3px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryBuilding ? '#fecaca' : A.sep}`, transition: 'all 0.2s', userSelect: 'none' }}>
                {wizard.formConfig.mandatoryBuilding ? '🔴 إلزامي' : '⚪ اختياري'}
              </div>
            )}
            <div onClick={() => setFC({ showBuildingField: !wizard.formConfig.showBuildingField })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showBuildingField ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showBuildingField ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>

        {/* Submitter Department Toggle & Depth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', borderRadius: 12, border: `1px solid ${wizard.formConfig.showDepartmentField ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🏛️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل التبعية المؤسسية لمقدم الطلب</div>
                <div style={{ fontSize: 11, color: A.textTer }}>تحديد موقع الموظف في الهيكل المؤسسي الحقيقي (إدارة / قسم / وحدة)</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {wizard.formConfig.showDepartmentField && (
                <div onClick={() => setFC({ mandatoryDepartment: !wizard.formConfig.mandatoryDepartment })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryDepartment ? A.red : A.textSub, fontWeight: 600, background: wizard.formConfig.mandatoryDepartment ? '#fef2f2' : '#f8fafc', padding: '3px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryDepartment ? '#fecaca' : A.sep}`, transition: 'all 0.2s', userSelect: 'none' }}>
                  {wizard.formConfig.mandatoryDepartment ? '🔴 إلزامي' : '⚪ اختياري'}
                </div>
              )}
              <div onClick={() => setFC({ showDepartmentField: !wizard.formConfig.showDepartmentField })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showDepartmentField ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showDepartmentField ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </div>
            </div>
          </div>

          {wizard.formConfig.showDepartmentField && (
            <div style={{ padding: '12px 14px', background: `${wizard.color}08`, borderRadius: 10, border: `1px solid ${wizard.color}25`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>
                مستوى التدرج التنظيمي المطلوب من الموظف:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div 
                  onClick={() => setFC({ departmentSelectionLevel: 'DEPT_ONLY' })}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? '#fff' : 'rgba(255,255,255,0.6)',
                    border: `1.5px solid ${(!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? wizard.color : A.sep}`,
                    boxShadow: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? `0 2px 8px ${wizard.color}20` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>🏛️</span> الإدارة فقط
                  </div>
                  <div style={{ fontSize: 10, color: A.textTer, marginTop: 4 }}>
                    إدارة عليا أو إدارة أو مكتب فقط
                  </div>
                </div>

                <div 
                  onClick={() => setFC({ departmentSelectionLevel: 'DEPT_AND_DIV' })}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? '#fff' : 'rgba(255,255,255,0.6)',
                    border: `1.5px solid ${wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? wizard.color : A.sep}`,
                    boxShadow: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? `0 2px 8px ${wizard.color}20` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>📂</span> الإدارة ➔ ثم القسم
                  </div>
                  <div style={{ fontSize: 10, color: A.textTer, marginTop: 4 }}>
                    يختار الإدارة ثم القسم التابع لها
                  </div>
                </div>

                <div 
                  onClick={() => setFC({ departmentSelectionLevel: 'FULL_HIERARCHY' })}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? '#fff' : 'rgba(255,255,255,0.6)',
                    border: `1.5px solid ${wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? wizard.color : A.sep}`,
                    boxShadow: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? `0 2px 8px ${wizard.color}20` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>👥</span> الإدارة ➔ القسم ➔ الوحدة
                  </div>
                  <div style={{ fontSize: 10, color: A.textTer, marginTop: 4 }}>
                    تسلسل كامل حتى الوحدة أو الفريق
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4, flexWrap: 'wrap' }}>
                {(wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' || wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: A.textSub }}>
                    <input 
                      type="checkbox" 
                      checked={!!wizard.formConfig.mandatoryDivision} 
                      onChange={e => setFC({ mandatoryDivision: e.target.checked })} 
                    />
                    <span>إلزامية تحديد القسم</span>
                  </label>
                )}
                {wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: A.textSub }}>
                    <input 
                      type="checkbox" 
                      checked={!!wizard.formConfig.mandatoryTeam} 
                      onChange={e => setFC({ mandatoryTeam: e.target.checked })} 
                    />
                    <span>إلزامية تحديد الوحدة/الفريق</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

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

        {/* ─── Smart Time & Scheduling Engine & Corporate Delegation ─── */}
        <div style={{ margin: '14px 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: A.text }}>محرك الجدولة الزمنية والتفويض المؤسسي</span>
          <div style={{ flex: 1, height: 1, background: A.sep, marginRight: 8 }} />
        </div>

        {/* 1. Smart Time & Scheduling Engine */}
        {(() => {
          const isScheduleActive = !!(wizard.formConfig.showScheduleEngine || wizard.formConfig.showDateRange);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: '#fff', borderRadius: 14, border: `1px solid ${isScheduleActive ? wizard.color + '45' : A.sep}`, boxShadow: isScheduleActive ? `0 2px 14px ${wizard.color}12` : 'none', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isScheduleActive ? `${wizard.color}15` : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🗓️
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>محرك الجدولة الزمنية والوقت الذكي (Scheduling & Attendance Engine)</div>
                    <div style={{ fontSize: 11, color: A.textTer }}>إجازات بعداد أيام تلقائي، أيام متفرقة، وأذونات خروج واستئذان بالساعات والدقائق</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isScheduleActive && (
                    <div onClick={() => setFC({ mandatorySchedule: !wizard.formConfig.mandatorySchedule, mandatoryDateRange: !wizard.formConfig.mandatorySchedule })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: (wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? A.red : A.textSub, fontWeight: 600, background: (wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? '#fef2f2' : '#f8fafc', padding: '3px 10px', borderRadius: 6, border: `1px solid ${(wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? '#fecaca' : A.sep}`, transition: 'all 0.2s', userSelect: 'none' }}>
                      {(wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? '🔴 إلزامي' : '⚪ اختياري'}
                    </div>
                  )}
                  <div onClick={() => setFC({ showScheduleEngine: !isScheduleActive, showDateRange: !isScheduleActive })} style={{ width: 40, height: 22, borderRadius: 11, background: isScheduleActive ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: isScheduleActive ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                  </div>
                </div>
              </div>

              {isScheduleActive && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: A.textSub, display: 'block', marginBottom: 5 }}>نمط الجدولة الزمنية المطلوب</label>
                      <select className="tr-input" style={{ fontSize: 12, padding: '8px 12px' }} value={wizard.formConfig.scheduleMode || 'ANY'} onChange={e => setFC({ scheduleMode: e.target.value as any })}>
                        <option value="ANY">🔀 نمط مرن وشامل (يتيح للموظف الاختيار بين فترة، أيام متفرقة، أو إذن ساعي)</option>
                        <option value="DATE_RANGE">📆 فترة متصلة بأيام محسوبة (تاريخ البدء إلى تاريخ الانتهاء مع عداد الأيام)</option>
                        <option value="DISCRETE_DAYS">🗓️ أيام متعددة متفرقة (إضافة عدة تواريخ متفرقة مع عداد الأيام)</option>
                        <option value="HOURLY_WINDOW">⏱️ إذن خروج واستئذان زمني بالساعات (تاريخ محدد + من وإلى الساعة)</option>
                        <option value="SINGLE_DATE">📅 موعد أو تاريخ محدد (يوم واحد فقط)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: A.textSub, display: 'block', marginBottom: 5 }}>تسمية الحقل في النموذج</label>
                      <input className="tr-input" style={{ fontSize: 12, padding: '8px 12px' }} placeholder="مثال: فترة الإجازة / الجدولة الزمنية" value={wizard.formConfig.scheduleLabel || wizard.formConfig.dateRangeLabel || ''} onChange={e => setFC({ scheduleLabel: e.target.value, dateRangeLabel: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, color: A.textSub, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>💡</span>
                    <span>يحسب النظام تلقائياً إجمالي الأيام المتصلة أو المتفرقة، أو الساعات والدقائق لأذونات الخروج دون أي تدخل يدوي.</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 2. Delegate / Alternate Employee Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: '#fff', borderRadius: 14, border: `1px solid ${wizard.formConfig.showDelegateUser ? wizard.color + '45' : A.sep}`, boxShadow: wizard.formConfig.showDelegateUser ? `0 2px 14px ${wizard.color}12` : 'none', transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: wizard.formConfig.showDelegateUser ? `${wizard.color}15` : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                👤
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>الموظف البديل / تسليم المهام (Delegate User)</div>
                <div style={{ fontSize: 11, color: A.textTer }}>لتحديد زميل يستلم المهام أو يتابع التنسيق أثناء غياب مقدم الطلب</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {wizard.formConfig.showDelegateUser && (
                <div onClick={() => setFC({ mandatoryDelegateUser: !wizard.formConfig.mandatoryDelegateUser })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryDelegateUser ? A.red : A.textSub, fontWeight: 600, background: wizard.formConfig.mandatoryDelegateUser ? '#fef2f2' : '#f8fafc', padding: '3px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryDelegateUser ? '#fecaca' : A.sep}`, transition: 'all 0.2s', userSelect: 'none' }}>
                  {wizard.formConfig.mandatoryDelegateUser ? '🔴 إلزامي' : '⚪ اختياري'}
                </div>
              )}
              <div onClick={() => setFC({ showDelegateUser: !wizard.formConfig.showDelegateUser })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showDelegateUser ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showDelegateUser ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </div>
            </div>
          </div>
          {wizard.formConfig.showDelegateUser && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: A.textSub, display: 'block', marginBottom: 5 }}>تسمية الحقل في النموذج</label>
              <input className="tr-input" style={{ fontSize: 12, padding: '8px 12px' }} placeholder="مثال: الموظف البديل / تسليم العهدة والمهام" value={wizard.formConfig.delegateUserLabel || ''} onChange={e => setFC({ delegateUserLabel: e.target.value })} />
            </div>
          )}
        </div>

        {/* 3. Enterprise Dynamic Recommendation Banner */}
        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(147,51,234,0.06))', borderRadius: 12, border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ fontSize: 11, color: A.textSub, lineHeight: 1.6 }}>
            <strong style={{ color: A.text }}>معمارية ديناميكية شاملة:</strong> أي بيانات إضافية (مثل بيانات المركبات، أرقام اللوحات، المبالغ، والعهد، أو التصنيفات الخاصة) تُبنى بكل دقة عبر <strong>المستدلات والمستدلات الفرعية</strong> أعلاه دون الحاجة لحقول ثابتة مقيدة.
          </div>
        </div>

        {/* 4. Submission & Open Ticket Governance Policy Card */}
        <div style={{ padding: '16px', background: '#fff', borderRadius: 12, border: `1.5px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حوكمة وضوابط تقديم الطلبات (Governance Policies)</div>
                <div style={{ fontSize: 11, color: A.textTer }}>التحكم في قيود تقديم الطلبات الجديدة، حظر التكرار، وإلزامية التقييم</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* أ) هل يسمح بإضافة طلب جديد ولديه طلب مفتوح */}
            <div style={{ padding: '12px', borderRadius: 10, background: A.bg, border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                السماح بتقديم طلب إضافي مع وجود طلب مفتوح
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                هل يستطيع الموظف تقديم طلب جديد إذا كان لديه طلب مفتوح بالفعل في هذا المسار؟
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFC({ allowMultipleOpenTickets: true })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${wizard.formConfig.allowMultipleOpenTickets !== false ? wizard.color : A.sep}`,
                    background: wizard.formConfig.allowMultipleOpenTickets !== false ? `${wizard.color}18` : '#fff',
                    color: wizard.formConfig.allowMultipleOpenTickets !== false ? wizard.color : A.textSub
                  }}
                >
                  ✓ مسموح دائماً
                </button>
                <button
                  type="button"
                  onClick={() => setFC({ allowMultipleOpenTickets: false })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${wizard.formConfig.allowMultipleOpenTickets === false ? A.red : A.sep}`,
                    background: wizard.formConfig.allowMultipleOpenTickets === false ? '#fef2f2' : '#fff',
                    color: wizard.formConfig.allowMultipleOpenTickets === false ? A.red : A.textSub
                  }}
                >
                  ✕ حظر حتى إغلاق المفتوح
                </button>
              </div>
            </div>

            {/* ب) أقصى عدد للطلبات المفتوحة المتزامنة */}
            <div style={{ padding: '12px', borderRadius: 10, background: A.bg, border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                أقصى عدد للطلبات المفتوحة المتزامنة
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                الحد الأقصى للتذاكر الجارية للموظف الواحد في هذا المسار (0 = غير محدود)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="tr-input"
                  style={{ width: 100, fontSize: 13, fontWeight: 700 }}
                  value={wizard.formConfig.maxConcurrentOpenTickets || 0}
                  onChange={e => setFC({ maxConcurrentOpenTickets: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <span style={{ fontSize: 11.5, color: A.textSub }}>
                  {(wizard.formConfig.maxConcurrentOpenTickets || 0) === 0 ? 'غير محدود (أي عدد)' : `حد أقصى ${wizard.formConfig.maxConcurrentOpenTickets} طلبات`}
                </span>
              </div>
            </div>

            {/* ج) إلزامية تقييم الطلبات السابقة المنجزة */}
            <div style={{ padding: '12px', borderRadius: 10, background: A.bg, border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                إلزامية تقييم الطلبات السابقة المنجزة
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                إلزام الموظف بتقييم طلباته المكتملة قبل السماح بتقديم طلب جديد
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFC({ requireRatingBeforeNewTicket: false })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${!wizard.formConfig.requireRatingBeforeNewTicket ? wizard.color : A.sep}`,
                    background: !wizard.formConfig.requireRatingBeforeNewTicket ? `${wizard.color}18` : '#fff',
                    color: !wizard.formConfig.requireRatingBeforeNewTicket ? wizard.color : A.textSub
                  }}
                >
                  اختياري
                </button>
                <button
                  type="button"
                  onClick={() => setFC({ requireRatingBeforeNewTicket: true })}
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${wizard.formConfig.requireRatingBeforeNewTicket ? '#ea580c' : A.sep}`,
                    background: wizard.formConfig.requireRatingBeforeNewTicket ? '#fff7ed' : '#fff',
                    color: wizard.formConfig.requireRatingBeforeNewTicket ? '#ea580c' : A.textSub
                  }}
                >
                  ⭐ إلزامي
                </button>
              </div>
            </div>

            {/* د) الحد الأقصى للتذاكر غير المقيمة قبل الحظر */}
            <div style={{ padding: '12px', borderRadius: 10, background: A.bg, border: `1px solid ${A.sep}` }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                حد التذاكر غير المقيمة قبل الحظر
              </label>
              <div style={{ fontSize: 11, color: A.textSub, marginBottom: 8 }}>
                عدد التذاكر المنجزة المعلقة دون تقييم التي تؤدي لإيقاف التقديم الجديد (0 = تعطيل)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={0}
                  max={50}
                  className="tr-input"
                  style={{ width: 100, fontSize: 13, fontWeight: 700 }}
                  value={wizard.formConfig.maxUnratedTicketsAllowed || 0}
                  onChange={e => setFC({ maxUnratedTicketsAllowed: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <span style={{ fontSize: 11.5, color: A.textSub }}>
                  {(wizard.formConfig.maxUnratedTicketsAllowed || 0) === 0 ? 'لا يتم الحظر بالعدد' : `حظر عند بلوغ ${wizard.formConfig.maxUnratedTicketsAllowed} تذاكر`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. منظم وتوزيع مراحل النموذج (Form Stage Organizer) */}
        <div style={{ padding: '16px', background: '#fff', borderRadius: 12, border: `1.5px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>منظم وتوزيع مراحل النموذج (Form Stage Organizer)</div>
                <div style={{ fontSize: 11, color: A.textTer }}>التحكم في طريقة عرض النموذج للموظف (مرحلة واحدة، مرحلتان، أو 3 مراحل بتسميات مخصصة)</div>
              </div>
            </div>
          </div>

          {/* Strategy buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {/* 1 Stage */}
            <div
              onClick={() => {
                setFC({
                  stages: [
                    { id: 'stage_all', title: 'تعبئة واعتماد المعاملة', fieldNames: [] }
                  ]
                });
              }}
              style={{
                padding: '12px',
                borderRadius: 10,
                cursor: 'pointer',
                background: wizard.formConfig.stages?.length === 1 ? `${wizard.color}15` : A.bg,
                border: `1.5px solid ${wizard.formConfig.stages?.length === 1 ? wizard.color : A.sep}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.stages?.length === 1 ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚡</span> مرحلة واحدة شاملة
              </div>
              <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 4 }}>
                عرض الحقول والتذكرة مباشرة في خطوة واحدة دون تنقل
              </div>
            </div>

            {/* 2 Stages */}
            <div
              onClick={() => {
                setFC({
                  stages: [
                    { id: 'stage_1', title: 'البيانات والتوجيه الأساسي', fieldNames: ['department', 'division', 'team', 'building', 'taxonomyMain', 'taxonomySub'] },
                    { id: 'stage_2', title: 'التفاصيل والتذكرة النهائية', fieldNames: [] }
                  ]
                });
              }}
              style={{
                padding: '12px',
                borderRadius: 10,
                cursor: 'pointer',
                background: wizard.formConfig.stages?.length === 2 ? `${wizard.color}15` : A.bg,
                border: `1.5px solid ${wizard.formConfig.stages?.length === 2 ? wizard.color : A.sep}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.stages?.length === 2 ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📑</span> مرحلتان متوازنتان
              </div>
              <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 4 }}>
                المرحلة 1: البيانات والتوجيه ➔ المرحلة 2: التذكرة والاعتماد
              </div>
            </div>

            {/* 3 Stages (Standard Enterprise) */}
            <div
              onClick={() => {
                setFC({
                  stages: [
                    { id: 'stage_1', title: 'التوجيه والتصنيف', fieldNames: ['department', 'division', 'team', 'building', 'taxonomyMain', 'taxonomySub'] },
                    { id: 'stage_2', title: 'المتطلبات والجدولة', fieldNames: ['scheduleEngine', 'delegateUser', 'description', 'attachment'] },
                    { id: 'stage_3', title: 'تذكرة الاعتماد والتمزيق', fieldNames: [] }
                  ]
                });
              }}
              style={{
                padding: '12px',
                borderRadius: 10,
                cursor: 'pointer',
                background: (!wizard.formConfig.stages || wizard.formConfig.stages?.length === 3) ? `${wizard.color}15` : A.bg,
                border: `1.5px solid ${(!wizard.formConfig.stages || wizard.formConfig.stages?.length === 3) ? wizard.color : A.sep}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: (!wizard.formConfig.stages || wizard.formConfig.stages?.length === 3) ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎯</span> ثلاث مراحل سينمائية (افتراضي)
              </div>
              <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 4 }}>
                1: الأساسيات ➔ 2: التفاصيل ➔ 3: التذكرة السينمائية
              </div>
            </div>
          </div>

          {/* Current Stages List with Editable Titles */}
          {wizard.formConfig.stages && wizard.formConfig.stages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: A.textSub }}>
                تسميات المراحل في نموذج الموظف:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {wizard.formConfig.stages.map((st, idx) => (
                  <div key={st.id || idx} style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', gap: 6, background: A.bg, padding: '6px 10px', borderRadius: 8, border: `1px solid ${A.sep}` }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: wizard.color }}>{idx + 1}.</span>
                    <input
                      type="text"
                      value={st.title}
                      onChange={e => {
                        const newStages = [...(wizard.formConfig.stages || [])];
                        newStages[idx] = { ...newStages[idx], title: e.target.value };
                        setFC({ stages: newStages });
                      }}
                      className="tr-input"
                      style={{ fontSize: 11.5, padding: '4px 8px', background: '#fff' }}
                      placeholder={`عنوان المرحلة ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
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
              <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, color: '#fff' }}>
                {renderIcon(wizard.icon || 'ClipboardList', 18, '#fff')}
              </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🏛️</div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: A.text }}>الإدارة / المكتب</span>
                        {wizard.formConfig.mandatoryDepartment && <span style={{ fontSize: 9, color: A.red, fontWeight: 700 }}>*</span>}
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: 8, background: '#F8F9FC', border: '1.5px solid #E8ECF4', fontSize: 11, color: A.textTer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>-- اختر الإدارة أو المكتب --</span><span style={{ fontSize: 9, transform: 'rotate(-90deg)', color: '#C0C4CC' }}>‹</span>
                      </div>
                    </div>

                    {(wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' || wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY') && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>📂</div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: A.text }}>القسم التابع له</span>
                          {wizard.formConfig.mandatoryDivision && <span style={{ fontSize: 9, color: A.red, fontWeight: 700 }}>*</span>}
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: 8, background: '#F8F9FC', border: '1.5px solid #E8ECF4', fontSize: 11, color: A.textTer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>-- اختر القسم التابع له --</span><span style={{ fontSize: 9, transform: 'rotate(-90deg)', color: '#C0C4CC' }}>‹</span>
                        </div>
                      </div>
                    )}

                    {wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👥</div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: A.text }}>الوحدة / الفريق</span>
                          {wizard.formConfig.mandatoryTeam && <span style={{ fontSize: 9, color: A.red, fontWeight: 700 }}>*</span>}
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: 8, background: '#F8F9FC', border: '1.5px solid #E8ECF4', fontSize: 11, color: A.textTer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>-- اختر الوحدة أو الفريق --</span><span style={{ fontSize: 9, transform: 'rotate(-90deg)', color: '#C0C4CC' }}>‹</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Smart Scheduling Engine Live Preview ── */}
            {(wizard.formConfig.showScheduleEngine || wizard.formConfig.showDateRange) && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, border: `1.5px solid ${wizard.color}35`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${wizard.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🗓️</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: A.text }}>{wizard.formConfig.scheduleLabel || wizard.formConfig.dateRangeLabel || 'الجدولة الزمنية / فترة الطلب'}</span>
                    {(wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) && <span style={{ fontSize: 9, color: A.red, fontWeight: 700 }}>*</span>}
                  </div>
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${wizard.color}15`, color: wizard.color, fontWeight: 700 }}>
                    {wizard.formConfig.scheduleMode === 'DATE_RANGE' ? 'فترة متصلة' : wizard.formConfig.scheduleMode === 'DISCRETE_DAYS' ? 'أيام متفرقة' : wizard.formConfig.scheduleMode === 'HOURLY_WINDOW' ? 'إذن ساعي' : wizard.formConfig.scheduleMode === 'SINGLE_DATE' ? 'تاريخ محدد' : 'نمط مرن'}
                  </span>
                </div>

                {/* Sub-preview based on mode */}
                {(!wizard.formConfig.scheduleMode || wizard.formConfig.scheduleMode === 'ANY') && (
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      {['فترة متصلة', 'أيام متفرقة', 'إذن ساعي'].map((tab, i) => (
                        <span key={tab} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: i === 0 ? wizard.color : '#e2e8f0', color: i === 0 ? '#fff' : '#64748b', fontWeight: 600 }}>{tab}</span>
                      ))}
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', fontSize: 10, color: A.textSub, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>من: 2026/10/15  إلى: 2026/10/20</span>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>🟢 إجمالي: 6 أيام</span>
                    </div>
                  </div>
                )}

                {wizard.formConfig.scheduleMode === 'DATE_RANGE' && (
                  <div style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', fontSize: 10, color: A.textSub, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>من: 2026/10/15  إلى: 2026/10/20</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>🟢 إجمالي: 6 أيام</span>
                  </div>
                )}

                {wizard.formConfig.scheduleMode === 'DISCRETE_DAYS' && (
                  <div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                      {['12 أكتوبر', '15 أكتوبر', '18 أكتوبر'].map(d => (
                        <span key={d} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${wizard.color}10`, color: wizard.color, border: `1px solid ${wizard.color}25`, fontWeight: 600 }}>{d} ✕</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>🟢 إجمالي: 3 أيام متفرقة</span>
                  </div>
                )}

                {wizard.formConfig.scheduleMode === 'HOURLY_WINDOW' && (
                  <div style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', fontSize: 10, color: A.textSub, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📅 اليوم | من: 09:30 إلى: 11:45</span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>⏱️ المدة: 2س و 15د</span>
                  </div>
                )}

                {wizard.formConfig.scheduleMode === 'SINGLE_DATE' && (
                  <div style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', fontSize: 10, color: A.textSub }}>
                    <span>📅 التاريخ المحدد: 2026/10/15</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Delegate Colleague Live Preview ── */}
            {wizard.formConfig.showDelegateUser && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: A.text }}>{wizard.formConfig.delegateUserLabel || 'الموظف البديل / تسليم المهام'}</span>
                  {wizard.formConfig.mandatoryDelegateUser && <span style={{ fontSize: 9, color: A.red, fontWeight: 700 }}>*</span>}
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: '#F8F9FC', border: '1.5px solid #E8ECF4', fontSize: 11, color: A.textTer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>-- اختر الموظف البديل من الدليل المؤسسي --</span><span style={{ fontSize: 9, transform: 'rotate(-90deg)', color: '#C0C4CC' }}>‹</span>
                </div>
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
                    <div style={{ width:48, height:48, borderRadius:12, background:`${r.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color: r.color }}>
                      {renderIcon(r.icon || 'ClipboardList', 24, r.color)}
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:A.text }}>{r.name}</div>
                      <div style={{ fontSize:12, color:A.textSub, marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:r.isActive?A.green:A.red }} />
                        {r.isActive?'نشط':'متوقف'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="route-action-btn" title="استنساخ المسار" onClick={() => duplicateRoute(r)} style={{ background:`${A.blue}15`, color:A.blue, border:'none', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>📑</button>
                    <button className="route-action-btn" title="تعديل المسار" onClick={() => openEdit(r)} style={{ background:A.bg, border:'none', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚙️</button>
                    <button className="route-action-btn" title="حذف المسار" onClick={() => deleteRoute(r.id)} style={{ background:'#FFF0F0', color:A.red, border:'none', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🗑</button>
                  </div>
                </div>
                <div style={{ background:A.bg, padding:10, borderRadius:8, fontSize:12, color:A.textSub, display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span>الإدارة:</span><strong style={{ color:A.text }}>{r.targetDepartmentName}</strong></div>
                  {r.targetDivisionName && <div style={{ display:'flex', justifyContent:'space-between' }}><span>القسم:</span><strong style={{ color:A.text }}>{r.targetDivisionName}</strong></div>}
                  {r.managerName && <div style={{ display:'flex', justifyContent:'space-between' }}><span>قائد المسار:</span><strong style={{ color:A.blue }}>🛡️ {r.managerName}</strong></div>}
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span>المستدلات:</span><strong style={{ color:A.text }}>{(r.formConfig?.routeDynamicFields||[]).length} حقول</strong></div>
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
      {/* ── Toast Notification ── */}
      {toast.visible && (
        <div className={`tr-toast ${toast.type}`}>
          {toast.type === 'loading' && <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
          {toast.type === 'success' && <span style={{ fontSize: 16 }}>✅</span>}
          {toast.type === 'error' && <span style={{ fontSize: 16 }}>❌</span>}
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: A.text, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>منشئ مسارات التذاكر 🛤️</h2>
          <p style={{ fontSize: 14, color: A.textSub, margin: 0 }}>تصميم تدفق الطلبات، ربط الإدارات، وبناء المستدلات الديناميكية</p>
        </div>
      </div>

      {/* ── Loading State ── */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: A.textTer }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>⏳</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: A.textSub }}>جارٍ تحميل المسارات...</div>
        </div>
      )}

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
                <button 
                  className="route-action-btn" 
                  disabled={isSaving}
                  style={{ padding:'10px 24px', borderRadius:10, background: isSaving ? A.bg : wizard.color, color: isSaving ? A.textTer : '#fff', border:'none', fontSize:13, fontWeight:700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, display:'flex', alignItems:'center', gap:6 }} 
                  onClick={handleSaveRoute}>
                  {isSaving ? <><span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(0,0,0,0.2)', borderTopColor: A.text, display:'inline-block', animation:'spin 0.7s linear infinite' }}/> جارٍ الحفظ...</> : (editingId ? 'حفظ التعديلات ✔' : 'إنشاء المسار 🚀')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
