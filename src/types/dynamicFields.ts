/**
 * LITC-TS v43.5 — Dynamic UI Fields Type Definitions
 * تعريفات أنواع الحقول الديناميكية لمحرك تخصيص واجهات الأقسام.
 */

export type FieldType = 'text' | 'number' | 'dropdown';

export interface FieldDefinition {
  /** معرف فريد للحقل — يُولَّد تلقائياً عند الإنشاء */
  fieldId: string;
  /** نوع الحقل: نص، رقم أو قائمة منسدلة */
  type: FieldType;
  /** تسمية الحقل التي ستظهر في الواجهة */
  label: string;
  /** نص إرشادي يظهر داخل الحقل (placeholder) */
  placeholder?: string;
  /** هل الحقل مطلوب أم لا */
  required: boolean;
  /** في حالة النوع dropdown، مجموعة الخيارات */
  options?: string[];
}

/** واجهة طلب تحديث الحقول الديناميكية لقسم معين */
export interface DynamicFieldsUpdatePayload {
  departmentId: string;
  fields: FieldDefinition[];
}

/** واجهة استجابة جلب الحقول الديناميكية لقسم معين */
export interface DynamicFieldsResponse {
  departmentId: string;
  fields: FieldDefinition[];
  updatedAt: string;
}
