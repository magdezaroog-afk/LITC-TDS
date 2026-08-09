import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { loadRoutes, TicketRouteDefinition } from './TicketRoutingTab';
import { TicketCreatorForm } from '../../../components/organisms/TicketCreatorForm';
import { ShieldCheck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { LayoutEngineLanding } from './LayoutEngineLanding';

export type ComponentCategory = 'employee_workspace' | 'technical_support_console' | 'operations_and_management' | 'system_admin_control' | 'external_components';

export interface DelegationRule {
  allow_override: boolean;
  delegated_to?: string;
}

export interface CascadingCeilingConfig {
  allowedRoles: CoreRole[];
  adminAbsoluteOverride: boolean;
}

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

const initialComponents: UIComponentDefinition[] = [
  // ─── [المرسل - Employee Workspace] ───
  { id: 'ticket_create', name: 'مكون إرسال وتوجيه الطلبات', category: 'employee_workspace', isActive: true, target_zone: 'Main_Viewport', properties: { destinationRoutes: [] } },
  { id: 'ticket_inbox', name: 'لوحة استعراض التذاكر المرسلة', category: 'employee_workspace', isActive: true, target_zone: 'Main_Viewport', properties: { showStatusBadges: true, allowCancellation: false } },

  // ─── [الاستقبال - Technical Support Console] ───
  { id: 'admin_operational_console', name: 'لوحة التذاكر الواردة متعددة التبويبات', category: 'technical_support_console', isActive: true, target_zone: 'Main_Viewport', properties: { tabsConfig: { NEW: true, IN_PROGRESS: true, PENDING: true, CLOSED: true }, routingScope: 'INTERNAL_TEAM', allowedCrossEscalationRoles: ['OPERATIONAL_MANAGER', 'SECTION_HEAD'], snatchingGovernance: true, activeConsoleTabs: ['NEW', 'IN_PROGRESS'], autoEscalationTimeMinutes: 30 } },
  { id: 'engineer_live_status', name: 'لوحة الحالة الحية للمهندسين', category: 'technical_support_console', isActive: false, target_zone: 'Main_Viewport', properties: { mapIntegration: false, autoRefreshSeconds: 30 } },
  { id: 'quick_actions_panel', name: 'لوحة الإجراءات السريعة', category: 'technical_support_console', isActive: false, target_zone: 'Main_Viewport', properties: { enableOneClickClose: false, escalateToManager: true, enableHandshakeTransfer: true, enableDependencyLock: true } },

  // ─── [الإدارة والتحليل - Operations & Management] ───
  { id: 'admin_analytics', name: 'Performance Analytics (Unified Smart Analytics)', category: 'operations_and_management', isActive: true, target_zone: 'Main_Viewport', properties: { activeCharts: ['kpi_cards', 'bar_chart'], dateRangeEnabled: true, managerAnalyticsControl: { allowEngineerDrilldown: true, allowLocationFilter: true, allowTaxonomyFilter: true }, adminOverride: false, enabledDimensions: ['GEO', 'STRUCT', 'TAXONOMY', 'TIME'], dataScope: 'TEAM', filterDestDept: 'IT' } },


  // ─── [الحوكمة والآدمن - System Admin Control] ───
  { id: 'system_audit_logs', name: 'سجل العمليات والأمان الشامل', category: 'system_admin_control', isActive: false, target_zone: 'Main_Viewport', properties: { logRetentionDays: 90, trackLogins: true } },
  { id: 'global_settings', name: 'الإعدادات العامة والربط الشبكي', category: 'system_admin_control', isActive: false, target_zone: 'Main_Viewport', properties: { defaultLanguage: 'ar', enableSSO: true } }
];

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: 'transparent',
    color: '#1D1D1F',
    padding: '0',
    fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
    direction: 'rtl' as const,
    boxSizing: 'border-box' as const,
  },
  header: {
    marginBottom: '24px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    paddingBottom: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1D1D1F',
    margin: 0,
    marginBottom: '4px',
    letterSpacing: '-0.4px'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6E6E73',
    margin: 0
  },
  saveBtn: {
    background: '#5856D6',
    color: '#ffffff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(88, 86, 214, 0.35)',
    transition: 'all 0.2s ease',
    fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif",
  },
  masterGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    height: 'calc(100vh - 120px)'
  },
  glassBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
    transition: 'all 0.25s ease'
  },
  boxHeader: {
    backgroundColor: '#F5F5F7',
    padding: '14px 18px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    textAlign: 'start' as const
  },
  boxTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: '#1D1D1F',
    letterSpacing: '-0.1px'
  },
  boxSub: {
    margin: '3px 0 0 0',
    fontSize: '11px',
    color: '#6E6E73'
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 120px)',
    padding: '10px',
  },
  item: {
    backgroundColor: '#F5F5F7',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1D1D1F',
    transition: 'all 0.2s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  },
  itemActive: {
    border: '1px solid rgba(88, 86, 214, 0.35)',
    backgroundColor: 'rgba(88, 86, 214, 0.06)',
    boxShadow: '0 0 0 3px rgba(88, 86, 214, 0.08)'
  },
  propBox: {
    backgroundColor: '#F5F5F7',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.07)',
    minWidth: '200px',
    flex: '0 0 auto'
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '8px',
    color: '#1D1D1F',
    padding: '9px 12px',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    marginTop: '6px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif",
  },
  switchTrue: {
    width: '44px',
    height: '26px',
    background: '#34C759',
    borderRadius: '13px',
    position: 'relative' as const,
    cursor: 'pointer',
    boxShadow: '0 0 8px rgba(52, 199, 89, 0.35)',
    transition: 'background 0.25s ease'
  },
  switchFalse: {
    width: '44px',
    height: '26px',
    backgroundColor: '#E5E5EA',
    borderRadius: '13px',
    position: 'relative' as const,
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.25s ease'
  },
  knobTrue: {
    width: '20px', height: '20px', backgroundColor: '#ffffff', borderRadius: '50%',
    position: 'absolute' as const, top: '3px', right: '21px', transition: 'right 0.25s cubic-bezier(0.28, 0.11, 0.32, 1)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
  },
  knobFalse: {
    width: '20px', height: '20px', backgroundColor: '#ffffff', borderRadius: '50%',
    position: 'absolute' as const, top: '3px', right: '3px', transition: 'right 0.25s cubic-bezier(0.28, 0.11, 0.32, 1)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
  }
};


const propertyLabelsAr: Record<string, string> = {
  isEscalated: 'تم التصعيد',
  escalatedTo: 'جهة التصعيد',
  dateRangeEnabled: 'تفعيل نطاق التاريخ',
  allowedScope: 'النطاق المسموح به',
  routingFilters: 'فلاتر التوجيه',
  injectedFieldForComparison: 'حقل المقارنة المحقون',
  forceWhatsApp: 'تفعيل إشعارات واتساب',
  isToastEnabled: 'تفعيل التنبيهات المنبثقة (Toast)',
  isBellEnabled: 'تفعيل أيقونة الجرس',
  toggleTicketComplete: 'تنبيه اكتمال التذكرة',
  toggleReassignment: 'تنبيه إعادة الإسناد',
  toggleExternalTransfer: 'تنبيه التحويل الخارجي',
  toggleSubTicketCreation: 'تنبيه إنشاء تذكرة فرعية',
  subordinatePerformanceAlerts: 'تنبيهات أداء المرؤوسين',
  incomingTicketWatch: 'مراقبة التذاكر الواردة',
  slaDelayMinutes: 'دقائق التأخير المسموحة لـ SLA',
  inApp: 'إشعارات داخل التطبيق',
  office365Email: 'تفعيل بريد Office 365',
  emergencyWhatsApp: 'واتساب الطوارئ',
  itemDefinitionAuthority: 'صلاحية تعريف المواد',
  flexibleApprovalChain: 'سلسلة الاعتماد المرنة',
  allowManagerToEnforceRules: 'السماح للمدير بفرض القواعد',
  enableGranularPolicyAssignment: 'تفعيل تخصيص السياسات الدقيق',
  enableAssetLineageTracking: 'تتبع مسار الأصول',
  allowAdvancedReportExport: 'السماح بالتصدير المتقدم للتقارير',
  reportVisibilityScope: 'نطاق رؤية التقارير',
  routingStrategy: 'استراتيجية التوجيه',
  isDelegated: 'مفوض',
  notificationType: 'نوع الإشعار',
  intervalReminder: 'مدة التذكير (ثواني)',
  eventTypeBinding: 'ربط نوع الحدث',
  defaultSlaMinutes: 'دقائق SLA الافتراضية',
  IsEscalationEnabled: 'تفعيل التصعيد',
  EscalationTargetRole: 'دور هدف التصعيد',
  linkedRole: 'الدور المرتبط',
  CanTransfer: 'صلاحية التحويل',
  CanClose: 'صلاحية الإغلاق',
  endpoint: 'رابط النهاية (Endpoint)',
  allowPublicAccess: 'السماح بالوصول العام',
  requireApprovalToPublish: 'يتطلب موافقة للنشر',
  exportFormats: 'صيغ التصدير',
  autoSchedule: 'جدولة تلقائية',
  allowNestedFields: 'السماح بالحقول المتداخلة',
  maxFieldsPerEntity: 'الحد الأقصى للحقول لكل كيان',
  aiModel: 'نموذج الذكاء الاصطناعي',
  knowledgeBaseSync: 'مزامنة قاعدة المعرفة',
  autoReplyTickets: 'رد تلقائي على التذاكر',
  maxInMemory: 'الحد الأقصى بالذاكرة',
  appendOnly: 'إضافة فقط (Append Only)'
};


export type CoreRole = 'END_USER' | 'OPERATIONAL_USER' | 'TEAM_LEADER' | 'SECTION_HEAD' | 'OPERATIONAL_MANAGER' | 'IT_ADMIN';

export interface SavedInterface {
  id: string;
  name: string;
  interfaceType: 'FUNCTIONAL' | 'OPERATIONAL'; // Added for functional vs operational split
  roleType?: CoreRole | string; // Optional for functional
  lastUpdated: string;
  associated_dept?: string;
  associated_section?: string;
  associated_team?: string | null;
}

export interface SubmissionTemplate {
  id: string;
  name: string;
  components: any[]; // UIComponentDefinition[]
  lastUpdated: string;
  isDefault?: boolean;
}

export interface RoleToTemplateMapping {
  role: CoreRole;
  templateId: string;
}





const useCascadingCeilingValidator = (builderRole: CoreRole) => {
  const isPropertyAllowed = (propKey: string, componentCeiling: Record<string, CascadingCeilingConfig> | undefined) => {
    if (builderRole === 'IT_ADMIN') return true;
    
    if (!componentCeiling || !componentCeiling[propKey]) {
      return true; // Unrestricted
    }

    const ceiling = componentCeiling[propKey];
    if (ceiling.adminAbsoluteOverride) {
      return false; // Locked by Admin
    }

    if (ceiling.allowedRoles && !ceiling.allowedRoles.includes(builderRole)) {
      return false; // Builder role is not explicitly authorized
    }

    return true;
  };
  return { isPropertyAllowed };
};


export interface CorporateLocation {
  id: string;
  buildingName: string;
  offices: { id: string; name: string }[];
}

