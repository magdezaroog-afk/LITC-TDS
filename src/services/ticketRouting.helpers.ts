// ═══════════════════════════════════════════════════════════
// Ticket Routing Helpers and Types
// Central service module to prevent Vite HMR invalidation in components
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
  // ─── Smart Time & Attendance / Scheduling Engine ───
  showScheduleEngine?: boolean;
  mandatorySchedule?: boolean;
  scheduleLabel?: string;
  scheduleMode?: 'ANY' | 'DATE_RANGE' | 'DISCRETE_DAYS' | 'HOURLY_WINDOW' | 'SINGLE_DATE';

  // ─── Delegate Colleague ───
  showDelegateUser?: boolean;
  mandatoryDelegateUser?: boolean;
  delegateUserLabel?: string;

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
  // ─── Smart Time & Attendance / Scheduling Engine ───
  showScheduleEngine: false,
  mandatorySchedule: false,
  scheduleLabel: 'الجدولة الزمنية / فترة الطلب',
  scheduleMode: 'ANY',
  // ─── Delegate Colleague ───
  showDelegateUser: false,
  mandatoryDelegateUser: false,
  delegateUserLabel: 'الموظف البديل / تسليم المهام',
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
});

export const normalizeRoute = (r: any): TicketRouteDefinition => {
  const baseConfig = defaultFormConfig();
  return {
    ...r,
    id: r.id || `route_${Date.now()}`,
    name: r.name || '',
    description: r.description || '',
    icon: r.icon || 'Monitor',
    color: r.color || '#007AFF',
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
      routeDynamicFields: Array.isArray(r.formConfig?.routeDynamicFields) ? r.formConfig.routeDynamicFields : []
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
