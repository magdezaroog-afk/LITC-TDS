// ═══════════════════════════════════════════════════════════
// Ticket Routing Helpers and Types
// Central service module to prevent Vite HMR invalidation in components
// ═══════════════════════════════════════════════════════════

export interface IndicatorOption { id: string; label: string; isActive: boolean; customInputs?: CustomFormInput[]; }
export interface SubIssueIndicator { id: string; parentMainIssueId: string; label: string; options: IndicatorOption[]; isActive: boolean; customInputs?: CustomFormInput[]; }
export interface MainIssueIndicator { id: string; label: string; subIssues: SubIssueIndicator[]; isActive: boolean; customInputs?: CustomFormInput[]; }

export interface ChildFieldBinding {
  childFieldId: string;
  triggerValue: string; // The ID of the option in the parent field
}

export interface DynamicFieldOption {
  id: string;
  label: string;
  icon?: string;
  isActive: boolean;
  customInputs?: CustomFormInput[];
}

export interface DynamicCustomField {
  id: string;
  name: string;
  options: DynamicFieldOption[];
  childBindings?: ChildFieldBinding[];
}

export interface CustomFormInput {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date';
  placeholder?: string;
  required: boolean;
  order?: number;
}

export interface OptionBehaviorRule {
  attachmentRule?: 'REQUIRED' | 'OPTIONAL' | 'HIDDEN';
  descriptionRule?: 'REQUIRED' | 'OPTIONAL' | 'HIDDEN';
  scheduleRule?: 'DATE_RANGE' | 'DISCRETE_DAYS' | 'HOURLY_WINDOW' | 'DEFAULT';
}

export interface RouteFormConfig {
  showBuildingField?: boolean;
  mandatoryBuilding?: boolean;
  showDepartmentField?: boolean;
  mandatoryDepartment?: boolean;
  departmentSelectionLevel?: 'DEPT_ONLY' | 'DEPT_AND_DIV' | 'FULL_HIERARCHY';
  mandatoryDivision?: boolean;
  mandatoryTeam?: boolean;
  showDescription: boolean;
  mandatoryDescription: boolean;
  showAttachments: boolean;
  mandatoryAttachments: boolean;
  attachmentTypes: string[];
  maxAttachmentMB: number;
  taxonomy: MainIssueIndicator[];
  customFieldIds: string[];
  routeDynamicFields: { fieldId: string; isRequired: boolean }[];
  // ─── Custom Dynamic Inputs (حقول نصية ورقمية إضافية بعدد غير محدود) ───
  customInputs?: CustomFormInput[];
  // ─── Option-Level Conditional Custom Inputs (حقول مخصصة مشروطة بخيارات المستدلات) ───
  optionCustomInputs?: Record<string, CustomFormInput[]>;
  // ─── Option-Level Behavioral Rules (شروط المرفقات والتعليقات والجدولة لكل نوع إجازة) ───
  optionBehaviorRules?: Record<string, OptionBehaviorRule>;
  // ─── Option Icons Mapping (تحديد أيقونة بجانب كل خيار) ───
  optionIcons?: Record<string, string>;
  // ─── Display Mode for Lists / Dropdowns (قوائم منسدلة أو كروت وأيقونات) ───
  taxonomyDisplayMode?: 'dropdown' | 'chips';
  dynamicFieldsDisplayMode?: Record<string, 'dropdown' | 'chips'>;
  // ─── Dynamic Field Sorting & Ordering (ترتيب الحقول تصاعدياً وتنازلياً) ───
  fieldsOrder?: string[];
  // ─── Smart Time & Attendance / Scheduling Engine ───
  showScheduleEngine?: boolean;
  mandatorySchedule?: boolean;
  scheduleLabel?: string;
  scheduleMode?: 'ANY' | 'DATE_RANGE' | 'DISCRETE_DAYS' | 'HOURLY_WINDOW' | 'SINGLE_DATE';

  // ─── Delegate Colleague (الموظف البديل / تسليم المهام) ───
  showDelegateUser?: boolean;
  mandatoryDelegateUser?: boolean;
  delegateUserLabel?: string;
  delegateScope?: 'ALL_COMPANY_USERS' | 'SAME_DEPARTMENT';
  delegateTriggerMode?: 'ONLY_ON_ASSIGNMENT' | 'ALWAYS';
  delegateTriggerOptionLabel?: string;