export function UILayoutEngineTab({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const [corporateLocations, setCorporateLocations] = useState<CorporateLocation[]>([
    {
      id: 'hq',
      buildingName: 'المقر الرئيسي (HQ)',
      offices: [
        { id: 'hq_it', name: 'إدارة تقنية المعلومات' },
        { id: 'hq_hr', name: 'الموارد البشرية' },
        { id: 'hq_finance', name: 'الإدارة المالية' }
      ]
    },
    {
      id: 'misurata',
      buildingName: 'فرع مصراتة',
      offices: [
        { id: 'mis_ops', name: 'العمليات' },
        { id: 'mis_support', name: 'الدعم الفني' }
      ]
    }
  ]);
  const [selectedBuildingForPreview, setSelectedBuildingForPreview] = useState<string>('');
  const [components, setComponents] = useState<UIComponentDefinition[]>(() => {
    const saved = localStorage.getItem('litc_layout_components');
    try {
      return saved ? JSON.parse(saved) : initialComponents;
    } catch (e) {
      return initialComponents;
    }
  });
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [showAdvancedComponents, setShowAdvancedComponents] = useState(false);

  // --- Dynamic Ticket Routes (from TicketRoutingTab) ---
  const [savedRoutes, setSavedRoutes] = useState<TicketRouteDefinition[]>(() => loadRoutes());
  useEffect(() => {
    const refreshRoutes = () => setSavedRoutes(loadRoutes());
    window.addEventListener('storage', refreshRoutes);
    return () => window.removeEventListener('storage', refreshRoutes);
  }, []);

  // --- Repository Scroll Helper ---
  const repositoryRef = React.useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  React.useEffect(() => {
    const repo = repositoryRef.current;
    if (!repo) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        repo.scrollLeft += e.deltaY;
      }
    };

    repo.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      repo.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleScrollRepo = (direction: 'right' | 'left') => {
    if (repositoryRef.current) {
      const amount = direction === 'left' ? -250 : 250;
      repositoryRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleRepoScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const total = target.scrollWidth - target.clientWidth;
    if (total > 0) {
      // Handle RTL scrollLeft values (which can be negative in some environments)
      const percent = (Math.abs(target.scrollLeft) / total) * 100;
      setScrollPercent(Math.min(100, Math.max(0, percent)));
    }
  };

  // --- Cascading Override State ---
  const [currentBuilderRole, setCurrentBuilderRole] = useState<CoreRole>('IT_ADMIN');
  const { isPropertyAllowed } = useCascadingCeilingValidator(currentBuilderRole);

  // --- Submission Templates & Builder Modes ---
  const [builderMode, setBuilderMode] = useState<'OPERATIONAL' | 'SUBMISSION_TEMPLATE'>('OPERATIONAL');
  
  const loadSubmissionTemplates = (): SubmissionTemplate[] => {
    try {
      const data = localStorage.getItem('SUBMISSION_TEMPLATES_SCHEMA');
      if (data) return JSON.parse(data);
    } catch(e) {}
    return [{
      id: 'template_standard_1',
      name: 'القالب القياسي (Standard)',
      lastUpdated: new Date().toISOString(),
      isDefault: true,
      components: [] // will be filled or kept empty meaning default fallback
    }];
  };

  const loadRoleTemplateMappings = (): RoleToTemplateMapping[] => {
    try {
      const data = localStorage.getItem('ROLE_SUBMISSION_MAPPINGS');
      if (data) return JSON.parse(data);
    } catch(e) {}
    return [];
  };

  const [submissionTemplates, setSubmissionTemplates] = useState<SubmissionTemplate[]>(loadSubmissionTemplates);
  const [roleTemplateMappings, setRoleTemplateMappings] = useState<RoleToTemplateMapping[]>(loadRoleTemplateMappings);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('template_standard_1');

  // When saving submission templates
  useEffect(() => {
    localStorage.setItem('SUBMISSION_TEMPLATES_SCHEMA', JSON.stringify(submissionTemplates));
  }, [submissionTemplates]);

  useEffect(() => {
    localStorage.setItem('ROLE_SUBMISSION_MAPPINGS', JSON.stringify(roleTemplateMappings));
  }, [roleTemplateMappings]);


  // --- Interactive Live Sandbox States ---
  const [previewRole, setPreviewRole] = useState<string>('Super_Admin');
  const [previewSelectedRouteId, setPreviewSelectedRouteId] = useState<string | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = useState<string>('');
  const [previewDynamicFields, setPreviewDynamicFields] = useState<any[]>([]);
  const [previewDesc, setPreviewDesc] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [simulatorViewMode, setSimulatorViewMode] = useState<'stack' | 'tabs'>('stack');
  const [simulatorActiveTab, setSimulatorActiveTab] = useState<string>('');

  // --- External Systems (UECP) Fetch ---
  useEffect(() => {
    const fetchExternalSystems = async () => {
      try {
        const res = await fetch('/admin/uecp/systems', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('litc_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          const systems = data.data || [];
          
          setComponents(prev => {
            const externalComps: UIComponentDefinition[] = systems.map((sys: any) => {
              let parsedProps = {};
              try {
                const parsedManifest = JSON.parse(sys.manifestData);
                parsedProps = parsedManifest.uiSchema?.configurableProps || {};
              } catch (e) {
                console.error("Failed to parse manifestData for", sys.systemName);
              }
              return {
                id: `ext_${sys.id}`,
                name: sys.systemName,
                category: 'external_components' as ComponentCategory,
                isActive: false,
                target_zone: 'Main_Viewport',
                properties: parsedProps
              };
            });
            
            // Add external components if they don't already exist in the state
            const newPrev = [...prev];
            externalComps.forEach(extComp => {
              if (!newPrev.find(c => c.id === extComp.id)) {
                newPrev.push(extComp);
              }
            });
            return newPrev;
          });
        }
      } catch (err) {
        console.error('Failed to fetch external systems', err);
      }
    };
    fetchExternalSystems();
  }, []);



  // --- Landing Manager State ---
  const mockOrgStructure = [
    {
      id: 'dept_it',
      name: 'إدارة تقنية المعلومات',
      sections: [
        { id: 'sec_net', name: 'قسم الشبكات', teams: [{ id: 'team_net_ops', name: 'عمليات الشبكة' }, { id: 'team_net_sec', name: 'أمن الشبكات' }] },
        { id: 'sec_sup', name: 'قسم الدعم الفني', teams: [{ id: 'team_helpdesk', name: 'مكتب المساعدة' }] }
      ]
    },
    {
      id: 'dept_hr',
      name: 'إدارة الموارد البشرية',
      sections: [
        { id: 'sec_rec', name: 'قسم التوظيف', teams: [] }
      ]
    }
  ];

  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const [isManagerMode, setIsManagerMode] = useState<boolean>(true);
  const [showSavedList, setShowSavedList] = useState<boolean>(false);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [interfaceName, setInterfaceName] = useState<string>('');
  
  const [interfaceCategory, setInterfaceCategory] = useState<CoreRole | null>(null);
  const [managementLevel, setManagementLevel] = useState<string>('');
  const [showSaveReportModal, setShowSaveReportModal] = useState<boolean>(false);
  const [interfaceToLoad, setInterfaceToLoad] = useState<SavedInterface | null>(null);

  // --- Confirm Save Handler ---
  const handleConfirmSave = () => {
    if (builderMode === 'SUBMISSION_TEMPLATE') {
      setSubmissionTemplates(prev => {
        const existing = prev.find(t => t.id === currentTemplateId);
        if (existing) {
          return prev.map(t => t.id === currentTemplateId ? { ...t, components, lastUpdated: new Date().toISOString() } : t);
        } else {
          return [...prev, { id: currentTemplateId, name: interfaceName || currentTemplateId, components, lastUpdated: new Date().toISOString() }];
        }
      });
    } else {
      const activeInterface = savedInterfaces.find(ui => ui.name === interfaceName) || { id: 'ui_' + (interfaceCategory || 'default'), roleType: interfaceCategory || 'IT_ADMIN' };
      localStorage.setItem(`litc_layout_components_${activeInterface.id}`, JSON.stringify(components));
      localStorage.setItem(`litc_layout_components_${activeInterface.roleType}`, JSON.stringify(components));
      localStorage.setItem('litc_layout_components', JSON.stringify(components));
    }
    setShowSaveReportModal(false);
    setIsManagerMode(true);
    
    // Auto-return navigation if requested
    const returnPath = localStorage.getItem('litc_ui_return_path');
    if (returnPath && onNavigateToTab) {
      localStorage.removeItem('litc_ui_return_path');
      onNavigateToTab(returnPath);
    }
  };
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [savedInterfaces, setSavedInterfaces] = useState<SavedInterface[]>(() => {
    try {
      const saved = localStorage.getItem('litc_saved_interfaces');
      if (saved) {
        let parsed = JSON.parse(saved);
        parsed = parsed.map((ui: any) => ({
          ...ui,
          interfaceType: ui.interfaceType || (ui.roleType === 'BASE_SUBMISSION' ? 'FUNCTIONAL' : 'OPERATIONAL')
        }));
        return parsed;
      }
    } catch(e) {}
    
    return [
      { id: 'MAIN_SUBMISSION_INTERFACE', name: 'واجهة الارسال الرئيسية', roleType: 'BASE_SUBMISSION', interfaceType: 'FUNCTIONAL', lastUpdated: new Date().toISOString().split('T')[0] },
      { id: 'ui_5', name: 'واجهة السوبر أدمن', roleType: 'IT_ADMIN', interfaceType: 'OPERATIONAL', lastUpdated: '2023-10-05' },
      { id: 'ui_op_manager', name: 'م. مجدي الزروق (مدير إدارة)', roleType: 'OPERATIONAL_MANAGER', interfaceType: 'OPERATIONAL', lastUpdated: new Date().toISOString().split('T')[0] },
      { id: 'ui_sec_head', name: 'أحمد النكوع (رئيس قسم)', roleType: 'SECTION_HEAD', interfaceType: 'OPERATIONAL', lastUpdated: new Date().toISOString().split('T')[0] },
      { id: 'ui_team_lead', name: 'نضال أبو غامجة (رئيس فريق)', roleType: 'TEAM_LEADER', interfaceType: 'OPERATIONAL', lastUpdated: new Date().toISOString().split('T')[0] },
      { id: 'ui_op_user', name: 'محمد الزياني (مستخدم تشغيلي)', roleType: 'OPERATIONAL_USER', interfaceType: 'OPERATIONAL', lastUpdated: new Date().toISOString().split('T')[0] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('litc_saved_interfaces', JSON.stringify(savedInterfaces));
  }, [savedInterfaces]);



  const handleLoadInterface = (ui: SavedInterface) => {
    const loadData = () => {
      setInterfaceName(ui.name);
      setInterfaceCategory(ui.roleType);
      const key = `litc_layout_components_${ui.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setComponents(JSON.parse(saved));
      } else {
        const roleSaved = localStorage.getItem(`litc_layout_components_${ui.roleType}`);
        if (roleSaved) {
            setComponents(JSON.parse(roleSaved));
        } else {
            setComponents(ui.roleType === 'IT_ADMIN' ? initialComponents : initialComponents.map(c => ({...c, isActive: false})));
        }
      }
      setIsManagerMode(false);
    };

    if (!isManagerMode && interfaceName && interfaceName.trim() !== '' && interfaceName !== ui.name) {
      setInterfaceToLoad(ui);
      setShowWarningModal(true);
    } else {
      loadData();
    }
  };

  useEffect(() => {
    // Load dynamic fields from local storage for the Sandbox
    const savedFields = localStorage.getItem('litc_dynamic_fields');
    if (savedFields) {
      try {
        setPreviewDynamicFields(JSON.parse(savedFields));
      } catch (e) {
        console.error('Failed to parse dynamic fields for sandbox');
      }
    }
  }, []);
  // ----------------------------------------

  const inactiveComponents = [...components.filter(c => !c.isActive)].sort((a, b) => a.category.localeCompare(b.category));
  const activeComponents = components.filter(c => c.isActive);
  const selectedComponent = components.find(c => c.id === selectedComponentId);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId !== destination.droppableId) {
      const isActivating = destination.droppableId === 'active-canvas';
      setComponents(prev => prev.map(c => {
        if (c.id === result.draggableId) {
          return { ...c, isActive: isActivating };
        }
        return c;
      }));
      if (isActivating) {
        setPreviewActiveTab(result.draggableId);
        setSelectedComponentId(result.draggableId);
      } else {
        if (selectedComponentId === result.draggableId) {
          setSelectedComponentId(null);
        }
        if (previewActiveTab === result.draggableId) {
          setPreviewActiveTab('');
        }
      }
      return;
    }

    if (source.droppableId === 'active-canvas' && destination.droppableId === 'active-canvas') {
      const items = Array.from(activeComponents);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const newComponents = [
        ...components.filter(c => !c.isActive),
        ...items
      ];
      setComponents(newComponents);
    }
  };

    const handlePropertyChange = (compId: string, key: string, value: any) => {
    setComponents(prev => prev.map(c => {
      if (c.id === compId) {
        return { ...c, properties: { ...c.properties, [key]: value } };
      }
      return c;
    }));
  };



  if (isManagerMode) {
    return (
      <LayoutEngineLanding 
         savedInterfaces={savedInterfaces}
         setSavedInterfaces={setSavedInterfaces as any}
         handleLoadInterface={handleLoadInterface}
         handleDeleteInterface={(id) => setSavedInterfaces(prev => prev.filter(ui => ui.id !== id))}
         onStartNewLayout={(payload) => {
            setInterfaceName(payload.name);
            setInterfaceCategory(payload.roleType as CoreRole);
            setComponents(prev => {
              const exts = prev.filter(c => c.category === 'external_components');
              const inits = initialComponents.map(c => ({...c, isActive: false}));
              const combined = [...inits];
              exts.forEach(e => {
                if (!combined.find(x => x.id === e.id)) {
                  combined.push({...e, isActive: false});
                }
              });
              return combined;
            });
            setIsManagerMode(false);
         }}
      />
    );
  }

  return (
    <>
      <div style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif", color: '#1D1D1F', filter: showNameModal ? 'blur(8px)' : 'none', pointerEvents: showNameModal ? 'none' : 'auto', transition: 'filter 0.3s ease' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #5856D6, #AF52DE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 12px rgba(88,86,214,0.3)' }}>⚡</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1D1D1F', margin: 0, letterSpacing: '-0.3px' }}>
                  {interfaceName || 'واجهة جديدة'}
                </h2>
                {interfaceCategory === 'IT_ADMIN' && <span style={{ fontSize: '11px', fontWeight: '700', background: '#FFF1F0', color: '#FF3B30', padding: '2px 8px', borderRadius: '6px', border: '1px solid #FECACA' }}>مسؤول النظام</span>}
                {interfaceCategory === 'OPERATIONAL_MANAGER' && <span style={{ fontSize: '11px', fontWeight: '700', background: '#FFFBEB', color: '#FF9500', padding: '2px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>مسؤول تشغيلي</span>}
                {interfaceCategory === 'OPERATIONAL_USER' && <span style={{ fontSize: '11px', fontWeight: '700', background: '#EFF6FF', color: '#007AFF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>مستخدم تشغيلي</span>}
                {interfaceCategory === 'END_USER' && <span style={{ fontSize: '11px', fontWeight: '700', background: '#F0FDF4', color: '#34C759', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>مستخدم عادي</span>}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6E6E73', marginTop: '2px' }}>مسرح تخصيص مكونات الواجهة وخصائصها</p>
            </div>
            <button
              onClick={() => setShowNameModal(true)}
              style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.08)', color: '#1D1D1F', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(88,86,214,0.07)'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#F5F5F7'}
            >
              ✏️ تعديل الاسم
            </button>
            
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setIsManagerMode(true); setShowSavedList(true); }}
              style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.08)', color: '#1D1D1F', padding: '9px 16px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#EBEBEB'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#F5F5F7'}
            >
              ← مدير الواجهات
            </button>
            <button onClick={() => setShowSaveReportModal(true)} style={{ ...styles.saveBtn, fontFamily: 'inherit' }}>حفظ التوزيع</button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '16px', height: 'calc(100vh - 160px)', width: '100%', position: 'relative' }}>
            {/* ── RIGHT COLUMN (RTL Col 1): Repository + Active Mapped Components ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
              {/* Component Repository */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden', flex: 1, minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                <style>{`
                  .inactive-repo-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                  }
                  .inactive-repo-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.02);
                    border-radius: 3px;
                  }
                  .inactive-repo-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(88, 86, 214, 0.25);
                    border-radius: 3px;
                    transition: background 0.2s;
                  }
                  .inactive-repo-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(88, 86, 214, 0.45);
                  }
                `}</style>
                <div style={{ padding: '12px 16px', background: '#F5F5F7', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5856D6' }}></div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D1D1F' }}>مستودع المكونات</span>
                  <span style={{ fontSize: '11px', color: '#AEAEB2', marginInlineStart: 'auto' }}>اسحب للتفعيل ←</span>
                </div>

                <Droppable droppableId="inactive-repository">
                  {(provided, snapshot) => (
                    <div
                      ref={(el) => {
                        provided.innerRef(el);
                        (repositoryRef as any).current = el;
                      }}
                      {...provided.droppableProps}
                      onScroll={handleRepoScroll}
                      className="inactive-repo-scrollbar"
                      style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '10px', overflowX: 'auto', overflowY: 'auto', padding: '12px 16px', backgroundColor: snapshot.isDraggingOver ? 'rgba(88,86,214,0.03)' : 'transparent', flex: 1 }}
                    >
                      {[
                        { key: 'employee_workspace', label: 'المرسل - Employee Workspace', color: '#34C759', icon: '📝' },
                        { key: 'technical_support_console', label: 'الاستقبال - Technical Support Console', color: '#007AFF', icon: '🛠' },
                        { key: 'operations_and_management', label: 'الإدارة والتحليل - Operations & Management', color: '#FF9500', icon: '📊' },
                        { key: 'system_admin_control', label: 'الحوكمة والآدمن - System Admin Control', color: '#FF3B30', icon: '🛡' },
                        { key: 'external_components', label: 'المكونات الخارجية - External Components', color: '#8B5CF6', icon: '🔌' }
                      ].filter(group => {
                          if (showAdvancedComponents) return true;
                          if (interfaceCategory === 'END_USER' || interfaceCategory === 'BASE_SUBMISSION') {
                            return group.key === 'employee_workspace';
                          }
                          if (interfaceCategory === 'OPERATIONAL_USER' || interfaceCategory === 'TEAM_LEADER' || interfaceCategory === 'SECTION_HEAD') {
                            return ['employee_workspace', 'technical_support_console'].includes(group.key);
                          }
                          if (interfaceCategory === 'OPERATIONAL_MANAGER' || interfaceCategory === 'IT_ADMIN') {
                            return true; // Managers and Admins can see everything
                          }
                          // Fallback
                          return true;
                        }).map(group => {
                        const groupComponents = inactiveComponents.filter(c => c.category === group.key);
                        if (groupComponents.length === 0) return null;
                        return (
                           <div key={group.key} style={{ flex: '0 0 180px', minHeight: '100%', background: '#F5F5F7', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '8px 10px', background: `${group.color}10`, borderBottom: `1px solid ${group.color}18`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px' }}>{group.icon}</span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: group.color }}>{group.label}</span>
                              <span style={{ fontSize: '11px', color: '#AEAEB2', marginInlineStart: 'auto', background: '#FFFFFF', borderRadius: '10px', padding: '1px 6px', border: `1px solid ${group.color}20` }}>{groupComponents.length}</span>
                            </div>
                            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {groupComponents.map((comp) => {
                                const globalIndex = inactiveComponents.findIndex(c => c.id === comp.id);
                                return (
                                  <Draggable key={comp.id} draggableId={comp.id} index={globalIndex}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{
                                          background: snapshot.isDragging ? '#FFFFFF' : '#FFFFFF',
                                          border: snapshot.isDragging ? `1px solid ${group.color}60` : '1px solid rgba(0,0,0,0.07)',
                                          borderRadius: '8px',
                                          padding: '8px 10px',
                                          fontSize: '12px',
                                          fontWeight: '500',
                                          color: '#1D1D1F',
                                          cursor: 'grab',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          boxShadow: snapshot.isDragging ? `0 8px 24px rgba(0,0,0,0.12), 0 0 0 2px ${group.color}30` : '0 1px 2px rgba(0,0,0,0.04)',
                                          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                                          ...provided.draggableProps.style,
                                        }}
                                      >
                                        <span style={{ color: group.color, fontSize: '10px', flexShrink: 0 }}>⋮⋮</span>
                                        <span style={{ lineHeight: 1.3 }}>{comp.name}</span>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
              
              {/* Modern Dynamic Navigation Panel (Active Components Sidebar) - Outside device frame */}
              <div style={{ width: '100%', flex: 1, minHeight: '150px', overflowY: 'auto', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} className="admin-scroll">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px', paddingLeft: '8px' }}>
              <span style={{ fontSize: '11px', color: '#6E6E73', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>المكونات النشطة</span>
              <span style={{ fontSize: '10px', background: '#E5E5EA', color: '#6E6E73', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{activeComponents.length}</span>
            </div>
            
            <Droppable droppableId="active-canvas">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px', backgroundColor: snapshot.isDraggingOver ? 'rgba(88,86,214,0.04)' : 'transparent', borderRadius: '16px', transition: 'all 0.3s', overflowY: 'auto' }}
                  className="scrollbar-thin"
                >
                  {activeComponents.map((c, index) => (
                    <Draggable key={c.id} draggableId={c.id} index={index}>
                      {(provided, snapshot) => {
                        const isActive = previewActiveTab === c.id;
                        return (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => { setPreviewActiveTab(c.id); setSelectedComponentId(c.id); }}
                            style={{
                              padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                              background: isActive ? '#FFFFFF' : snapshot.isDragging ? '#FFFFFF' : 'transparent',
                              color: isActive ? '#1D1D1F' : '#6E6E73',
                              border: isActive ? '1px solid rgba(88,86,214,0.15)' : '1px solid transparent',
                              boxShadow: isActive ? '0 4px 14px rgba(88,86,214,0.08)' : snapshot.isDragging ? '0 12px 24px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                              transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                              fontWeight: isActive ? '700' : '600',
                              fontSize: '13px',
                              ...provided.draggableProps.style
                            }}
                            onMouseEnter={(e) => { if (!isActive && !snapshot.isDragging) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
                            onMouseLeave={(e) => { if (!isActive && !snapshot.isDragging) e.currentTarget.style.background = 'transparent' }}
                          >
                            <div style={{ 
                              width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                              background: isActive ? 'linear-gradient(135deg, #5856D6, #AF52DE)' : '#F5F5F7',
                              color: isActive ? '#FFF' : '#8E8E93',
                              boxShadow: isActive ? '0 2px 8px rgba(88,86,214,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                              transition: 'all 0.3s'
                            }}>
                              {c.category === 'employee_workspace' ? '📝' : c.category === 'technical_support_console' ? '🛠' : c.category === 'operations_and_management' ? '📊' : '🛡'}
                            </div>
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                            {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5856D6', boxShadow: '0 0 6px rgba(88,86,214,0.5)' }}></div>}
                          </div>
                        );
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
            
              
              {/* ── Inspector Panel ── */}
              <div style={{ ...styles.glassBox, flex: 2, minHeight: '300px', overflow: 'hidden' }}>
                <div style={{ ...styles.boxHeader, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#AF52DE' }}></div>
                  <h3 style={{ ...styles.boxTitle, color: '#5856D6' }}>خصائص المكون (Inspector)</h3>
                  <p style={{ ...styles.boxSub, marginTop: 0, marginInlineStart: 'auto' }}>حدد مكوناً للتعديل</p>
                </div>
                <div style={{ ...styles.scrollArea, padding: '16px' }} className="admin-scroll">
                  {selectedComponent ? (
                    <div>
                      <div style={{ background: 'linear-gradient(135deg, rgba(88,86,214,0.06), rgba(175,82,222,0.06))', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(88,86,214,0.12)' }}>
                        <div style={{ fontSize: '10px', color: '#AEAEB2', marginBottom: '3px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>المعرف</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5856D6', marginBottom: '10px' }}>{selectedComponent.id}</div>
                        <div style={{ fontSize: '10px', color: '#AEAEB2', marginBottom: '3px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>الاسم</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1D1D1F' }}>{selectedComponent.name}</div>
                      </div>

                  {/* CUSTOM PANELS */}
                  {selectedComponent.id === 'admin_sovereign_custody_ledger_v10' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>الفلاتر التشغيلية المتاحة لتوليد التقارير:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'BY_ITEM_TYPE', label: 'فرز حسب الصنف الفردي أو المجموعات' },
                          { id: 'BY_DATE_RANGE', label: 'فرز حسب النطاق الزمني والتاريخ' },
                          { id: 'BY_TARGET_TICKET', label: 'فرز برقم التذكرة أو المهمة التشغيلية' },
                          { id: 'BY_JUSTIFICATION_REASON', label: 'فرز حسب مبررات وأسباب الصرف' }
                        ].map(filter => {
                          const filters = selectedComponent.properties.allowedReportFilters || [];
                          const isChecked = filters.includes(filter.id);
                          return (
<>{isPropertyAllowed("allowedReportFilters", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={filter.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={e => {
                                  let newFilters = [...filters];
                                  if (e.target.checked) newFilters.push(filter.id);
                                  else newFilters = newFilters.filter((f: string) => f !== filter.id);
                                  handlePropertyChange(selectedComponent.id, 'allowedReportFilters', newFilters);
                                }} 
                              />
                              {filter.label}
                            </label>
</div>
)}</>
                          );
                        })}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>أعمدة البيانات المسموح بظهورها في التقرير:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'SHOW_ISSUER_IDENTITY', label: 'عرض هوية المسؤول المفوِّض للصرف' },
                          { id: 'SHOW_RECEIVER_IDENTITY', label: 'عرض هوية الموظف المستلم الفعلي' },
                          { id: 'SHOW_EXACT_TIMESTAMP', label: 'عرض الوقت والتاريخ الفعلي بالثانية' },
                          { id: 'SHOW_VERIFICATION_STATUS', label: 'عرض حالة وموثوقية إجراء الصرف' }
                        ].map(col => {
                          const columns = selectedComponent.properties.allowedReportColumns || [];
                          const isChecked = columns.includes(col.id);
                          return (
<>{isPropertyAllowed("allowedReportColumns", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={e => {
                                  let newCols = [...columns];
                                  if (e.target.checked) newCols.push(col.id);
                                  else newCols = newCols.filter((c: string) => c !== col.id);
                                  handlePropertyChange(selectedComponent.id, 'allowedReportColumns', newCols);
                                }} 
                              />
                              {col.label}
                            </label>
</div>
)}</>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_archive Inspector ═══ */}
                  {selectedComponent.id === 'admin_archive' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص الأرشيف المركزي:</h5>
                      
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
<>{isPropertyAllowed("enableTimelineAuditLog", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.enableTimelineAuditLog || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'enableTimelineAuditLog', e.target.checked)} />
                          تفعيل شريط السجل التاريخي المتكامل (Timeline Audit Log) 📜
                        </label>
</div>
)}</>
<>{isPropertyAllowed("enableHistoricalExport", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.enableHistoricalExport || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'enableHistoricalExport', e.target.checked)} />
                          تفعيل زر تصدير التقارير التاريخية (Excel/PDF) 📥
                        </label>
</div>
)}</>
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>فلاتر الأرشيف المحقونة بالواجهة:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'building_location', label: 'المبنى والموقع' },
                          { id: 'department', label: 'القسم' },
                          { id: 'issue_type', label: 'تصنيفات الأعطال الحرة (من localStorage)' }
                        ].map(filter => {
                          const filters = selectedComponent.properties.enabledUIFilters || [];
                          const isChecked = filters.includes(filter.id);
                          return (
<>{isPropertyAllowed("enabledUIFilters", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={filter.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={e => {
                                  let newFilters = [...filters];
                                  if (e.target.checked) newFilters.push(filter.id);
                                  else newFilters = newFilters.filter((f: string) => f !== filter.id);
                                  handlePropertyChange(selectedComponent.id, 'enabledUIFilters', newFilters);
                                }} 
                              />
                              {filter.label}
                            </label>
</div>
)}</>
                          );
                        })}
                      </div>
                    </div>
                  )}



                  {selectedComponent.id === 'ticket_inbox' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص وإعدادات تتبع الطلبات النشطة:</h5>
                      
                      

                      {/* 2. Timeline Visibility */}
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>تفاصيل رحلة الطلب للموظف:</h6>
                        <select 
                          style={styles.input} 
                          value={selectedComponent.properties.timelineVisibility || 'ALL_STEPS'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'timelineVisibility', e.target.value)}
                        >
                          <option value="ALL_STEPS">شفافية تامة (رؤية جميع التحويلات الداخلية)</option>
                          <option value="MAJOR_MILESTONES">محطات رئيسية فقط (إخفاء التحويلات الداخلية)</option>
                        </select>
                      </div>

                      {/* 3. Rating & Closure Governance */}
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>سياسة التقييم وإغلاق الطلب:</h6>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.requireRatingToClose ?? true} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'requireRatingToClose', e.target.checked)} />
                          إلزامية التقييم (لا يُغلق الطلب نهائياً حتى يتم التقييم) ⭐
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.preventNewTicketIfPendingRating ?? false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'preventNewTicketIfPendingRating', e.target.checked)} />
                          منع إنشاء طلب جديد في نفس المسار إذا كان هناك طلب ينتظر التقييم 🛡️
                        </label>
                      </div>

                      {/* 4. Cancellation */}
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>صلاحيات إضافية:</h6>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.allowCancellation ?? false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'allowCancellation', e.target.checked)} />
                          السماح للموظف بإلغاء الطلب (فقط عندما يكون في حالة 'جديد') ❌
                        </label>
                      </div>

                    </div>
                  )}

                  {selectedComponent.id === 'admin_operational_console' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>⚡ كونسول الاستقبال والتشغيل (Operational Console)</h5>
                      
                      {/* Views */}
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[{ id: 'TREE', label: 'شجري (Tree View)' }, { id: 'FLAT', label: 'مسطح (Flat View)' }].map(v => {
                          const views = selectedComponent.properties.allowedViews || [];
                          return (
                            <React.Fragment key={v.id}>
                              {isPropertyAllowed("allowedViews", selectedComponent.strict_ceiling_props) && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={views.includes(v.id)} onChange={e => {
                                      let nv = [...views];
                                      if (e.target.checked) nv.push(v.id); else nv = nv.filter((x: string) => x !== v.id);
                                      handlePropertyChange(selectedComponent.id, 'allowedViews', nv);
                                    }} />
                                    {v.label}
                                  </label>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* allowed cross escalation roles */}
                      <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                        <h6 style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>مصفوفة التصعيد الخارجي (Cross-Escalation):</h6>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { role: 'OPERATIONAL_MANAGER', label: 'مدير إدارة' },
                            { role: 'SECTION_HEAD', label: 'رئيس قسم' },
                            { role: 'TEAM_LEADER', label: 'رئيس فريق' },
                            { role: 'ENGINEER', label: 'مهندس / فني' }
                          ].map(r => (
                            <label key={r.role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', cursor: 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={(selectedComponent.properties.allowedCrossEscalationRoles || []).includes(r.role)}
                                onChange={e => {
                                    const currentRoles = selectedComponent.properties.allowedCrossEscalationRoles || [];
                                    if (e.target.checked) {
                                      handlePropertyChange(selectedComponent.id, 'allowedCrossEscalationRoles', [...currentRoles, r.role]);
                                    } else {
                                      handlePropertyChange(selectedComponent.id, 'allowedCrossEscalationRoles', currentRoles.filter((x: string) => x !== r.role));
                                    }
                                }}
                              />
                              {r.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* snatching power and drag-and-drop */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '12px', color: '#475569', display: 'block' }}>سحب التذاكر الجبري (Snatching Power)</span>
                          </div>
                          <div
                            style={selectedComponent.properties.snatchingGovernance ? styles.switchTrue : styles.switchFalse}
                            onClick={() => handlePropertyChange(selectedComponent.id, 'snatchingGovernance', !selectedComponent.properties.snatchingGovernance)}
                          >
                            <div style={selectedComponent.properties.snatchingGovernance ? styles.knobTrue : styles.knobFalse}></div>
                          </div>
                        </div>

                        {isPropertyAllowed("enableDragAndDrop", selectedComponent.strict_ceiling_props) && (
                          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '5px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={selectedComponent.properties.enableDragAndDrop || false}
                                onChange={e => handlePropertyChange(selectedComponent.id, 'enableDragAndDrop', e.target.checked)} />
                              تفعيل السحب والإفلات (Drag & Drop)
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* ═══ global_settings Inspector ═══ */}
                  {selectedComponent.id === 'global_settings' && currentBuilderRole === 'IT_ADMIN' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#8b5cf6', marginBottom: '15px' }}>🏢 إدارة مواقع الشركة (Corporate Location Assets)</h5>
                      
                      <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        {corporateLocations.map(location => (
                          <div key={location.id} style={{ marginBottom: '15px', padding: '10px', background: 'rgba(241,245,249,0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <input 
                                type="text" 
                                value={location.buildingName}
                                onChange={e => {
                                  const updated = corporateLocations.map(loc => loc.id === location.id ? { ...loc, buildingName: e.target.value } : loc);
                                  setCorporateLocations(updated);
                                }}
                                style={{ padding: '6px', background: 'transparent', border: 'none', color: '#c4b5fd', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                              />
                              <button onClick={() => setCorporateLocations(corporateLocations.filter(loc => loc.id !== location.id))} style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#fca5a5', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>حذف المبنى</button>
                            </div>
                            
                            <div style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              {location.offices.map(office => (
                                <div key={office.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ color: '#64748b' }}>└</span>
                                  <input 
                                    type="text"
                                    value={office.name}
                                    onChange={e => {
                                      const updated = corporateLocations.map(loc => {
                                        if (loc.id !== location.id) return loc;
                                        return {
                                          ...loc,
                                          offices: loc.offices.map(off => off.id === office.id ? { ...off, name: e.target.value } : off)
                                        };
                                      });
                                      setCorporateLocations(updated);
                                    }}
                                    style={{ flex: 1, padding: '4px 8px', background: 'rgba(241,245,249,0.8)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b', borderRadius: '4px', fontSize: '11px', outline: 'none' }}
                                  />
                                  <button onClick={() => {
                                    const updated = corporateLocations.map(loc => {
                                      if (loc.id !== location.id) return loc;
                                      return { ...loc, offices: loc.offices.filter(off => off.id !== office.id) };
                                    });
                                    setCorporateLocations(updated);
                                  }} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>✖</button>
                                </div>
                              ))}
                              <button onClick={() => {
                                const updated = corporateLocations.map(loc => {
                                  if (loc.id !== location.id) return loc;
                                  return { ...loc, offices: [...loc.offices, { id: `off_${Date.now()}`, name: 'مكتب جديد' }] };
                                });
                                setCorporateLocations(updated);
                              }} style={{ alignSelf: 'flex-start', marginTop: '5px', padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px dotted rgba(56, 189, 248, 0.3)', color: '#7dd3fc', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>+ إضافة مكتب/إدارة</button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setCorporateLocations([...corporateLocations, { id: `bldg_${Date.now()}`, buildingName: 'مبنى جديد', offices: [] }])} style={{ width: '100%', padding: '10px', background: 'rgba(139, 92, 246, 0.2)', border: '1px dashed rgba(139, 92, 246, 0.4)', color: '#d8b4fe', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span>+</span> إضافة مبنى جديد
                        </button>
                      </div>
                    </div>
                  )}


<h4 style={{fontSize: '12px', color: '#c084fc', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px'}}>الخصائص المتقدمة المشتركة</h4>
                  
                  {Object.keys(selectedComponent.properties).length === 0 ? (
                    <div style={{textAlign: 'center', fontSize: '12px', color: '#64748b', padding: '20px'}}>لا توجد خصائص إضافية</div>
                  ) : (
                    <div>
                      {Object.entries(selectedComponent.properties).filter(([k]) => !['visualStyle', 'timelineVisibility', 'requireRatingToClose', 'preventNewTicketIfPendingRating', 'allowCancellation', 'showStatusBadges', 'destinationRoutes', 'tabsConfig', 'enableDescription', 'maxDescriptionLength', 'accessLevel', 'allowedReportFilters', 'allowedReportColumns', 'allowedFilters', 'activeCharts', 'dataScope', 'filterDestDept', 'allowedDimensions', 'allowedMetrics', 'displayModes', 'archiveScope', 'allowCompletedClosedTickets', 'allowSupplementaryAdditionalTickets', 'enabledUIFilters', 'forceWhatsappCritical', 'lockSLAThresholds', 'SLA_Thresholds', 'allowedViews', 'enableDragAndDrop', 'maxDepth', 'concurrencyMode', 'maxSubTickets', 'routingScope', 'attachmentsEnabled', 'mandatoryAttachments', 'attachmentMaxSizeMB', 'slaConditions', 'voiceToText', 'showPriority', 'allowThemeCustomization', 'manualInputFallback', 'identityProvider', 'neonPalette', 'glassOpacity', 'allowUserSwitch', 'darkModeEnabled', 'defaultLanguage', 'neonGlowColor', 'enableTimelineAuditLog', 'enableHistoricalExport', 'issueTypeCustomization', 'injectedDynamicFields', 'attachmentAllowedExtensions', 'routingDestination', 'cascadingDropdowns', 'dependencyMapping', 'maxAttachmentSizeMB', 'allowedExtensions', 'mandatoryDescription', 'targetDestinations', 'maxAttachmentSize', 'descriptionLimit', 'authorizedPathManager', 'enforceAttachments', 'enforceDescription', 'singleTicketRestriction', 'issueTaxonomy'].includes(k)).map(([key, val]) => {
                        // Boolean toggle
                        if (typeof val === 'boolean') {
                          return (
                            <div key={key} style={{...styles.propBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: '12px', color: '#475569'}}>{propertyLabelsAr[key] || key}</span>
                              <div 
                                style={val ? styles.switchTrue : styles.switchFalse}
                                onClick={() => handlePropertyChange(selectedComponent.id, key, !val)}
                              >
                                <div style={val ? styles.knobTrue : styles.knobFalse}></div>
                              </div>
                            </div>
                          );
                        }
                        // Array
                        if (Array.isArray(val)) {
                          return (
                            <div key={key} style={styles.propBox}>
                              <div style={{fontSize: '12px', color: '#475569', marginBottom: '8px'}}>{propertyLabelsAr[key] || key}</div>
                              <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px'}}>
                                {val.map((item, idx) => (
                                  <span key={idx} style={{backgroundColor: '#312e81', color: '#a5b4fc', fontSize: '10px', padding: '2px 6px', borderRadius: '4px'}}>
                                    {item}
                                  </span>
                                ))}
                              </div>
                              <input 
                                style={styles.input} 
                                placeholder="إضافة..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value) {
                                    handlePropertyChange(selectedComponent.id, key, [...val, e.currentTarget.value]);
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                            </div>
                          );
                        }
                        // String / Number
                        return (
                          <div key={key} style={styles.propBox}>
                            <div style={{fontSize: '12px', color: '#475569', marginBottom: '4px'}}>{propertyLabelsAr[key] || key}</div>
                            <input 
                              style={styles.input}
                              value={String(val)}
                              onChange={(e) => handlePropertyChange(selectedComponent.id, key, e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{textAlign: 'center', opacity: 0.5, marginTop: '80px'}}>
                  <div style={{fontSize: '32px', marginBottom: '16px'}}>🖱️</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>حدد مكوناً من مساحة العمل<br/>لاستعراض وتخصيص الخصائص</div>
                </div>
              )}
            </div>
          </div>
            </div>

            {/* ── LEFT COLUMN (RTL Col 2): Live Preview Canvas + Component Inspector ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
              {/* Device Simulator Workspace */}
              <div style={{ 
            flex: 1, minHeight: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: 'radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%)', 
            borderRadius: '16px', 
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '24px', 
            overflow: 'auto',
            position: 'relative',
            height: '100%',
            minHeight: '600px'
          }}>
            {/* Device Container Frame */}
            <div style={{
              width: previewDevice === 'mobile' ? '360px' : previewDevice === 'tablet' ? '580px' : '100%',
              maxWidth: previewDevice === 'desktop' ? '950px' : 'none',
              height: previewDevice === 'mobile' ? '680px' : previewDevice === 'tablet' ? '730px' : '580px',
              borderRadius: previewDevice === 'mobile' ? '40px' : previewDevice === 'tablet' ? '28px' : '12px',
              border: previewDevice === 'mobile' ? '12px solid #1D1D1F' : previewDevice === 'tablet' ? '14px solid #1D1D1F' : '4px solid #1D1D1F',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 8px rgba(0,0,0,0.8)',
              backgroundColor: '#FFFFFF',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              
              {/* Device Top Decoration (Notch/Camera/macOS title bar) */}
              {previewDevice === 'mobile' && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '120px',
                  height: '22px',
                  background: '#1D1D1F',
                  borderRadius: '0 0 14px 14px',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}>
                  {/* Speaker Grill */}
                  <div style={{ width: '45px', height: '3px', background: '#3A3A3C', borderRadius: '1.5px' }}></div>
                  {/* Camera lens */}
                  <div style={{ width: '6px', height: '6px', background: '#0D0D11', border: '1px solid #2C2C2E', borderRadius: '50%' }}></div>
                </div>
              )}

              {previewDevice === 'tablet' && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '8px',
                  background: '#1D1D1F',
                  borderRadius: '50%',
                  zIndex: 100,
                  border: '1px solid #334155'
                }}></div>
              )}

              {previewDevice === 'desktop' && (
                <div style={{ 
                  height: '36px', 
                  background: '#E8E8ED', 
                  borderBottom: '1px solid rgba(0,0,0,0.08)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0 12px', 
                  gap: '8px',
                  userSelect: 'none',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  {/* Window Controls */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F56', border: '0.5px solid #E0443E' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E', border: '0.5px solid #DEA123' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27C93F', border: '0.5px solid #1AAB2F' }}></div>
                  </div>
                  {/* Window Title */}
                  <div style={{ 
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: '#6E6E73',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🖥️ معاينة شاشة الكمبيوتر
                  </div>
                </div>
              )}

              {/* Viewport Content Container */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', position: 'relative' }}>
                
                {/* Simulated App Top Navbar */}
                <div style={{ 
                  height: '52px', 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  backdropFilter: 'blur(20px)', 
                  WebkitBackdropFilter: 'blur(20px)', 
                  borderBottom: '1px solid rgba(0,0,0,0.05)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: previewDevice === 'mobile' ? '0 16px' : '0 24px', 
                  justifyContent: 'space-between', 
                  gap: '10px', 
                  zIndex: 200,
                  flexShrink: 0,
                  position: 'relative'
                }}>
                  {/* Brand logo/title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '12px', fontWeight: '800' }}>L</div>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1D1D1F' }}>قمرة التشغيل</span>
                  </div>

                  {/* Top Navbar items */}
                  <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                    
                    {/* Bell Notification Icon */}
                    {activeComponents.some(c => c.id === 'admin_notifications') && (
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => {
                            setShowNotificationsDropdown(!showNotificationsDropdown);
                            setShowProfileDropdown(false);
                          }}
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: showNotificationsDropdown ? 'rgba(0,0,0,0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px'
                          }}
                          title="الإشعارات والتنبيهات"
                        >
                          🔔
                          <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#FF3B30', border: '1.5px solid #FFF' }}></span>
                        </button>

                        {/* Glassmorphic Notifications Dropdown */}
                        {showNotificationsDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '44px',
                            left: '0',
                            width: '280px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            padding: '12px',
                            zIndex: 1000,
                            textAlign: 'right',
                            animation: 'slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1D1D1F' }}>مركز التنبيهات الحية</span>
                              <span style={{ fontSize: '10px', color: '#007AFF', cursor: 'pointer' }} onClick={() => setShowNotificationsDropdown(false)}>إغلاق</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(() => {
                                const getRoleNotifications = () => {
                                  if (previewRole === 'Super_Admin') {
                                    return [
                                      { title: '🔒 تحديث أمني ناجح للنظام', desc: 'تم تطبيق الحزمة الأمنية v43.5.2 بنجاح.', time: 'منذ ساعة', unread: false },
                                      { title: '⚠️ محاولة تسجيل دخول مريبة', desc: 'تم رصد محاولة دخول من عنوان IP غير معروف.', time: 'منذ ساعتين', unread: true },
                                      { title: '⚙️ استقرار خادم قاعدة البيانات', desc: 'استهلاك الذاكرة الإجمالي مستقر عند 42%.', time: 'منذ 4 ساعات', unread: false }
                                    ];
                                  } else if (previewRole === 'Dept_Head') {
                                    return [
                                      { title: '📥 تذكرة جديدة غير مسندة #TKT-1029', desc: 'عطل طارئ في شبكة HQ IT في انتظار الإسناد.', time: 'منذ دقيقة', unread: true },
                                      { title: '⏰ SLA وشيك لـ #TKT-0994', desc: 'متبقي 15 دقيقة على خرق الاتفاقية لفريق الشبكات.', time: 'منذ 5 دقائق', unread: true },
                                      { title: '🤝 تأكيد تحويل تذكرة #TKT-0883', desc: 'وافق م. خليل على إدارة التذكرة المحولة له.', time: 'منذ ساعتين', unread: false }
                                    ];
                                  } else {
                                    // Field_Engineer or default
                                    return [
                                      { title: '🛠️ تم إسناد تذكرة جديدة لك #TKT-1029', desc: 'الرجاء فحص عطل شبكة HQ IT والتوجه للموقع.', time: 'منذ دقيقة', unread: true },
                                      { title: '⚠️ أولوية التذكرة #TKT-0994 مرتفعة', desc: 'تحديث حالة المعالجة لتجنب خرق مؤشر SLA.', time: 'منذ 5 دقائق', unread: true },
                                      { title: '📝 رسالة جديدة من العميل', desc: 'تم إضافة مرفق جديد لتفاصيل التذكرة #TKT-1029.', time: 'منذ ساعة', unread: false }
                                    ];
                                  }
                                };
                                return getRoleNotifications().map((item, idx) => (
                                  <div key={idx} style={{ padding: '8px', borderRadius: '8px', background: item.unread ? 'rgba(0,122,255,0.05)' : 'transparent', borderBottom: '0.5px solid rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '11px', fontWeight: '700', color: item.unread ? '#007AFF' : '#1D1D1F' }}>{item.title}</span>
                                      <span style={{ fontSize: '9px', color: '#8E8E93' }}>{item.time}</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#6E6E73', marginTop: '2px' }}>{item.desc}</div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Profile Icon */}
                    {activeComponents.some(c => c.id === 'admin_profile') && (
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => {
                            setShowProfileDropdown(!showProfileDropdown);
                            setShowNotificationsDropdown(false);
                          }}
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: showProfileDropdown ? 'rgba(0,0,0,0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px'
                          }}
                          title="الملف الشخصي"
                        >
                          👤
                        </button>

                        {/* Glassmorphic Profile Dropdown */}
                        {showProfileDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '44px',
                            left: '0',
                            width: '220px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            padding: '12px',
                            zIndex: 1000,
                            textAlign: 'right',
                            animation: 'slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#5856D6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold', fontSize: '14px' }}>M</div>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1D1D1F' }}>majdi.alzarrouk</div>
                                <div style={{ fontSize: '10px', color: '#8E8E93' }}>{previewRole}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {['الملف الشخصي', 'إعدادات الحساب', 'تسجيل الخروج'].map((opt, i) => (
                                <div key={opt} style={{ padding: '8px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: i === 2 ? '#FF3B30' : '#1D1D1F', cursor: 'pointer', background: 'transparent', transition: 'background 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  onClick={() => setShowProfileDropdown(false)}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Viewport Scrollable Screen Content */}
                <div 
                  style={{ 
                    flex: 1, minHeight: 0, 
                    background: '#F9FAFB', 
                    padding: previewDevice === 'mobile' ? '16px' : '24px', 
                    overflowY: 'auto', 
                    paddingBottom: '80px',
                    position: 'relative'
                  }} 
                  className="admin-scroll"
                  onClick={() => {
                    // Close dropdowns when clicking outside
                    setShowNotificationsDropdown(false);
                    setShowProfileDropdown(false);
                  }}
                >
                  
                  {(() => {
                    const mainComponents = activeComponents.filter(c => c.target_zone === 'Main_Viewport' || !c.target_zone);

                    if (mainComponents.length === 0) {
                      return (
                        <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#AEAEB2', gap: '16px' }}>
                          <div style={{ width: '64px', height: '64px', background: '#F5F5F7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>⚙️</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1D1D1F' }}>لا توجد مكونات نشطة بمساحة العرض</div>
                          <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '250px', lineHeight: '1.6' }}>قم بتفعيل المكونات في قائمة "المكونات النشطة" لتظهر فوراً في المعاينة.</div>
                        </div>
                      );
                    }

                    // Render component preview block helper
                    const renderComponent = (c: UIComponentDefinition) => {
                      switch (c.id) {
                                                case 'ticket_create': {
                            const tProps = c.properties || {};
                            const destinationRouteIds: string[] = tProps.destinationRoutes || [];
                            
                            // Mock custom fields parsing just for preview (from localStorage or empty)
                            let mockCustomFields = [];
                            try {
                                const stored = localStorage.getItem('litc_dynamic_fields');
                                if (stored) mockCustomFields = JSON.parse(stored);
                            } catch(e) {}
                            
                            return (
                                <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                                    <div style={{ width: '100%', maxWidth: '600px', opacity: 0.9 }}>
                                        <TicketCreatorForm
                                            customFields={mockCustomFields}
                                            allowedRouteIds={destinationRouteIds}
                                            concurrencyPolicy={tProps.concurrencyPolicy || 'ALLOW_MULTIPLE'}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        case 'ticket_inbox': {
                            const p = c.properties || {};
                            
                            const timelineVisibility = p.timelineVisibility || 'ALL_STEPS';
                            const requireRatingToClose = p.requireRatingToClose !== undefined ? p.requireRatingToClose : true;
                            const allowCancellation = p.allowCancellation || false;

                            // Mock active tickets for the preview
                            const mockActiveTickets = [
                              {
                                id: 'TKT-1002',
                                title: 'تذكرة عرض توضيحي للوحة الأدمن',
                                description: 'هذا مجرد عرض توضيحي لكيفية ظهور التذاكر النشطة للموظف بناءً على التصميم الجديد.',
                                status: 'OPEN',
                                routeColor: '#3b82f6',
                                routeIcon: '💻',
                                routeName: 'الدعم الفني',
                                currentHandler: 'إدارة أمن المعلومات',
                                history: [
                                  { id: '1', title: 'تم رفع الطلب', status: 'COMPLETED', department: 'بواسطتك', timestamp: '09:00 ص' },
                                  { id: '2', title: 'الاستلام الأولي', status: 'COMPLETED', department: 'مكتب الدعم الفني', timestamp: '09:15 ص' },
                                  { id: '3', title: 'تحويل داخلي', status: 'COMPLETED', department: 'فريق الشبكات', timestamp: '10:00 ص' },
                                  { id: '4', title: 'قيد المعالجة', status: 'ACTIVE', department: 'إدارة أمن المعلومات', timestamp: 'الآن' },
                                  { id: '5', title: 'الإنجاز', status: 'PENDING' }
                                ]
                              }
                            ];
                            
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', opacity: 0.9 }}>
                                <div>
                                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0, position: 'relative', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                    لوحة استعراض التذاكر المرسلة (معاينة حية)
                                    <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                                  </h2>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'none' }}>
                                  {mockActiveTickets.map(ticket => {
                                    let displayHistory = ticket.history || [];
                                    if (timelineVisibility === 'MAJOR_MILESTONES') {
                                      displayHistory = displayHistory.filter((n: any, idx: number) => {
                                        if (idx === 0 || idx === displayHistory.length - 1) return true;
                                        if (n.status === 'ACTIVE') return true;
                                        return false;
                                      });
                                    }

                                    return (
                                      <div key={ticket.id} style={{
                                        background: '#fff', borderRadius: '20px', padding: '24px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
                                        position: 'relative', overflow: 'hidden'
                                      }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: ticket.routeColor }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${ticket.routeColor}15`, color: ticket.routeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                              {ticket.routeIcon}
                                            </div>
                                            <div>
                                              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>{ticket.title}</h4>
                                              <span style={{ fontSize: '12px', color: '#64748b' }}>مسار: {ticket.routeName} • {ticket.currentHandler}</span>
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {allowCancellation && (
                                              <button style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                                إلغاء الطلب ❌
                                              </button>
                                            )}
                                            <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'rgba(0,0,0,0.04)', color: '#475569' }}>
                                              #{ticket.id}
                                            </span>
                                            <span style={{
                                              fontSize: '11px', fontWeight: 700,
                                              padding: '4px 10px', borderRadius: '20px',
                                              background: ticket.status === 'RESOLVED' ? '#e8f5e9' : ticket.status === 'TRANSFERRED' ? '#fff3e0' : '#e0f2fe',
                                              color: ticket.status === 'RESOLVED' ? '#2e7d32' : ticket.status === 'TRANSFERRED' ? '#ef6c00' : '#0288d1',
                                            }}>
                                              {ticket.status === 'NEW' ? '✨ جديد' : ticket.status === 'OPEN' ? '⚙️ قيد المعالجة' : ticket.status === 'TRANSFERRED' ? '↗️ محول' : '🎯 تم الإنجاز'}
                                            </span>
                                          </div>
                                        </div>

                                        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '20px', lineHeight: 1.5, background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px' }}>
                                          <strong>وصف المشكلة المرفوع:</strong> {ticket.description}
                                        </div>

                                        <div style={{ padding: '16px', background: '#fafbfc', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                                          <h5 style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              🗺️ رحلة الطلب ومكان المعالجة الحالي:
                                            </h5>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                              {displayHistory.map((node: any, idx: number) => {
                                                const isCompleted = node.status === 'COMPLETED';
                                                const isActive = node.status === 'ACTIVE';
                                                return (
                                                  <React.Fragment key={node.id || idx}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: '120px' }}>
                                                      <div style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        background: isCompleted ? ticket.routeColor : isActive ? '#ffffff' : '#f1f5f9',
                                                        border: `2px solid ${isCompleted || isActive ? ticket.routeColor : '#cbd5e1'}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: isCompleted ? '#fff' : isActive ? ticket.routeColor : '#94a3b8',
                                                        fontSize: '12px', fontWeight: 700,
                                                        boxShadow: isActive ? `0 0 0 4px ${ticket.routeColor}25` : 'none'
                                                      }}>
                                                        {isCompleted ? '✓' : idx + 1}
                                                      </div>
                                                      <div>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: isCompleted || isActive ? '#1e293b' : '#94a3b8' }}>{node.title}</div>
                                                        {node.department && <div style={{ fontSize: '10px', color: '#64748b' }}>{node.department}</div>}
                                                        {node.timestamp && <div style={{ fontSize: '9px', color: '#94a3b8' }}>{node.timestamp}</div>}
                                                      </div>
                                                    </div>
                                                    {idx < displayHistory.length - 1 && (
                                                      <div style={{ flex: 1, height: '2px', background: isCompleted ? ticket.routeColor : '#e2e8f0', minWidth: '20px' }} />
                                                    )}
                                                  </React.Fragment>
                                                );
                                              })}
                                            </div>
                                          </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                        }

                        case 'admin_operational_console': {
                          const p = c.properties || {};
                          const snatching = p.snatchingGovernance || false;
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#1D1D1F', fontWeight: '700' }}>لوحة التذاكر الواردة</h4>
                                
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px' }}>
                                  {['الجديدة', 'قيد المعالجة', 'معلقة', 'مغلقة'].map((tab, i) => (
                                     <div key={tab} style={{ padding: '8px 16px', borderRadius: '20px', background: i===0 ? '#E5F1FF' : 'transparent', color: i===0 ? '#007AFF' : '#6E6E73', fontSize: '13px', fontWeight: i===0 ? '700' : '500', cursor: 'pointer' }}>
                                        {tab}
                                     </div>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ padding: '16px', background: '#F9F9FB', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F' }}>تذكرة #10294</div>
                                      <div style={{ fontSize: '12px', color: '#6E6E73', marginTop: '4px' }}>مشكلة في الشبكة - مسندة إلى: أحمد (مهندس)</div>
                                    </div>
                                    {snatching && (
                                      <button style={{ padding: '8px 14px', background: '#FFF1F0', color: '#FF3B30', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>سحب التذكرة ✋</button>
                                    )}
                                  </div>
                                  <div style={{ padding: '16px', background: '#F9F9FB', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F' }}>تذكرة #10295</div>
                                      <div style={{ fontSize: '12px', color: '#6E6E73', marginTop: '4px' }}>تحديث النظام - جديدة</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        case 'quick_actions_panel': {
                          const p = c.properties || {};
                          const handshake = p.enableHandshakeTransfer || false;
                          const depLock = p.enableDependencyLock || false;
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                              <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#1D1D1F', fontWeight: '700' }}>الإجراءات السريعة (Quick Actions)</h4>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                  <button style={{ padding: '12px 18px', background: '#007AFF', color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,122,255,0.2)' }}>
                                    إسناد لنفسي 🙋‍♂️
                                  </button>
                                  
                                  <button style={{ padding: '12px 18px', background: '#F5F5F7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                    تحويل التذكرة {handshake && <span style={{ color: '#FF9500', fontSize: '11px', marginInlineStart: '5px' }}>(مشروط 🤝)</span>}
                                  </button>

                                  <button style={{ padding: '12px 18px', background: '#F5F5F7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                    إنشاء تذكرة فرعية {depLock && <span style={{ color: '#FF3B30', fontSize: '11px', marginInlineStart: '5px' }}>(قفل الاعتماد 🔒)</span>}
                                  </button>
                                </div>
                              </div>

                              <div style={{ marginTop: '10px', padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', boxShadow: '0 12px 24px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                                {handshake ? (
                                   <div style={{ position: 'relative', zIndex: 1 }}>
                                     <h5 style={{ margin: '0 0 10px 0', color: '#FF9500', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                                        <span style={{ fontSize: '18px' }}>🤝</span> نافذة التحويل المشروط (Handshake Transfer)
                                     </h5>
                                     <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6E6E73', lineHeight: '1.6' }}>أنت تقوم بتحويل هذه التذكرة. لن تنتقل الملكية رسمياً حتى يوافق الطرف الآخر. ستظل التذكرة بحالة معلقة.</p>
                                     <div style={{ display: 'flex', gap: '10px' }}>
                                       <select style={{ flex: 1, minHeight: 0, padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '13px', outline: 'none', background: '#F5F5F7', fontFamily: 'inherit' }}>
                                         <option>اختر الزميل...</option>
                                         <option>م. خليل (فريق الشبكات)</option>
                                       </select>
                                       <button style={{ padding: '12px 24px', background: '#FF9500', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)' }}>إرسال طلب التحويل</button>
                                     </div>
                                   </div>
                                ) : depLock ? (
                                   <div style={{ position: 'relative', zIndex: 1 }}>
                                     <h5 style={{ margin: '0 0 10px 0', color: '#007AFF', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                                        <span style={{ fontSize: '18px' }}>🔒</span> تذكرة فرعية مع قفل اعتمادي
                                     </h5>
                                     <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6E6E73', lineHeight: '1.6' }}>سيؤدي إرسال هذه التذكرة الفرعية إلى تحويل التذكرة الأصلية فوراً لحالة <strong style={{ color: '#FF3B30' }}>(معلقة)</strong> حتى يتم إنجاز التذكرة الفرعية.</p>
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                       <input type="text" placeholder="عنوان التذكرة الفرعية..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '13px', outline: 'none', background: '#F5F5F7', fontFamily: 'inherit' }} />
                                       <button style={{ alignSelf: 'flex-end', padding: '12px 24px', background: '#007AFF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)' }}>إنشاء وقفل التذكرة الأصلية</button>
                                     </div>
                                   </div>
                                ) : (
                                   <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#AEAEB2', fontSize: '13px', padding: '20px' }}>
                                     قم بتفعيل خيار "التحويل المشروط" أو "القفل الاعتمادي" من خصائص المكون لرؤية النوافذ التفاعلية.
                                   </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        case 'admin_analytics': {
                          const p = c.properties || {};
                          const isOverride = p.adminOverride || false;
                          const isSectionHead = previewRole === 'Dept_Head';
                          const drilldown = isOverride || (!isSectionHead || p.managerAnalyticsControl?.allowEngineerDrilldown);
                          const locationF = isOverride || (!isSectionHead || p.managerAnalyticsControl?.allowLocationFilter);
                          const taxF = isOverride || (!isSectionHead || p.managerAnalyticsControl?.allowTaxonomyFilter);
                          const activeCharts = p.activeCharts || ['kpi_cards', 'bar_chart'];
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ padding: '24px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                                <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#1D1D1F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700' }}>
                                  <span>لوحة التحليل المركزي (OLAP Engine)</span>
                                  {isOverride && <span style={{ fontSize: '11px', background: '#FFF1F0', color: '#FF3B30', padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA' }}>تجاوز المشرف النشط</span>}
                                </h4>
                                
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
                                  {locationF ? (
                                    <select style={{ flex: 1, minHeight: 0, padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', outline: 'none', background: '#F5F5F7', fontFamily: 'inherit', color: '#1D1D1F' }}>
                                      <option>📍 تصفية حسب المبنى</option>
                                      <option>المبنى الرئيسي (طرابلس)</option>
                                      <option>فرع بنغازي</option>
                                    </select>
                                  ) : (
                                    <div style={{ flex: 1, minHeight: 0, padding: '12px', borderRadius: '8px', background: '#F9F9FB', color: '#AEAEB2', border: '1px dashed rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🔒 تصفية المباني مقفلة</div>
                                  )}
                                  
                                  {taxF ? (
                                    <select style={{ flex: 1, minHeight: 0, padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', outline: 'none', background: '#F5F5F7', fontFamily: 'inherit', color: '#1D1D1F' }}>
                                      <option>🗂️ تصفية حسب التصنيف</option>
                                      <option>أعطال تقنية</option>
                                      <option>أعطال تشغيلية</option>
                                    </select>
                                  ) : (
                                    <div style={{ flex: 1, minHeight: 0, padding: '12px', borderRadius: '8px', background: '#F9F9FB', color: '#AEAEB2', border: '1px dashed rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🔒 تصفية التصنيفات مقفلة</div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                  <div style={{ flex: 2, minWidth: '280px', height: '220px', background: '#F9F9FB', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '32px' }}>📊</span>
                                    <span style={{ fontWeight: '600', color: '#6E6E73' }}>مؤشرات الأداء الزمنية</span>
                                  </div>
                                  
                                  <div style={{ flex: 1, minHeight: 0, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {drilldown ? (
                                      <div style={{ flex: 1, minHeight: 0, background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px' }}>🏆 أفضل المهندسين أداءً</span>
                                        <div style={{ fontSize: '12px', color: '#6E6E73', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontWeight: '500' }}>م. أحمد سالم</span><span>120 تذكرة</span></div>
                                        <div style={{ fontSize: '12px', color: '#6E6E73', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '500' }}>م. سارة علي</span><span>115 تذكرة</span></div>
                                      </div>
                                    ) : (
                                      <div style={{ flex: 1, minHeight: 0, background: '#FFF1F0', borderRadius: '12px', border: '1px solid #FECACA', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FF3B30', textAlign: 'center' }}>
                                        <span style={{ fontSize: '24px', marginBottom: '6px' }}>🔒</span>
                                        <span style={{ fontSize: '12px', fontWeight: '700' }}>تفاصيل المهندسين محجوبة</span>
                                        <span style={{ fontSize: '10px', marginTop: '4px' }}>بناءً على قيود الصلاحية</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                {activeCharts.includes('kpi_cards') && (
                                  <div style={{ flex: 1, minHeight: 0, minWidth: '120px', height: '100px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <span style={{ fontSize: '11px', color: '#8E8E93' }}>إجمالي التذاكر (المحلولة)</span>
                                    <strong style={{ fontSize: '20px', color: '#1D1D1F', marginTop: '4px' }}>243</strong>
                                  </div>
                                )}
                                {activeCharts.includes('line_chart') && (
                                  <div style={{ flex: 1, minHeight: 0, minWidth: '120px', height: '100px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                    <span style={{ fontSize: '11px', color: '#8E8E93' }}>معدّل سرعة الاستجابة</span>
                                    <strong style={{ fontSize: '20px', color: '#007AFF', marginTop: '4px' }}>18 دقيقة</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        case 'admin_leaderboard': {
                          const p = c.properties || {};
                          const maxElements = p.maxComparisonElements || 3;
                          const types = p.allowedComparisonTypes || ['ENGINEERS'];
                          const activeType = types[0] || 'ENGINEERS';
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }} className="scrollbar-thin">
                                {types.map((t: string) => (
                                  <div key={t} style={{ padding: '8px 18px', background: t === activeType ? '#5856D6' : '#F5F5F7', color: t === activeType ? '#FFFFFF' : '#6E6E73', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: `1px solid ${t === activeType ? '#5856D6' : 'rgba(0,0,0,0.08)'}`, transition: 'all 0.2s' }}>
                                    {t === 'ENGINEERS' ? 'المهندسين' : t === 'LOCATIONS' ? 'المباني' : 'المشاكل'}
                                  </div>
                                ))}
                                {types.length === 0 && <span style={{ fontSize: '13px', color: '#FF3B30' }}>لا توجد مقارنات مسموحة</span>}
                              </div>

                              <div style={{ height: '240px', padding: '20px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'flex-end', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '13px', color: '#1D1D1F', fontWeight: '700' }}>مؤشر الأداء ({activeType === 'ENGINEERS' ? 'المهندسين' : activeType === 'LOCATIONS' ? 'المباني' : 'المشاكل'})</div>
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
                                   {['أحمد', 'محمد', 'علي'].map((name, idx) => (
                                     <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, minHeight: 0, height: '100%', justifyContent: 'flex-end' }}>
                                       <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                                          {Array.from({ length: Math.min(3, maxElements) }).map((_, barIdx) => {
                                             const colors = [['#5856D6', '#AF52DE'], ['#007AFF', '#34C759'], ['#FF9500', '#FF3B30']];
                                             const color = colors[barIdx % colors.length];
                                             const h = 30 + Math.random() * 60;
                                             return (
                                               <div key={barIdx} style={{ width: '14px', height: `${h}%`, background: `linear-gradient(180deg, ${color[0]} 0%, ${color[1]} 100%)`, borderRadius: '4px 4px 0 0', opacity: 0.9, transition: 'all 0.5s' }}></div>
                                             );
                                          })}
                                       </div>
                                       <span style={{ fontSize: '11px', color: '#6E6E73', fontWeight: '600' }}>{name}</span>
                                     </div>
                                   ))}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        case 'admin_archive': {
                          const p = c.properties || {};
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  {(p.enabledUIFilters || ['التاريخ', 'الحالة']).map((filter: string, idx: number) => (
                                    <select key={idx} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#1D1D1F' }}>
                                      <option>تصفية: {filter}</option>
                                    </select>
                                  ))}
                                </div>
                                {p.enableHistoricalExport && (
                                  <button style={{ padding: '10px 18px', background: '#34C759', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)' }}>
                                    تصدير التقرير 📥
                                  </button>
                                )}
                              </div>
                              
                              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead style={{ background: '#F5F5F7', textAlign: 'right', fontSize: '13px', color: '#6E6E73' }}>
                                    <tr>
                                      <th style={{ padding: '14px 20px', fontWeight: '600' }}>رقم التذكرة</th>
                                      <th style={{ padding: '14px 20px', fontWeight: '600' }}>التصنيف</th>
                                      <th style={{ padding: '14px 20px', fontWeight: '600' }}>الحالة التاريخية</th>
                                    </tr>
                                  </thead>
                                  <tbody style={{ fontSize: '14px', color: '#1D1D1F' }}>
                                    {[1, 2].map(row => (
                                      <tr key={row} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                        <td style={{ padding: '16px 20px', fontWeight: '500' }}>#TKT-2026-00{row}</td>
                                        <td style={{ padding: '16px 20px' }}>عطل تقني متقدم</td>
                                        <td style={{ padding: '16px 20px' }}>
                                          <span style={{ padding: '4px 10px', background: '#E8F5E9', color: '#34C759', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>مغلقة نهائياً</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {p.enableTimelineAuditLog && (
                                <div style={{ marginTop: '10px', padding: '20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', borderRight: '4px solid #007AFF', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1D1D1F', fontWeight: '700' }}>📜 شريط السجل التاريخي المتكامل (Timeline Audit Log)</h5>
                                  <div style={{ fontSize: '13px', color: '#6E6E73', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#007AFF' }}/> 2026-05-30 14:00 - تم إغلاق التذكرة بواسطة (مدير النظام)</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        default:
                          return (
                            <div style={{ padding: '20px', background: '#F5F5F7', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)', textAlign: 'center', color: '#8E8E93', fontSize: '13px' }}>
                              ⚙️ مكون "{c.name}" - جاهز للعمل.
                            </div>
                          );
                      }
                    };

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                        
                        {/* Segmented View Mode Controller (Stack vs Tabs) */}
                        <div style={{ 
                          display: 'flex', 
                          background: 'rgba(118, 118, 128, 0.12)', 
                          borderRadius: '10px', 
                          padding: '2px', 
                          gap: '2px', 
                          alignItems: 'center', 
                          width: '100%',
                          maxWidth: '280px',
                          alignSelf: 'center',
                          direction: 'rtl'
                        }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSimulatorViewMode('stack'); }}
                            style={{ 
                              flex: 1, minHeight: 0, 
                              padding: '6px 12px', 
                              border: 'none', 
                              borderRadius: '8px', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              cursor: 'pointer', 
                              background: simulatorViewMode === 'stack' ? '#FFFFFF' : 'transparent',
                              color: simulatorViewMode === 'stack' ? '#1D1D1F' : '#6E6E73',
                              boxShadow: simulatorViewMode === 'stack' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            📑 عرض متتالي
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSimulatorViewMode('tabs'); }}
                            style={{ 
                              flex: 1, minHeight: 0, 
                              padding: '6px 12px', 
                              border: 'none', 
                              borderRadius: '8px', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              cursor: 'pointer', 
                              background: simulatorViewMode === 'tabs' ? '#FFFFFF' : 'transparent',
                              color: simulatorViewMode === 'tabs' ? '#1D1D1F' : '#6E6E73',
                              boxShadow: simulatorViewMode === 'tabs' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            🗂️ عرض تبويبي
                          </button>
                        </div>

                        {/* Rendering Viewport Contents based on mode */}
                        {simulatorViewMode === 'stack' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {mainComponents.map(c => {
                              const isSelected = selectedComponentId === c.id;
                              return (
                                <div 
                                  key={c.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedComponentId(c.id);
                                    setPreviewActiveTab(c.id);
                                  }}
                                  style={{
                                    border: isSelected ? '2px solid #5856D6' : '1px solid rgba(0,0,0,0.08)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    background: '#FFFFFF',
                                    boxShadow: isSelected ? '0 8px 24px rgba(88,86,214,0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative'
                                  }}
                                >
                                  {/* Component Header badge */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                                    paddingBottom: '8px',
                                    marginBottom: '16px'
                                  }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: isSelected ? '#5856D6' : '#1D1D1F', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? '#5856D6' : '#8E8E93' }}/>
                                      {c.name}
                                    </span>
                                    <span style={{ fontSize: '9px', background: isSelected ? 'rgba(88,86,214,0.08)' : '#F5F5F7', color: isSelected ? '#5856D6' : '#8E8E93', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                      {c.category === 'employee_workspace' ? 'المرسل' : c.category === 'technical_support_console' ? 'الاستقبال' : c.category === 'operations_and_management' ? 'الإدارة والتحليل' : 'الحوكمة'}
                                    </span>
                                  </div>

                                  {renderComponent(c)}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Horizontal scrollable tab row */}
                            <div style={{ 
                              display: 'flex', 
                              gap: '6px', 
                              overflowX: 'auto', 
                              paddingBottom: '8px',
                              borderBottom: '1px solid rgba(0,0,0,0.05)',
                              direction: 'rtl'
                            }} className="scrollbar-thin">
                              {mainComponents.map(c => {
                                const isSelected = selectedComponentId === c.id;
                                return (
                                  <button
                                    key={c.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedComponentId(c.id);
                                      setPreviewActiveTab(c.id);
                                    }}
                                    style={{
                                      padding: '6px 14px',
                                      border: 'none',
                                      borderRadius: '16px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      background: isSelected ? '#5856D6' : '#F5F5F7',
                                      color: isSelected ? '#FFFFFF' : '#6E6E73',
                                      boxShadow: isSelected ? '0 2px 8px rgba(88,86,214,0.2)' : 'none',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    {c.name}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Render active tab component */}
                            {(() => {
                              const activeTabComp = mainComponents.find(c => c.id === selectedComponentId) || mainComponents[0];
                              if (!activeTabComp) return null;
                              return (
                                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                                  {renderComponent(activeTabComp)}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                      </div>
                    );
                  })()}

                </div>
              </div>
              {/* Bottom iOS Indicator line */}
              {(previewDevice === 'mobile' || previewDevice === 'tablet') && (
                <div style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '120px',
                  height: '4px',
                  background: '#1D1D1F',
                  borderRadius: '2px',
                  zIndex: 100,
                  opacity: 0.8
                }}></div>
              )}

            </div>
          </div>
            </div>

          </div>
</DragDropContext>
</div>

      {showNameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90000, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '24px', width: '500px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#1D1D1F', marginBottom: '24px', fontSize: '22px', fontWeight: '800' }}>تعريف الواجهة والتصنيف (Configuration)</h3>
            
            <div style={{ textAlign: 'right', marginBottom: '25px', marginTop: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px', display: 'block' }}>1. أولاً: اختر التصنيف المعماري (Role / Persona):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'IT_ADMIN', label: 'السوبر أدمن', icon: '💻' },
                  { id: 'OPERATIONAL_MANAGER', label: 'م. مجدي الزروق (مدير إدارة)', icon: '📊' },
                  { id: 'SECTION_HEAD', label: 'أحمد النكوع (رئيس قسم)', icon: '🛠️' },
                  { id: 'TEAM_LEADER', label: 'نضال أبو غامجة (رئيس فريق)', icon: '👥' },
                  { id: 'OPERATIONAL_USER', label: 'محمد الزياني (مستخدم تشغيلي)', icon: '👤' },
                  { id: 'END_USER', label: 'مستخدم عادي', icon: '🌍' }
                ].map(role => (
                  <div 
                    key={role.id}
                    onClick={() => {
                      setInterfaceCategory(role.id as CoreRole); setManagementLevel(''); setSelectedDept(''); setSelectedSection(''); setSelectedTeam('');
                      setTimeout(() => {
                        const inputEl = document.getElementById('interface_name_input');
                        if(inputEl) inputEl.focus();
                      }, 50);
                    }}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      border: `1px solid ${interfaceCategory === role.id ? '#5856D6' : 'rgba(0,0,0,0.08)'}`, 
                      background: interfaceCategory === role.id ? 'rgba(88,86,214,0.06)' : '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: interfaceCategory === role.id ? '700' : '600',
                      color: interfaceCategory === role.id ? '#5856D6' : '#1D1D1F',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: interfaceCategory === role.id ? '0 4px 12px rgba(88,86,214,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{role.icon}</span>
                    {role.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px', textAlign: 'right' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px', display: 'block' }}>2. ثانياً: اختر نطاق الإدارة والتبعية التنظيمية:</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select 
                  value={managementLevel}
                  onChange={e => { setManagementLevel(e.target.value); setSelectedDept(''); setSelectedSection(''); setSelectedTeam(''); }}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                >
                  <option value="">-- مستوى الإدارة (Management Level) --</option>
                  <option value="GENERAL">الإدارة العامة</option>
                  <option value="DEPARTMENT">الإدارة التخصصية</option>
                  <option value="SECTION">قسم تنفيذي</option>
                  <option value="TEAM">وحدة / فريق ميداني</option>
                </select>

                {(managementLevel === 'DEPARTMENT' || managementLevel === 'SECTION' || managementLevel === 'TEAM') && (
                  <select 
                    value={selectedDept}
                    onChange={e => { setSelectedDept(e.target.value); setSelectedSection(''); setSelectedTeam(''); }}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                  >
                    <option value="">-- اختر الإدارة التخصصية --</option>
                    {mockOrgStructure.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}

                {(managementLevel === 'SECTION' || managementLevel === 'TEAM') && selectedDept && (
                  <select 
                    value={selectedSection}
                    onChange={e => { setSelectedSection(e.target.value); setSelectedTeam(''); }}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                  >
                    <option value="">-- اختر القسم التنفيذي --</option>
                    {mockOrgStructure.find(d => d.id === selectedDept)?.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}

                {managementLevel === 'TEAM' && selectedSection && (
                  <select 
                    value={selectedTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '14px', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                  >
                    <option value="">-- اختر الفريق الميداني --</option>
                    {mockOrgStructure.find(d => d.id === selectedDept)?.sections.find(s => s.id === selectedSection)?.teams?.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px', display: 'block' }}>3. ثالثاً: أطلق اسماً تعريفياً للواجهة:</label>
              <input
                id="interface_name_input"
                type="text"
                placeholder={`مثال: لوحة مدير ${mockOrgStructure.find(d=>d.id===selectedDept)?.name || 'العمليات'}`}
                value={interfaceName}
                onChange={(e) => setInterfaceName(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && interfaceName.trim() !== '' && interfaceCategory && managementLevel) {
                    setShowNameModal(false);
                  }
                }}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: '#FFFFFF', color: '#1D1D1F', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
              />
            </div>
            
            <button 
              onClick={() => {
                if (interfaceName.trim() === '') setInterfaceName('واجهة مخصصة جديدة');
                setShowNameModal(false);
              }}
              disabled={!interfaceCategory || !managementLevel}
              style={{ 
                width: '100%', padding: '16px', background: (!interfaceCategory || !managementLevel) ? '#EBEBEB' : '#5856D6', color: (!interfaceCategory || !managementLevel) ? '#AEAEB2' : '#FFFFFF', border: 'none', borderRadius: '12px', cursor: (!interfaceCategory || !managementLevel) ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '700', boxShadow: (!interfaceCategory || !managementLevel) ? 'none' : '0 4px 14px rgba(88,86,214,0.35)', transition: 'all 0.2s', fontFamily: 'inherit'
              }}
            >
              بدء التصميم والبناء 🚀
            </button>
            <button
              onClick={() => { setShowNameModal(false); setIsManagerMode(true); }}
              style={{ width: '100%', padding: '16px', background: 'transparent', color: '#6E6E73', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '10px', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1D1D1F'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6E6E73'}
            >
              إلغاء والعودة
            </button>
          </div>
        </div>
      )}

      {/* Save Success Modal */}
      {showSaveReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90000, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '24px', width: '500px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ width: '80px', height: '80px', background: '#34C759', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '40px', boxShadow: '0 8px 24px rgba(52,199,89,0.3)' }}>✓</div>
            <h3 style={{ color: '#1D1D1F', marginBottom: '16px', fontSize: '22px', fontWeight: '800' }}>تم الحفظ والاعتماد بنجاح!</h3>
            
            <div style={{ background: '#F5F5F7', padding: '20px', borderRadius: '12px', textAlign: 'right', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '13px', color: '#6E6E73', marginBottom: '8px' }}>تفاصيل النسخة المحفوظة:</div>
              <div style={{ fontWeight: '700', color: '#1D1D1F', marginBottom: '4px', fontSize: '15px' }}>📌 الاسم: {interfaceName || 'واجهة جديدة'}</div>
              <div style={{ fontWeight: '600', color: '#5856D6', marginBottom: '4px', fontSize: '14px' }}>👤 التصنيف: {interfaceCategory}</div>
              <div style={{ fontWeight: '600', color: '#AF52DE', marginBottom: '4px', fontSize: '14px' }}>🏢 مستوى الإدارة: {managementLevel}</div>
              <div style={{ fontWeight: '600', color: '#007AFF', marginBottom: '12px', fontSize: '14px' }}>📦 المكونات النشطة: {activeComponents.length} مكونات</div>
              <div style={{ fontSize: '12px', color: '#AEAEB2', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>💡 الواجهة جاهزة الآن للعمل بشكل مباشر مع المستخدمين أصحاب هذا الدور وهذه الإدارة.</div>
            </div>

            <button 
              onClick={handleConfirmSave}
              style={{ width: '100%', padding: '16px', background: '#1D1D1F', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'all 0.2s ease', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              العودة إلى مدير الواجهات
            </button>
          </div>
        </div>
      )}

      {/* ─── Data Loss Warning Modal ─── */}
      {showWarningModal && interfaceToLoad && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90000, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', padding: '30px', borderRadius: '24px', width: '450px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#FF3B30', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '30px', boxShadow: '0 8px 24px rgba(255,59,48,0.3)' }}>!</div>
            <h3 style={{ color: '#1D1D1F', margin: '0 0 15px 0', fontSize: '20px', fontWeight: '800' }}>
              تحذير: فقدان العمل غير المحفوظ
            </h3>
            
            <p style={{ color: '#6E6E73', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              أنت تقوم حالياً بتعديل واجهة تحت اسم <strong style={{ color: '#1D1D1F' }}>({interfaceName})</strong>.
              <br/><br/>
              محاولة فتح واجهة <strong style={{ color: '#1D1D1F' }}>({interfaceToLoad.name})</strong> ستؤدي إلى إزالة كل التعديلات الحالية غير المحفوظة والمكونات الموزعة وإعادة تحميل مساحة العمل بالواجهة المطلوبة.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  setInterfaceName(interfaceToLoad.name);
                  setInterfaceCategory(interfaceToLoad.roleType);
                  const key = `litc_layout_components_${interfaceToLoad.id}`;
                  const saved = localStorage.getItem(key);
                  if (saved) {
                    setComponents(JSON.parse(saved));
                  } else {
                    const roleSaved = localStorage.getItem(`litc_layout_components_${interfaceToLoad.roleType}`);
                    setComponents(roleSaved ? JSON.parse(roleSaved) : initialComponents);
                  }
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                  setIsManagerMode(false);
                }}
                style={{ flex: 1, padding: '14px', background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(255,59,48,0.3)' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                موافق، افتح الواجهة
              </button>
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                }}
                style={{ flex: 1, padding: '14px', background: '#F5F5F7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#EBEBEB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F5F5F7'}
              >
                إلغاء والعودة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
