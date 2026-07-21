import { useState, useEffect } from 'react';
import { DynamicCustomField } from '../pages/admin/tabs/DynamicFieldsTab';

export type CoreRole = 'END_USER' | 'OPERATIONAL_USER' | 'TEAM_LEADER' | 'SECTION_HEAD' | 'OPERATIONAL_MANAGER' | 'IT_ADMIN';

interface SchemaComponent {
  componentId: string;
  name: string;
  settings: any;
}

export interface UiSchema {
  version: string;
  layoutConfig: SchemaComponent[];
}

export const useWorkspaceLayout = (currentUserRole: CoreRole) => {
  const [schema, setSchema] = useState<UiSchema | null>(null);
  const [customFields, setCustomFields] = useState<DynamicCustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchema = async () => {
      // Fetch dynamic fields from local storage
      const savedFields = localStorage.getItem('litc_dynamic_fields');
      if (savedFields) {
        try { setCustomFields(JSON.parse(savedFields)); } catch (e) {}
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      // 1. Load layouts from localStorage for each role level
      const adminLayout = localStorage.getItem('litc_layout_components_IT_ADMIN') || localStorage.getItem('litc_layout_components');
      const managerLayout = localStorage.getItem('litc_layout_components_OPERATIONAL_MANAGER');
      const sectionHeadLayout = localStorage.getItem('litc_layout_components_SECTION_HEAD');
      const teamLeaderLayout = localStorage.getItem('litc_layout_components_TEAM_LEADER');
      const userLayout = localStorage.getItem('litc_layout_components_OPERATIONAL_USER');
      const endUserLayout = localStorage.getItem('litc_layout_components_END_USER');

      // 2. Parse layouts
      let adminList: any[] = [];
      try { adminList = adminLayout ? JSON.parse(adminLayout) : []; } catch (e) {}

      let managerList: any[] = [];
      try { managerList = managerLayout ? JSON.parse(managerLayout) : []; } catch (e) {}
      
      let sectionHeadList: any[] = [];
      try { sectionHeadList = sectionHeadLayout ? JSON.parse(sectionHeadLayout) : []; } catch (e) {}

      let teamLeaderList: any[] = [];
      try { teamLeaderList = teamLeaderLayout ? JSON.parse(teamLeaderLayout) : []; } catch (e) {}

      let userList: any[] = [];
      try { userList = userLayout ? JSON.parse(userLayout) : []; } catch (e) {}

      let endUserList: any[] = [];
      try { endUserList = endUserLayout ? JSON.parse(endUserLayout) : []; } catch (e) {}

      // Default layout config if no configurations found
      const defaultLayoutConfig = [
        { componentId: 'tool_language_theme', name: 'اللغات والمظهر', settings: { defaultLang: 'ar', allowUserSwitch: true } },
        { componentId: 'ticket_create', name: 'إنشاء تذكرة للمرسل', settings: { mandatoryAttachments: true, enableSLA: true, enableVoiceToText: true, showPriorityField: true, enableAttachments: true, maxAttachmentSizeMB: 5, allowedExtensions: 'pdf, jpg, png', injectedFields: customFields.map(f => f.id) } },
        { componentId: 'ticket_inbox', name: 'التذاكر الواردة', settings: {} },
        { componentId: 'tool_sla_timer', name: 'مؤقت الـ SLA', settings: {} },
        { componentId: 'sub_ticket_engine', name: 'محرك التذاكر الفرعية', settings: { concurrencyMode: 'SEQUENTIAL', maxSubTickets: 2, routingScope: 'INTERNAL_TEAM', enableDescription: true } },
        { componentId: 'admin_analytics', name: 'التحليل المركزي', settings: { dataScope: 'TEAM', filterDestDept: true, activeCharts: ['kpi_cards', 'bar_chart'], allowedFilters: [] } },
        { componentId: 'admin_leaderboard', name: 'المقارنة', settings: { allowedDimensions: ['EMP_VS_EMP', 'DEPT_VS_DEPT'], allowedMetrics: ['VOLUME', 'SPEED', 'SLA'], displayModes: ['SIDE_BAR', 'VARIANCE_TABLE'] } },
        { componentId: 'admin_archive', name: 'الأرشيف المركزي', settings: { archiveScope: 'Department_Only', allowCompletedClosedTickets: true, allowSupplementaryAdditionalTickets: true, enabledUIFilters: ['operator_name', 'end_user_name', 'issue_type', 'building_location'] } },
        { componentId: 'admin_profile', name: 'الملف الشخصي', settings: { identityProvider: 'Microsoft_SSO', allowThemeCustomization: true } },
        { componentId: 'admin_notifications', name: 'إعدادات الإشعارات والـ SLA', settings: { forceWhatsappCritical: true, lockSLAThresholds: false } },
        { componentId: 'admin_sovereign_custody_ledger_v10', name: 'منظومة العُهد والمخازن السيادية الشاملة V10', settings: { allowedReportFilters: ['BY_ITEM_TYPE', 'BY_DATE_RANGE'], allowedReportColumns: ['SHOW_RECEIVER_IDENTITY', 'SHOW_VERIFICATION_STATUS'] } },
        { componentId: 'admin_operational_console', name: 'قمرة إدارة الكيانات التشغيلية', settings: {} }
      ];

      // --- SUBMISSION TEMPLATE LOGIC ---
      let submissionLayout: any[] = [];
      try {
        const templatesRaw = localStorage.getItem('SUBMISSION_TEMPLATES_SCHEMA');
        const roleMappingsRaw = localStorage.getItem('ROLE_SUBMISSION_MAPPINGS');
        if (templatesRaw) {
          const templates = JSON.parse(templatesRaw);
          const mappings = roleMappingsRaw ? JSON.parse(roleMappingsRaw) : [];
          
          // Simulation: If a mapping exists for currentUserRole, use it. Else use default.
          const mapping = mappings.find((m: any) => m.role === currentUserRole);
          const activeTemplate = mapping 
            ? templates.find((t: any) => t.id === mapping.templateId)
            : templates.find((t: any) => t.isDefault);

          if (activeTemplate && activeTemplate.components && activeTemplate.components.length > 0) {
            submissionLayout = activeTemplate.components;
          }
        }
      } catch(e) {}

      // Perform cascading merge
      const baseList = adminList.length > 0 ? adminList : defaultLayoutConfig.map(d => ({ id: d.componentId, name: d.name, isActive: true, properties: d.settings }));
      const activeLayout = baseList.filter((c: any) => c.isActive);

      let finalLayoutConfig = activeLayout.map((c: any) => {
        const mergedProps = { ...c.properties };

        // A. Apply Operational Manager overrides if role allows
        const managerComp = managerList.find((mc: any) => mc.id === c.id);
        if (managerComp && (currentUserRole === 'OPERATIONAL_MANAGER' || currentUserRole === 'OPERATIONAL_USER' || currentUserRole === 'END_USER')) {
          Object.keys(managerComp.properties || {}).forEach(key => {
            const rule = c.delegationConfig?.[key];
            const ceiling = c.strict_ceiling_props?.[key];
            const isAllowedByAdmin = (rule && rule.allow_override) || (ceiling && !ceiling.adminAbsoluteOverride && ceiling.allowedRoles?.includes('OPERATIONAL_MANAGER'));
            if (isAllowedByAdmin) {
              mergedProps[key] = managerComp.properties[key];
            }
          });
        }

        // B. Apply Operational User (Section Head) overrides
        const userComp = userList.find((uc: any) => uc.id === c.id);
        if (userComp && (currentUserRole === 'OPERATIONAL_USER' || currentUserRole === 'END_USER')) {
          Object.keys(userComp.properties || {}).forEach(key => {
            const adminRule = c.delegationConfig?.[key];
            const adminCeiling = c.strict_ceiling_props?.[key];
            const isAllowedByAdmin = (adminRule && adminRule.allow_override) || (adminCeiling && !adminCeiling.adminAbsoluteOverride && (adminCeiling.allowedRoles?.includes('OPERATIONAL_USER') || adminCeiling.allowedRoles?.includes('OPERATIONAL_MANAGER')));
            
            const managerCompObj = managerList.find((mc: any) => mc.id === c.id);
            const managerRule = managerCompObj?.delegationConfig?.[key];
            const isAllowedByManager = !managerCompObj || (managerRule && managerRule.allow_override);

            if (isAllowedByAdmin && isAllowedByManager) {
              mergedProps[key] = userComp.properties[key];
            }
          });
        }

        // C. Apply End User (Field Engineer) overrides
        const endUserComp = endUserList.find((ec: any) => ec.id === c.id);
        if (endUserComp && currentUserRole === 'END_USER') {
          Object.keys(endUserComp.properties || {}).forEach(key => {
            const adminRule = c.delegationConfig?.[key];
            const adminCeiling = c.strict_ceiling_props?.[key];
            const isAllowedByAdmin = (adminRule && adminRule.allow_override) || (adminCeiling && !adminCeiling.adminAbsoluteOverride && adminCeiling.allowedRoles?.includes('END_USER'));
            if (isAllowedByAdmin) {
              mergedProps[key] = endUserComp.properties[key];
            }
          });
        }

        return {
          componentId: c.id,
          name: c.name,
          settings: mergedProps
        };
      });

      // Ensure basic system utilities are present
      const systemUtils = [
        { componentId: 'tool_language_theme', name: 'اللغات والمظهر', settings: { defaultLang: 'ar', allowUserSwitch: true } },
        { componentId: 'tool_sla_timer', name: 'مؤقت الـ SLA', settings: {} },
        { componentId: 'sub_ticket_engine', name: 'محرك التذاكر الفرعية', settings: { concurrencyMode: 'SEQUENTIAL', maxSubTickets: 2, routingScope: 'INTERNAL_TEAM', enableDescription: true } },
      ];
      
      const combined = [...systemUtils];
      finalLayoutConfig.forEach((item: any) => {
        if (!combined.some(s => s.componentId === item.componentId)) {
          combined.push(item);
        }
      });

      // Override with Submission Template components
      submissionLayout.forEach((subItem: any) => {
        const existingIdx = combined.findIndex(c => c.componentId === subItem.id);
        const transformed = { componentId: subItem.id, name: subItem.name, settings: subItem.properties };
        if (existingIdx >= 0) {
          combined[existingIdx] = transformed;
        } else {
          combined.push(transformed);
        }
      });

      setSchema({
        version: "v43.5",
        layoutConfig: combined
      });
      setLoading(false);
    };
    fetchSchema();
  }, [currentUserRole]);

  const getComponentSettings = (id: string) => {
    return schema?.layoutConfig.find(c => c.componentId === id)?.settings || null;
  };

  const isComponentActive = (id: string) => {
    return schema?.layoutConfig.some(c => c.componentId === id) ?? false;
  };

  return {
    schema,
    customFields,
    loading,
    getComponentSettings,
    isComponentActive
  };
};