  // ─── Compatibility Fields ───
  showDateRange?: boolean;
  mandatoryDateRange?: boolean;
  dateRangeType?: 'SINGLE_DATE' | 'DATE_ONLY' | 'DATETIME';
  dateRangeLabel?: string;
  showVehicleField?: boolean;
  mandatoryVehicle?: boolean;
  vehicleFieldLabel?: string;
  showAmountField?: boolean;
  mandatoryAmount?: boolean;
  amountFieldLabel?: string;
  showHealthField?: boolean;
  mandatoryHealth?: boolean;
  healthFieldLabel?: string;
  // ─── Concurrent Open Tickets & Rating Governance ───
  allowMultipleOpenTickets?: boolean;
  maxConcurrentOpenTickets?: number;
  maxUnratedTicketsAllowed?: number;
  requireRatingBeforeNewTicket?: boolean;
  // ─── Customizable Stages Architecture ───
  stages?: RouteFormStage[];
  // ─── Visual Field Widths Control (عرض الحقل: 100%، 50%، 33.3%) ───
  fieldWidths?: Record<string, '100%' | '50%' | '33.3%'>;
}

export interface RouteFormStage {
  id: string;
  title: string;
  fieldNames: string[];
}

export interface TicketRouteDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  routeCategory?: 'OPERATIONAL' | 'TIME_OFF' | 'FINANCIAL' | 'GENERAL';
  targetDepartmentId: string;
  targetDepartmentName: string;
  targetDivisionId: string;
  targetDivisionName: string;
  targetTeamId?: string;
  targetTeamName?: string;
  managerId?: string | number;
  managerName?: string;
  formConfig: RouteFormConfig;
  isActive: boolean;
  captured_historical_data?: any;
  createdAt: string;
  updatedAt: string;
}

export const defaultFormConfig = (): RouteFormConfig => ({
  showBuildingField: false,
  mandatoryBuilding: false,
  showDepartmentField: false,
  mandatoryDepartment: false,
  departmentSelectionLevel: 'DEPT_ONLY',
  mandatoryDivision: false,
  mandatoryTeam: false,
  showDescription: true,
  mandatoryDescription: true,
  showAttachments: true,
  mandatoryAttachments: false,
  attachmentTypes: ['PDF', 'PNG', 'JPG'],
  maxAttachmentMB: 5,
  taxonomy: [],
  customFieldIds: [],
  routeDynamicFields: [],
  customInputs: [],
  optionCustomInputs: {},
  optionBehaviorRules: {},
  optionIcons: {},
  taxonomyDisplayMode: 'dropdown',
  dynamicFieldsDisplayMode: {},
  fieldsOrder: [],
  fieldWidths: {},
  // ─── Smart Time & Attendance / Scheduling Engine ───
  showScheduleEngine: false,
  mandatorySchedule: false,
  scheduleLabel: 'الجدولة الزمنية / فترة الطلب',
  scheduleMode: 'ANY',
  // ─── Delegate Colleague ───
  showDelegateUser: false,
  mandatoryDelegateUser: false,
  delegateUserLabel: 'الموظف البديل / تسليم المهام',
  delegateScope: 'ALL_COMPANY_USERS',
  delegateTriggerMode: 'ONLY_ON_ASSIGNMENT',
  delegateTriggerOptionLabel: 'تكليف',
  // ─── Compatibility Fields ───
  showDateRange: false,
  mandatoryDateRange: false,
  dateRangeType: 'DATE_ONLY',
  dateRangeLabel: 'الفترة الزمنية / التاريخ',
  showVehicleField: false,
  mandatoryVehicle: false,
  vehicleFieldLabel: '',
  showAmountField: false,
  mandatoryAmount: false,
  amountFieldLabel: '',
  showHealthField: false,
  mandatoryHealth: false,
  healthFieldLabel: '',
  allowMultipleOpenTickets: true,
  maxConcurrentOpenTickets: 0,
  maxUnratedTicketsAllowed: 0,
  requireRatingBeforeNewTicket: false,
});

/**
 * Popular Lucide vector icons for dynamic field options & request types (NEXUS TDS 2026).
 */
export const POPULAR_OPTION_ICONS = [
  'Palmtree', 'HeartPulse', 'Zap', 'Clock', 'UserCheck', 'FileText', 'Calendar', 'Plane', 'Car', 'Building2',
  'Monitor', 'Laptop', 'Wrench', 'Printer', 'Wifi', 'Lock', 'Smartphone', 'Settings', 'Lightbulb', 'Server',
  'CreditCard', 'Coins', 'Package', 'ShoppingCart', 'Scale', 'GraduationCap', 'Handshake', 'Sparkles', 'Bell',
  'ShieldCheck', 'HelpCircle', 'Flame', 'CheckCircle2', 'FileSpreadsheet', 'Briefcase', 'FolderKanban',
  'Cpu', 'HardDrive', 'Network', 'Radio', 'KeyRound', 'Stamp', 'Droplets', 'Award', 'BadgeCheck'
];

