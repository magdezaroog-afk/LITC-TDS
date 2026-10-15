/**
 * LITC-TS v43 — useWorkspaceLayout Hook (Refactored)
 * ======================================================
 * يجلب إعدادات واجهة المستخدم من الـ API مباشرة بدلاً من localStorage.
 * المصدر: جدول Interface في قاعدة البيانات (مربوط بـ Department + roleType).
 */
import { useState, useEffect, useCallback } from 'react';
import { CoreRole } from '../types/roles';
import { DynamicCustomField } from '../pages/admin/tabs/DynamicFieldsTab';

interface SchemaComponent {
  componentId: string;
  name: string;
  settings: any;
}

export interface UiSchema {
  version: string;
  layoutConfig: SchemaComponent[];
}

// تصدير CoreRole من المصدر الموحد
export type { CoreRole };

/**
 * الواجهة الافتراضية التي تظهر للموظف العادي عندما لا توجد واجهة مخصصة.
 * تحتوي فقط على العناصر الأساسية: إنشاء طلب + متابعة الطلبات.
 */
const DEFAULT_FUNCTIONAL_LAYOUT: SchemaComponent[] = [
  { componentId: 'ticket_create', name: 'إنشاء طلب / بلاغ', settings: { enableAttachments: true, maxAttachmentSizeMB: 5 } },
  { componentId: 'ticket_inbox', name: 'طلباتي', settings: { showStatusBadges: true } },
  { componentId: 'admin_profile', name: 'الملف الشخصي', settings: {} },
];

/**
 * الواجهة الافتراضية للمستخدم التشغيلي الذي لم تُنشأ له واجهة مخصصة بعد.
 */
const DEFAULT_OPERATIONAL_LAYOUT: SchemaComponent[] = [
  { componentId: 'admin_operational_console', name: 'لوحة الطلبات الواردة', settings: { tabsConfig: { NEW: true, IN_PROGRESS: true, PENDING: true, CLOSED: true } } },
  { componentId: 'admin_profile', name: 'الملف الشخصي', settings: {} },
];

