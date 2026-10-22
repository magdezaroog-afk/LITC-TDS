import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { OrgDepartment, OrgDivision } from './OperationalStructureTab';
import * as LucideIcons from 'lucide-react';
import {
  Sparkles, Plus, Trash2, ArrowUp, ArrowDown, Check, X,
  ChevronLeft, ChevronRight, Edit3, MoveRight, MoveLeft,
  Settings, Layers, Sliders, Eye, FileText, Calendar,
  Clock, UserCheck, Paperclip, Building2, HelpCircle,
  Hash, DollarSign, CheckSquare, ToggleLeft, ToggleRight,
  Search, ShieldCheck, Copy, Play, Pause, Save, RefreshCw,
  LayoutGrid, List, CheckCircle2, AlertTriangle, Monitor,
  Printer, Wifi, Laptop, HardDrive, Cpu, Wrench
} from 'lucide-react';
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
  getOptionBehavior,
  getOptionIcon,
  POPULAR_OPTION_ICONS,
  LEAVE_TYPES_PRESET,
  type OptionBehaviorRule,
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
// Constants & Design Tokens
// ═══════════════════════════════════════════════════════════
const renderIcon = (name: string, size: number = 22, color?: string) => {
  return renderRouteIcon(name, size, color, 2.2);
};

const A = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  text: '#1D1D1F',
  textSub: '#6E6E73',
  textTer: '#AEAEB2',
  sep: 'rgba(0,0,0,0.08)',
  radius: '14px',
  radiusSm: '10px',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  shadowCard: '0 2px 8px rgba(0,0,0,0.06)',
  font: "-apple-system, 'SF Pro Display', 'Cairo', 'Tajawal', sans-serif",
  accent: '#FF6B35',
  accentBg: '#FFF3ED',
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  purple: '#5856D6',
};