/**
 * Standard Leave Types preset for instantaneous 1-click configuration in Leave Routes.
 */
export const LEAVE_TYPES_PRESET = {
  name: 'نوع الإجازة / الطلب',
  options: [
    {
      id: 'opt_leave_annual',
      label: 'إجازة سنوية اعتيادية',
      icon: 'Palmtree',
      rules: { attachmentRule: 'HIDDEN' as const, descriptionRule: 'OPTIONAL' as const, scheduleRule: 'DATE_RANGE' as const }
    },
    {
      id: 'opt_leave_sick',
      label: 'إجازة مرضية (بتقرير طبي)',
      icon: 'HeartPulse',
      rules: { attachmentRule: 'REQUIRED' as const, descriptionRule: 'OPTIONAL' as const, scheduleRule: 'DATE_RANGE' as const }
    },
    {
      id: 'opt_leave_emergency',
      label: 'إجازة طارئة (مع بيان السبب)',
      icon: 'Zap',
      rules: { attachmentRule: 'OPTIONAL' as const, descriptionRule: 'REQUIRED' as const, scheduleRule: 'DATE_RANGE' as const }
    },
    {
      id: 'opt_leave_permission',
      label: 'إذن مغادرة ساعي / تأخير',
      icon: 'Clock',
      rules: { attachmentRule: 'HIDDEN' as const, descriptionRule: 'OPTIONAL' as const, scheduleRule: 'HOURLY_WINDOW' as const }
    },
    {
      id: 'opt_leave_delegation',
      label: 'تكليف مؤقت / انتداب عمل',
      icon: 'UserCheck',
      rules: { attachmentRule: 'OPTIONAL' as const, descriptionRule: 'OPTIONAL' as const, scheduleRule: 'DATE_RANGE' as const }
    },
  ]
};

/**
 * Map legacy emojis to Lucide icon identifiers for flawless backward compatibility.
 */
export const EMOJI_TO_LUCIDE_MAP: Record<string, string> = {
  '🌴': 'Palmtree', '🏥': 'HeartPulse', '⚡': 'Zap', '⏱️': 'Clock', '👤': 'UserCheck',
  '📋': 'ClipboardList', '📄': 'FileText', '🎯': 'Target', '📅': 'Calendar', '✈️': 'Plane',
  '🚗': 'Car', '🏢': 'Building2', '💻': 'Laptop', '🔧': 'Wrench', '🖨️': 'Printer',
  '🌐': 'Wifi', '🔒': 'Lock', '📱': 'Smartphone', '🛠️': 'Wrench', '⚙️': 'Settings',
  '💡': 'Lightbulb', '📡': 'Radio', '🔌': 'Zap', '🖥️': 'Monitor', '💳': 'CreditCard',
  '💰': 'Coins', '📦': 'Package', '🛒': 'ShoppingCart', '🍽️': 'Coffee', '☕': 'Coffee',
  '⚖️': 'Scale', '🎓': 'GraduationCap', '🏷️': 'Tag', '🤝': 'Handshake', '✨': 'Sparkles',
  '🔔': 'Bell', '🏖️': 'Palmtree', '💼': 'Briefcase', '🛡️': 'ShieldCheck', '🚚': 'Truck'
};

/**
 * Resolves the visual Lucide vector icon for any option using explicit Admin choice or smart keyword fallback.
 */
