/**
 * LITC-TS v43 — Interface Engine Types (Unified)
 * ================================================
 * المصدر الوحيد لأنواع بيانات مخصص الواجهات.
 * يُمنع تعريف هذه الأنواع في أي ملف آخر.
 */

import { CoreRole, InterfaceType } from '../../../../types/roles';

// تصدير مُعاد للاستخدام في بقية الملفات
export type { CoreRole, InterfaceType };

// ─── فئات المكونات ───────────────────────────────────────────────────────────

export type ComponentCategory =
  | 'department_modules'         // المنظومات والموديولات التخصصية المستقلة
  | 'employee_workspace'         // بيئة الموظف والتوافق مع المكونات القديمة
  | 'technical_support_console'  // لوحة الدعم / الاستقبال والتشغيل
  | 'operations_and_management'  // الإدارة والتحليل والمقارنة
  | 'system_admin_control'       // تحكم الأدمن وإعدادات الأمان
  | 'external_components';       // الأنظمة الخارجية المرتبطة

export const CATEGORY_LABELS_AR: Record<ComponentCategory, string> = {
  department_modules: 'المنظومات التخصصية (الموديولات الإدارية)',
  employee_workspace: 'بيئة الموظف الأساسية',
  technical_support_console: 'لوحة الدعم والتشغيل',
  operations_and_management: 'الإدارة والتحليل والمقارنة',
  system_admin_control: 'إعدادات النظام والأمان',
  external_components: 'الأنظمة الخارجية',
};

// ─── قواعد التفويض والصلاحيات ────────────────────────────────────────────────

export interface DelegationRule {
  allow_override: boolean;
  delegated_to?: string;
}

export interface CascadingCeilingConfig {
  allowedRoles: CoreRole[];
  adminAbsoluteOverride: boolean;
}

// ─── تعريف المكون الواحد ──────────────────────────────────────────────────────

export interface UIComponentDefinition {
  id: string;
  name: string;
  category: ComponentCategory;
  isActive: boolean;
  target_zone?: 'Top_Navbar' | 'Dynamic_Sidebar' | 'Main_Viewport' | 'Status_Footer';
  properties: Record<string, any>;
  delegationConfig?: Record<string, DelegationRule>;
  strict_ceiling_props?: Record<string, CascadingCeilingConfig>;
}

// ─── الواجهة المحفوظة ─────────────────────────────────────────────────────────

/**
 * يمثل واجهة مكتملة ومحفوظة في قاعدة البيانات (جدول Interface).
 */
export interface SavedInterface {
  id: string;
  name: string;
  interfaceType: InterfaceType;
  roleType?: CoreRole | string;
  departmentId?: number;
  departmentName?: string;
  sectionId?: number | null;
  teamId?: string | null;
  lastUpdated: string;
}

// ─── قوالب الإرسال ────────────────────────────────────────────────────────────

export interface SubmissionTemplate {
  id: string;
  name: string;
  components: UIComponentDefinition[];
  lastUpdated: string;
  isDefault?: boolean;
}

export interface RoleToTemplateMapping {
  role: CoreRole;
  templateId: string;
}

// ─── إعدادات الحفظ ────────────────────────────────────────────────────────────

export interface SaveInterfacePayload {
  id?: string;           // إذا موجود = تحديث، وإلا = إنشاء جديد
  name: string;
  interfaceType: InterfaceType;
  roleType: CoreRole | string;
  departmentId: number;
  components: UIComponentDefinition[];
}

// ─── حالة المعالج (Wizard) ────────────────────────────────────────────────────

export type WizardCard = 'FUNCTIONAL' | 'OPERATOR' | 'LEADERSHIP';

export interface WizardFormState {
  card: WizardCard | null;
  dept: string;
  deptId: number | null;
  section: string;
  team: string;
  roleTitle: string;
  leadershipTitle: 'Director' | 'Section Head' | 'Team Lead' | '';
}

// ─── مكتبة المكونات التخصصية والإدارية المتاحة للتخصيص ─────────────────────────

/**
 * قائمة المكونات والمنظومات التخصصية المستقلة القابلة للتفعيل حسب طبيعة الإدارة.
 * الملاحظة الهندسية: العناصر الأساسية (الملف الشخصي، الإشعارات، دليل الهاتف، بيانات الموظف)
 * مثبتة بشكل دائم في البنية التحتية ولا تظهر هنا لأنها ركيزة صلبة غير قابلة للإزالة.
 */
export const COMPONENT_LIBRARY: UIComponentDefinition[] = [
  // ─── المنظومات التخصصية المستقلة (Pluggable Modules) ─────────────
  { 
    id: 'asset_inventory', 
    name: 'منظومة جرد الأصول والمعدات', 
    category: 'department_modules', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { trackHardware: true, requireBarcode: false, maintenanceLogs: true } 
  },
  { 
    id: 'department_stores', 
    name: 'منظومة المخزن التشغيلي للإدارة', 
    category: 'department_modules', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { stockTracking: true, minStockAlert: 5, allowTransfer: true } 
  },

  // ─── لوحة الدعم والتشغيل ──────────────────────────────────────────
  { 
    id: 'admin_operational_console', 
    name: 'لوحة استقبال ومعالجة الطلبات', 
    category: 'technical_support_console', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { tabsConfig: { NEW: true, IN_PROGRESS: true, PENDING: true, CLOSED: true }, snatchingGovernance: true, autoEscalationTimeMinutes: 30 } 
  },
  { 
    id: 'engineer_live_status', 
    name: 'الحالة الحية للكادر والعمليات', 
    category: 'technical_support_console', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { autoRefreshSeconds: 30 } 
  },
  { 
    id: 'quick_actions_panel', 
    name: 'شريط الإجراءات والتحويل السريع', 
    category: 'technical_support_console', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { escalateToManager: true, enableHandshakeTransfer: true } 
  },

  // ─── الإدارة والتحليل والمقارنة (المكون الأهم) ────────────────────
  { 
    id: 'dynamic_form_analytics', 
    name: 'محرك التحليل والمقارنة والتقارير الذكي', 
    category: 'operations_and_management', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { enableComparativeMode: true, allowExport: true, defaultPeriod: 'MONTHLY' } 
  },
  { 
    id: 'workforce_manager', 
    name: 'إدارة الكادر الوظيفي والهيكل التشغيلي', 
    category: 'operations_and_management', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { allowRoleAssignment: true, showPerformanceBadges: true } 
  },
  { 
    id: 'admin_archive', 
    name: 'الأرشيف المركزي والبحث التاريخي', 
    category: 'operations_and_management', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { archiveScope: 'Department_Only', enableDeepFilter: true } 
  },

  // ─── إعدادات النظام وحوكمة الأمان ────────────────────────────────
  { 
    id: 'system_audit_logs', 
    name: 'سجل العمليات والتدقيق الأمني', 
    category: 'system_admin_control', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: { logRetentionDays: 90 } 
  },
  { 
    id: 'admin_notifications', 
    name: 'حوكمة الإشعارات وقواعد الـ SLA', 
    category: 'system_admin_control', 
    isActive: false, 
    target_zone: 'Main_Viewport', 
    properties: {} 
  },
];
