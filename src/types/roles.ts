/**
 * LITC-TS v43 — Unified Role Types
 * المصدر الوحيد والموحد لتعريفات الأدوار الوظيفية في النظام.
 * يُمنع تعريف CoreRole في أي ملف آخر — يجب الاستيراد من هنا حصراً.
 */

/**
 * الأدوار الوظيفية الجوهرية في النظام.
 * - END_USER: موظف عادي (يُرسل الطلبات)
 * - OPERATIONAL_USER: مشغل عمليات (يستقبل الطلبات ويعمل عليها)
 * - TEAM_LEADER: قائد فريق
 * - SECTION_HEAD: رئيس قسم
 * - OPERATIONAL_MANAGER: مدير إدارة تشغيلية
 * - IT_ADMIN: أدمن النظام (صلاحية كاملة)
 */
export type CoreRole =
  | 'END_USER'
  | 'OPERATIONAL_USER'
  | 'TEAM_LEADER'
  | 'SECTION_HEAD'
  | 'OPERATIONAL_MANAGER'
  | 'IT_ADMIN';

/**
 * ترتيب الأدوار هرمياً (كلما كان الرقم أعلى، كانت الصلاحيات أوسع).
 * يُستخدم للتحقق من الصلاحيات الشجرية.
 */
export const ROLE_HIERARCHY: Record<CoreRole, number> = {
  END_USER: 1,
  OPERATIONAL_USER: 2,
  TEAM_LEADER: 3,
  SECTION_HEAD: 4,
  OPERATIONAL_MANAGER: 5,
  IT_ADMIN: 99,
};

/**
 * الأسماء العربية للأدوار للعرض في الواجهة.
 */
export const ROLE_LABELS_AR: Record<CoreRole, string> = {
  END_USER: 'موظف (مُرسِل)',
  OPERATIONAL_USER: 'مشغل عمليات',
  TEAM_LEADER: 'قائد فريق',
  SECTION_HEAD: 'رئيس قسم',
  OPERATIONAL_MANAGER: 'مدير إدارة',
  IT_ADMIN: 'مدير النظام',
};

/**
 * نوع الواجهة — يحدد الفئة الكبرى للواجهة المُنشأة.
 * - FUNCTIONAL: واجهة وظيفية أساسية (إرسال الطلبات)
 * - OPERATIONAL: واجهة تشغيلية (استقبال ومعالجة الطلبات)
 * - LEADERSHIP: واجهة قيادية (تحليل وإدارة)
 */
export type InterfaceType = 'FUNCTIONAL' | 'OPERATIONAL' | 'LEADERSHIP';

/**
 * يُحدد ما إذا كان الدور في مستوى قيادي أم لا.
 */
export const isLeadershipRole = (role: CoreRole): boolean =>
  ['TEAM_LEADER', 'SECTION_HEAD', 'OPERATIONAL_MANAGER', 'IT_ADMIN'].includes(role);

/**
 * يُحدد ما إذا كان الدور تشغيلياً (يستقبل طلبات).
 */
export const isOperationalRole = (role: CoreRole): boolean =>
  ['OPERATIONAL_USER', 'TEAM_LEADER', 'SECTION_HEAD', 'OPERATIONAL_MANAGER'].includes(role);

/**
 * يُحدد ما إذا كان الدور أ يستطيع التحكم في صلاحيات الدور ب.
 * القاعدة: يجب أن يكون أ أعلى هرمياً من ب.
 */
export const canManage = (managerRole: CoreRole, subordinateRole: CoreRole): boolean => {
  if (managerRole === 'IT_ADMIN') return true;
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[subordinateRole];
};