export const getOptionIcon = (
  option: { id?: string; label?: string; icon?: string },
  formConfig?: RouteFormConfig
): string => {
  const rawIcon = (option.icon && option.icon.trim())
    || (option.id && formConfig?.optionIcons?.[option.id])
    || (option.label && formConfig?.optionIcons?.[option.label]);

  if (rawIcon) {
    return EMOJI_TO_LUCIDE_MAP[rawIcon] || rawIcon;
  }

  const lbl = (option.label || '').toLowerCase();
  if (lbl.includes('سنوية') || lbl.includes('اعتيادية') || lbl.includes('استجمام') || lbl.includes('راحة')) return 'Palmtree';
  if (lbl.includes('مرضية') || lbl.includes('مستشفى') || lbl.includes('طبي') || lbl.includes('علاج')) return 'HeartPulse';
  if (lbl.includes('طارئة') || lbl.includes('عاجلة') || lbl.includes('وفاة')) return 'Zap';
  if (lbl.includes('إذن') || lbl.includes('ساعي') || lbl.includes('خروج') || lbl.includes('تأخير') || lbl.includes('مغادرة')) return 'Clock';
  if (lbl.includes('تكليف') || lbl.includes('انتداب') || lbl.includes('بديل') || lbl.includes('مهمة')) return 'UserCheck';
  if (lbl.includes('صيانة') || lbl.includes('عطل') || lbl.includes('تصليح') || lbl.includes('فني')) return 'Wrench';
  if (lbl.includes('حاسوب') || lbl.includes('كمبيوتر') || lbl.includes('لابتوب') || lbl.includes('شاشة')) return 'Laptop';
  if (lbl.includes('شبكة') || lbl.includes('انترنت') || lbl.includes('واي فاي')) return 'Wifi';
  if (lbl.includes('طابعة') || lbl.includes('حبر') || lbl.includes('سكانر')) return 'Printer';
  if (lbl.includes('شراء') || lbl.includes('مشتريات') || lbl.includes('صرف') || lbl.includes('فاتورة')) return 'CreditCard';
  if (lbl.includes('سيارة') || lbl.includes('نقل') || lbl.includes('حركة') || lbl.includes('وقود')) return 'Car';
  if (lbl.includes('مقر') || lbl.includes('مكتب') || lbl.includes('مبنى')) return 'Building2';
  if (lbl.includes('قانون') || lbl.includes('عقد') || lbl.includes('استشارة')) return 'Scale';
  if (lbl.includes('تدريب') || lbl.includes('دورة') || lbl.includes('شهادة')) return 'GraduationCap';
  return 'ClipboardList';
};

/**
 * Evaluates the behavioral rules for the selected option in a route form.
 * Supports explicit Admin configuration and provides intelligent defaults
 * (e.g. sick leave requires attachment, emergency leave requires explanation, etc.)
 */
export const getOptionBehavior = (
  formData: Record<string, any>,
  formConfig?: RouteFormConfig
): OptionBehaviorRule => {
  const result: OptionBehaviorRule = {
    attachmentRule: formConfig?.mandatoryAttachments ? 'REQUIRED' : formConfig?.showAttachments ? 'OPTIONAL' : 'HIDDEN',
    descriptionRule: formConfig?.mandatoryDescription ? 'REQUIRED' : formConfig?.showDescription ? 'OPTIONAL' : 'HIDDEN',
    scheduleRule: 'DEFAULT',
  };

  if (!formConfig) return result;

  const rules = formConfig.optionBehaviorRules || {};

  // Check every value selected in formData
  for (const key of Object.keys(formData)) {
    const val = String(formData[key] || '').trim();
    if (!val) continue;

    // 1. Direct key match (by Option ID or Option Label)
    if (rules[val]) {
      const r = rules[val];
      if (r.attachmentRule) result.attachmentRule = r.attachmentRule;
      if (r.descriptionRule) result.descriptionRule = r.descriptionRule;
      if (r.scheduleRule) result.scheduleRule = r.scheduleRule;
      return result;
    }

    // 2. Intelligent keyword fallback if not explicitly defined by Admin
    const lower = val.toLowerCase();
    if (lower.includes('مرضية') || lower.includes('مستشفى') || lower.includes('طبي')) {
      result.attachmentRule = 'REQUIRED'; // تقرير طبي إلزامي
      result.descriptionRule = 'OPTIONAL';
      result.scheduleRule = 'DATE_RANGE';
      return result;
    }
    if (lower.includes('طارئة') || lower.includes('عاجلة')) {
      result.attachmentRule = 'OPTIONAL';
      result.descriptionRule = 'REQUIRED'; // تعليق وبيان سبب الطوارئ إلزامي
      result.scheduleRule = 'DATE_RANGE';
      return result;
    }
    if (lower.includes('إذن') || lower.includes('خروج') || lower.includes('تأخير') || lower.includes('ساعي')) {
      result.attachmentRule = 'HIDDEN'; // غير مطلوب
      result.descriptionRule = 'OPTIONAL';
      result.scheduleRule = 'HOURLY_WINDOW';
      return result;
    }
    if (lower.includes('سنوية') || lower.includes('اعتيادية')) {
      result.attachmentRule = 'HIDDEN'; // غير مطلوب
      result.descriptionRule = 'OPTIONAL';
      result.scheduleRule = 'DATE_RANGE';
      return result;
    }
    if (lower.includes('تكليف')) {
      result.attachmentRule = 'OPTIONAL';
      result.descriptionRule = 'OPTIONAL';
      result.scheduleRule = 'DATE_RANGE';
      return result;
    }
  }

  return result;
};