const STYLE_ID = 'ticket-routing-tab-styles';
const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.96);} to { opacity:1; transform:scale(1);} }
    @keyframes toastIn { from { opacity:0; transform:translateY(-20px) scale(0.95);} to { opacity:1; transform:translateY(0) scale(1);} }
    @keyframes spin { from { transform:rotate(0deg);} to { transform:rotate(360deg);} }
    .route-card { transition:all 0.2s cubic-bezier(0.28,0.11,0.32,1); animation:fadeSlideIn 0.3s both; }
    .route-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.12) !important; }
    .route-action-btn { transition:all 0.15s ease; cursor:pointer; }
    .route-action-btn:hover { opacity:0.85; transform:scale(0.98); }
    .route-action-btn:active { transform:scale(0.94); }
    .palette-btn { transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor:pointer; }
    .palette-btn:hover { transform:translateY(-2px); border-color:#38bdf8 !important; box-shadow:0 4px 14px rgba(56,189,248,0.2) !important; }
    .field-canvas-card { transition:all 0.2s ease; }
    .field-canvas-card:hover { border-color:#38bdf8 !important; box-shadow:0 4px 18px rgba(0,0,0,0.06); }
    .tr-input { width:100%; padding:9px 12px; border:1.5px solid rgba(0,0,0,0.1); border-radius:10px; background:#F8FAFC; font-family:inherit; font-size:12.5px; color:#1D1D1F; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
    .tr-input:focus { border-color:#38bdf8; background:#fff; box-shadow:0 0 0 3px rgba(56,189,248,0.15); }
    .tr-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:99999; display:flex; align-items:center; gap:10px; padding:12px 20px; border-radius:14px; font-size:13px; font-weight:700; box-shadow:0 8px 32px rgba(0,0,0,0.25); animation:toastIn 0.3s cubic-bezier(0.28,0.11,0.32,1) both; min-width:240px; }
    .tr-toast.success { background:#0f172a; color:#fff; border:1px solid rgba(52,199,89,0.4); }
    .tr-toast.error { background:#0f172a; color:#fff; border:1px solid rgba(255,59,48,0.4); }
    .tr-toast.loading { background:#0f172a; color:#fff; border:1px solid rgba(255,255,255,0.15); }
    .ticket-perforation { position: relative; border-top: 2px dashed rgba(0,0,0,0.15); margin: 16px -16px; }
    .ticket-notch-left { position: absolute; left: -10px; top: -10px; width: 20px; height: 20px; border-radius: 50%; background: #F8FAFC; box-shadow: inset -2px 0 3px rgba(0,0,0,0.06); }
    .ticket-notch-right { position: absolute; right: -10px; top: -10px; width: 20px; height: 20px; border-radius: 50%; background: #F8FAFC; box-shadow: inset 2px 0 3px rgba(0,0,0,0.06); }
  `;
  document.head.appendChild(style);
};

export const ROUTE_CATEGORIES = [
  {
    id: 'OPERATIONAL',
    title: 'مسار عام / دعم فني وتشغيلي',
    desc: 'طلبات الدعم التقني، الصيانة، الخدمات الإدارية، وتصنيف الأعطال',
    icon: '🏢',
    color: '#007AFF',
  },
  {
    id: 'TIME_OFF',
    title: 'مسار إجازات ومغادرات دوام',
    desc: 'إجازات سنوية ومرضية، أذونات ساعية، وتكليف موظف بديل من دليل الشركة',
    icon: '🏖️',
    color: '#10B981',
  },
  {
    id: 'FINANCIAL',
    title: 'مسار مالي ومشتريات',
    desc: 'سلف، عهد نقدية، فواتير ومشتريات مع دورات اعتماد ومبالغ مالية',
    icon: '💼',
    color: '#F59E0B',
  },
] as const;

type WizardStep = 1 | 2 | 3;

interface WizardState {
  name: string;
  description: string;
  icon: string;
  color: string;
  routeCategory: 'OPERATIONAL' | 'TIME_OFF' | 'FINANCIAL' | 'GENERAL';
  targetDepartmentId: string;
  targetDepartmentName: string;
  targetDivisionId: string;
  targetDivisionName: string;
  targetTeamId?: string;
  targetTeamName?: string;
  managerId: string;
  managerName: string;
  formConfig: RouteFormConfig;
}

const defaultWizard = (): WizardState => ({
  name: '',
  description: '',
  icon: 'Monitor',
  color: '#007AFF',
  routeCategory: 'OPERATIONAL',
  targetDepartmentId: '',
  targetDepartmentName: '',
  targetDivisionId: '',
  targetDivisionName: '',
  targetTeamId: '',
  targetTeamName: '',
  managerId: '',
  managerName: '',
  formConfig: {
    ...defaultFormConfig(),
    stages: [
      { id: 'stage_1', title: 'البيانات الأساسية والتصنيف', fieldNames: [] },
      { id: 'stage_2', title: 'المتطلبات والمرفقات', fieldNames: [] }
    ],
    fieldWidths: {},
  },
});

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'loading';
  visible: boolean;
}

export const TicketRoutingTab: React.FC = () => {
  useEffect(() => {
    injectStyles();
  }, []);

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

  // Active Stage Index in Step 2 Studio
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  // Icon Library Search & Filter State
  const [iconSearch, setIconSearch] = useState('');
  const [iconCategory, setIconCategory] = useState<string>('all');

  // Quick Option Creator Popover per Field
  const [quickOptionInput, setQuickOptionInput] = useState<Record<string, string>>({});
  const [openOptionIconPicker, setOpenOptionIconPicker] = useState<string | null>(null);

  // Modal to add a new custom field / link dynamic field
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [dropdownModalTab, setDropdownModalTab] = useState<'saved' | 'create'>('saved');
  const [savedFieldSearch, setSavedFieldSearch] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'select' | 'text' | 'textarea' | 'number' | 'date'>('select');
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>(['خيار 1', 'خيار 2']);
  const [newFieldDisplayMode, setNewFieldDisplayMode] = useState<'dropdown' | 'chips'>('chips');

  // Sub-Dropdown Cascading Linker State
  const [openChildBindingPicker, setOpenChildBindingPicker] = useState<{
    parentFieldId: string;
    optionId: string;
    optionLabel: string;
  } | null>(null);
  const [newChildFieldInput, setNewChildFieldInput] = useState<{
    name: string;
    options: string;
  }>({ name: '', options: '' });

  // Candidate Route Managers
  const [candidateManagers, setCandidateManagers] = useState<any[]>([]);

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

  useEffect(() => {
    if (!wizard.targetDepartmentId) {
      setCandidateManagers([]);
      return;
    }
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
          if (wizard.managerId) {
            const current = res.candidates.find((c: any) => String(c.id) === String(wizard.managerId));
            if (current && !wizard.managerName) {
              setW({ managerName: current.name });
            }
          } else {
            const suggested = res.candidates.find((c: any) => c.isSuggested);
            if (suggested) {
              setW({ managerId: String(suggested.id), managerName: suggested.name });
            }
          }
        }
      })
      .catch(() => {});
  }, [wizard.targetDepartmentId, wizard.targetDivisionId, wizard.targetTeamId]);

  const setW = (upd: Partial<WizardState>) => setWizard(p => ({ ...p, ...upd }));
  const setFC = (upd: Partial<RouteFormConfig>) => setWizard(p => ({ ...p, formConfig: { ...p.formConfig, ...upd } }));

  // Ensure stages exist and are synchronized
  const stages: RouteFormStage[] = useMemo(() => {
    if (wizard.formConfig.stages && wizard.formConfig.stages.length > 0) {
      return wizard.formConfig.stages;
    }
    return [
      { id: 'stage_1', title: 'البيانات الأساسية والتصنيف', fieldNames: [] },
      { id: 'stage_2', title: 'المتطلبات والمرفقات', fieldNames: [] }
    ];
  }, [wizard.formConfig.stages]);

  const activeStage = stages[activeStageIdx] || stages[0];

  const openCreate = () => {
    setEditingId(null);
    setWizard(defaultWizard());
    setWizardStep(1);
    setActiveStageIdx(0);
    setView('wizard');
  };

  const openEdit = (route: TicketRouteDefinition) => {
    const r = normalizeRoute(route);
    setEditingId(r.id);
    const existingStages = (r.formConfig.stages && r.formConfig.stages.length > 0)
      ? r.formConfig.stages
      : [
          { id: 'stage_1', title: 'البيانات الأساسية والتصنيف', fieldNames: [] },
          { id: 'stage_2', title: 'المتطلبات والمرفقات', fieldNames: [] }
        ];

    setWizard({
      name: r.name,
      description: r.description,
      icon: r.icon,
      color: r.color,
      routeCategory: r.routeCategory || 'OPERATIONAL',
      targetDepartmentId: r.targetDepartmentId,
      targetDepartmentName: r.targetDepartmentName,
      targetDivisionId: r.targetDivisionId,
      targetDivisionName: r.targetDivisionName,
      targetTeamId: r.targetTeamId || '',
      targetTeamName: r.targetTeamName || '',
      managerId: r.managerId ? String(r.managerId) : '',
      managerName: r.managerName || '',
      formConfig: {
        ...r.formConfig,
        stages: existingStages,
        fieldWidths: r.formConfig.fieldWidths || {},
        routeDynamicFields: [...(r.formConfig.routeDynamicFields || [])],
        customInputs: [...(r.formConfig.customInputs || [])],
      }
    });
    setWizardStep(1);
    setActiveStageIdx(0);
    setView('wizard');
  };

  const handleSaveRoute = async () => {
    if (!wizard.name.trim()) {
      showToast('يرجى تحديد اسم المسار أولاً', 'error');
      setWizardStep(1);
      return;
    }
    if (!wizard.targetDepartmentId) {
      showToast('يرجى تحديد الإدارة المستقبلة للمسار', 'error');
      setWizardStep(1);
      return;
    }

    setIsSaving(true);
    showToast('جارٍ حفظ واعتماد المسار...', 'loading');
    const r: TicketRouteDefinition = {
      id: editingId || `route_${Date.now()}`,
      ...wizard,
      routeCategory: wizard.routeCategory || 'OPERATIONAL',
      managerId: wizard.managerId ? String(wizard.managerId) : undefined,
      managerName: wizard.managerName || undefined,
      isActive: true,
      createdAt: editingId ? (routes.find(x => x.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updated = [...routes];
    if (editingId) updated = updated.map(x => x.id === editingId ? r : x);
    else updated.push(r);

    try {
      const normalizedRoutes = await saveRoutes(updated);
      setRoutes(normalizedRoutes);
      setView('list');
      showToast(editingId ? '✅ تم تحديث المسار بنجاح' : '✅ تم إنشاء واعتماد المسار بنجاح', 'success');
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
    if (!window.confirm(`هل أنت متأكد من حذف مسار "${route?.name || ''}" تماماً؟`)) return;
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
        name: `${route.name} (نسخة جديدة)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [clonedRoute, ...routes];
      const normalizedRoutes = await saveRoutes(updated);
      setRoutes(normalizedRoutes);
      showToast('✅ تم استنساخ المسار بنجاح', 'success');
    } catch (err: any) {
      showToast(`❌ فشل استنساخ المسار: ${err?.message || 'خطأ في الاتصال'}`, 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Dynamic Fields & Stage Canvas Operations
  // ═══════════════════════════════════════════════════════════

  // Add a field directly to the currently active stage
  const addFieldToActiveStage = (fieldName: string) => {
    const currentStages = [...stages];
    const target = currentStages[activeStageIdx];
    if (!target) return;

    // Check if field is already in any stage
    const existsAnywhere = currentStages.some(st => (st.fieldNames || []).includes(fieldName));
    if (existsAnywhere) {
      showToast('هذا المكون مضاف بالفعل إلى النموذج', 'error');
      return;
    }

    currentStages[activeStageIdx] = {
      ...target,
      fieldNames: [...(target.fieldNames || []), fieldName]
    };
    setFC({ stages: currentStages });
    showToast(`✅ تم إضافة المكون إلى «${target.title}»`, 'success');
  };

  // Remove a field from stage
  const removeFieldFromStage = (fieldName: string) => {
    const currentStages = stages.map(st => ({
      ...st,
      fieldNames: (st.fieldNames || []).filter(fn => fn !== fieldName)
    }));
    setFC({ stages: currentStages });

    // Clean up toggles if system component
    if (fieldName === 'building') setFC({ showBuildingField: false });
    else if (fieldName === 'department') setFC({ showDepartmentField: false });
    else if (fieldName === 'scheduleEngine') setFC({ showScheduleEngine: false, showDateRange: false });
    else if (fieldName === 'delegateUser') setFC({ showDelegateUser: false });
    else if (fieldName === 'amount') setFC({ showAmountField: false });
    else if (fieldName === 'attachment') setFC({ showAttachments: false });
    else if (fieldName === 'description') setFC({ showDescription: false });
    else if (fieldName.startsWith('custom_')) {
      const cid = fieldName.replace('custom_', '');
      setFC({ customInputs: (wizard.formConfig.customInputs || []).filter(ci => ci.id !== cid) });
    } else if (fieldName.startsWith('dyn_')) {
      const fid = fieldName.replace('dyn_', '');
      setFC({ routeDynamicFields: (wizard.formConfig.routeDynamicFields || []).filter(rf => rf.fieldId !== fid) });
    }

    showToast('🗑 تم إزالة الحقل من المرحلة', 'success');
  };

  // Reorder field inside current stage
  const moveFieldInStage = (fieldName: string, direction: -1 | 1) => {
    const currentStages = [...stages];
    const target = currentStages[activeStageIdx];
    if (!target) return;

    const list = [...(target.fieldNames || [])];
    const idx = list.indexOf(fieldName);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    currentStages[activeStageIdx] = { ...target, fieldNames: list };
    setFC({ stages: currentStages });
  };

  // Move field to another stage
  const moveFieldToStage = (fieldName: string, targetStageIdx: number) => {
    if (targetStageIdx === activeStageIdx) return;
    const currentStages = stages.map((st, sIdx) => {
      if (sIdx === activeStageIdx) {
        return { ...st, fieldNames: (st.fieldNames || []).filter(fn => fn !== fieldName) };
      }
      if (sIdx === targetStageIdx) {
        return { ...st, fieldNames: [...(st.fieldNames || []), fieldName] };
      }
      return st;
    });
    setFC({ stages: currentStages });
    showToast(`➔ تم نقل الحقل إلى «${stages[targetStageIdx]?.title}»`, 'success');
  };

  // Change Field Width
  const setFieldWidth = (fieldName: string, width: '100%' | '50%' | '33.3%') => {
    const curWidths = { ...(wizard.formConfig.fieldWidths || {}) };
    curWidths[fieldName] = width;
    setFC({ fieldWidths: curWidths });
  };

  // Toggle Field Required
  const toggleFieldRequired = (fieldName: string) => {
    if (fieldName === 'building') setFC({ mandatoryBuilding: !wizard.formConfig.mandatoryBuilding });
    else if (fieldName === 'department') setFC({ mandatoryDepartment: !wizard.formConfig.mandatoryDepartment });
    else if (fieldName === 'scheduleEngine') setFC({ mandatorySchedule: !wizard.formConfig.mandatorySchedule });
    else if (fieldName === 'delegateUser') setFC({ mandatoryDelegateUser: !wizard.formConfig.mandatoryDelegateUser });
    else if (fieldName === 'amount') setFC({ mandatoryAmount: !wizard.formConfig.mandatoryAmount });
    else if (fieldName === 'attachment') setFC({ mandatoryAttachments: !wizard.formConfig.mandatoryAttachments });
    else if (fieldName === 'description') setFC({ mandatoryDescription: !wizard.formConfig.mandatoryDescription });
    else if (fieldName.startsWith('custom_')) {
      const cid = fieldName.replace('custom_', '');
      const cur = wizard.formConfig.customInputs || [];
      setFC({ customInputs: cur.map(c => c.id === cid ? { ...c, required: !c.required } : c) });
    } else if (fieldName.startsWith('dyn_')) {
      const fid = fieldName.replace('dyn_', '');
      const cur = wizard.formConfig.routeDynamicFields || [];
      setFC({ routeDynamicFields: cur.map(r => r.fieldId === fid ? { ...r, isRequired: !r.isRequired } : r) });
    }
  };

  // Add / Rename / Delete Stages
  const addStage = () => {
    const newStageNumber = stages.length + 1;
    const newStage: RouteFormStage = {
      id: `stage_${Date.now()}`,
      title: `المرحلة ${newStageNumber}: المتطلبات المتقدمة`,
      fieldNames: []
    };
    const nextStages = [...stages, newStage];
    setFC({ stages: nextStages });
    setActiveStageIdx(nextStages.length - 1);
    showToast(`✨ تم إنشاء المرحلة ${newStageNumber}`, 'success');
  };

  const removeStage = (indexToRemove: number) => {
    if (stages.length <= 1) {
      showToast('يجب أن يحتوي المسار على مرحلة واحدة على الأقل', 'error');
      return;
    }
    const stageToRemove = stages[indexToRemove];
    const fieldsToMigrate = stageToRemove.fieldNames || [];

    const nextStages = stages.filter((_, idx) => idx !== indexToRemove).map((st, idx) => {
      if (idx === 0) {
        return { ...st, fieldNames: [...st.fieldNames, ...fieldsToMigrate] };
      }
      return st;
    });

    setFC({ stages: nextStages });
    setActiveStageIdx(Math.max(0, indexToRemove - 1));
    showToast('🗑 تم حذف المرحلة ونقل حقولها للمرحلة الأولى', 'success');
  };

  const renameStage = (idx: number, newTitle: string) => {
    const nextStages = [...stages];
    if (nextStages[idx]) {
      nextStages[idx] = { ...nextStages[idx], title: newTitle };
      setFC({ stages: nextStages });
    }
  };

  // Add quick option to dynamic field
  const handleAddQuickOption = async (fieldId: string) => {
    const text = (quickOptionInput[fieldId] || '').trim();
    if (!text) return;

    const targetField = dynamicFields.find(f => f.id === fieldId);
    if (!targetField) return;

    if (targetField.options.some(o => o.label.toLowerCase() === text.toLowerCase())) {
      showToast('هذا الخيار موجود بالفعل', 'error');
      return;
    }

    const newOpt: DynamicFieldOption = {
      id: `opt_${Date.now()}`,
      label: text,
      isActive: true,
      icon: 'Sparkles',
    };

    const updated = dynamicFields.map(f => f.id === fieldId ? { ...f, options: [...f.options, newOpt] } : f);
    setDynamicFields(updated);
    await saveDynamicFields(updated);
    setQuickOptionInput(p => ({ ...p, [fieldId]: '' }));
    showToast(`✅ تم إضافة خيار «${text}»`, 'success');
  };

  const setOptionIcon = async (fieldId: string, optionId: string, optionLabel: string, icon: string) => {
    const updated = dynamicFields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: f.options.map(o => o.id === optionId ? { ...o, icon } : o)
        };
      }
      return f;
    });
    setDynamicFields(updated);
    await saveDynamicFields(updated);

    const nextIcons = {
      ...(wizard.formConfig.optionIcons || {}),
      [optionId]: icon,
      [optionLabel]: icon,
    };
    setFC({ optionIcons: nextIcons });
    setOpenOptionIconPicker(null);
    showToast(`✅ تم تغيير الأيقونة إلى ${icon}`, 'success');
  };

  // ── Cascading Sub-Dropdown Handlers ──
  const handleLinkChildField = async (parentId: string, childId: string, triggerValue: string) => {
    const updated = dynamicFields.map(f => {
      if (f.id !== parentId) return f;
      const curBindings = f.childBindings || [];
      const filtered = curBindings.filter(b => !(b.childFieldId === childId && b.triggerValue === triggerValue));
      return {
        ...f,
        childBindings: [...filtered, { childFieldId: childId, triggerValue }]
      };
    });
    setDynamicFields(updated);
    await saveDynamicFields(updated);
    showToast('✅ تم ربط المستدلة الفرعية بالخيار بنجاح', 'success');
    setOpenChildBindingPicker(null);
  };

  const handleUnlinkChildField = async (parentId: string, childId: string, triggerValue: string) => {
    const updated = dynamicFields.map(f => {
      if (f.id !== parentId) return f;
      return {
        ...f,
        childBindings: (f.childBindings || []).filter(b => !(b.childFieldId === childId && b.triggerValue === triggerValue))
      };
    });
    setDynamicFields(updated);
    await saveDynamicFields(updated);
    showToast('تم إلغاء ربط المستدلة الفرعية', 'info');
  };

  const handleCreateAndLinkChildField = async (parentId: string, triggerValue: string) => {
    const cName = newChildFieldInput.name.trim() || `فرع ${triggerValue}`;
    const opts = newChildFieldInput.options
      .split('\n')
      .map(o => o.trim())
      .filter(Boolean);
    if (opts.length === 0) opts.push('خيار فرعي 1', 'خيار فرعي 2');

    const newChild: DynamicCustomField = {
      id: `dyn_${Date.now()}`,
      name: cName,
      options: opts.map((lbl, i) => ({
        id: `opt_${Date.now()}_${i}`,
        label: lbl,
        isActive: true,
        icon: 'Sparkles',
      })),
      childBindings: []
    };

    const updated = [...dynamicFields, newChild].map(f => {
      if (f.id !== parentId) return f;
      const curBindings = f.childBindings || [];
      return {
        ...f,
        childBindings: [...curBindings, { childFieldId: newChild.id, triggerValue }]
      };
    });

    setDynamicFields(updated);
    await saveDynamicFields(updated);

    // Also register in routeDynamicFields if not present
    const curLinked = wizard.formConfig.routeDynamicFields || [];
    if (!curLinked.some(rdf => rdf.fieldId === newChild.id)) {
      setFC({
        routeDynamicFields: [...curLinked, { fieldId: newChild.id, isRequired: false }]
      });
    }

    setNewChildFieldInput({ name: '', options: '' });
    setOpenChildBindingPicker(null);
    showToast(`✅ تم إنشاء «${cName}» وربطها بالخيار بنجاح`, 'success');
  };

  const handleInsertSavedField = (f: DynamicCustomField) => {
    const curDynamicLinked = wizard.formConfig.routeDynamicFields || [];
    if (!curDynamicLinked.some(rdf => rdf.fieldId === f.id)) {
      setFC({
        routeDynamicFields: [...curDynamicLinked, { fieldId: f.id, isRequired: true }]
      });
    }
    addFieldToActiveStage(`dyn_${f.id}`);
    showToast(`✅ تم إدراج «${f.name}» في مرحلة «${activeStage?.title}»`, 'success');
  };

  // 1-Click Leave Types Preset
  const handleApplyLeavePreset = async () => {
    let leaveField = dynamicFields.find(f => f.name.includes('نوع الإجازة') || f.name.includes('نوع الطلب'));
    if (!leaveField) {
      leaveField = {
        id: `dyn_leave_${Date.now()}`,
        name: LEAVE_TYPES_PRESET.name,
        options: LEAVE_TYPES_PRESET.options.map(o => ({ id: o.id, label: o.label, icon: o.icon, isActive: true }))
      };
      const updatedFields = [leaveField, ...dynamicFields];
      setDynamicFields(updatedFields);
      await saveDynamicFields(updatedFields);
    }

    const currentLinked = wizard.formConfig.routeDynamicFields || [];
    const isLinked = currentLinked.some(r => r.fieldId === leaveField!.id);
    const updatedLinked = isLinked ? currentLinked : [{ fieldId: leaveField.id, isRequired: true }, ...currentLinked];

    const nextRules = { ...(wizard.formConfig.optionBehaviorRules || {}) };
    const nextIcons = { ...(wizard.formConfig.optionIcons || {}) };
    LEAVE_TYPES_PRESET.options.forEach(o => {
      nextRules[o.id] = o.rules;
      nextRules[o.label] = o.rules;
      if (o.icon) {
        nextIcons[o.id] = o.icon;
        nextIcons[o.label] = o.icon;
      }
    });

    const fName = `dyn_${leaveField.id}`;
    const nextStages = [...stages];
    if (nextStages[0] && !nextStages[0].fieldNames.includes(fName)) {
      nextStages[0].fieldNames = [fName, ...nextStages[0].fieldNames];
    }
    if (nextStages[1] && !nextStages[1].fieldNames.includes('scheduleEngine')) {
      nextStages[1].fieldNames = ['scheduleEngine', 'delegateUser', 'attachment', ...nextStages[1].fieldNames];
    }

    setFC({
      routeDynamicFields: updatedLinked,
      optionBehaviorRules: nextRules,
      optionIcons: nextIcons,
      taxonomyDisplayMode: 'chips',
      showScheduleEngine: true,
      mandatorySchedule: true,
      showDelegateUser: true,
      delegateTriggerMode: 'ONLY_ON_ASSIGNMENT',
      showDescription: true,
      showAttachments: true,
      stages: nextStages,
    });

    showToast('🏖️ تم إدراج حزمة أنواع الإجازات وشروط الجدولة بنجاح!', 'success');
  };

  // ═══════════════════════════════════════════════════════════
  // Render Step 1: Core Setup
  // ═══════════════════════════════════════════════════════════
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

  const step1Valid = wizard.name.trim().length > 0 && !!wizard.targetDepartmentId;

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. نوع وتصنيف المسار */}
      <div style={{ background: '#f8fafc', padding: 18, borderRadius: 14, border: `1.5px solid ${A.sep}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: A.text }}>طبيعة وتصنيف المسار المؤسسي (Route Nature)</div>
              <div style={{ fontSize: 11, color: A.textSub }}>اختر تصنيف المسار لتهيئة القوالب والمحركات المناسبة</div>
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
                  const catId = cat.id as any;
                  setW({ routeCategory: catId });
                  if (catId === 'TIME_OFF') {
                    setFC({
                      showScheduleEngine: true,
                      scheduleMode: 'DATE_RANGE',
                      scheduleLabel: 'فترة الإجازة أو المغادرة',
                      showDelegateUser: true,
                      delegateScope: 'ALL_COMPANY_USERS',
                      delegateTriggerMode: 'ONLY_ON_ASSIGNMENT',
                      showAmountField: false,
                    });
                  } else if (catId === 'FINANCIAL') {
                    setFC({
                      showScheduleEngine: false,
                      showDelegateUser: false,
                      showAmountField: true,
                      mandatoryAmount: true,
                      amountFieldLabel: 'المبلغ المالي المطلوب (د.ل)',
                    });
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  background: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                  border: isSelected ? `2px solid ${cat.color}` : `1.5px solid ${A.sep}`,
                  boxShadow: isSelected ? `0 4px 14px ${cat.color}25` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
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

      {/* 2. الاسم والوصف */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 6 }}>
            اسم المسار <span style={{ color: A.red }}>*</span>
          </label>
          <input
            className="tr-input"
            placeholder="مثال: طلب صيانة حاسب آلي / إجازة سنوية اعتيادية..."
            value={wizard.name}
            onChange={e => setW({ name: e.target.value })}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: A.textSub, display: 'block', marginBottom: 6 }}>
            وصف مختصر للمسار (اختياري)
          </label>
          <input
            className="tr-input"
            placeholder="شرح يظهر للموظف يوضح نطاق واستخدام هذا المسار..."
            value={wizard.description}
            onChange={e => setW({ description: e.target.value })}
          />
        </div>
      </div>

      {/* 3. مكتبة الأيقونات واللون */}
      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: `1px solid ${A.sep}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎨</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>الأيقونة واللون المميز للمسار والتذكرة</div>
              <div style={{ fontSize: 11, color: A.textSub }}>اختر الأيقونة الدالة واللون التنفيذي المعتمد</div>
            </div>
          </div>
          <input
            type="text"
            placeholder="🔍 ابحث عن أيقونة..."
            value={iconSearch}
            onChange={e => setIconSearch(e.target.value)}
            className="tr-input"
            style={{ padding: '6px 12px', fontSize: 11.5, width: 170, background: '#fff' }}
          />
        </div>

        {/* فئات الأيقونات */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {ICON_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setIconCategory(cat.id)}
              style={{
                padding: '4px 9px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: iconCategory === cat.id ? 800 : 600,
                cursor: 'pointer',
                border: iconCategory === cat.id ? `1.5px solid ${wizard.color}` : `1px solid ${A.sep}`,
                background: iconCategory === cat.id ? `${wizard.color}18` : '#fff',
                color: iconCategory === cat.id ? wizard.color : A.textSub,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* شبكة الأيقونات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 6, maxHeight: 150, overflowY: 'auto', padding: 2, marginBottom: 14 }}>
          {filteredIcons.map(ic => {
            const isSelected = wizard.icon === ic.name;
            return (
              <div
                key={ic.name}
                onClick={() => setW({ icon: ic.name })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 4px 6px',
                  borderRadius: 8,
                  background: isSelected ? `${wizard.color}18` : '#fff',
                  border: isSelected ? `2px solid ${wizard.color}` : `1px solid ${A.sep}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 2 }}>
                  {renderRouteIcon(ic.name, 20, isSelected ? wizard.color : '#475569')}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: isSelected ? 800 : 500, color: isSelected ? wizard.color : A.textSub, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {ic.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* لوحة الألوان */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>
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
                  borderRadius: 8,
                  background: isSelected ? '#fff' : '#ffffff88',
                  border: isSelected ? `2px solid ${pal.hex}` : `1px solid ${A.sep}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: pal.hex, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: isSelected ? 800 : 600, color: isSelected ? pal.hex : A.text }}>
                  {pal.name.split(' (')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. الجهة المستقبلة وقائد المسار */}
      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: `1.5px solid ${A.sep}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🏛️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>الجهة المعنية باستقبال ومعالجة طلبات هذا المسار <span style={{ color: A.red }}>*</span></div>
            <div style={{ fontSize: 11, color: A.textSub }}>تحديد الإدارة والقسم وقائد المسار المسؤول عن إنجاز التذاكر</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: A.text, display: 'block', marginBottom: 6 }}>
              الإدارة التشغيلية المستقبلة <span style={{ color: A.red }}>*</span>
            </label>
            <select
              className="tr-input"
              value={wizard.targetDepartmentId}
              onChange={e => {
                const dept = departments.find(d => String(d.id) === e.target.value);
                setW({
                  targetDepartmentId: e.target.value,
                  targetDepartmentName: dept?.name || '',
                  targetDivisionId: '',
                  targetDivisionName: '',
                  targetTeamId: '',
                  targetTeamName: '',
                });
              }}
            >
              <option value="">-- اختر الإدارة التشغيلية --</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {divisions.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.textSub, display: 'block', marginBottom: 6 }}>
                القسم التابع للإدارة (اختياري)
              </label>
              <select
                className="tr-input"
                value={wizard.targetDivisionId}
                onChange={e => {
                  const div = divisions.find(d => String(d.id) === e.target.value);
                  setW({
                    targetDivisionId: e.target.value,
                    targetDivisionName: div?.name || '',
                    targetTeamId: '',
                    targetTeamName: '',
                  });
                }}
              >
                <option value="">-- توجيه للإدارة بالكامل --</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {candidateManagers.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.textSub, display: 'block', marginBottom: 6 }}>
                قائد خصائص المسار (المشرف)
              </label>
              <select
                className="tr-input"
                value={wizard.managerId}
                onChange={e => {
                  const m = candidateManagers.find((c: any) => String(c.id) === e.target.value);
                  setW({ managerId: e.target.value, managerName: m?.name || '' });
                }}
              >
                <option value="">-- المشرف الافتراضي للإدارة --</option>
                {candidateManagers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.isSuggested ? '⭐ ' : ''}{c.name} {c.role ? `(${c.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // Render Step 2: Visual Studio (Palettes + Live Stage Canvas)
  // ═══════════════════════════════════════════════════════════
  const renderStep2Studio = () => {
    const stageFieldNames = activeStage?.fieldNames || [];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ─── 1. RIGHT SIDEBAR: Component Toolbox Palette ─── */}
        <div style={{ background: '#f8fafc', borderRadius: 14, border: `1.5px solid ${A.sep}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: A.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🧰</span>
              <span>مكتبة المكونات الجاهزة</span>
            </div>
            <div style={{ fontSize: 10.5, color: A.textSub, marginTop: 2 }}>
              انقر على أي مكون لإدراجه فوراً في <strong>«{activeStage?.title}»</strong>:
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* 1. مستدلة / قائمة اختيارات */}
            <div
              className="palette-btn"
              onClick={() => setShowAddFieldModal(true)}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>مستدلة / قائمة خيارات</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>قائمة منسدلة أو كروت وأيقونات دائرية</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 2. حقل نصي قصير */}
            <div
              className="palette-btn"
              onClick={() => {
                const newCi: CustomFormInput = {
                  id: `ci_${Date.now()}`,
                  name: `custom_input_${Date.now()}`,
                  label: 'حقل نصي إضافي',
                  type: 'text',
                  placeholder: 'أدخل البيانات المطلوبة...',
                  required: true,
                };
                const cur = wizard.formConfig.customInputs || [];
                setFC({ customInputs: [...cur, newCi] });
                addFieldToActiveStage(`custom_${newCi.id}`);
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔤</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>حقل نصي قصير</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>رقم لوحة، رمز نظام، عنوان فرعي...</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 3. نص ممتد / تفاصيل وشرح */}
            <div
              className="palette-btn"
              onClick={() => {
                setFC({ showDescription: true, mandatoryDescription: true });
                addFieldToActiveStage('description');
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📝</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>حقل نص ممتد (شرح وتفاصيل)</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>صندوق كتابة ملاحظات وتفاصيل المعاملة</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 4. محرك الجدولة والتاريخ والوقت */}
            <div
              className="palette-btn"
              onClick={() => {
                setFC({ showScheduleEngine: true, mandatorySchedule: true, scheduleMode: 'ANY' });
                addFieldToActiveStage('scheduleEngine');
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🗓️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>محرك الجدولة والوقت الذكي</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>فترة متصلة، إذن ساعي، أو أيام متفرقة</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 5. الموظف المكلف / البديل */}
            <div
              className="palette-btn"
              onClick={() => {
                setFC({ showDelegateUser: true, mandatoryDelegateUser: false, delegateScope: 'ALL_COMPANY_USERS' });
                addFieldToActiveStage('delegateUser');
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>👤</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>الموظف البديل / المكلف</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>بحث وتكليف مباشر من دليل الموظفين</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 6. مرفق ملفات ومستندات */}
            <div
              className="palette-btn"
              onClick={() => {
                setFC({ showAttachments: true, mandatoryAttachments: false, attachmentTypes: ['pdf', 'png', 'jpg', 'docx'] });
                addFieldToActiveStage('attachment');
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📎</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>مرفق ملفات ووثائق</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>رفع تقارير طبية، فواتير، مستندات</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 7. موقع العمل والمبنى */}
            <div
              className="palette-btn"
              onClick={() => {
                setFC({ showBuildingField: true, mandatoryBuilding: true });
                addFieldToActiveStage('building');
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🏢</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>موقع ومبنى العمل</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>تحديد المبنى أو المقر الإداري للطلب</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 8. التبعية المؤسسية لمقدم الطلب */}
            <div
              className="palette-btn"
              onClick={() => {
                setFC({ showDepartmentField: true, mandatoryDepartment: true, departmentSelectionLevel: 'DEPT_ONLY' });
                addFieldToActiveStage('department');
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🏛️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>التبعية المؤسسية لمقدم الطلب</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>الإدارة والقسم التابع له الموظف</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>

            {/* 9. مبلغ مالي */}
            <div
              className="palette-btn"
              onClick={() => {
                setFC({ showAmountField: true, mandatoryAmount: true });
                addFieldToActiveStage('amount');
              }}
              style={{
                padding: '10px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${A.sep}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: A.text }}>مبلغ مالي مطلوب</div>
                  <div style={{ fontSize: 9.5, color: A.textSub }}>بيانات مالية لسلف أو عهد أو مشتريات</div>
                </div>
              </div>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${wizard.color}15`, color: wizard.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>+</span>
            </div>
          </div>

          {/* HR Leave Types Preset Button */}
          {wizard.routeCategory === 'TIME_OFF' && (
            <button
              type="button"
              onClick={handleApplyLeavePreset}
              style={{
                padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #135d79)',
                color: '#fff', border: 'none', fontWeight: 800, fontSize: 11.5, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginTop: 6
              }}
            >
              <span>⚡ إدراج حزمة الإجازات الجاهزة</span>
            </button>
          )}
        </div>

        {/* ─── 2. LEFT PANEL: Live Interactive Stage Canvas (WYSIWYG) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stage Tabs Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: 12, border: `1px solid ${A.sep}`, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {stages.map((st, idx) => {
                const isActive = idx === activeStageIdx;
                return (
                  <div
                    key={st.id || idx}
                    onClick={() => setActiveStageIdx(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9,
                      background: isActive ? `${wizard.color}18` : '#f8fafc',
                      border: `1.5px solid ${isActive ? wizard.color : A.sep}`,
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 900, color: isActive ? wizard.color : A.textSub }}>
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={st.title}
                      onClick={e => e.stopPropagation()}
                      onChange={e => renameStage(idx, e.target.value)}
                      style={{
                        background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 700,
                        color: isActive ? wizard.color : A.text, width: 140
                      }}
                      title="انقر لتعديل اسم المرحلة"
                    />
                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeStage(idx); }}
                        style={{ background: 'none', border: 'none', color: A.red, cursor: 'pointer', padding: 2, fontSize: 11 }}
                        title="حذف المرحلة ونقل محتوياتها للمرحلة الأولى"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addStage}
                style={{
                  padding: '6px 12px', borderRadius: 9, background: '#fff',
                  border: `1.5px dashed ${wizard.color}`, color: wizard.color,
                  fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <span>+</span>
                <span>إضافة مرحلة جديدة</span>
              </button>
            </div>

            <span style={{ fontSize: 11, color: A.textSub, fontWeight: 600 }}>
              {stageFieldNames.length} مكونات في هذه المرحلة
            </span>
          </div>

          {/* Live Phone & Ticket Form Canvas */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: `1.5px solid ${A.sep}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            {/* Simulation Header */}
            <div style={{
              padding: '14px 20px',
              background: `linear-gradient(135deg, ${wizard.color}, ${wizard.color}DD)`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {renderIcon(wizard.icon, 22, '#fff')}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{wizard.name || 'اسم المسار'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                    الإدارة المستقبلة: {wizard.targetDepartmentName || 'إدارة الشؤون الفنية'}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 6 }}>
                  {activeStage?.title || 'المرحلة الحالية'}
                </div>
              </div>
            </div>

            {/* Canvas Body (Stage Fields Grid) */}
            <div style={{ padding: 20 }}>
              {stageFieldNames.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: `2px dashed ${A.sep}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: 32 }}>📥</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: A.text }}>هذه المرحلة فارغة حالياً</div>
                  <div style={{ fontSize: 11, color: A.textSub, maxWidth: 320 }}>
                    انقر على أي مكون من القائمة الجانبية في اليمين لإدراجه هنا في <strong>«{activeStage?.title}»</strong> والتحكم في حجمه وترتيبه.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12 }}>
                  {stageFieldNames.map((fn, idx) => {
                    const widthSetting = wizard.formConfig.fieldWidths?.[fn] || '100%';
                    const gridSpan = widthSetting === '33.3%' ? 'span 4' : (widthSetting === '50%' ? 'span 6' : 'span 12');

                    // 1. Dynamic Select / Dropdown Field
                    if (fn.startsWith('dyn_')) {
                      const fid = fn.replace('dyn_', '');
                      const fDef = dynamicFields.find(f => f.id === fid);
                      const isChips = wizard.formConfig.dynamicFieldsDisplayMode?.[fid] === 'chips' || wizard.formConfig.taxonomyDisplayMode === 'chips';
                      const isReq = (wizard.formConfig.routeDynamicFields || []).find(r => r.fieldId === fid)?.isRequired ?? true;

                      return (
                        <div key={fn} className="field-canvas-card" style={{ gridColumn: gridSpan, padding: 12, borderRadius: 12, border: `1.5px solid ${A.sep}`, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Top Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.sep}`, paddingBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13 }}>📋</span>
                              <strong style={{ fontSize: 12, color: A.text }}>{fDef?.name || 'مستدلة ديناميكية'}</strong>
                              <button
                                type="button"
                                onClick={() => toggleFieldRequired(fn)}
                                style={{
                                  fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, border: 'none', cursor: 'pointer',
                                  background: isReq ? '#fef2f2' : '#f1f5f9', color: isReq ? A.red : A.textSub
                                }}
                              >
                                {isReq ? '🔴 إلزامي' : '⚪ اختياري'}
                              </button>
                            </div>

                            {/* Width & Move & Delete Tools */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {/* Display mode toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  const curModes = { ...(wizard.formConfig.dynamicFieldsDisplayMode || {}) };
                                  curModes[fid] = isChips ? 'dropdown' : 'chips';
                                  setFC({ dynamicFieldsDisplayMode: curModes });
                                }}
                                style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, border: `1px solid ${A.sep}`, background: '#fff', cursor: 'pointer', color: wizard.color }}
                                title="التبديل بين قائمة منسدلة أو كروت وأيقونات دائرية"
                              >
                                {isChips ? '🔲 أيقونات' : '🔘 منسدلة'}
                              </button>

                              {/* Width buttons */}
                              {(['100%', '50%', '33.3%'] as const).map(w => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => setFieldWidth(fn, w)}
                                  style={{
                                    fontSize: 9.5, fontWeight: widthSetting === w ? 900 : 500, padding: '2px 5px', borderRadius: 4,
                                    border: widthSetting === w ? `1.5px solid ${wizard.color}` : `1px solid ${A.sep}`,
                                    background: widthSetting === w ? `${wizard.color}20` : '#fff', color: widthSetting === w ? wizard.color : A.textSub, cursor: 'pointer'
                                  }}
                                >
                                  {w === '100%' ? 'كامل' : (w === '50%' ? '½' : '⅓')}
                                </button>
                              ))}

                              {/* Reorder */}
                              <button type="button" onClick={() => moveFieldInStage(fn, -1)} disabled={idx === 0} style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: 11 }}>▲</button>
                              <button type="button" onClick={() => moveFieldInStage(fn, 1)} disabled={idx === stageFieldNames.length - 1} style={{ border: 'none', background: 'none', cursor: idx === stageFieldNames.length - 1 ? 'default' : 'pointer', opacity: idx === stageFieldNames.length - 1 ? 0.3 : 1, fontSize: 11 }}>▼</button>

                              {/* Delete */}
                              <button type="button" onClick={() => removeFieldFromStage(fn)} style={{ border: 'none', background: 'none', color: A.red, cursor: 'pointer', fontSize: 12 }}>🗑</button>
                            </div>
                          </div>

                          {/* Options Preview with Cascading Sub-Dropdown Linking */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {isChips ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(fDef?.options || []).map(o => {
                                  const oIcon = wizard.formConfig.optionIcons?.[o.id] || wizard.formConfig.optionIcons?.[o.label] || o.icon || 'Sparkles';
                                  const linkedBindings = (fDef?.childBindings || []).filter(b => b.triggerValue === o.id || b.triggerValue === o.label);
                                  const isBindingOpen = openChildBindingPicker?.optionId === o.id && openChildBindingPicker?.parentFieldId === fDef.id;

                                  return (
                                    <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#fff', border: `1px solid ${linkedBindings.length > 0 ? '#86efac' : A.sep}`, borderRadius: 8, padding: '6px 8px' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700 }}>
                                        <span style={{ color: wizard.color }}>{renderRouteIcon(oIcon, 14, wizard.color)}</span>
                                        <span>{o.label}</span>
                                        <button
                                          type="button"
                                          onClick={() => setOpenOptionIconPicker(openOptionIconPicker === o.id ? null : o.id)}
                                          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 10, color: A.textSub }}
                                          title="تغيير الأيقونة"
                                        >
                                          🎨
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setOpenChildBindingPicker(isBindingOpen ? null : { parentFieldId: fDef.id, optionId: o.id, optionLabel: o.label })}
                                          style={{ border: 'none', background: isBindingOpen ? `${wizard.color}20` : '#f1f5f9', color: isBindingOpen ? wizard.color : '#0284c7', borderRadius: 4, padding: '2px 5px', fontSize: 9.5, fontWeight: 700, cursor: 'pointer' }}
                                          title="ربط مستدلة فرعية تظهر عند اختيار هذا البند"
                                        >
                                          ↳ ربط فرع
                                        </button>
                                      </div>

                                      {/* Linked child sub-dropdown badges */}
                                      {linkedBindings.map(b => {
                                        const childF = dynamicFields.find(df => df.id === b.childFieldId);
                                        return (
                                          <div
                                            key={b.childFieldId}
                                            style={{
                                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                              padding: '2px 6px', borderRadius: 5, background: '#f0fdf4', border: '1px solid #86efac',
                                              fontSize: 9.5, color: '#166534', gap: 4
                                            }}
                                          >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                              <span>↳ متفرع:</span>
                                              <strong>{childF?.name || b.childFieldId}</strong>
                                              <span style={{ color: '#65a30d' }}>({childF?.options?.length || 0})</span>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleUnlinkChildField(fDef.id, b.childFieldId, b.triggerValue)}
                                              style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 10, fontWeight: 900 }}
                                              title="إلغاء الربط"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        );
                                      })}

                                      {/* Sub-Dropdown Cascading Linker Popover */}
                                      {isBindingOpen && (
                                        <div style={{
                                          width: '100%', padding: '8px 10px', borderRadius: 7, background: '#f0fdf4',
                                          border: '1.5px dashed #22c55e', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <strong style={{ fontSize: 10.5, color: '#15803d' }}>
                                              ربط مستدلة فرعية تظهر عند «{o.label}»:
                                            </strong>
                                            <button type="button" onClick={() => setOpenChildBindingPicker(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: '#dc2626' }}>✕</button>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            <div style={{ fontSize: 9.5, color: '#166534', fontWeight: 700 }}>المستدلات المحفوظة:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                              {dynamicFields.filter(df => df.id !== fDef.id).length === 0 ? (
                                                <span style={{ fontSize: 9.5, color: '#64748b' }}>لا توجد مستدلات أخرى محفوظة</span>
                                              ) : (
                                                dynamicFields.filter(df => df.id !== fDef.id).map(df => (
                                                  <button
                                                    key={df.id}
                                                    type="button"
                                                    onClick={() => handleLinkChildField(fDef.id, df.id, o.id || o.label)}
                                                    style={{
                                                      padding: '2px 7px', borderRadius: 4, background: '#fff', border: '1px solid #86efac',
                                                      fontSize: 10, fontWeight: 700, color: '#15803d', cursor: 'pointer'
                                                    }}
                                                  >
                                                    + {df.name} ({df.options?.length || 0})
                                                  </button>
                                                ))
                                              )}
                                            </div>
                                          </div>

                                          {/* Quick create child field */}
                                          <div style={{ borderTop: '1px dashed #86efac', paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            <div style={{ fontSize: 9.5, color: '#166534', fontWeight: 700 }}>أو أنشئ مستدلة فرعية جديدة فوراً:</div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                              <input
                                                className="tr-input"
                                                placeholder="اسم المستدلة..."
                                                value={newChildFieldInput.name}
                                                onChange={e => setNewChildFieldInput(p => ({ ...p, name: e.target.value }))}
                                                style={{ padding: '2px 6px', fontSize: 10, background: '#fff', flex: 1 }}
                                              />
                                              <input
                                                className="tr-input"
                                                placeholder="خيارات بفواصل (أ، ب، ج)..."
                                                value={newChildFieldInput.options}
                                                onChange={e => setNewChildFieldInput(p => ({ ...p, options: e.target.value }))}
                                                style={{ padding: '2px 6px', fontSize: 10, background: '#fff', flex: 1.5 }}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleCreateAndLinkChildField(fDef.id, o.id || o.label)}
                                                style={{ padding: '2px 8px', borderRadius: 4, background: '#16a34a', color: '#fff', border: 'none', fontSize: 9.5, fontWeight: 800, cursor: 'pointer' }}
                                              >
                                                + ربط
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ padding: '8px 12px', borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, fontSize: 11.5, color: A.textSub, display: 'flex', justifyContent: 'space-between' }}>
                                  <span>اختر: {fDef?.name}...</span>
                                  <span>▼</span>
                                </div>
                                <div style={{ fontSize: 10, color: A.textSub, fontWeight: 600 }}>
                                  خيارات القائمة وفروعها التابعة ({fDef?.options?.length || 0}):
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {(fDef?.options || []).map(o => {
                                    const linkedBindings = (fDef?.childBindings || []).filter(b => b.triggerValue === o.id || b.triggerValue === o.label);
                                    return (
                                      <div key={o.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 5, background: '#fff', border: `1px solid ${linkedBindings.length > 0 ? '#86efac' : A.sep}`, fontSize: 10.5 }}>
                                        <span>{o.label}</span>
                                        {linkedBindings.length > 0 && <span style={{ color: '#16a34a', fontWeight: 800 }}>({linkedBindings.length} فرع)</span>}
                                        <button
                                          type="button"
                                          onClick={() => setOpenChildBindingPicker({ parentFieldId: fDef.id, optionId: o.id, optionLabel: o.label })}
                                          style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer', fontSize: 9, fontWeight: 700 }}
                                        >
                                          ↳ ربط
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Icon picker popup if open */}
                          {openOptionIconPicker && (fDef?.options || []).some(o => o.id === openOptionIconPicker) && (
                            <div style={{ padding: 8, background: '#fff', borderRadius: 8, border: `1px solid ${wizard.color}50`, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {POPULAR_OPTION_ICONS.slice(0, 20).map(ic => (
                                <button
                                  key={ic}
                                  type="button"
                                  onClick={() => {
                                    const o = fDef?.options.find(opt => opt.id === openOptionIconPicker);
                                    if (o) setOptionIcon(fDef.id, o.id, o.label, ic);
                                  }}
                                  style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${A.sep}`, background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  {renderRouteIcon(ic, 14, wizard.color)}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick Option Adder */}
                          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                            <input
                              className="tr-input"
                              placeholder={`+ إضافة خيار جديد إلى «${fDef?.name}»...`}
                              value={quickOptionInput[fid] || ''}
                              onChange={e => setQuickOptionInput(p => ({ ...p, [fid]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuickOption(fid); } }}
                              style={{ padding: '4px 8px', fontSize: 11, background: '#fff' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddQuickOption(fid)}
                              style={{ padding: '4px 10px', borderRadius: 6, background: wizard.color, color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              + إضافة
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // 2. Custom Input Field (text, textarea, number, date)
                    if (fn.startsWith('custom_')) {
                      const cid = fn.replace('custom_', '');
                      const ci = (wizard.formConfig.customInputs || []).find(c => c.id === cid);
                      return (
                        <div key={fn} className="field-canvas-card" style={{ gridColumn: gridSpan, padding: 12, borderRadius: 12, border: `1.5px solid ${A.sep}`, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.sep}`, paddingBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13 }}>{ci?.type === 'textarea' ? '📝' : '🔤'}</span>
                              <input
                                type="text"
                                value={ci?.label || 'حقل مخصص'}
                                onChange={e => {
                                  const val = e.target.value;
                                  const cur = wizard.formConfig.customInputs || [];
                                  setFC({ customInputs: cur.map(c => c.id === cid ? { ...c, label: val, name: val } : c) });
                                }}
                                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 800, color: A.text, width: 140 }}
                              />
                              <button
                                type="button"
                                onClick={() => toggleFieldRequired(fn)}
                                style={{
                                  fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, border: 'none', cursor: 'pointer',
                                  background: ci?.required ? '#fef2f2' : '#f1f5f9', color: ci?.required ? A.red : A.textSub
                                }}
                              >
                                {ci?.required ? '🔴 إلزامي' : '⚪ اختياري'}
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {(['100%', '50%', '33.3%'] as const).map(w => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => setFieldWidth(fn, w)}
                                  style={{
                                    fontSize: 9.5, fontWeight: widthSetting === w ? 900 : 500, padding: '2px 5px', borderRadius: 4,
                                    border: widthSetting === w ? `1.5px solid ${wizard.color}` : `1px solid ${A.sep}`,
                                    background: widthSetting === w ? `${wizard.color}20` : '#fff', color: widthSetting === w ? wizard.color : A.textSub, cursor: 'pointer'
                                  }}
                                >
                                  {w === '100%' ? 'كامل' : (w === '50%' ? '½' : '⅓')}
                                </button>
                              ))}
                              <button type="button" onClick={() => moveFieldInStage(fn, -1)} disabled={idx === 0} style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: 11 }}>▲</button>
                              <button type="button" onClick={() => moveFieldInStage(fn, 1)} disabled={idx === stageFieldNames.length - 1} style={{ border: 'none', background: 'none', cursor: idx === stageFieldNames.length - 1 ? 'default' : 'pointer', opacity: idx === stageFieldNames.length - 1 ? 0.3 : 1, fontSize: 11 }}>▼</button>
                              <button type="button" onClick={() => removeFieldFromStage(fn)} style={{ border: 'none', background: 'none', color: A.red, cursor: 'pointer', fontSize: 12 }}>🗑</button>
                            </div>
                          </div>

                          {ci?.type === 'textarea' ? (
                            <div style={{ height: 50, borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, padding: 8, fontSize: 11, color: A.textTer }}>
                              {ci.placeholder || 'أدخل التفاصيل والشرح هنا...'}
                            </div>
                          ) : (
                            <div style={{ height: 34, borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, padding: '7px 10px', fontSize: 11, color: A.textTer }}>
                              {ci?.placeholder || 'أدخل القيمة المطلوبة هنا...'}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 3. System Fields (Building, Department, Schedule, Delegate, Amount, Attachment, Description)
                    const sysConfigMap: Record<string, { label: string; icon: string; preview: React.ReactNode; isReq: boolean }> = {
                      building: {
                        label: 'موقع ومبنى العمل',
                        icon: '🏢',
                        preview: <div style={{ height: 34, borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, padding: '7px 10px', fontSize: 11, color: A.textTer, display: 'flex', justifyContent: 'space-between' }}><span>اختر المبنى / الموقع...</span><span>▼</span></div>,
                        isReq: !!wizard.formConfig.mandatoryBuilding,
                      },
                      department: {
                        label: 'التبعية المؤسسية لمقدم الطلب',
                        icon: '🏛️',
                        preview: <div style={{ height: 34, borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, padding: '7px 10px', fontSize: 11, color: A.textTer, display: 'flex', justifyContent: 'space-between' }}><span>اختر الإدارة والقسم...</span><span>▼</span></div>,
                        isReq: !!wizard.formConfig.mandatoryDepartment,
                      },
                      scheduleEngine: {
                        label: 'الجدولة الزمنية والوقت',
                        icon: '🗓️',
                        preview: <div style={{ height: 34, borderRadius: 7, background: '#fff', border: `1.5px dashed ${wizard.color}50`, padding: '7px 10px', fontSize: 11, color: wizard.color, display: 'flex', alignItems: 'center', gap: 6 }}><span>🕒 محرك الجدولة الذكي (فترة متصلة / إذن ساعي)</span></div>,
                        isReq: !!wizard.formConfig.mandatorySchedule,
                      },
                      delegateUser: {
                        label: 'الموظف البديل / المكلف',
                        icon: '👤',
                        preview: <div style={{ height: 34, borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, padding: '7px 10px', fontSize: 11, color: A.textTer }}><span>🔍 دليل موظفي الشركة الذكي...</span></div>,
                        isReq: !!wizard.formConfig.mandatoryDelegateUser,
                      },
                      amount: {
                        label: 'المبلغ المالي المطلوب',
                        icon: '💰',
                        preview: <div style={{ height: 34, borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, padding: '7px 10px', fontSize: 11, color: A.textTer }}><span>0.00 د.ل</span></div>,
                        isReq: !!wizard.formConfig.mandatoryAmount,
                      },
                      description: {
                        label: 'شرح وملاحظات الطلب',
                        icon: '📝',
                        preview: <div style={{ height: 50, borderRadius: 7, background: '#fff', border: `1px solid ${A.sep}`, padding: 8, fontSize: 11, color: A.textTer }}><span>أدخل تفاصيل ومبررات الطلب...</span></div>,
                        isReq: !!wizard.formConfig.mandatoryDescription,
                      },
                      attachment: {
                        label: 'مرفق المستندات والوثائق',
                        icon: '📎',
                        preview: <div style={{ height: 38, borderRadius: 7, background: '#fff', border: `1.5px dashed ${A.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: A.textSub }}><span>📎 رفع ملف أو مستند من الجهاز</span></div>,
                        isReq: !!wizard.formConfig.mandatoryAttachments,
                      },
                    };

                    const sys = sysConfigMap[fn];
                    if (!sys) return null;

                    return (
                      <div key={fn} className="field-canvas-card" style={{ gridColumn: gridSpan, padding: 12, borderRadius: 12, border: `1.5px solid ${A.sep}`, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.sep}`, paddingBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13 }}>{sys.icon}</span>
                            <strong style={{ fontSize: 12, color: A.text }}>{sys.label}</strong>
                            <button
                              type="button"
                              onClick={() => toggleFieldRequired(fn)}
                              style={{
                                fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, border: 'none', cursor: 'pointer',
                                background: sys.isReq ? '#fef2f2' : '#f1f5f9', color: sys.isReq ? A.red : A.textSub
                              }}
                            >
                              {sys.isReq ? '🔴 إلزامي' : '⚪ اختياري'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {(['100%', '50%', '33.3%'] as const).map(w => (
                              <button
                                key={w}
                                type="button"
                                onClick={() => setFieldWidth(fn, w)}
                                style={{
                                  fontSize: 9.5, fontWeight: widthSetting === w ? 900 : 500, padding: '2px 5px', borderRadius: 4,
                                  border: widthSetting === w ? `1.5px solid ${wizard.color}` : `1px solid ${A.sep}`,
                                  background: widthSetting === w ? `${wizard.color}20` : '#fff', color: widthSetting === w ? wizard.color : A.textSub, cursor: 'pointer'
                                }}
                              >
                                {w === '100%' ? 'كامل' : (w === '50%' ? '½' : '⅓')}
                              </button>
                            ))}
                            <button type="button" onClick={() => moveFieldInStage(fn, -1)} disabled={idx === 0} style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: 11 }}>▲</button>
                            <button type="button" onClick={() => moveFieldInStage(fn, 1)} disabled={idx === stageFieldNames.length - 1} style={{ border: 'none', background: 'none', cursor: idx === stageFieldNames.length - 1 ? 'default' : 'pointer', opacity: idx === stageFieldNames.length - 1 ? 0.3 : 1, fontSize: 11 }}>▼</button>
                            <button type="button" onClick={() => removeFieldFromStage(fn)} style={{ border: 'none', background: 'none', color: A.red, cursor: 'pointer', fontSize: 12 }}>🗑</button>
                          </div>
                        </div>

                        {sys.preview}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Canvas Footer simulation */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${A.sep}`, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: A.textSub }}>
                المرحلة {activeStageIdx + 1} من {stages.length}: {activeStage?.title}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: wizard.color }}>
                {activeStageIdx < stages.length - 1 ? '➔ التالي: المرحلة التالية' : '🎟️ التالي: إنهاء التذكرة'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── CENTRAL DROPDOWNS STUDIO & PICKER MODAL (مكتبة المستدلات المركزية) ─── */}
        {showAddFieldModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 16, maxWidth: 580, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              
              {/* Modal Header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${A.sep}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                  <div>
                    <strong style={{ fontSize: 14, color: A.text, display: 'block' }}>مكتبة المستدلات وقوائم الخيارات</strong>
                    <span style={{ fontSize: 11, color: A.textSub }}>اختر من المستدلات المحفوظة مسبقاً أو أنشئ مستدلة جديدة لإدراجها في «{activeStage?.title}»</span>
                  </div>
                </div>
                <button type="button" onClick={() => setShowAddFieldModal(false)} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: A.textSub }}>✕</button>
              </div>

              {/* Tabs Switcher */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${A.sep}`, background: '#f1f5f9', padding: '6px 12px', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setDropdownModalTab('saved')}
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                    background: dropdownModalTab === 'saved' ? '#fff' : 'transparent',
                    color: dropdownModalTab === 'saved' ? wizard.color : A.textSub,
                    boxShadow: dropdownModalTab === 'saved' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  📁 المستدلات المحفوظة مسبقاً ({dynamicFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDropdownModalTab('create')}
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                    background: dropdownModalTab === 'create' ? '#fff' : 'transparent',
                    color: dropdownModalTab === 'create' ? wizard.color : A.textSub,
                    boxShadow: dropdownModalTab === 'create' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  ✨ + إنشاء مستدلة جديدة
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dropdownModalTab === 'saved' ? (
                  /* ── TAB 1: SAVED DROPDOWNS PICKER ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="tr-input"
                        placeholder="🔍 ابحث في المستدلات المحفوظة بالاسم..."
                        value={savedFieldSearch}
                        onChange={e => setSavedFieldSearch(e.target.value)}
                        style={{ padding: '8px 12px', fontSize: 12 }}
                      />
                    </div>

                    {dynamicFields.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: A.textSub, fontSize: 12 }}>
                        <div>📂 لا توجد مستدلات محفوظة مسبقاً في النظام بعد.</div>
                        <button
                          type="button"
                          onClick={() => setDropdownModalTab('create')}
                          style={{ marginTop: 10, padding: '6px 14px', borderRadius: 7, background: wizard.color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700 }}
                        >
                          + إنشاء أول مستدلة الآن
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dynamicFields
                          .filter(f => !savedFieldSearch || f.name.toLowerCase().includes(savedFieldSearch.toLowerCase()))
                          .map(f => {
                            const isAlreadyInStage = stageFieldNames.includes(`dyn_${f.id}`);
                            const opts = f.options || [];
                            const curMode = wizard.formConfig.dynamicFieldsDisplayMode?.[f.id] || 'chips';

                            return (
                              <div
                                key={f.id}
                                style={{
                                  padding: 12,
                                  borderRadius: 10,
                                  border: isAlreadyInStage ? `1.5px solid #86efac` : `1.5px solid ${A.sep}`,
                                  background: isAlreadyInStage ? '#f0fdf4' : '#f8fafc',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>📋</span>
                                    <div>
                                      <div style={{ fontSize: 12.5, fontWeight: 800, color: A.text }}>{f.name}</div>
                                      <div style={{ fontSize: 10, color: A.textSub }}>
                                        {opts.length} خيارات • {f.childBindings?.length ? `مرتبط بـ ${f.childBindings.length} فروع` : 'لا توجد فروع'}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isAlreadyInStage ? (
                                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        ✓ مدرجة في المرحلة
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleInsertSavedField(f);
                                          setShowAddFieldModal(false);
                                        }}
                                        style={{
                                          padding: '6px 14px',
                                          borderRadius: 8,
                                          background: wizard.color,
                                          color: '#fff',
                                          border: 'none',
                                          fontSize: 11.5,
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          boxShadow: `0 2px 8px ${wizard.color}30`
                                        }}
                                      >
                                        + إدراج في المرحلة ➔
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Options chips preview */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {opts.slice(0, 6).map((o: any) => (
                                    <span key={o.id || o.label} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#fff', border: `1px solid ${A.sep}`, color: A.textSub }}>
                                      {o.label || o}
                                    </span>
                                  ))}
                                  {opts.length > 6 && (
                                    <span style={{ fontSize: 9.5, color: A.textTer, alignSelf: 'center' }}>+{opts.length - 6} خيارات إضافية</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── TAB 2: CREATE NEW DROPDOWN ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                        اسم المستدلة / العنوان
                      </label>
                      <input
                        className="tr-input"
                        placeholder="مثال: نوع العطل، المبنى الفرعي، فئة المشكلة..."
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                        طريقة العرض للموظف
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setNewFieldDisplayMode('chips')}
                          style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                            border: `1.5px solid ${newFieldDisplayMode === 'chips' ? wizard.color : A.sep}`,
                            background: newFieldDisplayMode === 'chips' ? `${wizard.color}18` : '#fff',
                            color: newFieldDisplayMode === 'chips' ? wizard.color : A.textSub
                          }}
                        >
                          🔲 أيقونات دائرية حرة بدون مربعات
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewFieldDisplayMode('dropdown')}
                          style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                            border: `1.5px solid ${newFieldDisplayMode === 'dropdown' ? wizard.color : A.sep}`,
                            background: newFieldDisplayMode === 'dropdown' ? `${wizard.color}18` : '#fff',
                            color: newFieldDisplayMode === 'dropdown' ? wizard.color : A.textSub
                          }}
                        >
                          🔘 قائمة منسدلة حديثة
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: A.text, display: 'block', marginBottom: 4 }}>
                        الخيارات المتاحة (خيار لكل سطر)
                      </label>
                      <textarea
                        className="tr-input"
                        rows={5}
                        value={newFieldOptions.join('\n')}
                        onChange={e => setNewFieldOptions(e.target.value.split('\n'))}
                        placeholder="أدخل كل خيار في سطر جديد...&#10;الخيار الأول&#10;الخيار الثاني&#10;الخيار الثالث"
                        style={{ resize: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${A.sep}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  إغلاق
                </button>
                {dropdownModalTab === 'create' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const cleanName = newFieldName.trim() || 'مستدلة جديدة';
                      const cleanOpts = newFieldOptions.map(o => o.trim()).filter(Boolean);
                      if (cleanOpts.length === 0) cleanOpts.push('خيار 1', 'خيار 2');

                      const newDynamicField: DynamicCustomField = {
                        id: `dyn_${Date.now()}`,
                        name: cleanName,
                        options: cleanOpts.map((lbl, i) => ({
                          id: `opt_${Date.now()}_${i}`,
                          label: lbl,
                          isActive: true,
                          icon: 'Sparkles',
                        })),
                        childBindings: []
                      };

                      const updatedFields = [...dynamicFields, newDynamicField];
                      setDynamicFields(updatedFields);
                      await saveDynamicFields(updatedFields);

                      const curDynamicLinked = wizard.formConfig.routeDynamicFields || [];
                      const curModes = { ...(wizard.formConfig.dynamicFieldsDisplayMode || {}) };
                      curModes[newDynamicField.id] = newFieldDisplayMode;

                      setFC({
                        routeDynamicFields: [...curDynamicLinked, { fieldId: newDynamicField.id, isRequired: true }],
                        dynamicFieldsDisplayMode: curModes
                      });

                      addFieldToActiveStage(`dyn_${newDynamicField.id}`);
                      setShowAddFieldModal(false);
                      setNewFieldName('');
                      setNewFieldOptions(['خيار 1', 'خيار 2']);
                      showToast(`✅ تم إنشاء «${cleanName}» وإدراجها بنجاح`, 'success');
                    }}
                    style={{ padding: '8px 18px', borderRadius: 8, background: wizard.color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}
                  >
                    💾 إنشاء المستدلة وإدراجها في المرحلة ➔
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Render Step 3: Final Authentic Cinema Ticket Review
  // ═══════════════════════════════════════════════════════════
  const renderStep3FinalReview = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: A.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>🎟️</span>
            <span>المعاينة النهائية للتذكرة الحرارية السينمائية</span>
          </div>
          <div style={{ fontSize: 11.5, color: A.textSub, marginTop: 4 }}>
            هذا هو الشكل النهائي الفعلي للتذكرة الحرارية كما ستطبع وتنسدل للموظف في نهاية رحلته:
          </div>
        </div>

        {/* Authentic Cinema Ticket Silhouette */}
        <div style={{
          maxWidth: 420,
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          border: `1.5px solid ${A.sep}`,
        }}>
          {/* Ticket Header Slot */}
          <div style={{ padding: '16px 20px', background: `linear-gradient(135deg, ${wizard.color}, #135d79)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {renderIcon(wizard.icon, 22, '#fff')}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{wizard.name || 'اسم المعاملة'}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)' }}>
                  {wizard.targetDepartmentName || 'إدارة الشؤون الفنية'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'left', fontFamily: 'monospace' }}>
              <div style={{ fontSize: 11, fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 6 }}>
                #REQ-2026-NX
              </div>
            </div>
          </div>

          {/* Ticket Summary Information */}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: wizard.color }}>
              📋 ملخص مراحل وحقول الطلب المعتمدة:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stages.map((st, sIdx) => (
                <div key={st.id || sIdx} style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${A.sep}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: A.text }}>
                    مرحلة {sIdx + 1}: {st.title} ({st.fieldNames.length} حقول)
                  </div>
                  <div style={{ fontSize: 10, color: A.textSub, marginTop: 2 }}>
                    {st.fieldNames.length > 0 ? st.fieldNames.join(' • ') : 'لا توجد حقول'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: A.textSub, marginTop: 4 }}>
              <span>قائد ومسؤول المسار:</span>
              <strong style={{ color: A.text }}>{wizard.managerName || 'المشرف التشغيلي'}</strong>
            </div>

            {/* Perforation Cut Line with Side Notches */}
            <div className="ticket-perforation">
              <div className="ticket-notch-left" />
              <div className="ticket-notch-right" />
            </div>

            {/* Barcode & QR Code simulation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px' }}>
              {/* Barcode */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', gap: 2, height: 28, alignItems: 'center' }}>
                  {[3, 1, 4, 1, 2, 5, 1, 3, 2, 4, 1, 3, 2, 5, 2, 1, 4, 2].map((w, i) => (
                    <div key={i} style={{ width: w, height: '100%', background: '#1e293b' }} />
                  ))}
                </div>
                <span style={{ fontSize: 8.5, letterSpacing: 2, color: A.textSub, textAlign: 'center' }}>*NEXUS-TICKET-2026*</span>
              </div>

              {/* QR Code */}
              <div style={{ width: 40, height: 40, borderRadius: 6, border: '1.5px solid #1e293b', padding: 2, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ background: (i % 2 === 0 || i % 5 === 0) ? '#1e293b' : 'transparent', borderRadius: 1 }} />
                ))}
              </div>
            </div>

            {/* Tear Ticket Button Simulation */}
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${wizard.color}, #f36c21)`,
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
              boxShadow: `0 4px 14px ${wizard.color}35`,
              marginTop: 4
            }}>
              🎟️✂️ تمزيق التذكرة وإرسال المعاملة إلى حوض الموظف
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Render Routes List View
  // ═══════════════════════════════════════════════════════════
  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {routes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: A.textTer }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛤️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: A.textSub }}>لا توجد مسارات تذاكر حالياً</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>قم بإنشاء مسارك الأول لتوجيه طلبات الموظفين</div>
          <button
            className="route-action-btn"
            onClick={openCreate}
            style={{ marginTop: 24, background: A.blue, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 800, boxShadow: `0 4px 12px ${A.blue}40` }}
          >
            + إنشاء مسار جديد
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: A.textSub }}>
              إجمالي المسارات النشطة: {routes.length} مساراً
            </span>
            <button
              className="route-action-btn"
              onClick={openCreate}
              style={{ background: A.blue, color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800, boxShadow: `0 4px 12px ${A.blue}40` }}
            >
              + إنشاء مسار جديد
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {routes.map(r => (
              <div
                key={r.id}
                className="route-card"
                style={{
                  background: A.surface,
                  borderRadius: A.radius,
                  padding: 18,
                  boxShadow: A.shadowCard,
                  border: `1px solid ${A.sep}`,
                  borderRight: `4px solid ${r.color}`,
                  opacity: r.isActive ? 1 : 0.65
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color }}>
                      {renderIcon(r.icon || 'ClipboardList', 22, r.color)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: A.text }}>{r.name}</div>
                      <div style={{ fontSize: 11.5, color: A.textSub, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.isActive ? A.green : A.red }} />
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{r.isActive ? 'نشط' : 'متوقف'}</span>
                        </div>
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 700,
                          background: r.routeCategory === 'TIME_OFF' ? '#ecfdf5' : r.routeCategory === 'FINANCIAL' ? '#fffbeb' : '#eff6ff',
                          color: r.routeCategory === 'TIME_OFF' ? '#059669' : r.routeCategory === 'FINANCIAL' ? '#d97706' : '#2563eb',
                        }}>
                          {r.routeCategory === 'TIME_OFF' ? '🏖️ إجازات' : r.routeCategory === 'FINANCIAL' ? '💼 مالي' : '🏢 دعم تشغيلي'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="route-action-btn" title="استنساخ المسار" onClick={() => duplicateRoute(r)} style={{ background: `${A.blue}15`, color: A.blue, border: 'none', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>📑</button>
                    <button className="route-action-btn" title="تعديل المسار في الاستوديو" onClick={() => openEdit(r)} style={{ background: '#f1f5f9', border: 'none', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⚙️</button>
                    <button className="route-action-btn" title="حذف المسار" onClick={() => deleteRoute(r.id)} style={{ background: '#FFF0F0', color: A.red, border: 'none', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🗑</button>
                  </div>
                </div>

                <div style={{ background: A.bg, padding: 10, borderRadius: 8, fontSize: 11.5, color: A.textSub, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>الإدارة المستقبلة:</span>
                    <strong style={{ color: A.text }}>{r.targetDepartmentName}</strong>
                  </div>
                  {r.targetDivisionName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>القسم:</span>
                      <strong style={{ color: A.text }}>{r.targetDivisionName}</strong>
                    </div>
                  )}
                  {r.managerName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>قائد المسار:</span>
                      <strong style={{ color: A.blue }}>🛡️ {r.managerName}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>المراحل والمكونات:</span>
                    <strong style={{ color: A.text }}>
                      {(r.formConfig?.stages || []).length} مراحل
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: 12, borderTop: `1px solid ${A.sep}`, paddingTop: 10, display: 'flex', gap: 8 }}>
                  <button
                    className="route-action-btn"
                    onClick={() => toggleRouteStatus(r.id)}
                    style={{ flex: 1, padding: '7px', background: r.isActive ? `${A.red}15` : `${A.green}15`, color: r.isActive ? A.red : A.green, border: 'none', borderRadius: 8, fontSize: 11.5, fontWeight: 700 }}
                  >
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
    <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', paddingTop: '20px', paddingBottom: '120px', animation: 'fadeSlideIn 0.3s ease' }}>
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`tr-toast ${toast.type}`}>
          {toast.type === 'loading' && <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
          {toast.type === 'success' && <span>✅</span>}
          {toast.type === 'error' && <span>❌</span>}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: A.text, margin: '0 0 3px 0' }}>
            استوديو بناء وإدارة مسارات التذاكر 🛤️
          </h2>
          <p style={{ fontSize: 12.5, color: A.textSub, margin: 0 }}>
            تصميم تدفق المراحل، المكونات الحية، والمعاينة التفاعلية المباشرة
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: A.textTer }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.6 }}>⏳</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.textSub }}>جارٍ تحميل المسارات والمكونات...</div>
        </div>
      ) : view === 'list' ? (
        renderList()
      ) : (
        <div style={{ background: A.surface, borderRadius: A.radius, padding: 24, boxShadow: A.shadowCard, border: `1px solid ${A.sep}` }}>

          {/* Stepper Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24, background: '#f8fafc', padding: '10px 16px', borderRadius: 14, border: `1px solid ${A.sep}` }}>
            {[
              { s: 1, title: '1. الهوية والجهة المستقبلة' },
              { s: 2, title: '2. استوديو المراحل والمكونات الحية 🧰' },
              { s: 3, title: '3. مراجعة التذكرة واعتماد المسار 🎟️' },
            ].map((stepObj, i) => {
              const active = wizardStep === stepObj.s;
              const done = wizardStep > stepObj.s;
              return (
                <React.Fragment key={stepObj.s}>
                  <div
                    onClick={() => {
                      if (stepObj.s === 1 || step1Valid) setWizardStep(stepObj.s as WizardStep);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '6px 14px', borderRadius: 10,
                      background: active ? '#fff' : 'transparent',
                      border: active ? `1.5px solid ${wizard.color}` : '1.5px solid transparent',
                      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: done ? A.green : (active ? wizard.color : '#e2e8f0'),
                      color: (done || active) ? '#fff' : A.textSub,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900
                    }}>
                      {done ? '✓' : stepObj.s}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: active ? 800 : 600, color: active ? wizard.color : A.textSub }}>
                      {stepObj.title}
                    </span>
                  </div>
                  {i < 2 && <div style={{ width: 24, height: 2, background: done ? A.green : '#e2e8f0' }} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 1 */}
          {wizardStep === 1 && renderStep1()}

          {/* Step 2 */}
          {wizardStep === 2 && renderStep2Studio()}

          {/* Step 3 */}
          {wizardStep === 3 && renderStep3FinalReview()}

          {/* Bottom Navigation Buttons */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${A.sep}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="route-action-btn"
              onClick={() => setView('list')}
              style={{ padding: '8px 18px', borderRadius: 9, background: A.bg, border: 'none', fontSize: 12, color: A.textSub, fontWeight: 700 }}
            >
              إلغاء وخروج
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {wizardStep > 1 && (
                <button
                  className="route-action-btn"
                  onClick={() => setWizardStep(p => (p - 1) as WizardStep)}
                  style={{ padding: '8px 18px', borderRadius: 9, background: A.bg, border: 'none', fontSize: 12, color: A.text, fontWeight: 700 }}
                >
                  ← السابق
                </button>
              )}

              {wizardStep < 3 ? (
                <button
                  className="route-action-btn"
                  onClick={() => {
                    if (wizardStep === 1) {
                      if (!wizard.name.trim()) { showToast('يرجى تحديد اسم المسار', 'error'); return; }
                      if (!wizard.targetDepartmentId) { showToast('يرجى تحديد الإدارة المستقبلة', 'error'); return; }
                      setWizardStep(2);
                    } else if (wizardStep === 2) {
                      setWizardStep(3);
                    }
                  }}
                  style={{
                    padding: '9px 24px', borderRadius: 9, background: wizard.color, color: '#fff', border: 'none',
                    fontSize: 12.5, fontWeight: 800, boxShadow: `0 4px 14px ${wizard.color}35`
                  }}
                >
                  {wizardStep === 1 ? 'التالي: استوديو بناء المراحل والمكونات ➔' : 'التالي: مراجعة التذكرة السينمائية ➔'}
                </button>
              ) : (
                <button
                  className="route-action-btn"
                  disabled={isSaving}
                  onClick={handleSaveRoute}
                  style={{
                    padding: '9px 26px', borderRadius: 9, background: isSaving ? '#94a3b8' : wizard.color,
                    color: '#fff', border: 'none', fontSize: 13, fontWeight: 800,
                    boxShadow: `0 4px 16px ${wizard.color}45`, display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {isSaving ? (
                    <>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <span>💾 حفظ واعتماد المسار بالكامل</span>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
