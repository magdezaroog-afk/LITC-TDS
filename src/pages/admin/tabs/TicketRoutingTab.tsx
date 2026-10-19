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
  type CustomFormInput,
  defaultFormConfig,
  normalizeRoute,
  loadRoutes,
  saveRoutes,
  loadDynamicFields,
  saveDynamicFields,
  isDelegateFieldVisible,
} from '../../../services/ticketRouting.helpers';

import {
  ROUTE_ICONS,
  ICON_CATEGORIES,
  EXECUTIVE_PALETTE,
  renderRouteIcon,
} from '../../../services/ticketIconLibrary';
import { EmployeeDelegatePicker } from '../../../functional_ui/components/EmployeeDelegatePicker';

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
  CustomFormInput,
};

// ═══════════════════════════════════════════════════════════
// Constants & Styling
// ═══════════════════════════════════════════════════════════
const renderIcon = (name: string, size: number = 24, color?: string) => {
  return renderRouteIcon(name, size, color, 2.2);
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
    .ticket-perforation { position: relative; border-top: 2px dashed rgba(0,0,0,0.14); margin: 16px -16px; }
    .ticket-notch-left { position: absolute; left: -10px; top: -10px; width: 20px; height: 20px; border-radius: 50%; background: #F8FAFC; box-shadow: inset -2px 0 3px rgba(0,0,0,0.06); }
    .ticket-notch-right { position: absolute; right: -10px; top: -10px; width: 20px; height: 20px; border-radius: 50%; background: #F8FAFC; box-shadow: inset 2px 0 3px rgba(0,0,0,0.06); }
  `;
  document.head.appendChild(style);
};

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════
export const ROUTE_CATEGORIES = [
  {
    id: 'OPERATIONAL',
    title: 'مسار عام / دعم فني وتشغيلي',
    desc: 'طلبات الدعم التقني، الصيانة، الخدمات الإدارية، والمهام العامة',
    icon: '🏢',
    color: '#007AFF',
  },
  {
    id: 'TIME_OFF',
    title: 'مسار إجازات ومغادرات دوام',
    desc: 'إجازات سنوية ومرضية، أذونات ساعية، تكليف موظف بديل من دليل الشركة',
    icon: '🏖️',
    color: '#10B981',
  },
  {
    id: 'FINANCIAL',
    title: 'مسار مالي ومشتريات',
    desc: 'سلف، عهد نقدية، فواتير ومشتريات مع دورات اعتماد متقدمة',
    icon: '💼',
    color: '#F59E0B',
  },
] as const;

type WizardStep = 1 | 2 | 3;
interface WizardState {
  name: string; description: string; icon: string; color: string;
  routeCategory: 'OPERATIONAL' | 'TIME_OFF' | 'FINANCIAL' | 'GENERAL';
  targetDepartmentId: string; targetDepartmentName: string;
  targetDivisionId: string; targetDivisionName: string;
  targetTeamId?: string; targetTeamName?: string;
  managerId: string; managerName: string;
  formConfig: RouteFormConfig;
}
const defaultWizard = (): WizardState => ({
  name: '', description: '', icon: 'Monitor', color: '#007AFF',
  routeCategory: 'OPERATIONAL',
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

  // Icon Library Filter & Search State
  const [iconSearch, setIconSearch] = useState('');
  const [iconCategory, setIconCategory] = useState<string>('all');

  // Live Preview Stage Index (Step 3)
  const [previewStageIndex, setPreviewStageIndex] = useState(0);

  // Option-level Conditional Custom Inputs State
  const [activeOptionInputAdder, setActiveOptionInputAdder] = useState<{ fieldId: string; optionId: string; optionLabel: string } | null>(null);
  const [optionInputDraft, setOptionInputDraft] = useState<{ label: string; type: 'text' | 'textarea' | 'number' | 'date'; placeholder: string; required: boolean }>({
    label: '',
    type: 'text',
    placeholder: '',
    required: true,
  });

  // Interactive Live Preview Selection State
  const [previewSelectedOptions, setPreviewSelectedOptions] = useState<Record<string, string>>({});

  // Quick Option Adder State per Field
  const [quickOptionText, setQuickOptionText] = useState<Record<string, string>>({});

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
      routeCategory: r.routeCategory || 'OPERATIONAL',
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
      routeCategory: wizard.routeCategory || 'OPERATIONAL',
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

    // Auto-commit any pending draftOptionText if user typed but did not press "إضافة خيار"
    let currentOptions = [...(fieldDraft.options || [])];
    if (draftOptionText.trim()) {
      currentOptions.push({
        id: `opt_${Date.now()}`,
        label: draftOptionText.trim(),
        isActive: true,
      });
      setDraftOptionText('');
    }

    if (!finalName || !currentOptions.length) {
      showToast(asSubField ? 'الرجاء إضافة خيار فرعي واحد على الأقل.' : 'الرجاء إدخال اسم المستدلة وإضافة خيار واحد على الأقل.', 'error');
      return;
    }

    if (editingFieldId) {
      const updatedFields = dynamicFields.map(f => {
        if (f.id === editingFieldId) {
          return { ...f, name: finalName, options: currentOptions };
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
      options: currentOptions,
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

  const handleQuickAddOption = async (fieldId: string) => {
    const text = (quickOptionText[fieldId] || '').trim();
    if (!text) {
      showToast('يرجى كتابة نص الخيار الجديد', 'error');
      return;
    }

    const targetField = dynamicFields.find(f => f.id === fieldId);
    if (!targetField) return;

    if ((targetField.options || []).some(o => o.label.trim().toLowerCase() === text.toLowerCase())) {
      showToast('هذا الخيار موجود بالفعل في هذه المستدلة', 'error');
      return;
    }

    const newOption: DynamicFieldOption = {
      id: `opt_${Date.now()}`,
      label: text,
      isActive: true,
    };

    const updatedFields = dynamicFields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: [...(f.options || []), newOption],
        };
      }
      return f;
    });

    const result = await saveDynamicFields(updatedFields);
    if (result.success) {
      setDynamicFields(updatedFields);
      setQuickOptionText(p => ({ ...p, [fieldId]: '' }));
      showToast(`✅ تم إضافة خيار «${text}» وحفظه بنجاح`, 'success');
    } else {
      showToast(`❌ ${result.error || 'فشل في حفظ الخيار الجديد'}`, 'error');
    }
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

  // ─── Option-Level Conditional Custom Inputs Helpers ───
  const getInputsForOption = (fieldId: string, optionId: string): CustomFormInput[] => {
    if (wizard.formConfig.optionCustomInputs?.[optionId]) {
      return wizard.formConfig.optionCustomInputs[optionId];
    }
    const f = dynamicFields.find(df => df.id === fieldId);
    const opt = f?.options.find(o => o.id === optionId);
    return opt?.customInputs || [];
  };

  const addInputToOption = async (fieldId: string, optionId: string) => {
    if (!optionInputDraft.label.trim()) {
      showToast('يرجى كتابة تسمية الحقل', 'error');
      return;
    }
    const currentInputs = getInputsForOption(fieldId, optionId);
    const newInput: CustomFormInput = {
      id: `oci_${Date.now()}`,
      name: `opt_input_${Date.now()}`,
      label: optionInputDraft.label.trim(),
      type: optionInputDraft.type,
      placeholder: optionInputDraft.placeholder.trim(),
      required: optionInputDraft.required,
      order: currentInputs.length,
    };
    const updatedInputs = [...currentInputs, newInput];

    const nextOptionMap = {
      ...(wizard.formConfig.optionCustomInputs || {}),
      [optionId]: updatedInputs,
    };
    setFC({ optionCustomInputs: nextOptionMap });

    const updatedFields = dynamicFields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: f.options.map(o => o.id === optionId ? { ...o, customInputs: updatedInputs } : o),
        };
      }
      return f;
    });
    setDynamicFields(updatedFields);
    await saveDynamicFields(updatedFields);

    showToast(`✅ تم ربط الحقل «${newInput.label}» بالخيار بنجاح`, 'success');
    setOptionInputDraft({ label: '', type: 'text', placeholder: '', required: true });
    setActiveOptionInputAdder(null);
  };

  const removeInputFromOption = async (fieldId: string, optionId: string, inputId: string) => {
    const currentInputs = getInputsForOption(fieldId, optionId);
    const updatedInputs = currentInputs.filter(ci => ci.id !== inputId);

    const nextOptionMap = {
      ...(wizard.formConfig.optionCustomInputs || {}),
      [optionId]: updatedInputs,
    };
    setFC({ optionCustomInputs: nextOptionMap });

    const updatedFields = dynamicFields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: f.options.map(o => o.id === optionId ? { ...o, customInputs: updatedInputs } : o),
        };
      }
      return f;
    });
    setDynamicFields(updatedFields);
    await saveDynamicFields(updatedFields);
    showToast('🗑 تم حذف الحقل التابع للخيار', 'success');
  };

  const toggleInputRequiredForOption = async (fieldId: string, optionId: string, inputId: string) => {
    const currentInputs = getInputsForOption(fieldId, optionId);
    const updatedInputs = currentInputs.map(ci => ci.id === inputId ? { ...ci, required: !ci.required } : ci);

    const nextOptionMap = {
      ...(wizard.formConfig.optionCustomInputs || {}),
      [optionId]: updatedInputs,
    };
    setFC({ optionCustomInputs: nextOptionMap });

    const updatedFields = dynamicFields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: f.options.map(o => o.id === optionId ? { ...o, customInputs: updatedInputs } : o),
        };
      }
      return f;
    });
    setDynamicFields(updatedFields);
    await saveDynamicFields(updatedFields);
  };


  // ─── Rendering Steps ───
  const step1Valid = wizard.name.trim().length > 0 && !!wizard.targetDepartmentId;
  const step2Valid = true;

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
                {s === 1 ? '1. الأساسيات والجهة المستقبلة' : s === 2 ? '2. تخصيص الحقول والمستدلات' : '3. منظم المراحل والمعاينة التفاعلية ⚡'}
              </span>
            </div>
            {i < 2 && <div style={{ width:24, height:2, background: done ? A.green : '#E2E8F0' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── Step 1 Computed Helpers ───
  const selectedDept = departments.find(d => String(d.id) === String(wizard.targetDepartmentId));
  const divisions = selectedDept?.divisions || [];
  const selectedDiv = divisions.find(d => String(d.id) === String(wizard.targetDivisionId));
  const teams = selectedDiv?.teams || [];

  const filteredIcons = ROUTE_ICONS.filter(ic => {
    const matchesCat = iconCategory === 'all' || ic.category === iconCategory;
    const matchesSearch = !iconSearch.trim() || 
      ic.name.toLowerCase().includes(iconSearch.toLowerCase()) || 
      ic.label.includes(iconSearch);
    return matchesCat && matchesSearch;
  });

  const renderStep1 = () => (
    <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* ── 0. تصنيف وطبيعة المسار المؤسسي (Route Nature & Architecture) ── */}
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 14, border: `1.5px solid ${A.sep}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>طبيعة وتصنيف المسار المؤسسي (Route Nature & Engine Category)</div>
              <div style={{ fontSize: 11, color: A.textSub }}>اختر تصنيف المسار لتهيئة المحركات التشغيلية المتخصصة تلقائياً (إجازات ومغادرات، دعم عام، اعتمادات مالية)</div>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: ROUTE_CATEGORIES.find(c => c.id === (wizard.routeCategory || 'OPERATIONAL'))?.color }}>
            {ROUTE_CATEGORIES.find(c => c.id === (wizard.routeCategory || 'OPERATIONAL'))?.title}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {ROUTE_CATEGORIES.map(cat => {
            const isSelected = (wizard.routeCategory || 'OPERATIONAL') === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setW({ routeCategory: cat.id as any });
                  if (cat.id === 'TIME_OFF') {
                    // Activate schedule engine & global company delegate picker
                    setFC({
                      showScheduleEngine: true,
                      scheduleMode: 'DATE_RANGE',
                      scheduleLabel: 'فترة الإجازة أو المغادرة',
                      showDelegateUser: true,
                      delegateScope: 'ALL_COMPANY_USERS',
                      delegateUserLabel: 'الموظف المكلف بالعمل / البديل',
                    });
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px',
                  borderRadius: 12,
                  background: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                  border: isSelected ? `2px solid ${cat.color}` : `1.5px solid ${A.sep}`,
                  boxShadow: isSelected ? `0 4px 14px ${cat.color}25` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <span style={{ fontSize: 26, lineHeight: 1 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? cat.color : A.text }}>{cat.title}</div>
                    {isSelected && (
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: cat.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: A.textSub, marginTop: 4, lineHeight: 1.4 }}>{cat.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 1. الهوية الأساسية ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:A.text, display:'block', marginBottom:6 }}>اسم المسار <span style={{ color:A.red }}>*</span></label>
          <input className="tr-input" placeholder="مثال: طلب إجازة سنوية / إذن مغادرة" value={wizard.name} onChange={e => setW({ name:e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:A.textSub, display:'block', marginBottom:6 }}>وصف مختصر للمسار (اختياري)</label>
          <input className="tr-input" placeholder="شرح مبسط يظهر للموظف عند التقديم..." value={wizard.description} onChange={e => setW({ description:e.target.value })} />
        </div>
      </div>

      {/* ── 2. مكتبة الأيقونات المؤسسية الحديثة ── */}
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 14, border: `1px solid ${A.sep}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎨</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>مكتبة الأيقونات المؤسسية الحديثة (Icon Library)</div>
              <div style={{ fontSize: 11, color: A.textSub }}>اختر الأيقونة الدالة على طبيعة ونوع الطلب في هذا المسار</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${wizard.color}18`, color: wizard.color, fontWeight: 800 }}>
              المحددة: {wizard.icon}
            </span>
            <input
              type="text"
              placeholder="🔍 ابحث عن أيقونة..."
              value={iconSearch}
              onChange={e => setIconSearch(e.target.value)}
              className="tr-input"
              style={{ padding: '6px 12px', fontSize: 11.5, width: 170, background: '#fff' }}
            />
          </div>
        </div>

        {/* فئات الأيقونات */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {ICON_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setIconCategory(cat.id)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: iconCategory === cat.id ? 800 : 600,
                cursor: 'pointer',
                border: iconCategory === cat.id ? `1.5px solid ${wizard.color}` : `1px solid ${A.sep}`,
                background: iconCategory === cat.id ? `${wizard.color}18` : '#fff',
                color: iconCategory === cat.id ? wizard.color : A.textSub,
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* شبكة الأيقونات الحديثة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8, maxHeight: 195, overflowY: 'auto', padding: '4px' }}>
          {filteredIcons.map(ic => {
            const isSelected = wizard.icon === ic.name;
            return (
              <div
                key={ic.name}
                onClick={() => setW({ icon: ic.name })}
                className="icon-option"
                title={`${ic.label} (${ic.name})`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 4px 6px',
                  borderRadius: 10,
                  background: isSelected ? `${wizard.color}18` : '#fff',
                  border: isSelected ? `2px solid ${wizard.color}` : `1px solid ${A.sep}`,
                  boxShadow: isSelected ? `0 2px 8px ${wizard.color}30` : 'none',
                  color: isSelected ? wizard.color : A.text,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {renderRouteIcon(ic.name, 22, isSelected ? wizard.color : '#475569')}
                </div>
                <span style={{ fontSize: 10, fontWeight: isSelected ? 800 : 500, color: isSelected ? wizard.color : A.textSub, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', padding: '0 2px' }}>
                  {ic.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. الألوان التنفيذية الفاخرة ── */}
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 14, border: `1px solid ${A.sep}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💎</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>لوحة الألوان التنفيذية للمسار (Executive Palette)</div>
              <div style={{ fontSize: 11, color: A.textSub }}>اللون المميز للمسار والتذكرة السينمائية والأختام</div>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: wizard.color }}>
            {EXECUTIVE_PALETTE.find(p => p.hex.toLowerCase() === wizard.color.toLowerCase())?.name || wizard.color}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 1fr))', gap: 8 }}>
          {EXECUTIVE_PALETTE.map(pal => {
            const isSelected = wizard.color.toLowerCase() === pal.hex.toLowerCase();
            return (
              <div
                key={pal.hex}
                onClick={() => setW({ color: pal.hex })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: isSelected ? '#fff' : '#ffffff88',
                  border: isSelected ? `2px solid ${pal.hex}` : `1px solid ${A.sep}`,
                  boxShadow: isSelected ? `0 2px 10px ${pal.hex}35` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: pal.hex,
                    boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 3px ${pal.hex}` : 'none',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: isSelected ? 800 : 600, color: isSelected ? pal.hex : A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pal.name.split(' (')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. جهة استقبال الطلبات والتفويض المؤسسي (ضمن الخطوة الأولى) ── */}
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 14, border: `1.5px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🏛️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>الجهة المعنية باستقبال ومعالجة طلبات هذا المسار <span style={{ color:A.red }}>*</span></div>
            <div style={{ fontSize: 11, color: A.textSub }}>تحديد الإدارة والقسم والفريق المسؤول عن تنفيذ التذاكر وتعيين قائد خصائص المسار</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {/* الإدارة */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:A.text, display:'block', marginBottom:6 }}>الإدارة التشغيلية المستقبلة <span style={{ color:A.red }}>*</span></label>
            <select className="tr-input" value={wizard.targetDepartmentId} onChange={e => { const dept=departments.find(d=>String(d.id)===e.target.value); setW({ targetDepartmentId:e.target.value, targetDepartmentName:dept?.name||'', targetDivisionId:'', targetDivisionName:'', targetTeamId:'', targetTeamName:'' }); }}>
              <option value="">-- اختر الإدارة التشغيلية --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {departments.length === 0 && <div style={{ fontSize:11, color:A.textTer, marginTop:4 }}>💡 أنشئ الإدارات أولاً من تبويب "الهيكل التشغيلي"</div>}
          </div>

          {/* القسم */}
          {divisions.length > 0 && (
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:A.textSub, display:'block', marginBottom:6 }}>القسم التابع للإدارة (اختياري)</label>
              <select className="tr-input" value={wizard.targetDivisionId} onChange={e => { const div=divisions.find(d=>String(d.id)===e.target.value); setW({ targetDivisionId:e.target.value, targetDivisionName:div?.name||'', targetTeamId:'', targetTeamName:'' }); }}>
                <option value="">-- توجيه للإدارة بالكامل دون حصر في قسم --</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {/* الفريق / الوحدة */}
          {teams.length > 0 && (
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:A.textSub, display:'block', marginBottom:6 }}>الوحدة / الفريق التابع للقسم (اختياري)</label>
              <select className="tr-input" value={wizard.targetTeamId || ''} onChange={e => { const tm=teams.find((t: any)=>String(t.id)===e.target.value); setW({ targetTeamId:e.target.value, targetTeamName:tm?.name||'' }); }}>
                <option value="">-- توجيه للقسم بالكامل دون حصر في وحدة --</option>
                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* ── قائد خصائص المسار (Flow Manager Delegation) ── */}
        {wizard.targetDepartmentId && (
          <div style={{ background: '#fff', padding: '14px', borderRadius: 10, border: `1.5px solid ${wizard.managerId ? wizard.color + '60' : A.sep}`, marginTop: 6, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: A.text, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span>🛡️ من مكلف بإدارة خصائص المسار (قائد الحوكمة)</span>
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
      </div>
    </div>
  );

  // ─── Custom Inputs Helpers ───
  const addCustomInput = () => {
    const cur = wizard.formConfig.customInputs || [];
    const newInput: CustomFormInput = {
      id: `ci_${Date.now()}`,
      name: `custom_input_${cur.length + 1}`,
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
      order: cur.length,
    };
    setFC({ customInputs: [...cur, newInput] });
  };

  const updateCustomInput = (id: string, upd: Partial<CustomFormInput>) => {
    const cur = wizard.formConfig.customInputs || [];
    setFC({ customInputs: cur.map(ci => ci.id === id ? { ...ci, ...upd } : ci) });
  };

  const removeCustomInput = (id: string) => {
    const cur = wizard.formConfig.customInputs || [];
    setFC({ customInputs: cur.filter(ci => ci.id !== id) });
  };

  const moveCustomInput = (index: number, direction: -1 | 1) => {
    const cur = [...(wizard.formConfig.customInputs || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= cur.length) return;
    const [moved] = cur.splice(index, 1);
    cur.splice(targetIndex, 0, moved);
    setFC({ customInputs: cur });
  };

  const renderStep2 = () => {
    const attachedMainFields = dynamicFields.filter(f => (wizard.formConfig.routeDynamicFields || []).some(rf => rf.fieldId === f.id));
    const availableToAttach = dynamicFields.filter(f => !(wizard.formConfig.routeDynamicFields || []).some(rf => rf.fieldId === f.id));
    const customInputsList = wizard.formConfig.customInputs || [];
    const taxMode = wizard.formConfig.taxonomyDisplayMode || 'dropdown';

    return (
      <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:22 }}>

        {/* ── 1. المستدلات والتصنيفات الديناميكية للمسار ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${A.sep}`, padding: '18px', boxShadow: A.shadow }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span>
                <span>المستدلات والتصنيفات الديناميكية للمسار</span>
              </div>
              <div style={{ fontSize:11, color:A.textSub, marginTop: 2 }}>
                قوائم الاختيار المتفرعة التي تظهر للموظف لتحديد طبيعة وتفاصيل طلبه
              </div>
            </div>
            {!isBuildingField && (
              <button 
                className="route-action-btn" 
                onClick={() => startBuildingField()} 
                style={{ padding:'7px 14px', background:wizard.color, color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>+</span> مستدلة جديدة
              </button>
            )}
          </div>

          {/* محدد نمط عرض المستدلات في نموذج الموظف (Display Mode) */}
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${A.sep}`, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>نمط عرض خيارات المستدلات للموظف:</div>
              <div style={{ fontSize: 10.5, color: A.textSub }}>اختر طريقة ظهور عناصر هذه المستدلات عند تعبئة النموذج</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setFC({ taxonomyDisplayMode: 'dropdown' })}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${taxMode === 'dropdown' ? wizard.color : A.sep}`,
                  background: taxMode === 'dropdown' ? `${wizard.color}15` : '#fff',
                  color: taxMode === 'dropdown' ? wizard.color : A.textSub,
                  transition: 'all 0.2s'
                }}
              >
                🔘 قائمة منسدلة كلاسيكية (Dropdown)
              </button>
              <button
                type="button"
                onClick={() => setFC({ taxonomyDisplayMode: 'chips' })}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${taxMode === 'chips' ? wizard.color : A.sep}`,
                  background: taxMode === 'chips' ? `${wizard.color}15` : '#fff',
                  color: taxMode === 'chips' ? wizard.color : A.textSub,
                  transition: 'all 0.2s'
                }}
              >
                🔲 كروت وأيقونات تفاعلية (Chips & Cards)
              </button>
            </div>
          </div>

          {isBuildingField ? (
            <div className="field-card" style={{ border: `2px solid ${wizard.color}55`, background: '#F8FAFC' }}>
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
                <input className="tr-input" placeholder="اسم المستدلة (مثال: نوع العطل / نوع الصيانة)" value={fieldDraft.name} onChange={e => setFieldDraft(p => ({ ...p, name: e.target.value }))} style={{ marginBottom:10 }} />
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(fieldDraft.options || []).map((o, idx) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', padding: '6px 12px', borderRadius: 8, border: `1px solid ${A.sep}` }}>
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
                  <input
                    className="tr-input"
                    placeholder="إضافة خيار جديد..."
                    value={draftOptionText}
                    onChange={e => setDraftOptionText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDraftOption();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={addDraftOption} style={{ background:A.bg, border:`1px solid ${A.sep}`, borderRadius:8, padding:'0 14px', cursor:'pointer', fontWeight:600, color: A.text }}>+ إضافة خيار</button>
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
                <div style={{ fontSize:12, color:A.textTer, textAlign:'center', padding:20, background:A.bg, borderRadius:12 }}>لا توجد مستدلات مرتبطة بهذا المسار بعد. اضغط «+ مستدلة جديدة» أعلاه.</div>
              ) : (
                attachedMainFields.map(field => (
                  <div key={field.id} className="field-card" style={{ marginBottom: 0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight:700, fontSize:13.5, color:A.text }}>{field.name}</div>
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
                        <button onClick={() => unlinkMainField(field.id)} style={{ background:'none', border:'none', color:A.accent, fontSize:12, cursor:'pointer', fontWeight:600 }}>إلغاء الربط</button>
                        <button onClick={() => deleteDynamicField(field.id)} style={{ background:'none', border:'none', color:A.red, fontSize:12, cursor:'pointer', fontWeight:600 }}>حذف نهائي</button>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {field.options.map(opt => {
                        const children = getChildFieldsForOption(field.id, opt.id);
                        const conditionalInputs = getInputsForOption(field.id, opt.id);
                        const isAddingInput = activeOptionInputAdder?.optionId === opt.id;

                        return (
                          <div key={opt.id} style={{ display:'flex', flexDirection:'column', gap:8, background: '#fff', padding: '10px 14px', borderRadius: 10, border: `1px solid ${A.sep}` }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="option-tag" style={{ margin:0, fontWeight: 700, fontSize: 12.5 }}>
                                  {opt.label}
                                </div>
                                {conditionalInputs.length > 0 && (
                                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: `${wizard.color}15`, color: wizard.color, fontWeight: 700 }}>
                                    📝 {conditionalInputs.length} حقول مشروطة
                                  </span>
                                )}
                                {children.length > 0 && (
                                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: '#f1f5f9', color: A.textSub, fontWeight: 700 }}>
                                    ↳ مستدلة فرعية
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {/* Button to add custom conditional inputs */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAddingInput) {
                                      setActiveOptionInputAdder(null);
                                    } else {
                                      setActiveOptionInputAdder({ fieldId: field.id, optionId: opt.id, optionLabel: opt.label });
                                      setOptionInputDraft({ label: '', type: 'text', placeholder: '', required: true });
                                    }
                                  }}
                                  style={{
                                    padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                                    background: isAddingInput ? `${wizard.color}25` : `${wizard.color}12`,
                                    color: wizard.color, border: `1px solid ${wizard.color}40`,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                                    transition: 'all 0.15s'
                                  }}
                                  title="إضافة حقول نصية أو رقمية مخصصة تظهر عند اختيار هذا الخيار"
                                >
                                  <span>📝</span>
                                  <span>+ حقول مشروطة لهذا الخيار</span>
                                </button>

                                {/* Button to add cascading sub-issue dropdown */}
                                <button
                                  type="button"
                                  className="add-subfield-btn"
                                  onClick={() => startBuildingField({ parentFieldId: field.id, triggerOptionId: opt.id })}
                                  title="إضافة مستدلة وتصنيف فرعي ينبثق عند اختيار هذا الخيار"
                                  style={{
                                    padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                                    background: '#f8fafc', color: A.textSub, border: `1px solid ${A.sep}`,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                                    width: 'auto', height: 'auto'
                                  }}
                                >
                                  <span>↳</span>
                                  <span>+ مستدلة فرعية</span>
                                </button>
                              </div>
                            </div>

                            {/* Inline Adder Form for Conditional Inputs */}
                            {isAddingInput && (
                              <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8, border: `1.5px dashed ${wizard.color}66`, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                                <div style={{ fontSize: 11.5, fontWeight: 800, color: wizard.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span>➕</span>
                                  <span>إضافة حقل إدخال مشروط بخيار: «{opt.label}»</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                                  <div>
                                    <label style={{ fontSize: 10.5, fontWeight: 700, color: A.textSub, display: 'block', marginBottom: 4 }}>تسمية الحقل *</label>
                                    <input
                                      className="tr-input"
                                      style={{ fontSize: 11.5, padding: '5px 8px', background: '#fff' }}
                                      placeholder="مثال: رقم التقرير الطبي / اسم المستشفى"
                                      value={optionInputDraft.label}
                                      onChange={e => setOptionInputDraft(p => ({ ...p, label: e.target.value }))}
                                      onKeyDown={e => e.key === 'Enter' && addInputToOption(field.id, opt.id)}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: 10.5, fontWeight: 700, color: A.textSub, display: 'block', marginBottom: 4 }}>نوع الإدخال</label>
                                    <select
                                      className="tr-input"
                                      style={{ fontSize: 11.5, padding: '5px 8px', background: '#fff' }}
                                      value={optionInputDraft.type}
                                      onChange={e => setOptionInputDraft(p => ({ ...p, type: e.target.value as any }))}
                                    >
                                      <option value="text">🔤 نص قصير (Text)</option>
                                      <option value="textarea">📝 نص ممتد وشرح (Textarea)</option>
                                      <option value="number">🔢 رقم / كمية (Number)</option>
                                      <option value="date">📅 تاريخ محدد (Date)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: 10.5, fontWeight: 700, color: A.textSub, display: 'block', marginBottom: 4 }}>نص توضيحي (Placeholder)</label>
                                    <input
                                      className="tr-input"
                                      style={{ fontSize: 11.5, padding: '5px 8px', background: '#fff' }}
                                      placeholder="مثال: اكتب الرقم هنا..."
                                      value={optionInputDraft.placeholder}
                                      onChange={e => setOptionInputDraft(p => ({ ...p, placeholder: e.target.value }))}
                                    />
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: A.text, cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={optionInputDraft.required}
                                        onChange={e => setOptionInputDraft(p => ({ ...p, required: e.target.checked }))}
                                      />
                                      <span>حقل إلزامي عند اختيار هذا الخيار</span>
                                    </label>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveOptionInputAdder(null)}
                                    style={{ padding: '6px 12px', background: '#fff', border: `1px solid ${A.sep}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', color: A.textSub, fontWeight: 600 }}
                                  >
                                    إلغاء
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => addInputToOption(field.id, opt.id)}
                                    style={{ padding: '6px 14px', background: wizard.color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    حفظ وربط الحقل
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* List of Existing Conditional Custom Inputs for this Option */}
                            {conditionalInputs.length > 0 && (
                              <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, borderRight: `3px solid ${wizard.color}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span>📝</span>
                                  <span>حقول إدخال تظهر تلقائياً للموظف عند اختيار ({opt.label}):</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {conditionalInputs.map(ci => (
                                    <div key={ci.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '6px 10px', borderRadius: 6, border: `1px solid ${A.sep}` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13 }}>{ci.type === 'textarea' ? '📝' : ci.type === 'number' ? '🔢' : ci.type === 'date' ? '📅' : '🔤'}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: A.text }}>{ci.label}</span>
                                        <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', color: A.textSub, fontWeight: 600 }}>
                                          {ci.type === 'textarea' ? 'نص ممتد' : ci.type === 'number' ? 'رقم' : ci.type === 'date' ? 'تاريخ' : 'نص'}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span
                                          onClick={() => toggleInputRequiredForOption(field.id, opt.id, ci.id)}
                                          style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', background: ci.required ? '#fef2f2' : '#f8fafc', color: ci.required ? A.red : A.textSub, border: `1px solid ${ci.required ? '#fecaca' : A.sep}`, fontWeight: 700 }}
                                        >
                                          {ci.required ? '🔴 إلزامي' : '⚪ اختياري'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => removeInputFromOption(field.id, opt.id, ci.id)}
                                          style={{ background: 'none', border: 'none', color: A.red, cursor: 'pointer', fontSize: 12, padding: '2px 4px', fontWeight: 800 }}
                                          title="حذف الحقل المشروط"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Cascading Subfield (preserved) */}
                            {children.length > 0 && (
                              <div style={{ padding: '10px 14px', background: A.bg, borderRadius: 10, borderRight: `3px solid ${wizard.color}66` }}>
                                {children.map(cf => (
                                  <div key={cf.id} style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>↳ مستدلة فرعية: {cf.name}</div>
                                      <div style={{ display:'flex', gap:6 }}>
                                        <button onClick={() => startEditingField(cf, { parentFieldId: field.id, triggerOptionId: opt.id })} style={{ background:'none', border:'none', color:A.blue, fontSize:11, cursor:'pointer', padding:0, fontWeight:600 }}>تعديل</button>
                                        <button onClick={() => unlinkSubField(field.id, opt.id, cf.id)} style={{ background:'none', border:'none', color:A.accent, fontSize:11, cursor:'pointer', padding:0, fontWeight:600 }}>إلغاء الربط</button>
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

                    {/* Quick Inline Option Adder for this Field */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${A.sep}` }}>
                      <input
                        className="tr-input"
                        placeholder={`+ إضافة خيار رئيسي جديد إلى «${field.name}» مباشرة...`}
                        value={quickOptionText[field.id] || ''}
                        onChange={e => setQuickOptionText(p => ({ ...p, [field.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAddOption(field.id);
                          }
                        }}
                        style={{ flex: 1, fontSize: 12, padding: '7px 12px', background: '#F8FAFC' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickAddOption(field.id)}
                        style={{
                          padding: '7px 14px', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                          background: wizard.color, color: '#fff', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap'
                        }}
                      >
                        <span>+</span>
                        <span>إضافة وحفظ الخيار</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {availableToAttach.length > 0 && (
                <div style={{ marginTop:6, padding:12, background:'#F8FAFC', borderRadius:10, border:`1px solid ${A.sep}` }}>
                  <div style={{ fontSize:11.5, fontWeight:600, color:A.textSub, marginBottom:6 }}>ربط مستدلة محفوظة مسبقاً بهذا المسار:</div>
                  <select className="tr-input" onChange={e => {
                    if (e.target.value) {
                      const current = wizard.formConfig.routeDynamicFields || [];
                      setFC({ routeDynamicFields: [...current, { fieldId: e.target.value, isRequired: true }] });
                      e.target.value = '';
                    }
                  }}>
                    <option value="">-- اختر مستدلة محفوظة لربطها --</option>
                    {availableToAttach.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 2. الحقول النصية والرقمية المخصصة (Custom Form Inputs) ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${A.sep}`, padding: '18px', boxShadow: A.shadow }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔤</span>
                <span>الحقول النصية والرقمية المخصصة (Custom Form Inputs)</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${wizard.color}15`, color: wizard.color, fontWeight: 700 }}>
                  عدد غير محدود
                </span>
              </div>
              <div style={{ fontSize:11, color:A.textSub, marginTop: 2 }}>
                أضف حقول إدخال إضافية خاصة بهذا المسار (نص، رقم، تاريخ، نص ممتد) مثل: رقم اللوحة، المبلغ، الملاحظات...
              </div>
            </div>
            <button 
              type="button"
              className="route-action-btn" 
              onClick={addCustomInput} 
              style={{ padding:'7px 14px', background: `${wizard.color}18`, color: wizard.color, border: `1px solid ${wizard.color}40`, borderRadius:9, fontSize:12, fontWeight:700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>+</span> إضافة حقل إدخال جديد
            </button>
          </div>

          {customInputsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', background: '#F8FAFC', borderRadius: 12, border: `1px dashed ${A.sep}` }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📝</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: A.textSub }}>لا توجد حقول نصية أو رقمية مخصصة حتى الآن</div>
              <div style={{ fontSize: 11, color: A.textTer, marginTop: 4 }}>يمكنك إضافة أي عدد من الحقول المخصصة لجمع تفاصيل مخصصة من الموظف</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {customInputsList.map((ci, idx) => (
                <div key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, border: `1px solid ${A.sep}`, flexWrap: 'wrap' }}>
                  {/* Reorder Arrows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button type="button" onClick={() => moveCustomInput(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.25 : 1, padding: 0, fontSize: 10, color: A.textSub }}>▲</button>
                    <button type="button" onClick={() => moveCustomInput(idx, 1)} disabled={idx === customInputsList.length - 1} style={{ background: 'none', border: 'none', cursor: idx === customInputsList.length - 1 ? 'default' : 'pointer', opacity: idx === customInputsList.length - 1 ? 0.25 : 1, padding: 0, fontSize: 10, color: A.textSub }}>▼</button>
                  </div>

                  {/* Type Selector */}
                  <div style={{ width: 140 }}>
                    <select 
                      className="tr-input" 
                      style={{ fontSize: 11.5, padding: '6px 8px', background: '#fff' }}
                      value={ci.type} 
                      onChange={e => updateCustomInput(ci.id, { type: e.target.value as any })}
                    >
                      <option value="text">🔤 نص قصير</option>
                      <option value="textarea">📝 نص ممتد</option>
                      <option value="number">🔢 رقم / كمية</option>
                      <option value="date">📅 تاريخ محدد</option>
                    </select>
                  </div>

                  {/* Label Input */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <input 
                      className="tr-input" 
                      style={{ fontSize: 12, padding: '6px 10px', background: '#fff' }}
                      placeholder="اسم الحقل (مثال: رقم لوحة المركبة)" 
                      value={ci.label} 
                      onChange={e => updateCustomInput(ci.id, { label: e.target.value, name: e.target.value })}
                    />
                  </div>

                  {/* Placeholder Input */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <input 
                      className="tr-input" 
                      style={{ fontSize: 12, padding: '6px 10px', background: '#fff' }}
                      placeholder="نص التلميح (مثال: أ-12345)" 
                      value={ci.placeholder || ''} 
                      onChange={e => updateCustomInput(ci.id, { placeholder: e.target.value })}
                    />
                  </div>

                  {/* Required Toggle */}
                  <div 
                    onClick={() => updateCustomInput(ci.id, { required: !ci.required })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11,
                      color: ci.required ? A.red : A.textSub, fontWeight: 700,
                      background: ci.required ? '#fef2f2' : '#fff', padding: '6px 10px', borderRadius: 8,
                      border: `1px solid ${ci.required ? '#fecaca' : A.sep}`, userSelect: 'none'
                    }}
                  >
                    {ci.required ? '🔴 إلزامي' : '⚪ اختياري'}
                  </div>

                  {/* Delete Button */}
                  <button 
                    type="button" 
                    onClick={() => removeCustomInput(ci.id)} 
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: A.red, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}
                    title="حذف الحقل"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. حقول الموقع والتبعية المؤسسية لمقدم الطلب ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${A.sep}`, padding: '18px', boxShadow: A.shadow, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏢</span>
            <span>حقول الموقع والتبعية المؤسسية لمقدم الطلب</span>
          </div>

          {/* Building field */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${!!wizard.formConfig.showBuildingField ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل موقع / مبنى العمل</div>
                <div style={{ fontSize: 11, color: A.textSub }}>إلزام أو إتاحة اختيار المبنى أو الموقع الذي تقع فيه المشكلة</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!!wizard.formConfig.showBuildingField && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryBuilding ? A.red : A.textSub, fontWeight: 700, background: wizard.formConfig.mandatoryBuilding ? '#fef2f2' : '#fff', padding: '4px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryBuilding ? '#fecaca' : A.sep}` }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${!!wizard.formConfig.showDepartmentField ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🏛️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل التبعية المؤسسية لمقدم الطلب</div>
                  <div style={{ fontSize: 11, color: A.textSub }}>تحديد موقع الموظف في الهيكل المؤسسي الحقيقي (إدارة / قسم / وحدة)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!!wizard.formConfig.showDepartmentField && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryDepartment ? A.red : A.textSub, fontWeight: 700, background: wizard.formConfig.mandatoryDepartment ? '#fef2f2' : '#fff', padding: '4px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryDepartment ? '#fecaca' : A.sep}` }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={!!wizard.formConfig.mandatoryDepartment} onChange={e => setFC({ mandatoryDepartment: e.target.checked })} />
                    {wizard.formConfig.mandatoryDepartment ? '🔴 إلزامي' : '⚪ اختياري'}
                  </label>
                )}
                <div onClick={() => setFC({ showDepartmentField: !wizard.formConfig.showDepartmentField })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showDepartmentField ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showDepartmentField ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>

            {!!wizard.formConfig.showDepartmentField && (
              <div style={{ padding: '12px 14px', background: `${wizard.color}08`, borderRadius: 10, border: `1px solid ${wizard.color}25`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>
                  مستوى التدرج التنظيمي المطلوب من الموظف:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                  <div 
                    onClick={() => setFC({ departmentSelectionLevel: 'DEPT_ONLY' })}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? '#fff' : 'rgba(255,255,255,0.6)',
                      border: `1.5px solid ${(!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? wizard.color : A.sep}`,
                      boxShadow: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? `0 2px 8px ${wizard.color}20` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: (!wizard.formConfig.departmentSelectionLevel || wizard.formConfig.departmentSelectionLevel === 'DEPT_ONLY') ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>🏛️</span> الإدارة / المكتب فقط
                    </div>
                  </div>

                  <div 
                    onClick={() => setFC({ departmentSelectionLevel: 'DEPT_AND_DIV' })}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? '#fff' : 'rgba(255,255,255,0.6)',
                      border: `1.5px solid ${wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? wizard.color : A.sep}`,
                      boxShadow: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? `0 2px 8px ${wizard.color}20` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>📂</span> الإدارة ➔ ثم القسم
                    </div>
                  </div>

                  <div 
                    onClick={() => setFC({ departmentSelectionLevel: 'FULL_HIERARCHY' })}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? '#fff' : 'rgba(255,255,255,0.6)',
                      border: `1.5px solid ${wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? wizard.color : A.sep}`,
                      boxShadow: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? `0 2px 8px ${wizard.color}20` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>👥</span> الإدارة ➔ القسم ➔ الوحدة
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
        </div>

        {/* ── 4. محركات الوظائف المتخصصة (Scheduling, Delegate, Description, Attachments) ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${A.sep}`, padding: '18px', boxShadow: A.shadow, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span>
            <span>المحركات التشغيلية والمرفقات</span>
          </div>

          {/* Smart Scheduling Engine */}
          {(() => {
            const isScheduleActive = !!(wizard.formConfig.showScheduleEngine || wizard.formConfig.showDateRange);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '14px', background: '#F8FAFC', borderRadius: 12, border: `1px solid ${isScheduleActive ? wizard.color + '45' : A.sep}`, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: isScheduleActive ? `${wizard.color}15` : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, border: `1px solid ${A.sep}` }}>
                      🗓️
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>محرك الجدولة الزمنية والوقت الذكي (Scheduling Engine)</div>
                      <div style={{ fontSize: 11, color: A.textSub }}>فترات إجازة بعداد تلقائي، أيام متفرقة، وأذونات ساعية</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isScheduleActive && (
                      <div onClick={() => setFC({ mandatorySchedule: !wizard.formConfig.mandatorySchedule, mandatoryDateRange: !wizard.formConfig.mandatorySchedule })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: (wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? A.red : A.textSub, fontWeight: 700, background: (wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? '#fef2f2' : '#fff', padding: '4px 10px', borderRadius: 6, border: `1px solid ${(wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? '#fecaca' : A.sep}`, userSelect: 'none' }}>
                        {(wizard.formConfig.mandatorySchedule || wizard.formConfig.mandatoryDateRange) ? '🔴 إلزامي' : '⚪ اختياري'}
                      </div>
                    )}
                    <div onClick={() => setFC({ showScheduleEngine: !isScheduleActive, showDateRange: !isScheduleActive })} style={{ width: 40, height: 22, borderRadius: 11, background: isScheduleActive ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, left: isScheduleActive ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                </div>

                {isScheduleActive && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: A.textSub, display: 'block', marginBottom: 5 }}>نمط الجدولة الزمنية المطلوب</label>
                        <select className="tr-input" style={{ fontSize: 12, padding: '7px 10px', background: '#fff' }} value={wizard.formConfig.scheduleMode || 'ANY'} onChange={e => setFC({ scheduleMode: e.target.value as any })}>
                          <option value="ANY">🔀 نمط مرن وشامل (فترة، أيام متفرقة، أو إذن ساعي)</option>
                          <option value="DATE_RANGE">📆 فترة متصلة بأيام محسوبة (من - إلى مع عداد الأيام)</option>
                          <option value="DISCRETE_DAYS">🗓️ أيام متعددة متفرقة (اختيار تواريخ متفرقة مع عداد)</option>
                          <option value="HOURLY_WINDOW">⏱️ إذن ساعي (تاريخ + من وإلى الساعة بدقة الدقائق)</option>
                          <option value="SINGLE_DATE">📅 موعد أو تاريخ محدد (يوم واحد فقط)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: A.textSub, display: 'block', marginBottom: 5 }}>تسمية الحقل في النموذج</label>
                        <input className="tr-input" style={{ fontSize: 12, padding: '7px 10px', background: '#fff' }} placeholder="مثال: فترة الإجازة / الموعد المحدد" value={wizard.formConfig.scheduleLabel || wizard.formConfig.dateRangeLabel || ''} onChange={e => setFC({ scheduleLabel: e.target.value, dateRangeLabel: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Delegate Colleague */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '14px', background: '#F8FAFC', borderRadius: 12, border: `1px solid ${wizard.formConfig.showDelegateUser ? wizard.color + '45' : A.sep}`, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: wizard.formConfig.showDelegateUser ? `${wizard.color}15` : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, border: `1px solid ${A.sep}` }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>الموظف المكلف بالعمل / البديل (Covering & Delegate Employee)</div>
                  <div style={{ fontSize: 11, color: A.textSub }}>تحديد زميل لتسليم المهام مع بحث حي فوري عبر كامل دليل موظفي الشركة</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {wizard.formConfig.showDelegateUser && (
                  <div onClick={() => setFC({ mandatoryDelegateUser: !wizard.formConfig.mandatoryDelegateUser })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryDelegateUser ? A.red : A.textSub, fontWeight: 700, background: wizard.formConfig.mandatoryDelegateUser ? '#fef2f2' : '#fff', padding: '4px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryDelegateUser ? '#fecaca' : A.sep}`, userSelect: 'none' }}>
                    {wizard.formConfig.mandatoryDelegateUser ? '🔴 إلزامي' : '⚪ اختياري'}
                  </div>
                )}
                <div onClick={() => setFC({ showDelegateUser: !wizard.formConfig.showDelegateUser })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showDelegateUser ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showDelegateUser ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>
            {wizard.formConfig.showDelegateUser && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: A.textSub, display: 'block', marginBottom: 5 }}>تسمية الحقل في النموذج</label>
                    <input className="tr-input" style={{ fontSize: 12, padding: '7px 10px', background: '#fff' }} placeholder="مثال: الموظف المكلف بالعمل / البديل" value={wizard.formConfig.delegateUserLabel || ''} onChange={e => setFC({ delegateUserLabel: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: A.textSub, display: 'block', marginBottom: 5 }}>نطاق اختيار الموظف المكلف</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setFC({ delegateScope: 'ALL_COMPANY_USERS' })}
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${(!wizard.formConfig.delegateScope || wizard.formConfig.delegateScope === 'ALL_COMPANY_USERS') ? wizard.color : A.sep}`,
                          background: (!wizard.formConfig.delegateScope || wizard.formConfig.delegateScope === 'ALL_COMPANY_USERS') ? `${wizard.color}15` : '#fff',
                          color: (!wizard.formConfig.delegateScope || wizard.formConfig.delegateScope === 'ALL_COMPANY_USERS') ? wizard.color : A.textSub,
                          transition: 'all 0.2s'
                        }}
                      >
                        🌐 جميع موظفي الشركة (دليل شامل)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFC({ delegateScope: 'SAME_DEPARTMENT' })}
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${wizard.formConfig.delegateScope === 'SAME_DEPARTMENT' ? wizard.color : A.sep}`,
                          background: wizard.formConfig.delegateScope === 'SAME_DEPARTMENT' ? `${wizard.color}15` : '#fff',
                          color: wizard.formConfig.delegateScope === 'SAME_DEPARTMENT' ? wizard.color : A.textSub,
                          transition: 'all 0.2s'
                        }}
                      >
                        🏛️ نفس الإدارة فقط
                      </button>
                    </div>
                  </div>

                  {/* شرط الظهور الذكي لحقل الموظف المكلف */}
                  <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: A.text, display: 'block', marginBottom: 6 }}>شرط وتوقيت ظهور حقل الموظف المكلف في النموذج</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                      <div
                        onClick={() => setFC({ delegateTriggerMode: 'ONLY_ON_ASSIGNMENT' })}
                        style={{
                          padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                          background: (!wizard.formConfig.delegateTriggerMode || wizard.formConfig.delegateTriggerMode === 'ONLY_ON_ASSIGNMENT') ? '#fff' : 'rgba(255,255,255,0.6)',
                          border: `1.5px solid ${(!wizard.formConfig.delegateTriggerMode || wizard.formConfig.delegateTriggerMode === 'ONLY_ON_ASSIGNMENT') ? wizard.color : A.sep}`,
                          boxShadow: (!wizard.formConfig.delegateTriggerMode || wizard.formConfig.delegateTriggerMode === 'ONLY_ON_ASSIGNMENT') ? `0 2px 8px ${wizard.color}20` : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: (!wizard.formConfig.delegateTriggerMode || wizard.formConfig.delegateTriggerMode === 'ONLY_ON_ASSIGNMENT') ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>🎯</span> فقط عند اختيار نوع طلب تكليف مؤقت / انتداب (ذكي موصى به)
                        </div>
                        <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 4, lineHeight: 1.4 }}>
                          يختفي تماماً في الإجازات والأذونات الساعية، ويظهر للموظف فقط عندما يختار نوع الطلب تكليفاً مؤقتاً
                        </div>
                      </div>

                      <div
                        onClick={() => setFC({ delegateTriggerMode: 'ALWAYS' })}
                        style={{
                          padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                          background: wizard.formConfig.delegateTriggerMode === 'ALWAYS' ? '#fff' : 'rgba(255,255,255,0.6)',
                          border: `1.5px solid ${wizard.formConfig.delegateTriggerMode === 'ALWAYS' ? wizard.color : A.sep}`,
                          boxShadow: wizard.formConfig.delegateTriggerMode === 'ALWAYS' ? `0 2px 8px ${wizard.color}20` : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: wizard.formConfig.delegateTriggerMode === 'ALWAYS' ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>🌐</span> دائماً في كافة طلبات هذا المسار
                        </div>
                        <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 4, lineHeight: 1.4 }}>
                          يظهر حقل الزميل البديل دائماً لكافة الموظفين بصرف النظر عن نوع المعاملة
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Problem Description */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${wizard.formConfig.showDescription ? wizard.color + '40' : A.sep}`, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>✏️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>حقل وصف المشكلة / الطلب</div>
                <div style={{ fontSize: 11, color: A.textSub }}>مربع نص ممتد لكتابة تفاصيل وشرح المعاملة</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {wizard.formConfig.showDescription && (
                <div onClick={() => setFC({ mandatoryDescription: !wizard.formConfig.mandatoryDescription })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryDescription ? A.red : A.textSub, fontWeight: 700, background: wizard.formConfig.mandatoryDescription ? '#fef2f2' : '#fff', padding: '4px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryDescription ? '#fecaca' : A.sep}`, userSelect: 'none' }}>
                  {wizard.formConfig.mandatoryDescription ? '🔴 إلزامي' : '⚪ اختياري'}
                </div>
              )}
              <div onClick={() => setFC({ showDescription: !wizard.formConfig.showDescription })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showDescription ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showDescription ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '14px', background: '#F8FAFC', borderRadius: 12, border: `1px solid ${wizard.formConfig.showAttachments ? wizard.color + '45' : A.sep}`, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📎</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>مكون رفع المرفقات والملفات</div>
                  <div style={{ fontSize: 11, color: A.textSub }}>رفع مستندات وصور مع الطلب مع حظر صيغ معينة وتحديد الحجم الأقصى</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {wizard.formConfig.showAttachments && (
                  <div onClick={() => setFC({ mandatoryAttachments: !wizard.formConfig.mandatoryAttachments })} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: wizard.formConfig.mandatoryAttachments ? A.red : A.textSub, fontWeight: 700, background: wizard.formConfig.mandatoryAttachments ? '#fef2f2' : '#fff', padding: '4px 10px', borderRadius: 6, border: `1px solid ${wizard.formConfig.mandatoryAttachments ? '#fecaca' : A.sep}`, userSelect: 'none' }}>
                    {wizard.formConfig.mandatoryAttachments ? '🔴 إلزامي' : '⚪ اختياري'}
                  </div>
                )}
                <div onClick={() => setFC({ showAttachments: !wizard.formConfig.showAttachments })} style={{ width: 40, height: 22, borderRadius: 11, background: wizard.formConfig.showAttachments ? wizard.color : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: wizard.formConfig.showAttachments ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            </div>

            {wizard.formConfig.showAttachments && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: A.textSub }}>الامتدادات المسموحة:</span>
                  {['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx', 'zip'].map(ext => {
                    const active = (wizard.formConfig.attachmentTypes || []).includes(ext);
                    return (
                      <span
                        key={ext}
                        onClick={() => {
                          const cur = wizard.formConfig.attachmentTypes || [];
                          const next = active ? cur.filter(x => x !== ext) : [...cur, ext];
                          setFC({ attachmentTypes: next });
                        }}
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                          background: active ? `${wizard.color}18` : '#fff',
                          color: active ? wizard.color : A.textSub,
                          border: `1px solid ${active ? wizard.color : A.sep}`,
                          transition: 'all 0.15s'
                        }}
                      >
                        {active && '✓ '}
                        {ext.toUpperCase()}
                      </span>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: A.textSub }}>الحد الأقصى للملف الواحد:</span>
                  <select
                    className="tr-input"
                    style={{ width: 120, fontSize: 11.5, padding: '4px 8px', background: '#fff' }}
                    value={wizard.formConfig.maxAttachmentMB || 10}
                    onChange={e => setFC({ maxAttachmentMB: parseInt(e.target.value) || 10 })}
                  >
                    <option value={5}>5 ميغابايت</option>
                    <option value={10}>10 ميغابايت</option>
                    <option value={25}>25 ميغابايت</option>
                    <option value={50}>50 ميغابايت</option>
                  </select>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  // ─── Step 3: Fields Matrix & Ordering Helpers ───
  interface ActiveFieldItem {
    id: string;
    label: string;
    typeLabel: string;
    icon: string;
    isRequired: boolean;
  }

  const getActiveFormFields = (): ActiveFieldItem[] => {
    const items: ActiveFieldItem[] = [];
    const fc = wizard.formConfig;

    if (fc.showBuildingField) {
      items.push({ id: 'building', label: 'المبنى وموقع العمل', typeLabel: 'موقع جغرافي', icon: '🏢', isRequired: !!fc.mandatoryBuilding });
    }
    if (fc.showDepartmentField) {
      items.push({ id: 'department', label: 'التبعية المؤسسية لمقدم الطلب', typeLabel: 'هيكل مؤسسي', icon: '🏛️', isRequired: !!fc.mandatoryDepartment });
    }
    (fc.routeDynamicFields || []).forEach(rf => {
      const f = dynamicFields.find(df => df.id === rf.fieldId);
      if (f) {
        items.push({ id: `dynamic_${f.id}`, label: f.name, typeLabel: 'مستدلة وتصنيف', icon: '📋', isRequired: rf.isRequired });
      }
    });
    (fc.customInputs || []).forEach(ci => {
      items.push({
        id: `custom_${ci.id}`,
        label: ci.label || 'حقل مخصص',
        typeLabel: ci.type === 'textarea' ? 'نص ممتد' : ci.type === 'number' ? 'رقم / كمية' : ci.type === 'date' ? 'تاريخ' : 'نص قصير',
        icon: ci.type === 'textarea' ? '📝' : ci.type === 'number' ? '🔢' : ci.type === 'date' ? '📅' : '🔤',
        isRequired: ci.required,
      });
    });
    if (fc.showScheduleEngine || fc.showDateRange) {
      items.push({ id: 'scheduleEngine', label: fc.scheduleLabel || fc.dateRangeLabel || 'الجدولة الزمنية والوقت', typeLabel: 'محرك جدولة', icon: '🗓️', isRequired: !!(fc.mandatorySchedule || fc.mandatoryDateRange) });
    }
    if (fc.showDelegateUser) {
      items.push({ id: 'delegateUser', label: fc.delegateUserLabel || 'الموظف البديل / تسليم المهام', typeLabel: 'تفويض مؤسسي', icon: '👤', isRequired: !!fc.mandatoryDelegateUser });
    }
    if (fc.showDescription) {
      items.push({ id: 'description', label: 'وصف المشكلة / الطلب', typeLabel: 'شرح وملاحظات', icon: '✏️', isRequired: !!fc.mandatoryDescription });
    }
    if (fc.showAttachments) {
      items.push({ id: 'attachment', label: 'مرفقات الطلب', typeLabel: 'ملفات ووثائق', icon: '📎', isRequired: !!fc.mandatoryAttachments });
    }

    if (fc.fieldsOrder && fc.fieldsOrder.length > 0) {
      items.sort((a, b) => {
        const idxA = fc.fieldsOrder!.indexOf(a.id);
        const idxB = fc.fieldsOrder!.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    return items;
  };

  const handleSortAscending = () => {
    const fields = getActiveFormFields();
    fields.sort((a, b) => a.label.localeCompare(b.label, 'ar'));
    setFC({ fieldsOrder: fields.map(f => f.id) });
    showToast('تم ترتيب الحقول تصاعدياً (أ - ي) بنجاح', 'success');
  };

  const handleSortDescending = () => {
    const fields = getActiveFormFields();
    fields.sort((a, b) => b.label.localeCompare(a.label, 'ar'));
    setFC({ fieldsOrder: fields.map(f => f.id) });
    showToast('تم ترتيب الحقول تنازلياً (ي - أ) بنجاح', 'success');
  };

  const handleResetOrder = () => {
    setFC({ fieldsOrder: [] });
    showToast('تمت استعادة الترتيب المنطقي الافتراضي للحقول', 'success');
  };

  const handleMoveField = (fieldId: string, direction: -1 | 1) => {
    const fields = getActiveFormFields();
    const currentOrder = fields.map(f => f.id);
    const index = currentOrder.indexOf(fieldId);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const [moved] = currentOrder.splice(index, 1);
    currentOrder.splice(targetIndex, 0, moved);
    setFC({ fieldsOrder: currentOrder });
  };

  const getFieldStageIndex = (fieldId: string): number => {
    const stages = wizard.formConfig.stages || [];
    if (stages.length <= 1) return 0;
    for (let i = 0; i < stages.length; i++) {
      if ((stages[i].fieldNames || []).includes(fieldId)) return i;
    }
    // Default heuristics if not explicitly mapped
    if (stages.length === 2) {
      return (fieldId === 'description' || fieldId === 'attachment') ? 1 : 0;
    }
    if (stages.length === 3) {
      if (['department', 'building'].includes(fieldId) || fieldId.startsWith('dynamic_')) return 0;
      if (['scheduleEngine', 'delegateUser', 'description', 'attachment'].includes(fieldId) || fieldId.startsWith('custom_')) return 1;
      return 0;
    }
    return 0;
  };

  const handleAssignFieldStage = (fieldId: string, targetStageIndex: number) => {
    const stages = [...(wizard.formConfig.stages || [
      { id: 'stage_1', title: 'التوجيه والتصنيف', fieldNames: [] },
      { id: 'stage_2', title: 'المتطلبات والجدولة', fieldNames: [] },
      { id: 'stage_3', title: 'تذكرة الاعتماد والتمزيق 🎟️', fieldNames: [] },
    ])];
    const updatedStages = stages.map((st, idx) => ({
      ...st,
      fieldNames: (st.fieldNames || []).filter(fn => fn !== fieldId)
    }));
    if (updatedStages[targetStageIndex]) {
      updatedStages[targetStageIndex].fieldNames = [
        ...(updatedStages[targetStageIndex].fieldNames || []),
        fieldId
      ];
    }
    setFC({ stages: updatedStages });
  };

  const renderStep3 = () => {
    const activeFields = getActiveFormFields();
    const currentStages = wizard.formConfig.stages && wizard.formConfig.stages.length > 0
      ? wizard.formConfig.stages
      : [
          { id: 'stage_1', title: 'التوجيه والتصنيف', fieldNames: ['department', 'division', 'team', 'building'] },
          { id: 'stage_2', title: 'المتطلبات والجدولة والمرفقات', fieldNames: ['scheduleEngine', 'delegateUser', 'description', 'attachment'] },
          { id: 'stage_3', title: 'تذكرة الاعتماد والتمزيق 🎟️', fieldNames: [] }
        ];

    const currentStageCount = currentStages.length;
    const safePreviewIndex = Math.min(previewStageIndex, currentStageCount - 1);
    const isTicketStage = safePreviewIndex === currentStageCount - 1 && currentStageCount > 1;

    // Filter fields belonging to current preview stage
    const fieldsInPreviewStage = activeFields.filter(f => getFieldStageIndex(f.id) === safePreviewIndex);

    return (
      <div className="wizard-step" style={{ display:'flex', flexDirection:'column', gap:22 }}>

        {/* ── 1. منظم وتوزيع مراحل النموذج (Stage Distributor Console) ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${A.sep}`, padding: '18px', boxShadow: A.shadow, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span>
                <span>منظم وتوزيع مراحل النموذج (Form Stage Distributor)</span>
              </div>
              <div style={{ fontSize: 11, color: A.textSub, marginTop: 2 }}>
                اختر عدد مراحل تعبئة النموذج للموظف، وقم بتخصيص مسميات المراحل بدقة
              </div>
            </div>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${wizard.color}15`, color: wizard.color, fontWeight: 700 }}>
              {currentStageCount === 1 ? 'مرحلة واحدة' : currentStageCount === 2 ? 'مرحلتان' : '3 مراحل سينمائية'}
            </span>
          </div>

          {/* Strategy preset selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {/* 1 Stage */}
            <div
              onClick={() => {
                setFC({
                  stages: [{ id: 'stage_all', title: 'تعبئة واعتماد المعاملة', fieldNames: [] }]
                });
                setPreviewStageIndex(0);
              }}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                background: currentStageCount === 1 ? `${wizard.color}15` : '#F8FAFC',
                border: `1.5px solid ${currentStageCount === 1 ? wizard.color : A.sep}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: currentStageCount === 1 ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
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
                    { id: 'stage_1', title: 'البيانات والتوجيه الأساسي', fieldNames: [] },
                    { id: 'stage_2', title: 'التفاصيل والتذكرة النهائية', fieldNames: [] }
                  ]
                });
                setPreviewStageIndex(0);
              }}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                background: currentStageCount === 2 ? `${wizard.color}15` : '#F8FAFC',
                border: `1.5px solid ${currentStageCount === 2 ? wizard.color : A.sep}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: currentStageCount === 2 ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📑</span> مرحلتان متوازنتان
              </div>
              <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 4 }}>
                المرحلة 1: البيانات ➔ المرحلة 2: التذكرة والاعتماد
              </div>
            </div>

            {/* 3 Stages (Default) */}
            <div
              onClick={() => {
                setFC({
                  stages: [
                    { id: 'stage_1', title: 'التوجيه والتصنيف', fieldNames: ['department', 'division', 'team', 'building'] },
                    { id: 'stage_2', title: 'المتطلبات والجدولة والمرفقات', fieldNames: ['scheduleEngine', 'delegateUser', 'description', 'attachment'] },
                    { id: 'stage_3', title: 'تذكرة الاعتماد والتمزيق 🎟️', fieldNames: [] }
                  ]
                });
                setPreviewStageIndex(0);
              }}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                background: currentStageCount === 3 ? `${wizard.color}15` : '#F8FAFC',
                border: `1.5px solid ${currentStageCount === 3 ? wizard.color : A.sep}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: currentStageCount === 3 ? wizard.color : A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎯</span> ثلاث مراحل سينمائية (افتراضي)
              </div>
              <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 4 }}>
                1: الأساسيات ➔ 2: التفاصيل ➔ 3: التذكرة السينمائية
              </div>
            </div>
          </div>

          {/* Editable Stage Titles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: A.textSub }}>
              تسميات المراحل في شريط تنقل الموظف:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentStages.map((st, idx) => (
                <div key={st.id || idx} style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, border: `1px solid ${A.sep}` }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: wizard.color }}>{idx + 1}.</span>
                  <input
                    type="text"
                    value={st.title}
                    onChange={e => {
                      const newStages = [...currentStages];
                      newStages[idx] = { ...newStages[idx], title: e.target.value };
                      setFC({ stages: newStages });
                    }}
                    className="tr-input"
                    style={{ fontSize: 11.5, padding: '5px 8px', background: '#fff' }}
                    placeholder={`عنوان المرحلة ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. مصفوفة ترتيب وتوزيع الحقول على المراحل (Field Matrix & Sorter) ── */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${A.sep}`, padding: '18px', boxShadow: A.shadow, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔀</span>
                <span>مصفوفة ترتيب وتوزيع الحقول على المراحل</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: A.textSub, fontWeight: 700 }}>
                  {activeFields.length} حقول نشطة
                </span>
              </div>
              <div style={{ fontSize: 11, color: A.textSub, marginTop: 2 }}>
                قم بفرز الحقول تصاعدياً/تنازلياً أو تحريك كل حقل يدوياً، وتحديد المرحلة التي يظهر فيها
              </div>
            </div>

            {/* Quick sort buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSortAscending}
                className="route-action-btn"
                style={{ padding: '6px 10px', borderRadius: 8, background: '#F8FAFC', border: `1px solid ${A.sep}`, fontSize: 11, fontWeight: 700, color: A.text, display: 'flex', alignItems: 'center', gap: 4 }}
                title="ترتيب أبجدي تصاعدي لكافة الحقول"
              >
                <span>🔤</span> أ ➔ ي (تصاعدي)
              </button>
              <button
                type="button"
                onClick={handleSortDescending}
                className="route-action-btn"
                style={{ padding: '6px 10px', borderRadius: 8, background: '#F8FAFC', border: `1px solid ${A.sep}`, fontSize: 11, fontWeight: 700, color: A.text, display: 'flex', alignItems: 'center', gap: 4 }}
                title="ترتيب أبجدي تنازلي لكافة الحقول"
              >
                <span>🔤</span> ي ➔ أ (تنازلي)
              </button>
              <button
                type="button"
                onClick={handleResetOrder}
                className="route-action-btn"
                style={{ padding: '6px 10px', borderRadius: 8, background: '#F8FAFC', border: `1px solid ${A.sep}`, fontSize: 11, fontWeight: 700, color: A.textSub, display: 'flex', alignItems: 'center', gap: 4 }}
                title="استعادة الترتيب المنطقي الافتراضي"
              >
                <span>🔄</span> استعادة الافتراضي
              </button>
            </div>
          </div>

          {activeFields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: A.textTer, background: '#F8FAFC', borderRadius: 10 }}>
              لا توجد حقول مفعلة حالياً في الخطوة 2.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeFields.map((field, idx) => {
                const assignedStage = getFieldStageIndex(field.id);
                return (
                  <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: `1px solid ${A.sep}`, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                      {/* Sequence Badge */}
                      <span style={{ fontSize: 11, fontWeight: 800, color: wizard.color, width: 24, textAlign: 'center' }}>
                        #{idx + 1}
                      </span>
                      {/* Move buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button type="button" onClick={() => handleMoveField(field.id, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.25 : 1, padding: 0, fontSize: 10, color: A.textSub }}>▲</button>
                        <button type="button" onClick={() => handleMoveField(field.id, 1)} disabled={idx === activeFields.length - 1} style={{ background: 'none', border: 'none', cursor: idx === activeFields.length - 1 ? 'default' : 'pointer', opacity: idx === activeFields.length - 1 ? 0.25 : 1, padding: 0, fontSize: 10, color: A.textSub }}>▼</button>
                      </div>
                      {/* Icon & Label */}
                      <span style={{ fontSize: 16 }}>{field.icon}</span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: A.text }}>{field.label}</div>
                        <div style={{ fontSize: 10.5, color: A.textSub }}>{field.typeLabel}</div>
                      </div>
                      {field.isRequired && (
                        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 6, background: '#fef2f2', color: A.red, fontWeight: 700, border: '1px solid #fecaca' }}>
                          إلزامي
                        </span>
                      )}
                    </div>

                    {/* Stage Assignment Dropdown */}
                    {currentStageCount > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: A.textSub, fontWeight: 600 }}>يظهر في:</span>
                        <select
                          className="tr-input"
                          style={{ width: 170, fontSize: 11.5, padding: '5px 8px', background: '#fff' }}
                          value={assignedStage}
                          onChange={e => handleAssignFieldStage(field.id, parseInt(e.target.value) || 0)}
                        >
                          {currentStages.map((st, sIdx) => (
                            <option key={st.id || sIdx} value={sIdx}>
                              مرحلة {sIdx + 1}: {st.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 3. المعاينة التفاعلية المباشرة لتجربة الموظف والتذكرة السينمائية (Live Preview) ── */}
        <div style={{ padding: 20, background: 'linear-gradient(135deg, rgba(19,93,121,0.06), rgba(243,108,33,0.06))', borderRadius: 18, border: '1px solid rgba(19,93,121,0.15)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: A.text, marginBottom: 14, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>👁️</span>
            <span>معاينة تفاعلية مباشرة لتجربة الموظف</span>
            <span style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 20, background: `${wizard.color}18`, color: wizard.color, fontWeight: 800 }}>LIVE PREVIEW</span>
          </div>

          {/* Stepper Tabs */}
          {currentStageCount > 1 && (
            <div style={{ maxWidth: 420, margin: '0 auto 14px', display: 'flex', gap: 6, background: '#fff', padding: 4, borderRadius: 12, border: `1px solid ${A.sep}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {currentStages.map((st, sIdx) => {
                const isActive = sIdx === safePreviewIndex;
                return (
                  <button
                    key={st.id || sIdx}
                    type="button"
                    onClick={() => setPreviewStageIndex(sIdx)}
                    style={{
                      flex: 1, padding: '7px 8px', borderRadius: 9, fontSize: 11, fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer', border: 'none',
                      background: isActive ? wizard.color : 'transparent',
                      color: isActive ? '#fff' : A.textSub,
                      transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}
                  >
                    {sIdx + 1}. {st.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Phone Frame */}
          <div style={{ maxWidth: 420, margin: '0 auto', background: '#FFFFFF', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
            {/* Header bar */}
            <div style={{ padding: '12px 18px', background: `linear-gradient(135deg, ${wizard.color}, ${wizard.color}DD)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>
                  {renderIcon(wizard.icon || 'ClipboardList', 20, '#fff')}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{wizard.name || 'اسم المسار'}</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>
                    ← {wizard.targetDepartmentName || 'الإدارة المستقبلة'}
                  </div>
                </div>
              </div>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>✕</div>
            </div>

            {/* Stage Body */}
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!isTicketStage ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: wizard.color, marginBottom: 2 }}>
                    📍 {currentStages[safePreviewIndex]?.title || 'تفاصيل النموذج'}
                  </div>

                  {fieldsInPreviewStage.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 12px', color: A.textTer, fontSize: 12 }}>
                      لا توجد حقول مخصصة لهذه المرحلة. (يمكنك تعيين حقول لها من المصفوفة أعلاه)
                    </div>
                  ) : (
                    fieldsInPreviewStage.map(field => {
                      // Building Field
                      if (field.id === 'building') {
                        return (
                          <div key={field.id}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: A.text, display: 'block', marginBottom: 4 }}>
                              🏢 {field.label} {field.isRequired && <span style={{ color: A.red }}>*</span>}
                            </label>
                            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', fontSize: 11.5, color: A.textTer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>-- اختر موقع أو مبنى العمل --</span>
                              <span style={{ fontSize: 9 }}>▼</span>
                            </div>
                          </div>
                        );
                      }

                      // Department Field
                      if (field.id === 'department') {
                        return (
                          <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: A.text, display: 'block', margin: 0 }}>
                              🏛️ {field.label} {field.isRequired && <span style={{ color: A.red }}>*</span>}
                            </label>
                            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', fontSize: 11.5, color: A.textTer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>-- اختر الإدارة أو المكتب التابع له --</span>
                              <span style={{ fontSize: 9 }}>▼</span>
                            </div>
                            {(wizard.formConfig.departmentSelectionLevel === 'DEPT_AND_DIV' || wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY') && (
                              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', fontSize: 11.5, color: A.textTer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>-- اختر القسم التابع له --</span>
                                <span style={{ fontSize: 9 }}>▼</span>
                              </div>
                            )}
                            {wizard.formConfig.departmentSelectionLevel === 'FULL_HIERARCHY' && (
                              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', fontSize: 11.5, color: A.textTer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>-- اختر الوحدة أو الفريق --</span>
                                <span style={{ fontSize: 9 }}>▼</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Dynamic Taxonomies & Conditional Inputs in Preview
                      if (field.id.startsWith('dynamic_')) {
                        const dynId = field.id.replace('dynamic_', '');
                        const dynField = dynamicFields.find(df => df.id === dynId);
                        const isChips = (wizard.formConfig.taxonomyDisplayMode === 'chips');
                        const defaultOptId = dynField?.options?.[0]?.id || '';
                        const selectedOptId = previewSelectedOptions[dynId] || defaultOptId;
                        const selectedOpt = dynField?.options?.find(o => o.id === selectedOptId);
                        const conditionalInputs = selectedOpt ? getInputsForOption(dynId, selectedOpt.id) : [];

                        return (
                          <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: A.text, display: 'block', margin: 0 }}>
                              📋 {field.label} {field.isRequired && <span style={{ color: A.red }}>*</span>}
                            </label>
                            {isChips ? (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {(dynField?.options || [{ id: '1', label: 'الخيار الأول' }, { id: '2', label: 'الخيار الثاني' }, { id: '3', label: 'الخيار الثالث' }]).map((opt) => {
                                  const isSel = (selectedOptId === opt.id);
                                  return (
                                    <div
                                      key={opt.id}
                                      onClick={() => setPreviewSelectedOptions(p => ({ ...p, [dynId]: opt.id }))}
                                      style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                        background: isSel ? `${wizard.color}15` : '#fff',
                                        color: isSel ? wizard.color : A.textSub,
                                        border: `1.5px solid ${isSel ? wizard.color : A.sep}`,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                                        transition: 'all 0.15s'
                                      }}
                                    >
                                      {isSel && <span>✓</span>}
                                      <span>{opt.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <select
                                className="tr-input"
                                style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', fontSize: 11.5 }}
                                value={selectedOptId}
                                onChange={e => setPreviewSelectedOptions(p => ({ ...p, [dynId]: e.target.value }))}
                              >
                                {(dynField?.options || []).map(opt => (
                                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                              </select>
                            )}

                            {/* Dynamically expand conditional inputs for the selected option in preview */}
                            {conditionalInputs.length > 0 && (
                              <div style={{ marginTop: 4, padding: '10px 12px', background: `${wizard.color}08`, borderRadius: 10, border: `1.5px dashed ${wizard.color}40`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 10.5, fontWeight: 800, color: wizard.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span>↳</span>
                                  <span>متطلبات إضافية مشروطة باختيار «{selectedOpt?.label}»:</span>
                                </div>
                                {conditionalInputs.map(ci => (
                                  <div key={ci.id}>
                                    <label style={{ fontSize: 10.5, fontWeight: 600, color: A.text, display: 'block', marginBottom: 2 }}>
                                      {ci.type === 'textarea' ? '📝' : ci.type === 'number' ? '🔢' : ci.type === 'date' ? '📅' : '🔤'} {ci.label} {ci.required && <span style={{ color: A.red }}>*</span>}
                                    </label>
                                    {ci.type === 'textarea' ? (
                                      <div style={{ padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #E2E8F0', minHeight: 38, fontSize: 11, color: A.textTer }}>
                                        {ci.placeholder || 'اكتب التفاصيل المطلوبة هنا...'}
                                      </div>
                                    ) : (
                                      <div style={{ padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #E2E8F0', fontSize: 11, color: A.textTer }}>
                                        {ci.placeholder || `أدخل ${ci.label}...`}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Custom Form Inputs
                      if (field.id.startsWith('custom_')) {
                        const ciId = field.id.replace('custom_', '');
                        const ci = (wizard.formConfig.customInputs || []).find(c => c.id === ciId);
                        return (
                          <div key={field.id}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: A.text, display: 'block', marginBottom: 4 }}>
                              {field.icon} {field.label} {field.isRequired && <span style={{ color: A.red }}>*</span>}
                            </label>
                            {ci?.type === 'textarea' ? (
                              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', minHeight: 46, fontSize: 11.5, color: A.textTer }}>
                                {ci?.placeholder || 'اكتب التفاصيل المطلوبة هنا...'}
                              </div>
                            ) : (
                              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', fontSize: 11.5, color: A.textTer }}>
                                {ci?.placeholder || `أدخل ${field.label}...`}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Scheduling Engine
                      if (field.id === 'scheduleEngine') {
                        return (
                          <div key={field.id} style={{ background: '#F8FAFC', borderRadius: 10, padding: 10, border: `1px solid ${wizard.color}35`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: A.text }}>🗓️ {field.label}</span>
                              <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 8, background: `${wizard.color}15`, color: wizard.color, fontWeight: 700 }}>
                                محرك تلقائي
                              </span>
                            </div>
                            <div style={{ padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #E2E8F0', fontSize: 10.5, color: A.textSub, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>من: 2026/10/15  إلى: 2026/10/20</span>
                              <span style={{ fontWeight: 800, color: '#16a34a' }}>🟢 6 أيام</span>
                            </div>
                          </div>
                        );
                      }

                      // Delegate Colleague
                      if (field.id === 'delegateUser') {
                        const isVis = isDelegateFieldVisible(previewSelectedOptions, wizard.formConfig);
                        if (!isVis) {
                          return (
                            <div key={field.id} style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1.5px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: A.textSub, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>🔒</span>
                                <span>حقل الزميل المكلف محجوب الآن ذكياً</span>
                              </div>
                              <div style={{ fontSize: 10, color: A.textTer }}>
                                لن يظهر للموظف في الإجازات والأذونات العادية، ويظهر فوراً إذا اختار نوع الطلب «تكليف مؤقت».
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={field.id}>
                            <EmployeeDelegatePicker
                              value={previewSelectedOptions['delegateUser'] || ''}
                              onChange={(userId) => setPreviewSelectedOptions(p => ({ ...p, delegateUser: userId }))}
                              label={field.label}
                              required={field.isRequired}
                              scope={wizard.formConfig.delegateScope || 'ALL_COMPANY_USERS'}
                            />
                          </div>
                        );
                      }

                      // Problem Description
                      if (field.id === 'description') {
                        return (
                          <div key={field.id}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: A.text, display: 'block', marginBottom: 4 }}>
                              ✏️ {field.label} {field.isRequired && <span style={{ color: A.red }}>*</span>}
                            </label>
                            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#F8FAFC', border: '1.5px solid #E2E8F0', minHeight: 52, fontSize: 11.5, color: A.textTer }}>
                              اكتب شرحاً تفصيلياً للمشكلة أو المعاملة...
                            </div>
                          </div>
                        );
                      }

                      // Attachments
                      if (field.id === 'attachment') {
                        return (
                          <div key={field.id}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: A.text, display: 'block', marginBottom: 4 }}>
                              📎 {field.label} {field.isRequired && <span style={{ color: A.red }}>*</span>}
                            </label>
                            <div style={{ padding: '12px', borderRadius: 10, background: '#FAFBFE', border: '2px dashed #CBD5E1', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 20, opacity: 0.6 }}>☁️</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: A.textSub }}>استعراض أو سحب الملف هنا</span>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
                                {wizard.formConfig.attachmentTypes.slice(0, 4).map(t => (
                                  <span key={t} style={{ fontSize: 8.5, padding: '2px 5px', borderRadius: 4, background: '#E2E8F0', color: A.textSub, fontWeight: 700 }}>{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })
                  )}

                  {/* Stepper Navigation Button */}
                  <div
                    onClick={() => {
                      if (safePreviewIndex < currentStageCount - 1) {
                        setPreviewStageIndex(safePreviewIndex + 1);
                      }
                    }}
                    style={{
                      padding: '10px 16px', marginTop: 6,
                      background: `linear-gradient(135deg, ${wizard.color}, ${wizard.color}DD)`,
                      borderRadius: 10, textAlign: 'center',
                      fontSize: 12.5, fontWeight: 800, color: '#fff',
                      boxShadow: `0 3px 12px ${wizard.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{safePreviewIndex < currentStageCount - 1 ? 'الانتقال للمرحلة التالية' : 'إرسال المعاملة'}</span>
                    <span>←</span>
                  </div>
                </>
              ) : (
                /* ── Authentic Cinema Ticket Live Preview ── */
                <div style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${wizard.color}40`, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  {/* Top Perforation / Ribbon */}
                  <div style={{ background: `linear-gradient(135deg, ${wizard.color}, ${wizard.color}CC)`, padding: '12px 16px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🎟️</span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800 }}>تذكرة اعتماد المعاملة</div>
                        <div style={{ fontSize: 9.5, opacity: 0.85 }}>نظام التذاكر الموحد — NEXUS TDS</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9.5, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.25)', fontWeight: 800 }}>
                      جاهز للإرسال
                    </span>
                  </div>

                  {/* Ticket Details */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: `1px solid ${A.sep}`, paddingBottom: 6 }}>
                      <span style={{ color: A.textSub }}>رقم التذكرة الافتراضي:</span>
                      <strong style={{ color: wizard.color }}>#TKT-2026-8841</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: `1px solid ${A.sep}`, paddingBottom: 6 }}>
                      <span style={{ color: A.textSub }}>المسار والجهة المستهدفة:</span>
                      <strong style={{ color: A.text }}>{wizard.name || 'المسار'} ({wizard.targetDepartmentName || 'الإدارة'})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderBottom: `1px solid ${A.sep}`, paddingBottom: 6 }}>
                      <span style={{ color: A.textSub }}>مقدم الطلب:</span>
                      <strong style={{ color: A.text }}>م. مجدي الزروق (مهندس برمجيات)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, paddingBottom: 2 }}>
                      <span style={{ color: A.textSub }}>تاريخ وساعة التقديم:</span>
                      <strong style={{ color: A.text }}>19 أكتوبر 2026 — 11:30 ص</strong>
                    </div>

                    {/* Perforation Cut Line with Side Notches */}
                    <div className="ticket-perforation">
                      <div className="ticket-notch-left" />
                      <div className="ticket-notch-right" />
                    </div>

                    {/* Barcode & QR Code simulation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
                      {/* Barcode Simulation */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', gap: 2, height: 32, alignItems: 'center' }}>
                          {[3, 1, 4, 1, 2, 5, 1, 3, 2, 4, 1, 3, 2, 5, 2, 1, 4, 2].map((w, i) => (
                            <div key={i} style={{ width: w, height: '100%', background: '#1e293b' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 8.5, letterSpacing: 2, color: A.textSub, textAlign: 'center' }}>*TKT-8841-NX*</span>
                      </div>

                      {/* QR Code Simulation */}
                      <div style={{ width: 44, height: 44, borderRadius: 6, border: '1.5px solid #1e293b', padding: 3, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} style={{ background: (i % 2 === 0 || i % 5 === 0) ? '#1e293b' : 'transparent', borderRadius: 1 }} />
                        ))}
                      </div>
                    </div>

                    {/* Realistic Cinema Ticket Tear / Submit Button */}
                    <button
                      type="button"
                      style={{
                        padding: '12px 16px', marginTop: 4,
                        background: `linear-gradient(135deg, ${wizard.color}, #f36c21)`,
                        border: 'none', borderRadius: 10,
                        fontSize: 13, fontWeight: 800, color: '#fff',
                        boxShadow: `0 4px 16px ${wizard.color}45`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                      }}
                    >
                      <span>تمزيق التذكرة وإرسال المعاملة</span>
                      <span style={{ fontSize: 16 }}>🎟️✂️</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Phone bottom bar */}
            <div style={{ height: 4, width: 90, margin: '6px auto 10px', borderRadius: 4, background: 'rgba(0,0,0,0.12)' }} />
          </div>
        </div>

      </div>
    );
  };

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
                      <div style={{ fontSize:12, color:A.textSub, marginTop:3, display:'flex', alignItems:'center', gap:6, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:r.isActive?A.green:A.red }} />
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{r.isActive?'نشط':'متوقف'}</span>
                        </div>
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 700,
                          background: r.routeCategory === 'TIME_OFF' ? '#ecfdf5' : r.routeCategory === 'FINANCIAL' ? '#fffbeb' : '#eff6ff',
                          color: r.routeCategory === 'TIME_OFF' ? '#059669' : r.routeCategory === 'FINANCIAL' ? '#d97706' : '#2563eb',
                          border: `1px solid ${r.routeCategory === 'TIME_OFF' ? '#a7f3d0' : r.routeCategory === 'FINANCIAL' ? '#fde68a' : '#bfdbfe'}`
                        }}>
                          {r.routeCategory === 'TIME_OFF' ? '🏖️ إجازات ومغادرات' : r.routeCategory === 'FINANCIAL' ? '💼 مالي واعتمادات' : '🏢 دعم وتشغيل'}
                        </span>
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
