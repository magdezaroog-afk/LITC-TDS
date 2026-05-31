/**
 * LITC-TS v43.0 - Core Data Schema
 * هذا الملف هو المرجع الأساسي لتحديد هيكلية المكونات والصفحات.
 * يلتزم بالتعريف الصارم للأنواع (export type) لتحقيق أقصى درجات Type Safety.
 */

/**
 * الأنواع المحددة والمدعومة للمكونات البرمجية داخل النظام
 */
export type ComponentType = 
  | 'TicketList' 
  | 'ActionButton' 
  | 'AssetMonitor' 
  | 'StatsWidget' 
  | 'SystemHealthWidget'
  | 'BaseButton'
  | 'BaseCard'
  | 'BaseInput'
  | 'BaseText'
  | 'TicketOperationPanel'
  | 'DynamicFormCreator'
  | 'OperationalDashboard'
  | 'AdminGovernanceConsole'
  | 'GovernanceAnalytics';

/**
 * إعدادات المكون البرمجي وتوصيف سياسات حمايته ومحتوياته
 */
export type ComponentConfig = {
  /** المعرف الفريد للمكون داخل الصفحة */
  id: string;
  /** نوع المكون البرمجي (يجب أن يكون من الأنواع المعرفة في ComponentType) */
  type: ComponentType;
  /** قائمة الصلاحيات الأمنية المطلوبة للولوج أو رؤية هذا المكون */
  permissions: string[];
  /** سياسة الأمان المطبقة بشكل صارم على هذا المكون للتحقق والتحكم في الوصول */
  policy?: 'department_only' | 'global' | 'admin_only';
  /** الخصائص والبيانات الإضافية الممررة للمكون للتحكم في سلوكه ورسمه */
  props: Record<string, any>;
};

/**
 * الهيكل العام لتخطيط الصفحة ومجموعة المكونات التابعة لها
 */
export type PageLayout = {
  /** اسم الصفحة التعريفي */
  pageName: string;
  /** قائمة المكونات البرمجية المهيأة للعرض داخل الصفحة */
  components: ComponentConfig[];
};