export const useWorkspaceLayout = (currentUserRole: CoreRole, userId?: number) => {
  const [submissionSchema, setSubmissionSchema] = useState<UiSchema | null>(null);
  const [workSchema, setWorkSchema] = useState<UiSchema | null>(null);
  const [customFields, setCustomFields] = useState<DynamicCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWorkModeLocked, setIsWorkModeLocked] = useState(false);

  const systemUtils: SchemaComponent[] = [
    { componentId: 'tool_language_theme', name: 'اللغات والمظهر', settings: { defaultLang: 'ar', allowUserSwitch: true } },
  ];

  const fetchSchema = useCallback(async () => {
    setLoading(true);
    try {
      // 1. جلب الحقول الديناميكية من الباكاند
      try {
        const fieldsRes = await fetch('/api/v1/admin/dynamic-fields', { credentials: 'include' });
        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          if (Array.isArray(fieldsData.fields)) {
            setCustomFields(fieldsData.fields);
          }
        }
      } catch (_) {
        // الحقول الديناميكية اختيارية — لا نوقف العملية
      }

      // 2. جلب قوالب الإرسال من الباكاند
      let submissionLayout: SchemaComponent[] = [];
      try {
        const [templatesRes, mappingsRes] = await Promise.all([
          fetch('/api/v1/admin/settings/SUBMISSION_TEMPLATES_SCHEMA', { credentials: 'include' }),
          fetch('/api/v1/admin/settings/ROLE_SUBMISSION_MAPPINGS', { credentials: 'include' }),
        ]);

        if (templatesRes.ok && mappingsRes.ok) {
          const tData = await templatesRes.json();
          const mData = await mappingsRes.json();

          if (tData?.settingValue) {
            const templates = JSON.parse(tData.settingValue);
            const mappings = mData?.settingValue ? JSON.parse(mData.settingValue) : [];

            const mapping = mappings.find((m: any) => m.role === currentUserRole);
            const activeTemplate = mapping
              ? templates.find((t: any) => t.id === mapping.templateId)
              : templates.find((t: any) => t.isDefault);

            if (activeTemplate?.components?.length > 0) {
              submissionLayout = activeTemplate.components.map((c: any) => ({
                componentId: c.id,
                name: c.name,
                settings: c.properties || {},
              }));
            }
          }
        }
      } catch (_) {
        // قوالب الإرسال اختيارية
      }

      // 3. جلب الواجهة المخصصة لهذا المستخدم بناءً على دوره من جدول Interface
      let workLayout: SchemaComponent[] = [];
      let hasCustomWorkLayout = false;
      try {
        // نجلب الواجهة المناسبة: إذا كان لدينا userId نجلب الواجهة المسندة له،
        // وإلا نجلب بحسب الدور فقط
        const interfaceEndpoint = userId
          ? `/api/v1/layouts?userId=${userId}&roleType=${currentUserRole}`
          : `/api/v1/layouts?roleType=${currentUserRole}`;

        const layoutRes = await fetch(interfaceEndpoint, { credentials: 'include' });
        if (layoutRes.ok) {
          const layoutData = await layoutRes.json();
          // يدعم الـ API استجابة على شكل مصفوفة أو كائن
          const components = Array.isArray(layoutData)
            ? layoutData
            : (layoutData.components || layoutData.layout || []);

          if (components.length > 0) {
            workLayout = components
              .filter((c: any) => c.isActive !== false)
              .map((c: any) => ({
                componentId: c.id || c.componentId,
                name: c.name,
                settings: c.properties || c.settings || {},
              }));
            hasCustomWorkLayout = workLayout.length > 0;
          }
        }
      } catch (_) {
        // نرجع للقيم الافتراضية
      }

      // 4. تحديد ما إذا كان وضع العمل متاحاً
      const operationalRoles = ['tech_director', 'dept_head', 'team_leader', 'system_director', 'super_admin'];
      const isOperationalRole = operationalRoles.includes(currentUserRole) || ['OPERATIONAL_USER', 'TEAM_LEADER', 'SECTION_HEAD', 'OPERATIONAL_MANAGER', 'IT_ADMIN'].includes(currentUserRole);
      setIsWorkModeLocked(!isOperationalRole && !hasCustomWorkLayout);

      // 5. بناء مخطط الإرسال (للموظف العادي)
      const funcDefault = submissionLayout.length > 0 ? submissionLayout : DEFAULT_FUNCTIONAL_LAYOUT;
      const combinedSubmission = [...systemUtils];
      funcDefault.forEach(item => {
        if (!combinedSubmission.some(s => s.componentId === item.componentId)) {
          combinedSubmission.push(item);
        }
      });

      // 6. بناء مخطط العمل (للمستخدم التشغيلي والقيادي)
      const operDefault = hasCustomWorkLayout ? workLayout : (isOperationalRole ? DEFAULT_OPERATIONAL_LAYOUT : []);
      const combinedWork = [...systemUtils];
      operDefault.forEach(item => {
        if (!combinedWork.some(s => s.componentId === item.componentId)) {
          combinedWork.push(item);
        }
      });

      setSubmissionSchema({ version: 'v43.5', layoutConfig: combinedSubmission });
      setWorkSchema({ version: 'v43.5', layoutConfig: combinedWork });
    } catch (error) {
      console.error('[useWorkspaceLayout] Failed to fetch schema:', error);
      // في حالة الفشل الكامل، نُظهر الواجهة الافتراضية
      setSubmissionSchema({ version: 'v43.5', layoutConfig: [...systemUtils, ...DEFAULT_FUNCTIONAL_LAYOUT] });
      setWorkSchema({ version: 'v43.5', layoutConfig: [...systemUtils, ...DEFAULT_OPERATIONAL_LAYOUT] });
    } finally {
      setLoading(false);
    }
  }, [currentUserRole, userId]);

  useEffect(() => {
    fetchSchema();

    // الاستماع لتحديثات الإعدادات من نفس الجلسة
    const handleSettingsUpdate = () => fetchSchema();
    window.addEventListener('litc_settings_updated', handleSettingsUpdate);
    window.addEventListener('litc_layout_saved', handleSettingsUpdate);

    return () => {
      window.removeEventListener('litc_settings_updated', handleSettingsUpdate);
      window.removeEventListener('litc_layout_saved', handleSettingsUpdate);
    };
  }, [fetchSchema]);

  return {
    submissionSchema,
    workSchema,
    customFields,
    loading,
    isWorkModeLocked,
    refreshSchema: fetchSchema,
  };
};