/**
 * Checks whether the delegate colleague field should be rendered on screen.
 * By default ('ONLY_ON_ASSIGNMENT'), it ONLY appears when the user selects a request type
 * that represents a temporary assignment or task delegation (e.g. 'تكليف مؤقت' or 'انتداب'),
 * remaining completely hidden on regular leaves, hourly permissions, etc.
 */
export const isDelegateFieldVisible = (
  formData: Record<string, any>,
  formConfig?: RouteFormConfig
): boolean => {
  if (!formConfig?.showDelegateUser) return false;
  if (formConfig.delegateTriggerMode === 'ALWAYS') return true;

  const target = (formConfig.delegateTriggerOptionLabel || 'تكليف').trim().toLowerCase();

  // Inspect all values selected in formData (main taxonomy, sub-issue, dynamic selects)
  for (const key of Object.keys(formData)) {
    const val = String(formData[key] || '').toLowerCase();
    if (val.includes(target) || val.includes('تكليف') || val.includes('انتداب')) {
      return true;
    }
  }

  return false;
};

export const normalizeRoute = (r: any): TicketRouteDefinition => {
  const baseConfig = defaultFormConfig();
  return {
    ...r,
    id: r.id || `route_${Date.now()}`,
    name: r.name || '',
    description: r.description || '',
    icon: r.icon || 'Monitor',
    color: r.color || '#007AFF',
    routeCategory: r.routeCategory || 'OPERATIONAL',
    targetDepartmentId: r.targetDepartmentId || '',
    targetDepartmentName: r.targetDepartmentName || '',
    targetDivisionId: r.targetDivisionId || '',
    targetDivisionName: r.targetDivisionName || '',
    targetTeamId: r.targetTeamId || '',
    targetTeamName: r.targetTeamName || '',
    managerId: r.managerId ? String(r.managerId) : '',
    managerName: r.managerName || '',
    isActive: r.isActive !== false,
    formConfig: {
      ...baseConfig,
      ...(r.formConfig || {}),
      customInputs: Array.isArray(r.formConfig?.customInputs) ? r.formConfig.customInputs : [],
      optionCustomInputs: r.formConfig?.optionCustomInputs || {},
      optionBehaviorRules: r.formConfig?.optionBehaviorRules || {},
      optionIcons: r.formConfig?.optionIcons || {},
      taxonomyDisplayMode: r.formConfig?.taxonomyDisplayMode || 'dropdown',
      dynamicFieldsDisplayMode: r.formConfig?.dynamicFieldsDisplayMode || {},
      fieldsOrder: Array.isArray(r.formConfig?.fieldsOrder) ? r.formConfig.fieldsOrder : [],
      routeDynamicFields: Array.isArray(r.formConfig?.routeDynamicFields) ? r.formConfig.routeDynamicFields : [],
      delegateScope: r.formConfig?.delegateScope || 'ALL_COMPANY_USERS',
      delegateTriggerMode: r.formConfig?.delegateTriggerMode || 'ONLY_ON_ASSIGNMENT',
      delegateTriggerOptionLabel: r.formConfig?.delegateTriggerOptionLabel || 'تكليف',
    }
  };
};

export const loadRoutes = async (): Promise<TicketRouteDefinition[]> => {
  try {
    const { AdminAPI } = await import('./admin.api');
    const res = await AdminAPI.getRoutes();
    if (res.success && res.routes) {
      return res.routes.map(normalizeRoute);
    }
    return [];
  } catch {
    return [];
  }
};

export const saveRoutes = async (routes: TicketRouteDefinition[]): Promise<TicketRouteDefinition[]> => {
  const { AdminAPI } = await import('./admin.api');
  const res = await AdminAPI.saveRoutesSnapshot(routes);
  if (!res?.success) throw new Error(res?.error || 'فشل حفظ المسارات');
  window.dispatchEvent(new Event('litc_settings_updated'));
  return Array.isArray(res?.routes) ? res.routes.map(normalizeRoute) : routes;
};

export const loadDynamicFields = async (): Promise<DynamicCustomField[]> => {
  try {
    const { AdminAPI } = await import('./admin.api');
    const res = await AdminAPI.getDynamicFields();
    return res.success && res.fields ? res.fields : [];
  } catch {
    return [];
  }
};

export const saveDynamicFields = async (fields: DynamicCustomField[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const { AdminAPI } = await import('./admin.api');
    await AdminAPI.saveDynamicFields(fields);
    window.dispatchEvent(new Event('litc_settings_updated'));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'فشل في حفظ الحقول الديناميكية' };
  }
};
