import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export type ComponentCategory = 'submission' | 'operations' | 'intelligence' | 'admin';

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
  // ─── Submission Modules ───
  { id: 'ticket_create', name: 'إنشاء التذكرة وتوجيهها الأولي', category: 'submission', isActive: true, target_zone: 'Main_Viewport', properties: { targetDestinations: [], maxAttachmentSize: 5, descriptionLimit: 1000, authorizedPathManager: '', enforceAttachments: false, enforceDescription: true, singleTicketRestriction: false, issueTaxonomy: {} } },
  { id: 'user_tickets_view', name: 'لوحة استعراض التذاكر المرسلة', category: 'submission', isActive: true, target_zone: 'Main_Viewport', properties: { showStatusBadges: true, allowCancellation: false } },
  { id: 'user_profile', name: 'الملف الشخصي وإعدادات الحساب', category: 'submission', isActive: false, target_zone: 'Top_Navbar', properties: { allowThemeCustomization: true, allowPasswordChange: true } },
  { id: 'knowledge_base_user', name: 'الأدلة المعرفية ومكتبة المساعدة', category: 'submission', isActive: false, target_zone: 'Main_Viewport', properties: { enableSearch: true, autoSuggest: true } },

  // ─── Operations Modules ───
  { id: 'inbound_tickets_hub', name: 'لوحة التذاكر الواردة متعددة التبويبات', category: 'operations', isActive: true, target_zone: 'Main_Viewport', properties: { tabsConfig: { NEW: true, IN_PROGRESS: true, PENDING: true, CLOSED: true }, routingScope: 'INTERNAL_TEAM', allowedCrossEscalationRoles: ['OPERATIONAL_MANAGER', 'SECTION_HEAD'], snatchingGovernance: true } },
  { id: 'audit_timeline', name: 'شريط الزمن التدقيقي لمسار التذكرة', category: 'operations', isActive: false, target_zone: 'Main_Viewport', properties: { showInternalNotes: false, detailedTimestamps: true } },
  { id: 'notifications_hub', name: 'مركز الإشعارات والتنبيهات', category: 'operations', isActive: false, target_zone: 'Top_Navbar', properties: { inApp: true, office365Email: true, pushNotifications: true } },
  { id: 'engineer_live_status', name: 'لوحة الحالة الحية للمهندسين', category: 'operations', isActive: false, target_zone: 'Main_Viewport', properties: { mapIntegration: false, autoRefreshSeconds: 30 } },
  { id: 'quick_actions_panel', name: 'لوحة الإجراءات السريعة', category: 'operations', isActive: false, target_zone: 'Main_Viewport', properties: { enableOneClickClose: false, escalateToManager: true, enableHandshakeTransfer: true, enableDependencyLock: true } },

  // ─── Intelligence & Governance ───
  { id: 'analytics_dashboard', name: 'التحليل المركزي للمؤشرات', category: 'intelligence', isActive: true, target_zone: 'Main_Viewport', properties: { activeCharts: ['kpi_cards', 'bar_chart'], dateRangeEnabled: true, managerAnalyticsControl: { allowEngineerDrilldown: true, allowLocationFilter: true, allowTaxonomyFilter: true }, adminOverride: false, enabledDimensions: ['GEO', 'STRUCT', 'TAXONOMY', 'TIME'] } },
  { id: 'cross_comparison', name: 'المقارنات التقاطعية للفرق', category: 'intelligence', isActive: false, target_zone: 'Main_Viewport', properties: { allowedMetrics: ['VOLUME', 'SPEED', 'SLA'], maxComparisonElements: 3, allowedComparisonTypes: ['ENGINEERS', 'LOCATIONS', 'PROBLEMS'] } },
  { id: 'advanced_reports', name: 'لوحة التقارير المتقدمة', category: 'intelligence', isActive: false, target_zone: 'Main_Viewport', properties: { exportFormats: ['PDF', 'EXCEL'], autoSchedule: false } },
  { id: 'inventory_assets', name: 'إدارة العهد والمخازن الفنية', category: 'intelligence', isActive: false, target_zone: 'Main_Viewport', properties: { allowManagerToEnforceRules: true, flexibleApprovalChain: 'DEPT_HEAD_ONLY' } },
  { id: 'historical_archive', name: 'الأرشيف التاريخي', category: 'intelligence', isActive: true, target_zone: 'Main_Viewport', properties: { archiveScope: 'Department_Only', enableHistoricalExport: true } },
  { id: 'sla_monitor', name: 'شاشة مراقبة الـ SLA', category: 'intelligence', isActive: false, target_zone: 'Main_Viewport', properties: { warningThreshold: 15, autoEscalate: true } },

  // ─── System Admin Modules ───
  { id: 'governance_config', name: 'مكون إعدادات الحوكمة وتخصيص الواجهات', category: 'admin', isActive: false, target_zone: 'Main_Viewport', properties: { restrictToSuperAdmin: true } },
  { id: 'system_audit_logs', name: 'سجل العمليات والأمان الشامل', category: 'admin', isActive: false, target_zone: 'Main_Viewport', properties: { logRetentionDays: 90, trackLogins: true } },
  { id: 'global_settings', name: 'الإعدادات العامة والربط الشبكي', category: 'admin', isActive: false, target_zone: 'Main_Viewport', properties: { defaultLanguage: 'ar', enableSSO: true } }
];

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#0f172a',
    padding: '24px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    direction: 'rtl' as const,
    boxSizing: 'border-box' as const,
  },
  header: {
    marginBottom: '24px',
    borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
    paddingBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#6366f1',
    margin: 0,
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0
  },
  saveBtn: {
    backgroundColor: '#059669',
    color: '#0f172a',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  masterGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: 'calc(100vh - 120px)'
  },
  glassBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
  },
  boxHeader: {
    backgroundColor: '#f1f5f9',
    padding: '16px',
    borderBottom: '1px solid rgba(6, 182, 212, 0.3)',
    textAlign: 'center' as const
  },
  boxTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#059669'
  },
  boxSub: {
    margin: '4px 0 0 0',
    fontSize: '10px',
    color: '#64748b'
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 120px)',
    padding: '0 8px',
  },
  item: {
    backgroundColor: '#e8eef6',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#334155',
    transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab'
  },
  itemActive: {
    border: '1px solid #22d3ee',
    backgroundColor: '#e0f2fe'
  },
  propBox: {
    backgroundColor: '#000000',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #1e293b',
    marginBottom: '12px'
  },
  input: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    color: '#6366f1',
    padding: '8px',
    fontSize: '12px',
    boxSizing: 'border-box' as const,
    marginTop: '8px'
  },
  switchTrue: {
    width: '36px',
    height: '20px',
    backgroundColor: '#06b6d4',
    borderRadius: '10px',
    position: 'relative' as const,
    cursor: 'pointer'
  },
  switchFalse: {
    width: '36px',
    height: '20px',
    backgroundColor: '#475569',
    borderRadius: '10px',
    position: 'relative' as const,
    cursor: 'pointer'
  },
  knobTrue: {
    width: '14px', height: '14px', backgroundColor: 'white', borderRadius: '50%',
    position: 'absolute' as const, top: '3px', right: '19px', transition: 'right 0.2s'
  },
  knobFalse: {
    width: '14px', height: '14px', backgroundColor: 'white', borderRadius: '50%',
    position: 'absolute' as const, top: '3px', right: '3px', transition: 'right 0.2s'
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


export type CoreRole = 'END_USER' | 'OPERATIONAL_USER' | 'OPERATIONAL_MANAGER' | 'IT_ADMIN';

export interface SavedInterface {
  id: string;
  name: string;
  roleType: CoreRole;
  lastUpdated: string;
  associated_dept?: string;
  associated_section?: string;
  associated_team?: string | null;
}


const DelegationToggle = ({
  propKey,
  componentId,
  interfaceCategory,
  isDelegated,
  onChange
}: {
  propKey: string;
  componentId: string;
  interfaceCategory: CoreRole | null;
  isDelegated: boolean;
  onChange: (compId: string, propKey: string, allowed: boolean) => void;
}) => {
  if (interfaceCategory !== 'OPERATIONAL_MANAGER' && interfaceCategory !== 'IT_ADMIN') return null;

  return (
    <div style={{ marginTop: '6px', marginBottom: '4px', marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139, 92, 246, 0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px dashed rgba(139, 92, 246, 0.3)' }} onClick={e => e.stopPropagation()}>
      <input 
        type="checkbox" 
        checked={isDelegated} 
        onChange={(e) => onChange(componentId, propKey, e.target.checked)} 
        style={{ cursor: 'pointer', accentColor: '#8b5cf6', width: '12px', height: '12px' }}
      />
      <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold' }}>
        🔑 تفويض هذه الخاصية للصلاحيات الأدنى
      </span>
    </div>
  );
};

const HardCeilingToggle = ({
  propKey,
  componentId,
  currentBuilderRole,
  config,
  onChange
}: {
  propKey: string;
  componentId: string;
  currentBuilderRole: CoreRole;
  config?: CascadingCeilingConfig;
  onChange: (compId: string, propKey: string, newConfig: CascadingCeilingConfig) => void;
}) => {
  if (currentBuilderRole !== 'IT_ADMIN') return null; // Only IT_ADMIN can see and configure the hard ceiling

  const currentConfig: CascadingCeilingConfig = config || { allowedRoles: [], adminAbsoluteOverride: false };

  const handleToggleRole = (role: CoreRole) => {
    let newRoles = [...currentConfig.allowedRoles];
    if (newRoles.includes(role)) {
      newRoles = newRoles.filter(r => r !== role);
    } else {
      newRoles.push(role);
    }
    onChange(componentId, propKey, { ...currentConfig, allowedRoles: newRoles });
  };

  return (
    <div style={{ marginTop: '6px', marginBottom: '12px', marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0, 0, 0, 0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="checkbox" 
          checked={currentConfig.adminAbsoluteOverride} 
          onChange={(e) => onChange(componentId, propKey, { ...currentConfig, adminAbsoluteOverride: e.target.checked })} 
          style={{ cursor: 'pointer', accentColor: '#ef4444', width: '14px', height: '14px' }}
        />
        <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 'bold' }}>
          👑 تجاوز مطلق (Absolute Override): منع جميع הרتب الأدنى من التحكم بهذه الخاصية
        </span>
      </div>
      
      {!currentConfig.adminAbsoluteOverride && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '22px', borderRight: '1px dashed #ef4444', paddingRight: '10px' }}>
          <span style={{ fontSize: '10px', color: '#64748b' }}>أو قم بتفويض التعديل للأدوار التالية تتابعياً:</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['OPERATIONAL_MANAGER', 'OPERATIONAL_USER'].map(r => (
              <label key={r} style={{ fontSize: '10px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={currentConfig.allowedRoles.includes(r as CoreRole)}
                  onChange={() => handleToggleRole(r as CoreRole)}
                  style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                {r === 'OPERATIONAL_MANAGER' ? 'مدير إدارة' : 'رئيس قسم/فريق'}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



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

export function UILayoutEngineTab() {
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
  const [components, setComponents] = useState<UIComponentDefinition[]>(initialComponents);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // --- Cascading Override State ---
  const [currentBuilderRole, setCurrentBuilderRole] = useState<CoreRole>('IT_ADMIN');
  const { isPropertyAllowed } = useCascadingCeilingValidator(currentBuilderRole);


  // --- Interactive Live Sandbox States ---
  const [previewRole, setPreviewRole] = useState<string>('Super_Admin');
  const [previewActiveTab, setPreviewActiveTab] = useState<string>('');
  const [previewDynamicFields, setPreviewDynamicFields] = useState<any[]>([]);
  const [previewDesc, setPreviewDesc] = useState<string>('');


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
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [savedInterfaces, setSavedInterfaces] = useState<SavedInterface[]>([
    { id: 'ui_1', name: 'الواجهة الرئيسية للجمهور', roleType: 'END_USER', lastUpdated: '2023-10-01' },
    { id: 'ui_2', name: 'واجهة الدعم الفني', roleType: 'OPERATIONAL_USER', lastUpdated: '2023-10-02' },
    { id: 'ui_3', name: 'قمرة القيادة للإدارة', roleType: 'OPERATIONAL_MANAGER', lastUpdated: '2023-10-03' },
    { id: 'ui_4', name: 'لوحة تحكم الشبكات', roleType: 'OPERATIONAL_MANAGER', lastUpdated: '2023-10-04' },
    { id: 'ui_5', name: 'مركز المراقبة الشامل', roleType: 'IT_ADMIN', lastUpdated: '2023-10-05' },
  ]);



  const handleLoadInterface = (ui: SavedInterface) => {
    if (interfaceName && interfaceName.trim() !== '' && interfaceName !== ui.name) {
      setInterfaceToLoad(ui);
      setShowWarningModal(true);
    } else {
      setInterfaceName(ui.name);
      setInterfaceCategory(ui.roleType);
      // Reset active components back to default or load them if we had them (future)
      // setComponents(initialComponents); 
      setIsManagerMode(false);
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
      setComponents(prev => prev.map(c => {
        if (c.id === result.draggableId) {
          return { ...c, isActive: destination.droppableId === 'active-canvas' };
        }
        return c;
      }));
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

    const handleDelegationChange = (compId: string, propKey: string, allowed: boolean) => {
    setComponents(prev => prev.map(c => {
      if (c.id === compId) {
        const currentConfig = c.delegationConfig || {};
        return {
          ...c,
          delegationConfig: {
            ...currentConfig,
            [propKey]: { allow_override: allowed, delegated_to: '' }
          }
        };
      }
      return c;
    }));
  };

  const handleCeilingChange = (compId: string, propKey: string, newConfig: CascadingCeilingConfig) => {
    setComponents(prev => prev.map(c => {
      if (c.id === compId) {
        const currentCeiling = c.strict_ceiling_props || {};
        return {
          ...c,
          strict_ceiling_props: {
            ...currentCeiling,
            [propKey]: newConfig
          }
        };
      }
      return c;
    }));
  };

  if (isManagerMode) {
    return (
      <div style={{...styles.container, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', background: 'linear-gradient(135deg, #f8fafc, #eef2ff)'}}>
        <div style={{ background: 'rgba(241, 245, 249, 0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '24px', padding: '50px', textAlign: 'center', maxWidth: showSavedList ? '800px' : '600px', width: '100%', transition: 'max-width 0.3s ease', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          
          {!showSavedList ? (
            <>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔮</div>
              <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '15px', fontWeight: 'bold' }}>مدير حوكمة وتخصيص واجهات النظام - LITC</h1>
              <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '40px', lineHeight: '1.6' }}>مرحباً بك في المحرك السيادي لتخصيص الواجهات. يمكنك إنشاء واجهات جديدة من الصفر بمرونة فائقة، أو تعديل الواجهات المحفوظة مسبقاً لدعم عمليات النظام.</p>
              

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                <button 
                  onClick={() => {
                    setIsManagerMode(false);
                    setShowNameModal(true);
                  }}
                  style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.7)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)'; }}
                >
                  <span>➕</span> إنشاء واجهة جديدة
                </button>
                
                <button 
                  onClick={() => setShowSavedList(true)}
                  style={{ width: '100%', padding: '16px', background: 'rgba(99, 102, 241, 0.04)', color: '#334155', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)'}
                >
                  <span>📁</span> الواجهات الجاهزة والمحفوظة
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: 'rgba(241, 245, 249, 0.9)', borderRadius: '16px', padding: '20px', textAlign: 'right', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#6366f1', margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📁</span> الواجهات الجاهزة والمحفوظة
                </h3>
                <button 
                  onClick={() => setShowSavedList(false)} 
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                >
                  العودة للقائمة
                </button>
              </div>
              {savedInterfaces.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>لا توجد واجهات محفوظة حالياً.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { key: 'IT_ADMIN', label: 'مسؤول نظام (IT Admin)', color: '#ef4444' },
                    { key: 'OPERATIONAL_MANAGER', label: 'مسؤول تشغيلي (Operational Manager)', color: '#f59e0b' },
                    { key: 'OPERATIONAL_USER', label: 'مستخدم تشغيلي (Operational User)', color: '#3b82f6' },
                    { key: 'END_USER', label: 'مستخدم عادي / مرسل (End User)', color: '#10b981' }
                  ].map(category => {
                    const categoryInterfaces = savedInterfaces.filter(ui => ui.roleType === category.key);
                    if (categoryInterfaces.length === 0) return null;
                    return (
                      <div key={category.key} style={{ background: 'rgba(241, 245, 249, 0.5)', borderRadius: '12px', padding: '15px', border: `1px solid ${category.color}40` }}>
                        <h4 style={{ color: category.color, margin: '0 0 15px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: category.color, display: 'inline-block' }}></span>
                          {category.label} ({categoryInterfaces.length})
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                          {categoryInterfaces.map(ui => (
                            <div key={ui.id} style={{ background: 'rgba(241, 245, 249, 0.95)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s' }}
                                 onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${category.color}80`; }}
                                 onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.04)'; }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{ui.name}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>آخر تعديل: {ui.lastUpdated}</div>
                              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                <button onClick={() => handleLoadInterface(ui)} style={{ flex: 1, padding: '5px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>تعديل ⚙️</button>
                                <button style={{ flex: 1, padding: '5px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>حذف 🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      {/* ─── Data Loss Warning Modal ─── */}
      {showWarningModal && interfaceToLoad && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.97)', padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ color: '#f87171', margin: '0 0 15px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> تحذير: فقدان العمل غير المحفوظ
            </h3>
            
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              أنت تقوم حالياً بتعديل واجهة تحت اسم <strong style={{ color: '#6366f1' }}>({interfaceName})</strong>.
              <br/><br/>
              محاولة فتح واجهة <strong style={{ color: '#f59e0b' }}>({interfaceToLoad.name})</strong> ستؤدي إلى إزالة كل التعديلات الحالية غير المحفوظة والمكونات الموزعة وإعادة تحميل مساحة العمل بالواجهة المطلوبة.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  setInterfaceName(interfaceToLoad.name);
                  setInterfaceCategory(interfaceToLoad.roleType);
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                  setIsManagerMode(false);
                }}
                style={{ flex: 1, padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                موافق، افتح الواجهة
              </button>
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                }}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                إلغاء والعودة
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    );
  }

  return (
    <>
      <div style={{...styles.container, filter: showNameModal ? 'blur(10px)' : 'none', pointerEvents: showNameModal ? 'none' : 'auto', transition: 'filter 0.3s ease' }}>
        <div style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>
              <h2 style={{...styles.title, display: 'flex', alignItems: 'center', gap: '10px'}}>
                {interfaceName || 'واجهة جديدة بدون اسم'}
                {interfaceCategory === 'IT_ADMIN' && <span style={{fontSize: '16px'}}>🔴 مسؤول نظام</span>}
                {interfaceCategory === 'OPERATIONAL_MANAGER' && <span style={{fontSize: '16px'}}>🟠 مسؤول تشغيلي</span>}
                {interfaceCategory === 'OPERATIONAL_USER' && <span style={{fontSize: '16px'}}>🔵 مستخدم تشغيلي</span>}
                {interfaceCategory === 'END_USER' && <span style={{fontSize: '16px'}}>🟢 مستخدم عادي</span>}
              </h2>
              <p style={styles.subtitle}>مسرح تخصيص الخصائص والمكونات للواجهة المحددة.</p>
            </div>
            <button 
              onClick={() => setShowNameModal(true)}
              style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
            >
              تعديل الاسم/الدور ✏️
            </button>
          </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => { setIsManagerMode(true); setShowSavedList(true); }}
            style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#334155', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)'}
          >
            ⬅️ العودة لمدير الواجهات
          </button>
          <button onClick={() => setShowSaveReportModal(true)} style={styles.saveBtn}>حفظ التوزيع النهائي</button>
        </div>
      </div>

            <DragDropContext onDragEnd={onDragEnd}>
        <div style={styles.masterGrid}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: '1', minHeight: '300px' }}>
          {/* RIGHT: INACTIVE REPOSITORY */}
          <div style={styles.glassBox}>
            <div style={styles.boxHeader}>
              <h3 style={{...styles.boxTitle, color: '#6366f1'}}>📦 مستودع المكونات المعطلة</h3>
              <p style={styles.boxSub}>اسحب المكون للوحة الفعالة لتركيبه</p>
            </div>
            <Droppable droppableId="inactive-repository">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  style={{...styles.scrollArea, backgroundColor: snapshot.isDraggingOver ? 'rgba(56, 189, 248, 0.05)' : 'transparent'}}
                >
                  {[
                    { key: 'submission', title: '📤 مكونات الإرسال وبلاغات المستخدم' },
                    { key: 'operations', title: '⚙️ مكونات الاستقبال والمعالجة الميدانية' },
                    { key: 'intelligence', title: '🧠 مكونات الإشراف والذكاء التنظيمي' },
                    { key: 'admin', title: '👑 مكونات الإدارة والسيادة الكبرى' }
                  ].map(group => {
                    const groupComponents = inactiveComponents.filter(c => c.category === group.key);
                    if (groupComponents.length === 0) return null;
                    return (
                      <div key={group.key} style={{ marginBottom: '15px', background: 'rgba(241, 245, 249, 0.5)', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '12px', background: 'rgba(241, 245, 249, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', fontWeight: 'bold', color: '#6366f1', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                          {group.title} <span style={{ color: '#64748b' }}>({groupComponents.length})</span>
                        </div>
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {groupComponents.map((comp, localIndex) => {
                            const globalIndex = inactiveComponents.findIndex(c => c.id === comp.id);
                            return (
                              <Draggable key={comp.id} draggableId={comp.id} index={globalIndex}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...styles.item,
                                      ...provided.draggableProps.style,
                                      marginBottom: 0,
                                      backgroundColor: snapshot.isDragging ? '#ede9fe' : 'rgba(15, 23, 42, 0.6)',
                                      border: snapshot.isDragging ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.05)',
                                      backdropFilter: snapshot.isDragging ? 'none' : 'blur(10px)',
                                      boxShadow: snapshot.isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)' : 'none'
                                    }}
                                  >
                                    <div><span style={{color: '#64748b', marginRight: '8px'}}>⋮⋮</span> {comp.name}</div>
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

                    {/* LEFT: INSPECTOR PANEL */}
          <div style={{...styles.glassBox, flex: '1', minHeight: '300px'}}>
            <div style={styles.boxHeader}>
              <h3 style={{...styles.boxTitle, color: '#c084fc'}}>⚙️ خصائص المكون (Inspector)</h3>
              <p style={styles.boxSub}>حدد مكوناً للتعديل</p>
            </div>
            <div style={styles.scrollArea}>
              {selectedComponent ? (
                <div>
                  <div style={{backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '20px'}}>
                    <div style={{fontSize: '10px', color: '#64748b', marginBottom: '4px'}}>المعرف (ID)</div>
                    <div style={{fontFamily: 'monospace', fontSize: '11px', color: '#c084fc'}}>{selectedComponent.id}</div>
                    <div style={{fontSize: '10px', color: '#64748b', marginTop: '12px', marginBottom: '4px'}}>الاسم</div>
                    <div style={{fontSize: '12px', fontWeight: 'bold'}}>{selectedComponent.name}</div>
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
<DelegationToggle propKey="allowedReportFilters" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowedReportFilters']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowedReportFilters" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowedReportFilters"]} onChange={handleCeilingChange} />
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
<DelegationToggle propKey="allowedReportColumns" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowedReportColumns']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowedReportColumns" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowedReportColumns"]} onChange={handleCeilingChange} />
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
<DelegationToggle propKey="enableTimelineAuditLog" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['enableTimelineAuditLog']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="enableTimelineAuditLog" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["enableTimelineAuditLog"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("enableHistoricalExport", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.enableHistoricalExport || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'enableHistoricalExport', e.target.checked)} />
                          تفعيل زر تصدير التقارير التاريخية (Excel/PDF) 📥
                        </label>
<DelegationToggle propKey="enableHistoricalExport" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['enableHistoricalExport']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="enableHistoricalExport" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["enableHistoricalExport"]} onChange={handleCeilingChange} />
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
<DelegationToggle propKey="enabledUIFilters" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['enabledUIFilters']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="enabledUIFilters" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["enabledUIFilters"]} onChange={handleCeilingChange} />
</div>
)}</>
                          );
                        })}
                      </div>
                    </div>
                  )}



                  {selectedComponent.id === 'ticket_inbox' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص وإجراءات التذاكر الواردة:</h5>
                      {[
                        { key: 'NEW', label: 'التذاكر الجديدة', actions: ['OPEN', 'RECEIVE', 'PREVIEW'] },
                        { key: 'OPEN', label: 'التذاكر المفتوحة', actions: ['TRANSFER', 'ASSIGN', 'CLOSE', 'ESCALATE'] },
                        { key: 'TRANSFERRED', label: 'التذاكر المحولة', actions: ['ACCEPT', 'REJECT', 'REROUTE'] },
                        { key: 'STUCK', label: 'التذاكر العالقة (SLA)', actions: ['ESCALATE', 'REOPEN', 'FORCE_CLOSE'] },
                      ].map(tab => {
                        const tabsConfig = selectedComponent.properties.tabsConfig || {};
                        const tabCfg = tabsConfig[tab.key] || { active: false, actions: [] };
                        return (
                          <div key={tab.key} style={{ background: 'rgba(241,245,249,0.8)', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
<>{isPropertyAllowed("tabsConfig", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', color: tabCfg.active ? '#6366f1' : '#ccc' }}>
                              <input 
                                type="checkbox" 
                                checked={tabCfg.active} 
                                onChange={e => {
                                  const newTabsConfig = { ...tabsConfig, [tab.key]: { ...tabCfg, active: e.target.checked } };
                                  handlePropertyChange(selectedComponent.id, 'tabsConfig', newTabsConfig);
                                }} 
                              />
                              تبويب: {tab.label}
                            </label>
<DelegationToggle propKey="tabsConfig" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['tabsConfig']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="tabsConfig" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["tabsConfig"]} onChange={handleCeilingChange} />
</div>
)}</>
                            
                            {tabCfg.active && (
                              <div style={{ paddingRight: '20px', marginTop: '8px' }}>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>الإجراءات المتاحة:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {tab.actions.map(action => {
                                    const currentActions = tabCfg.actions || [];
                                    const isChecked = currentActions.includes(action);
                                    const actionLabels: Record<string, string> = {
                                      'OPEN': 'فتح', 'RECEIVE': 'استلام', 'PREVIEW': 'معاينة',
                                      'TRANSFER': 'تحويل', 'ASSIGN': 'إسناد', 'CLOSE': 'إغلاق',
                                      'ESCALATE': 'تصعيد', 'ACCEPT': 'قبول', 'REJECT': 'رفض',
                                      'REROUTE': 'إعادة توجيه', 'REOPEN': 'إعادة فتح', 'FORCE_CLOSE': 'إغلاق قسري'
                                    };
                                    return (
<>{isPropertyAllowed("tabsConfig", selectedComponent.strict_ceiling_props) && (
                                      <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={action} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', padding: '3px 8px', background: isChecked ? 'rgba(0, 229, 255, 0.1)' : 'transparent', border: `1px solid ${isChecked ? 'rgba(0,229,255,0.3)' : 'rgba(99,102,241,0.04)'}`, borderRadius: '6px' }}>
                                        <input type="checkbox" checked={isChecked} onChange={e => {
                                          let newActions = [...currentActions];
                                          if (e.target.checked) newActions.push(action); else newActions = newActions.filter((a: string) => a !== action);
                                          const newTabsConfig = { ...tabsConfig, [tab.key]: { ...tabCfg, actions: newActions } };
                                          handlePropertyChange(selectedComponent.id, 'tabsConfig', newTabsConfig);
                                        }} />
                                        {actionLabels[action] || action}
                                      </label>
<DelegationToggle propKey="tabsConfig" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['tabsConfig']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="tabsConfig" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["tabsConfig"]} onChange={handleCeilingChange} />
</div>
)}</>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedComponent.id === 'sub_ticket_engine' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص وحوكمة التذاكر الفرعية:</h5>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>1. ضوابط المحتوى</h6>
<>{isPropertyAllowed("enableDescription", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '5px' }}>
                          <input type="checkbox" checked={selectedComponent.properties.enableDescription || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'enableDescription', e.target.checked)} />
                          تفعيل حقل الوصف
                        </label>
<DelegationToggle propKey="enableDescription" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['enableDescription']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="enableDescription" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["enableDescription"]} onChange={handleCeilingChange} />
</div>
)}</>
                        {selectedComponent.properties.enableDescription && (
                          <div style={{ paddingRight: '20px', marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '11px', opacity: 0.8, marginBottom: '5px' }}>الحد الأقصى للأحرف (MaxLength):</label>
                            <input type="number" style={{ ...styles.input, width: '100px', marginBottom: '5px', padding: '5px' }} 
                              value={selectedComponent.properties.maxDescriptionLength || 500}
                              onChange={e => handlePropertyChange(selectedComponent.id, 'maxDescriptionLength', parseInt(e.target.value))} />
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>2. وضع التزامن (Concurrency Mode)</h6>
<>{isPropertyAllowed("concurrencyMode", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select style={styles.input} value={selectedComponent.properties.concurrencyMode || 'SEQUENTIAL'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'concurrencyMode', e.target.value)}>
                          <option value="SEQUENTIAL">تسلسلي (Sequential)</option>
                          <option value="PARALLEL">متزامن (Parallel)</option>
                        </select>
<DelegationToggle propKey="concurrencyMode" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['concurrencyMode']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="concurrencyMode" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["concurrencyMode"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>3. الحد الأقصى للتذاكر الفرعية</h6>
                        <input type="number" style={{ ...styles.input, width: '80px', padding: '5px' }} 
                          value={selectedComponent.properties.maxSubTickets || 2}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'maxSubTickets', parseInt(e.target.value))} />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>4. نطاق التوجيه (Routing Scope)</h6>
<>{isPropertyAllowed("routingScope", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select style={styles.input} value={selectedComponent.properties.routingScope || 'INTERNAL_TEAM'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'routingScope', e.target.value)}>
                          <option value="INTERNAL_TEAM">الفريق الداخلي فقط</option>
                          <option value="SAME_DEPARTMENT">نفس القسم</option>
                          <option value="CROSS_DEPARTMENT">أقسام مختلفة</option>
                          <option value="GLOBAL">كل الكيانات</option>
                        </select>
<DelegationToggle propKey="routingScope" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['routingScope']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="routingScope" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["routingScope"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>
                    </div>
                  )}

                  {selectedComponent.id === 'tool_roles_perms' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>مستوى الصلاحيات (Access Level):</h5>
<>{isPropertyAllowed("accessLevel", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select 
                        style={styles.input} 
                        value={selectedComponent.properties.accessLevel || 'READ_ONLY'}
                        onChange={e => handlePropertyChange(selectedComponent.id, 'accessLevel', e.target.value)}
                      >
                        <option value="READ_ONLY">قراءة فقط (Read Only)</option>
                        <option value="EDIT">تعديل (Edit)</option>
                        <option value="FULL_ACCESS">تحكم كامل (Full Access)</option>
                      </select>
<DelegationToggle propKey="accessLevel" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['accessLevel']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="accessLevel" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["accessLevel"]} onChange={handleCeilingChange} />
</div>
)}</>
                    </div>
                  )}

                  {/* ═══ ticket_create Inspector ═══ */}
                  {selectedComponent.id === 'ticket_create' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص إنشاء وتوجيه التذاكر:</h5>
                      
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
<>{isPropertyAllowed("attachmentsEnabled", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.attachmentsEnabled || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'attachmentsEnabled', e.target.checked)} />
                          السماح بالمرفقات للمستخدم
                        </label>
<DelegationToggle propKey="attachmentsEnabled" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['attachmentsEnabled']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="attachmentsEnabled" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["attachmentsEnabled"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("mandatoryAttachments", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.mandatoryAttachments || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'mandatoryAttachments', e.target.checked)} />
                          إجبار المستخدم على إرفاق ملف
                        </label>
<DelegationToggle propKey="mandatoryAttachments" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['mandatoryAttachments']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="mandatoryAttachments" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["mandatoryAttachments"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("slaConditions", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.slaConditions || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'slaConditions', e.target.checked)} />
                          ربط التذكرة بشروط الـ SLA فور إنشائها
                        </label>
<DelegationToggle propKey="slaConditions" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['slaConditions']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="slaConditions" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["slaConditions"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("voiceToText", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.voiceToText || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'voiceToText', e.target.checked)} />
                          تفعيل الإدخال الصوتي الذكي (تحويل الصوت إلى نص)
                        </label>
<DelegationToggle propKey="voiceToText" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['voiceToText']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="voiceToText" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["voiceToText"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("showPriority", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.showPriority || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'showPriority', e.target.checked)} />
                          إظهار حقل مستوى الأولوية
                        </label>
<DelegationToggle propKey="showPriority" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['showPriority']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="showPriority" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["showPriority"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("mandatoryDescription", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.mandatoryDescription || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'mandatoryDescription', e.target.checked)} />
                          إجبار المستخدم على كتابة وصف المشكلة
                        </label>
<DelegationToggle propKey="mandatoryDescription" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['mandatoryDescription']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="mandatoryDescription" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["mandatoryDescription"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>الحد الأقصى للمرفق (ميجابايت):</h6>
                        <input type="number" style={{ ...styles.input, width: '80px', padding: '5px' }} value={selectedComponent.properties.attachmentMaxSizeMB || 5}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'attachmentMaxSizeMB', parseInt(e.target.value))} />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>أنواع المرفقات المسموح بها:</h6>
                        <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
<>{isPropertyAllowed("attachmentAllowedExtensions", selectedComponent.strict_ceiling_props) && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={(selectedComponent.properties.attachmentAllowedExtensions || []).includes('PDF')} 
                              onChange={e => {
                                const exts = selectedComponent.properties.attachmentAllowedExtensions || [];
                                const newExts = e.target.checked 
                                  ? Array.from(new Set([...exts, 'PDF', 'DOCX']))
                                  : exts.filter((x: string) => x !== 'PDF' && x !== 'DOCX');
                                handlePropertyChange(selectedComponent.id, 'attachmentAllowedExtensions', newExts);
                              }} />
                            وثائق ومستندات (PDF, DOCX)
                          </label>
<DelegationToggle propKey="attachmentAllowedExtensions" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['attachmentAllowedExtensions']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="attachmentAllowedExtensions" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["attachmentAllowedExtensions"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("attachmentAllowedExtensions", selectedComponent.strict_ceiling_props) && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={(selectedComponent.properties.attachmentAllowedExtensions || []).includes('PNG')} 
                              onChange={e => {
                                const exts = selectedComponent.properties.attachmentAllowedExtensions || [];
                                const newExts = e.target.checked 
                                  ? Array.from(new Set([...exts, 'PNG', 'JPG']))
                                  : exts.filter((x: string) => x !== 'PNG' && x !== 'JPG');
                                handlePropertyChange(selectedComponent.id, 'attachmentAllowedExtensions', newExts);
                              }} />
                            صور ولقطات شاشة (PNG, JPG)
                          </label>
<DelegationToggle propKey="attachmentAllowedExtensions" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['attachmentAllowedExtensions']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="attachmentAllowedExtensions" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["attachmentAllowedExtensions"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("attachmentAllowedExtensions", selectedComponent.strict_ceiling_props) && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={(selectedComponent.properties.attachmentAllowedExtensions || []).includes('ZIP')} 
                              onChange={e => {
                                const exts = selectedComponent.properties.attachmentAllowedExtensions || [];
                                const newExts = e.target.checked 
                                  ? Array.from(new Set([...exts, 'ZIP', 'RAR']))
                                  : exts.filter((x: string) => x !== 'ZIP' && x !== 'RAR');
                                handlePropertyChange(selectedComponent.id, 'attachmentAllowedExtensions', newExts);
                              }} />
                            ملفات مضغوطة (ZIP, RAR)
                          </label>
<DelegationToggle propKey="attachmentAllowedExtensions" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['attachmentAllowedExtensions']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="attachmentAllowedExtensions" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["attachmentAllowedExtensions"]} onChange={handleCeilingChange} />
</div>
)}</>
                        </div>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>توجيه التذكرة التلقائي المزدوج:</h6>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {(selectedComponent.properties.destinationRoutes || []).map((route: string, idx: number) => (
                            <span key={idx} style={{backgroundColor: '#312e81', color: '#a5b4fc', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                              {route}
                              <span style={{ cursor: 'pointer', color: '#f87171' }} onClick={() => {
                                const routes = selectedComponent.properties.destinationRoutes.filter((r: string) => r !== route);
                                handlePropertyChange(selectedComponent.id, 'destinationRoutes', routes);
                              }}>×</span>
                            </span>
                          ))}
                        </div>
<>{isPropertyAllowed("destinationRoutes", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select style={styles.input} onChange={e => {
                          const routes = selectedComponent.properties.destinationRoutes || [];
                          if (!routes.includes(e.target.value) && e.target.value !== '') {
                            handlePropertyChange(selectedComponent.id, 'destinationRoutes', [...routes, e.target.value]);
                          }
                          e.target.value = ''; // reset
                        }}>
                          <option value="">إضافة مسار توجيه...</option>
                          <option value="IT_SUPPORT">الدعم التقني</option>
                          <option value="MAINTENANCE">الصيانة العامة</option>
                          <option value="HR">الموارد البشرية</option>
                          <option value="SECURITY">الأمن والسلامة</option>
                        </select>
<DelegationToggle propKey="destinationRoutes" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['destinationRoutes']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="destinationRoutes" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["destinationRoutes"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_analytics Inspector ═══ */}
                  {selectedComponent.id === 'admin_analytics' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>نطاق الاستعلام (Data Scope):</h5>
<>{isPropertyAllowed("dataScope", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {['PERSONAL', 'TEAM', 'SPECIFIC_EMPLOYEE'].map(scope => (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="dataScope" 
                              checked={selectedComponent.properties.dataScope === scope}
                              onChange={() => handlePropertyChange(selectedComponent.id, 'dataScope', scope)}
                            />
                            {scope === 'PERSONAL' ? 'شخصي (Personal)' : scope === 'TEAM' ? 'الفريق (Team)' : 'موظف محدد (Specific)'}
                          </label>
<DelegationToggle propKey="dataScope" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['dataScope']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="dataScope" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["dataScope"]} onChange={handleCeilingChange} />
</div>
                        ))}
                      </div>
)}</>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>الفلاتر الديناميكية المتاحة:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'BUILDING', label: 'فلتر حسب المبنى' },
                          { id: 'ISSUE_TYPE', label: 'فلتر حسب نوع المشكلة' },
                          { id: 'DEPARTMENT', label: 'فلتر حسب القسم' },
                          { id: 'DATE_RANGE', label: 'فلتر النطاق الزمني' }
                        ].map(f => {
                          const filters = selectedComponent.properties.allowedFilters || [];
                          return (
<>{isPropertyAllowed("allowedFilters", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={filters.includes(f.id)} onChange={e => {
                                let nf = [...filters];
                                if (e.target.checked) nf.push(f.id); else nf = nf.filter((x: string) => x !== f.id);
                                handlePropertyChange(selectedComponent.id, 'allowedFilters', nf);
                              }} />
                              {f.label}
                            </label>
<DelegationToggle propKey="allowedFilters" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowedFilters']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowedFilters" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowedFilters"]} onChange={handleCeilingChange} />
</div>
)}</>
                          );
                        })}
                      </div>

<>{isPropertyAllowed("filterDestDept", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.filterDestDept || false} onChange={e => handlePropertyChange(selectedComponent.id, 'filterDestDept', e.target.checked)} />
                        تفعيل فلتر التوجيه (القسم الوجهة)
                      </label>
<DelegationToggle propKey="filterDestDept" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['filterDestDept']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="filterDestDept" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["filterDestDept"]} onChange={handleCeilingChange} />
</div>
)}</>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px', marginTop: '15px' }}>الرسوم البيانية المفعلة:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'kpi_cards', label: 'بطاقات KPI' },
                          { id: 'line_chart', label: 'رسم خطي (Line)' },
                          { id: 'bar_chart', label: 'رسم عمودي (Bar)' },
                          { id: 'pie_chart', label: 'رسم دائري (Pie)' }
                        ].map(c => {
                          const charts = selectedComponent.properties.activeCharts || [];
                          return (
<>{isPropertyAllowed("activeCharts", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={charts.includes(c.id)} onChange={e => {
                                let nc = [...charts];
                                if (e.target.checked) nc.push(c.id); else nc = nc.filter((x: string) => x !== c.id);
                                handlePropertyChange(selectedComponent.id, 'activeCharts', nc);
                              }} />
                              {c.label}
                            </label>
<DelegationToggle propKey="activeCharts" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['activeCharts']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="activeCharts" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["activeCharts"]} onChange={handleCeilingChange} />
</div>
)}</>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_leaderboard Inspector ═══ */}
                  {selectedComponent.id === 'admin_leaderboard' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>محاور المقارنة المتاحة (Dimensions):</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'EMP_VS_EMP', label: 'موظف مقابل موظف' },
                          { id: 'DEPT_VS_DEPT', label: 'قسم مقابل قسم' },
                          { id: 'TIME_VS_TIME', label: 'فترة زمنية مقابل فترة' },
                          { id: 'FIELD_VS_FIELD', label: 'مستدلة حرة مقابل مستدلة' }
                        ].map(d => {
                          const dims = selectedComponent.properties.allowedDimensions || [];
                          return (
<>{isPropertyAllowed("allowedDimensions", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={dims.includes(d.id)} onChange={e => {
                                let nd = [...dims];
                                if (e.target.checked) nd.push(d.id); else nd = nd.filter((x: string) => x !== d.id);
                                handlePropertyChange(selectedComponent.id, 'allowedDimensions', nd);
                              }} />
                              {d.label}
                            </label>
<DelegationToggle propKey="allowedDimensions" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowedDimensions']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowedDimensions" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowedDimensions"]} onChange={handleCeilingChange} />
</div>
)}</>
                          );
                        })}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>مقاييس الأداء (Metrics):</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'VOLUME', label: 'حجم التذاكر (Volume)' },
                          { id: 'SPEED', label: 'سرعة الإغلاق (Speed)' },
                          { id: 'SLA', label: 'نسبة خرق الـ SLA' }
                        ].map(m => {
                          const metrics = selectedComponent.properties.allowedMetrics || [];
                          return (
<>{isPropertyAllowed("allowedMetrics", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={metrics.includes(m.id)} onChange={e => {
                                let nm = [...metrics];
                                if (e.target.checked) nm.push(m.id); else nm = nm.filter((x: string) => x !== m.id);
                                handlePropertyChange(selectedComponent.id, 'allowedMetrics', nm);
                              }} />
                              {m.label}
                            </label>
<DelegationToggle propKey="allowedMetrics" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowedMetrics']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowedMetrics" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowedMetrics"]} onChange={handleCeilingChange} />
</div>
)}</>
                          );
                        })}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>أوضاع العرض (Display Modes):</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'SIDE_BAR', label: 'رسم عمودي مزدوج (Side-by-Side Bar)' },
                          { id: 'VARIANCE_TABLE', label: 'جدول نسبة التغيير (Variance %)' }
                        ].map(dm => {
                          const modes = selectedComponent.properties.displayModes || [];
                          return (
<>{isPropertyAllowed("displayModes", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={dm.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={modes.includes(dm.id)} onChange={e => {
                                let nmodes = [...modes];
                                if (e.target.checked) nmodes.push(dm.id); else nmodes = nmodes.filter((x: string) => x !== dm.id);
                                handlePropertyChange(selectedComponent.id, 'displayModes', nmodes);
                              }} />
                              {dm.label}
                            </label>
<DelegationToggle propKey="displayModes" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['displayModes']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="displayModes" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["displayModes"]} onChange={handleCeilingChange} />
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
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>نطاق الوصول (Archive Scope):</h5>
<>{isPropertyAllowed("archiveScope", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {['Personal_Only', 'Department_Only', 'Building_Only', 'Global_Access'].map(scope => (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                            <input type="radio" name="archiveScope" checked={selectedComponent.properties.archiveScope === scope}
                              onChange={() => handlePropertyChange(selectedComponent.id, 'archiveScope', scope)} />
                            {scope.replace(/_/g, ' ')}
                          </label>
<DelegationToggle propKey="archiveScope" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['archiveScope']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="archiveScope" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["archiveScope"]} onChange={handleCeilingChange} />
</div>
                        ))}
                      </div>
)}</>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>أنواع التذاكر المسموحة:</h5>
<>{isPropertyAllowed("allowCompletedClosedTickets", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.allowCompletedClosedTickets || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'allowCompletedClosedTickets', e.target.checked)} />
                        التذاكر المنجزة والمغلقة (Completed/Closed)
                      </label>
<DelegationToggle propKey="allowCompletedClosedTickets" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowCompletedClosedTickets']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowCompletedClosedTickets" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowCompletedClosedTickets"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("allowSupplementaryAdditionalTickets", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '15px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.allowSupplementaryAdditionalTickets || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'allowSupplementaryAdditionalTickets', e.target.checked)} />
                        التذاكر الفرعية/الإضافية (Supplementary)
                      </label>
<DelegationToggle propKey="allowSupplementaryAdditionalTickets" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowSupplementaryAdditionalTickets']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowSupplementaryAdditionalTickets" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowSupplementaryAdditionalTickets"]} onChange={handleCeilingChange} />
</div>
)}</>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>فلاتر الواجهة المتاحة للمستخدم:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'operator_name', label: 'تصفية باسم الموظف (Operator)' },
                          { id: 'end_user_name', label: 'تصفية باسم المستخدم النهائي' },
                          { id: 'issue_type', label: 'تصفية بنوع المشكلة' },
                          { id: 'building_location', label: 'تصفية بالمبنى/الموقع' }
                        ].map(f => {
                          const filters = selectedComponent.properties.enabledUIFilters || [];
                          return (
<>{isPropertyAllowed("enabledUIFilters", selectedComponent.strict_ceiling_props) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
<label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={filters.includes(f.id)} onChange={e => {
                                let nf = [...filters];
                                if (e.target.checked) nf.push(f.id); else nf = nf.filter((x: string) => x !== f.id);
                                handlePropertyChange(selectedComponent.id, 'enabledUIFilters', nf);
                              }} />
                              {f.label}
                            </label>
<DelegationToggle propKey="enabledUIFilters" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['enabledUIFilters']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="enabledUIFilters" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["enabledUIFilters"]} onChange={handleCeilingChange} />
</div>
)}</>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_profile Inspector ═══ */}
                  {selectedComponent.id === 'admin_profile' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص الملف الشخصي الديناميكي:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
<>{isPropertyAllowed("allowThemeCustomization", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.allowThemeCustomization || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'allowThemeCustomization', e.target.checked)} />
                          السماح بتخصيص المظهر (Theme Customization)
                        </label>
<DelegationToggle propKey="allowThemeCustomization" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowThemeCustomization']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowThemeCustomization" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowThemeCustomization"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("manualInputFallback", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.manualInputFallback || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'manualInputFallback', e.target.checked)} />
                          تفعيل الإدخال اليدوي كبديل (Manual Input Fallback)
                        </label>
<DelegationToggle propKey="manualInputFallback" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['manualInputFallback']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="manualInputFallback" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["manualInputFallback"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>مزود الهوية (Identity Provider):</h6>
<>{isPropertyAllowed("identityProvider", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select style={styles.input} value={selectedComponent.properties.identityProvider || 'Microsoft_SSO'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'identityProvider', e.target.value)}>
                          <option value="Microsoft_SSO">Microsoft SSO</option>
                          <option value="Google_Workspace">Google Workspace</option>
                          <option value="Active_Directory">Active Directory On-Premise</option>
                          <option value="Internal_DB">قاعدة البيانات الداخلية</option>
                        </select>
<DelegationToggle propKey="identityProvider" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['identityProvider']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="identityProvider" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["identityProvider"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>لوحة الألوان المضيئة (Neon Palette):</h6>
<>{isPropertyAllowed("neonPalette", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select style={styles.input} value={selectedComponent.properties.neonPalette || 'Cyber Blue'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'neonPalette', e.target.value)}>
                          <option value="Cyber Blue">Cyber Blue</option>
                          <option value="Emerald Green">Emerald Green</option>
                          <option value="Neon Purple">Neon Purple</option>
                          <option value="Crimson Red">Crimson Red</option>
                        </select>
<DelegationToggle propKey="neonPalette" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['neonPalette']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="neonPalette" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["neonPalette"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>شفافية المظهر الزجاجي (Glass Opacity):</h6>
                        <input type="range" min="0.1" max="1.0" step="0.1" style={{ width: '100%' }}
                          value={selectedComponent.properties.glassOpacity || 0.6}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'glassOpacity', parseFloat(e.target.value))} />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedComponent.properties.glassOpacity || 0.6}</span>
                      </div>
                    </div>
                  )}

                  {/* ═══ tool_language_theme Inspector ═══ */}
                  {selectedComponent.id === 'tool_language_theme' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص اللغات والمظهر:</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
<>{isPropertyAllowed("allowUserSwitch", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.allowUserSwitch || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'allowUserSwitch', e.target.checked)} />
                          السماح للمستخدم بتغيير اللغة (User Switch)
                        </label>
<DelegationToggle propKey="allowUserSwitch" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowUserSwitch']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="allowUserSwitch" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowUserSwitch"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("darkModeEnabled", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.darkModeEnabled || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'darkModeEnabled', e.target.checked)} />
                          تفعيل النمط الداكن الافتراضي (Dark Mode)
                        </label>
<DelegationToggle propKey="darkModeEnabled" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['darkModeEnabled']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="darkModeEnabled" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["darkModeEnabled"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>اللغة الافتراضية (Default Language):</h6>
<>{isPropertyAllowed("defaultLanguage", selectedComponent.strict_ceiling_props) && (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
<select style={styles.input} value={selectedComponent.properties.defaultLanguage || 'ar'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'defaultLanguage', e.target.value)}>
                          <option value="ar">العربية (Arabic)</option>
                          <option value="en">الإنجليزية (English)</option>
                        </select>
<DelegationToggle propKey="defaultLanguage" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['defaultLanguage']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="defaultLanguage" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["defaultLanguage"]} onChange={handleCeilingChange} />
</div>
)}</>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '12px', color: '#6366f1', margin: '0 0 10px 0' }}>لون التوهج (Neon Glow Color):</h6>
                        <input type="color" style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          value={selectedComponent.properties.neonGlowColor || '#6366f1'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'neonGlowColor', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_notifications Inspector ═══ */}
                  {selectedComponent.id === 'admin_notifications' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#f97316', marginBottom: '10px' }}>⚠️ ضوابط الحوكمة السيادية:</h5>
<>{isPropertyAllowed("forceWhatsappCritical", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.forceWhatsappCritical || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'forceWhatsappCritical', e.target.checked)} />
                        فرض إشعارات WhatsApp للأحداث الحرجة 📱
                      </label>
<DelegationToggle propKey="forceWhatsappCritical" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['forceWhatsappCritical']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="forceWhatsappCritical" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["forceWhatsappCritical"]} onChange={handleCeilingChange} />
</div>
)}</>
<>{isPropertyAllowed("lockSLAThresholds", selectedComponent.strict_ceiling_props) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
<label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '15px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.lockSLAThresholds || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'lockSLAThresholds', e.target.checked)} />
                        قفل تعديل مدد الـ SLA (منع المدراء من التخفيض) 🔒
                      </label>
<DelegationToggle propKey="lockSLAThresholds" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['lockSLAThresholds']?.allow_override || false} onChange={handleDelegationChange} />
<HardCeilingToggle propKey="lockSLAThresholds" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["lockSLAThresholds"]} onChange={handleCeilingChange} />
</div>
)}</>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>حدود التصعيد الزمني (SLA Thresholds):</h5>
                      <div style={{ background: 'rgba(99,102,241,0.04)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(selectedComponent.properties.SLA_Thresholds || ['15m', '1h', '24h']).map((t: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#ef4444' }}>⏳ المستوى {i + 1}:</span>
                            <input style={{ ...styles.input, width: '80px', padding: '4px 8px' }} value={t}
                              onChange={e => {
                                const nt = [...(selectedComponent.properties.SLA_Thresholds || ['15m', '1h', '24h'])];
                                nt[i] = e.target.value;
                                handlePropertyChange(selectedComponent.id, 'SLA_Thresholds', nt);
                              }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_operational_console Inspector ═══ */}
                  {selectedComponent.id === 'admin_operational_console' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>طرق العرض المتاحة:</h5>
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
                                  <DelegationToggle propKey="allowedViews" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['allowedViews']?.allow_override || false} onChange={handleDelegationChange} />
                                  <HardCeilingToggle propKey="allowedViews" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["allowedViews"]} onChange={handleCeilingChange} />
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      
                      <React.Fragment>
                        {isPropertyAllowed("enableDragAndDrop", selectedComponent.strict_ceiling_props) && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '10px' }}>
                              <input type="checkbox" checked={selectedComponent.properties.enableDragAndDrop || false}
                                onChange={e => handlePropertyChange(selectedComponent.id, 'enableDragAndDrop', e.target.checked)} />
                              تفعيل السحب والإفلات (Drag & Drop)
                            </label>
                            <DelegationToggle propKey="enableDragAndDrop" componentId={selectedComponent.id} interfaceCategory={interfaceCategory} isDelegated={selectedComponent.delegationConfig?.['enableDragAndDrop']?.allow_override || false} onChange={handleDelegationChange} />
                            <HardCeilingToggle propKey="enableDragAndDrop" componentId={selectedComponent.id} currentBuilderRole={currentBuilderRole} config={selectedComponent.strict_ceiling_props?.["enableDragAndDrop"]} onChange={handleCeilingChange} />
                          </div>
                        )}
                      </React.Fragment>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', opacity: 0.8, marginBottom: '5px' }}>العمق الأقصى للشجرة (Max Depth):</label>
                        <input type="number" style={{ ...styles.input, width: '80px', padding: '5px' }}
                          value={selectedComponent.properties.maxDepth || 5}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'maxDepth', parseInt(e.target.value))} />
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
                      {Object.entries(selectedComponent.properties).filter(([k]) => !['destinationRoutes', 'tabsConfig', 'enableDescription', 'maxDescriptionLength', 'accessLevel', 'allowedReportFilters', 'allowedReportColumns', 'allowedFilters', 'activeCharts', 'dataScope', 'filterDestDept', 'allowedDimensions', 'allowedMetrics', 'displayModes', 'archiveScope', 'allowCompletedClosedTickets', 'allowSupplementaryAdditionalTickets', 'enabledUIFilters', 'forceWhatsappCritical', 'lockSLAThresholds', 'SLA_Thresholds', 'allowedViews', 'enableDragAndDrop', 'maxDepth', 'concurrencyMode', 'maxSubTickets', 'routingScope', 'attachmentsEnabled', 'mandatoryAttachments', 'attachmentMaxSizeMB', 'slaConditions', 'voiceToText', 'showPriority', 'allowThemeCustomization', 'manualInputFallback', 'identityProvider', 'neonPalette', 'glassOpacity', 'allowUserSwitch', 'darkModeEnabled', 'defaultLanguage', 'neonGlowColor', 'enableTimelineAuditLog', 'enableHistoricalExport', 'issueTypeCustomization', 'injectedDynamicFields', 'attachmentAllowedExtensions', 'routingDestination', 'cascadingDropdowns', 'dependencyMapping'].includes(k)).map(([key, val]) => {
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

                  {/* ═══ inbound_tickets_hub Inspector ═══ */}
                  {selectedComponent.id === 'inbound_tickets_hub' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '15px' }}>⚡ إعدادات محرك الاستقبال (Inbound Hub)</h5>
                      
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#475569', display: 'block' }}>سحب التذاكر الجبري (Snatching Power)</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>السماح للقادة بسحب التذاكر وإعادة توزيعها حسب نطاقهم</span>
                        </div>
                        <div
                          style={selectedComponent.properties.snatchingGovernance ? styles.switchTrue : styles.switchFalse}
                          onClick={() => handlePropertyChange(selectedComponent.id, 'snatchingGovernance', !selectedComponent.properties.snatchingGovernance)}
                        >
                          <div style={selectedComponent.properties.snatchingGovernance ? styles.knobTrue : styles.knobFalse}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ quick_actions_panel Inspector ═══ */}
                  {selectedComponent.id === 'quick_actions_panel' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '15px' }}>🚀 إعدادات الإجراءات السريعة (Quick Actions)</h5>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#475569', display: 'block' }}>التحويل المشروط (Handshake Transfer)</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>عدم انتقال الملكية إلا بعد قبول الطرف المستلم</span>
                        </div>
                        <div
                          style={selectedComponent.properties.enableHandshakeTransfer ? styles.switchTrue : styles.switchFalse}
                          onClick={() => handlePropertyChange(selectedComponent.id, 'enableHandshakeTransfer', !selectedComponent.properties.enableHandshakeTransfer)}
                        >
                          <div style={selectedComponent.properties.enableHandshakeTransfer ? styles.knobTrue : styles.knobFalse}></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#475569', display: 'block' }}>القفل الاعتمادي (Dependency Lock)</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>إمكانية قفل التذكرة الأم تلقائياً عند إنشاء تذكرة فرعية</span>
                        </div>
                        <div
                          style={selectedComponent.properties.enableDependencyLock ? styles.switchTrue : styles.switchFalse}
                          onClick={() => handlePropertyChange(selectedComponent.id, 'enableDependencyLock', !selectedComponent.properties.enableDependencyLock)}
                        >
                          <div style={selectedComponent.properties.enableDependencyLock ? styles.knobTrue : styles.knobFalse}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ analytics_dashboard Inspector ═══ */}
                  {selectedComponent.id === 'analytics_dashboard' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#10b981', marginBottom: '15px' }}>📈 إعدادات التحليل المركزي (Analytics)</h5>
                      
                      {currentBuilderRole === 'IT_ADMIN' ? (
                        <>
                      <div style={{ padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                          <div>
                            <h6 style={{ fontSize: '13px', color: '#059669', margin: '0 0 5px 0' }}>صلاحيات مدير الإدارة (Manager Analytics Control)</h6>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>تمكين المدير من التحكم في الفلاتر المتاحة لرؤساء الأقسام</span>
                          </div>
                        </div>

                        {[
                          { key: 'allowEngineerDrilldown', label: 'السماح برؤية أداء المهندسين بالاسم (Drilldown)' },
                          { key: 'allowLocationFilter', label: 'السماح بمقارنة وفلترة المباني والمكاتب' },
                          { key: 'allowTaxonomyFilter', label: 'السماح بفلترة تصنيفات المشاكل' }
                        ].map(ctrl => {
                          const val = selectedComponent.properties.managerAnalyticsControl?.[ctrl.key] ?? false;
                          return (
                            <div key={ctrl.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <span style={{ fontSize: '12px', color: '#475569' }}>{ctrl.label}</span>
                              <div
                                style={val ? styles.switchTrue : styles.switchFalse}
                                onClick={() => {
                                  const mac = { ...(selectedComponent.properties.managerAnalyticsControl || {}) };
                                  mac[ctrl.key] = !val;
                                  handlePropertyChange(selectedComponent.id, 'managerAnalyticsControl', mac);
                                }}
                              >
                                <div style={val ? styles.knobTrue : styles.knobFalse}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#fca5a5', display: 'block', fontWeight: 'bold' }}>تجاوز الأدمين (Admin Absolute Override)</span>
                          <span style={{ fontSize: '10px', color: '#475569' }}>فتح كافة الفلاتر إجبارياً متجاهلاً قيود المدراء (تجاوز صامت)</span>
                        </div>
                        <div
                          style={selectedComponent.properties.adminOverride ? styles.switchTrue : styles.switchFalse}
                          onClick={() => handlePropertyChange(selectedComponent.id, 'adminOverride', !selectedComponent.properties.adminOverride)}
                        >
                          <div style={selectedComponent.properties.adminOverride ? styles.knobTrue : styles.knobFalse}></div>
                        </div>
                      </div>
                      </>
                      ) : (
                        <div style={{ padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                          🔒 هذه الإعدادات مخصصة لمدير النظام (IT_ADMIN) فقط.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ cross_comparison Inspector ═══ */}
                  {selectedComponent.id === 'cross_comparison' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#8b5cf6', marginBottom: '15px' }}>⚖️ المقارنات التقاطعية (N-Elements Comparison)</h5>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '5px' }}>الحد الأقصى لعناصر المقارنة المتزامنة (N-Elements):</label>
                        <input 
                          type="number" 
                          min={2} max={10}
                          value={selectedComponent.properties.maxComparisonElements || 3}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'maxComparisonElements', parseInt(e.target.value))}
                          style={{ ...styles.input, width: '100px', padding: '6px' }}
                        />
                      </div>

                      <div style={{ padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                        <h6 style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>أنواع المقارنات المسموحة:</h6>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { type: 'ENGINEERS', label: 'مقارنة الكوادر (أداء المهندسين)' },
                            { type: 'LOCATIONS', label: 'مقارنة المواقع والمباني' },
                            { type: 'PROBLEMS', label: 'مقارنة أنواع المشاكل والتصنيفات' }
                          ].map(t => {
                            const types = selectedComponent.properties.allowedComparisonTypes || [];
                            const isChecked = types.includes(t.type);
                            return (
                              <label key={t.type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    let newTypes = [...types];
                                    if (e.target.checked) newTypes.push(t.type);
                                    else newTypes = newTypes.filter((x: string) => x !== t.type);
                                    handlePropertyChange(selectedComponent.id, 'allowedComparisonTypes', newTypes);
                                  }}
                                />
                                {t.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
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
          <div style={{ flex: '1.2', minHeight: '0', display: 'flex', flexDirection: 'column' }}>
      {/* INTERACTIVE LIVE SANDBOX (MODERN GLASSMORPHISM) ═══ */}
      <div className="scrollbar-thin" style={{ flex: '1', background: 'linear-gradient(135deg, #f8fafc 0%, #f3f4f6 50%, rgba(239, 246, 255, 0.8) 100%)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(148, 163, 184, 0.2)', color: '#1e293b', display: 'flex', flexDirection: 'column', maxHeight: '750px', overflowY: 'auto', paddingRight: '8px' }}>
        
        {/* Sandbox Toolbar */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.8)', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' }}>
            <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🧪</span> المعاينة الحية للواجهة (Modern Live Preview)
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>محاكاة الدور (Role Testing):</label>
            <select style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: 'rgba(255,255,255,0.9)', fontSize: '12px', color: '#475569', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', outline: 'none', cursor: 'pointer' }} value={previewRole} onChange={(e) => setPreviewRole(e.target.value)}>
              <option value="Super_Admin">مدير نظام (Super Admin)</option>
              <option value="Dept_Head">رئيس قسم (Dept Head)</option>
              <option value="Field_Engineer">مهندس ميداني (Field Engineer)</option>
            </select>
          </div>
        </div>

        {/* Sandbox Shell Areas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', direction: 'rtl', padding: '20px', gap: '20px' }}>
          
          {/* Top Navbar Zone */}
          <div style={{ height: '65px', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(226, 232, 240, 0.4)', display: 'flex', alignItems: 'center', padding: '0 25px', justifyContent: 'flex-end', gap: '15px' }}>
            {activeComponents.filter(c => c.target_zone === 'Top_Navbar').map(c => (
              <div key={c.id} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', boxShadow: '0 4px 6px rgba(148, 163, 184, 0.1)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>{c.id === 'admin_profile' ? '👤' : c.id === 'admin_notifications' ? '🔔' : '🌐'}</span> {c.name}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
            {/* Dynamic Sidebar Zone */}
            <div style={{ width: '260px', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(226, 232, 240, 0.4)', padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>القائمة الملاحية (DYNAMIC SIDEBAR)</div>
              <Droppable droppableId="active-canvas">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px', backgroundColor: snapshot.isDraggingOver ? 'rgba(56, 189, 248, 0.1)' : 'transparent', borderRadius: '12px', padding: '5px', transition: 'all 0.3s' }}
                  >
                    {activeComponents.map((c, index) => (
                      <Draggable key={c.id} draggableId={c.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setPreviewActiveTab(c.id)}
                            style={{
                              padding: '12px 18px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              background: previewActiveTab === c.id ? 'rgba(56, 189, 248, 0.15)' : snapshot.isDragging ? 'rgba(255,255,255,0.9)' : 'transparent',
                              color: previewActiveTab === c.id ? '#0284c7' : '#1e293b',
                              border: previewActiveTab === c.id ? '1px solid rgba(56, 189, 248, 0.3)' : snapshot.isDragging ? '1px solid #38bdf8' : '1px solid transparent',
                              boxShadow: previewActiveTab === c.id ? '0 4px 6px rgba(56, 189, 248, 0.1)' : snapshot.isDragging ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none',
                              ...provided.draggableProps.style
                            }}
                          >
                            {c.name}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Main Viewport Zone */}
            <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(226, 232, 240, 0.4)', padding: '30px', overflowY: 'auto' }}>
              {previewActiveTab ? (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h2 style={{ margin: '0 0 25px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '24px', background: '#0ea5e9', borderRadius: '4px' }}></span>
                    {activeComponents.find(c => c.id === previewActiveTab)?.name || 'غير معروف'}
                  </h2>
                  
                  {previewActiveTab === 'ticket_create' && (() => {
                    const tProps = activeComponents.find(c => c.id === 'ticket_create')?.properties || {};
                    const targets = tProps.targetDestinations || [];
                    const isInstantRouting = targets.length === 1;
                    const maxDesc = tProps.descriptionLimit || 1000;
                    const taxRaw = tProps.issueTaxonomyRaw || '';
                    const taxonomyLines = taxRaw.split('\n').filter((l: string) => l.trim() !== '');
                    const taxonomyList = taxonomyLines.map((line: string) => {
                      const [main, sub] = line.split('|');
                      return { main: main?.trim() || '', sub: sub ? sub.split(',').map((s: string) => s.trim()) : [] };
                    }).filter((t: any) => t.main !== '');

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {!isInstantRouting && (
                          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.5)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#0369a1', fontWeight: 'bold' }}>توجيه التذكرة (Routing)</h4>
                            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>إلى أي إدارة تريد إرسال هذه التذكرة؟ <span style={{ color: '#ef4444' }}>*</span></label>
                            <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#0f172a', outline: 'none', color: '#475569' }}>
                              <option value="">-- اختر الإدارة المستقبلة --</option>
                              {targets.map((deptId: string) => {
                                const deptName = mockOrgStructure.find(d => d.id === deptId)?.name || deptId;
                                return <option key={deptId} value={deptId}>{deptName}</option>;
                              })}
                            </select>
                          </div>
                        )}

                        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>الموقع الفعلي (Physical Location)</h4>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>المبنى الحالي <span style={{ color: '#ef4444' }}>*</span></label>
                              <select 
                                value={selectedBuildingForPreview}
                                onChange={e => setSelectedBuildingForPreview(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#0f172a', outline: 'none', color: '#475569' }}
                              >
                                <option value="">-- المبنى --</option>
                                {corporateLocations.map(loc => (
                                  <option key={loc.id} value={loc.id}>{loc.buildingName}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>الإدارة التابع لها أو المكتب <span style={{ color: '#ef4444' }}>*</span></label>
                              <select 
                                disabled={!selectedBuildingForPreview}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: !selectedBuildingForPreview ? '#f1f5f9' : '#0f172a', outline: 'none', color: '#475569' }}
                              >
                                <option value="">-- الإدارة أو المكتب --</option>
                                {selectedBuildingForPreview && corporateLocations.find(l => l.id === selectedBuildingForPreview)?.offices.map(off => (
                                  <option key={off.id} value={off.id}>{off.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>تصنيف المشكلة (Issue Taxonomy)</h4>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>المشكلة الرئيسية <span style={{ color: '#ef4444' }}>*</span></label>
                              <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#0f172a', outline: 'none', color: '#475569' }}>
                                <option value="">-- اختر المشكلة الرئيسية --</option>
                                {taxonomyList.map((t: any, i: number) => <option key={i}>{t.main}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>المشكلة الفرعية <span style={{ color: '#ef4444' }}>*</span></label>
                              <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#0f172a', outline: 'none', color: '#475569' }}>
                                <option value="">-- اختر المشكلة الفرعية --</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>تفاصيل التذكرة والمرفقات</h4>
                          
                          <input type="text" placeholder="عنوان التذكرة (اختياري، يولد تلقائياً إن ترك فارغاً)" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#0f172a', marginBottom: '15px', outline: 'none' }} />
                          
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span>وصف المشكلة بالتفصيل {tProps.enforceDescription && <span style={{ color: '#ef4444' }}>*</span>}</span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>0 / {maxDesc}</span>
                            </label>
                            <textarea 
                              placeholder="الرجاء كتابة تفاصيل المشكلة هنا..."
                              style={{ width: '100%', padding: '12px', minHeight: '100px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#0f172a', outline: 'none', resize: 'vertical' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span>إرفاق ملفات أو صور {tProps.enforceAttachments && <span style={{ color: '#ef4444' }}>*</span>}</span>
                              <span style={{ fontSize: '10px', color: '#64748b' }}>الحد الأقصى: {tProps.maxAttachmentSize || 5}MB</span>
                            </label>
                            <div style={{ width: '100%', padding: '20px', border: '2px dashed rgba(203, 213, 225, 0.8)', borderRadius: '8px', background: 'rgba(248, 250, 252, 0.5)', textAlign: 'center', cursor: 'pointer', color: '#64748b', fontSize: '12px' }}>
                              + اسحب الملفات هنا أو اضغط للاستعراض
                            </div>
                          </div>
                        </div>

                        <button style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', color: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(14, 165, 233, 0.3)' }}>
                          إرسال التذكرة 🚀
                        </button>
                      </div>
                    );
                  })()}

                  
{previewActiveTab === 'inbound_tickets_hub' && (() => {
  const p = activeComponents.find(c => c.id === 'inbound_tickets_hub')?.properties || {};
  const snatching = p.snatchingGovernance || false;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>لوحة التذاكر الواردة</h4>
        
        {/* Context-Aware Tabs Mock */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '10px' }}>
          {['NEW', 'IN_PROGRESS', 'PENDING', 'CLOSED'].map((tab, i) => (
             <div key={tab} style={{ padding: '8px 16px', borderRadius: '20px', background: i===0 ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: i===0 ? '#0284c7' : '#64748b', fontSize: '12px', fontWeight: i===0 ? 'bold' : 'normal', cursor: 'pointer' }}>
                {tab}
             </div>
          ))}
        </div>

        {/* Data Filtering Mock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '15px', background: '#0f172a', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>تذكرة #10294</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>مشكلة في الشبكة - مسندة إلى: أحمد (مهندس)</div>
            </div>
            {snatching && (
              <button style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>سحب التذكرة ✋</button>
            )}
          </div>
          <div style={{ padding: '15px', background: '#0f172a', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>تذكرة #10295</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>تحديث النظام - جديدة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})()}

{previewActiveTab === 'quick_actions_panel' && (() => {
  const p = activeComponents.find(c => c.id === 'quick_actions_panel')?.properties || {};
  const handshake = p.enableHandshakeTransfer || false;
  const depLock = p.enableDependencyLock || false;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>الإجراءات السريعة (Quick Actions)</h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button style={{ padding: '10px 15px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(2, 132, 199, 0.2)' }}>
            إسناد لنفسي 🙋‍♂️
          </button>
          
          <button style={{ padding: '10px 15px', background: 'rgba(255, 255, 255, 0.9)', color: '#475569', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            تحويل التذكرة {handshake && <span style={{ color: '#f59e0b', fontSize: '10px', marginLeft: '5px' }}>(مشروط 🤝)</span>}
          </button>

          <button style={{ padding: '10px 15px', background: 'rgba(255, 255, 255, 0.9)', color: '#475569', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
            إنشاء تذكرة فرعية {depLock && <span style={{ color: '#ef4444', fontSize: '10px', marginLeft: '5px' }}>(قفل الاعتماد 🔒)</span>}
          </button>
        </div>
      </div>

      {/* Visual Mock for Handshake / Sub-ticket Popup Animation */}
      <div style={{ marginTop: '10px', padding: '20px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative glass glare */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }}></div>
        
        {handshake ? (
           <div style={{ position: 'relative', zIndex: 1 }}>
             <h5 style={{ margin: '0 0 10px 0', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ fontSize: '16px' }}>🤝</span> نافذة التحويل المشروط (Handshake Transfer)
             </h5>
             <p style={{ margin: '0 0 15px 0', fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>أنت تقوم بتحويل هذه التذكرة. لن تنتقل الملكية رسمياً حتى يوافق الطرف الآخر. ستظل التذكرة بحالة (Pending Acceptance).</p>
             <div style={{ display: 'flex', gap: '10px' }}>
               <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '12px', outline: 'none' }}>
                 <option>اختر الزميل...</option>
                 <option>م. خليل (فريق الشبكات)</option>
               </select>
               <button style={{ padding: '10px 20px', background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}>إرسال طلب التحويل</button>
             </div>
           </div>
        ) : depLock ? (
           <div style={{ position: 'relative', zIndex: 1 }}>
             <h5 style={{ margin: '0 0 10px 0', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ fontSize: '16px' }}>🔒</span> تذكرة فرعية مع قفل اعتمادي (Dependency Locked Sub-Ticket)
             </h5>
             <p style={{ margin: '0 0 15px 0', fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>سيؤدي إرسال هذه التذكرة الفرعية إلى تحويل التذكرة الأصلية فوراً لحالة <strong style={{ color: '#ef4444' }}>(معلقة Blocked)</strong> حتى يتم إنجاز التذكرة الفرعية.</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <input type="text" placeholder="عنوان التذكرة الفرعية..." style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '12px', outline: 'none' }} />
               <button style={{ alignSelf: 'flex-end', padding: '10px 20px', background: '#0284c7', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>إنشاء وقفل التذكرة الأصلية</button>
             </div>
           </div>
        ) : (
           <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '20px' }}>
             قم بتفعيل خيار "التحويل المشروط" أو "القفل الاعتمادي" من المفتش لرؤية النوافذ التفاعلية هنا.
           </div>
        )}
      </div>
    </div>
  );
})()}


{previewActiveTab === 'analytics_dashboard' && (() => {
  const p = activeComponents.find(c => c.id === 'analytics_dashboard')?.properties || {};
  const isOverride = p.adminOverride || false;
  // NOTE: In the sandbox, 'previewRole' is used to simulate the role viewing the UI
  const isSectionHead = previewRole === 'Dept_Head'; // Adjusted to match the actual roles dropdown value
  const drilldown = isOverride || (!isSectionHead || p.managerAnalyticsControl?.allowEngineerDrilldown);
  const locationF = isOverride || (!isSectionHead || p.managerAnalyticsControl?.allowLocationFilter);
  const taxF = isOverride || (!isSectionHead || p.managerAnalyticsControl?.allowTaxonomyFilter);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(16px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>لوحة التحليل المركزي (OLAP Engine)</span>
          {isOverride && <span style={{ fontSize: '10px', background: '#fca5a5', color: '#7f1d1d', padding: '4px 8px', borderRadius: '4px' }}>Admin Override Active</span>}
        </h4>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {locationF ? (
            <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
              <option>📍 تصفية حسب المبنى</option>
              <option>المبنى الرئيسي (طرابلس)</option>
              <option>فرع بنغازي</option>
            </select>
          ) : (
            <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🔒 تصفية المباني مقفلة</div>
          )}
          
          {taxF ? (
            <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
              <option>🗂️ تصفية حسب التصنيف</option>
              <option>أعطال تقنية</option>
              <option>أعطال تشغيلية</option>
            </select>
          ) : (
            <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🔒 تصفية التصنيفات مقفلة</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 2, height: '220px', background: 'rgba(255,255,255,0.8)', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <span style={{ fontWeight: 'bold', color: '#475569' }}>مؤشرات الأداء الزمنية</span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {drilldown ? (
              <div style={{ flex: 1, background: '#0f172a', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>🏆 أفضل المهندسين أداءً</span>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}><span>م. أحمد سالم</span><span>120 تذكرة</span></div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}><span>م. سارة علي</span><span>115 تذكرة</span></div>
              </div>
            ) : (
              <div style={{ flex: 1, background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', marginBottom: '5px' }}>🔒</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>تفاصيل المهندسين محجوبة</span>
                <span style={{ fontSize: '9px' }}>بناءً على قيود الصلاحية</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
})()}

{previewActiveTab === 'cross_comparison' && (() => {
  const p = activeComponents.find(c => c.id === 'cross_comparison')?.properties || {};
  const maxElements = p.maxComparisonElements || 3;
  const types = p.allowedComparisonTypes || ['ENGINEERS'];
  const activeType = types[0] || 'ENGINEERS';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }} className="scrollbar-thin">
        {types.map((t: string) => (
          <div key={t} style={{ padding: '8px 16px', background: t === activeType ? '#8b5cf6' : 'rgba(255,255,255,0.6)', color: t === activeType ? '#0f172a' : '#64748b', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', border: `1px solid ${t === activeType ? '#8b5cf6' : 'rgba(203, 213, 225, 0.8)'}`, transition: 'all 0.3s' }}>
            {t === 'ENGINEERS' ? 'المهندسين' : t === 'LOCATIONS' ? 'المباني' : 'المشاكل'}
          </div>
        ))}
        {types.length === 0 && <span style={{ fontSize: '12px', color: '#ef4444' }}>لا توجد أنواع مقارنات مسموحة</span>}
      </div>

      <div style={{ height: '300px', padding: '20px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'flex-end' }}>
        <div style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>مؤشر الأداء ({activeType === 'ENGINEERS' ? 'أسماء المهندسين' : activeType === 'LOCATIONS' ? 'أسماء المباني' : 'أنواع المشاكل'})</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', borderBottom: '2px solid #cbd5e1' }}>
           {['يناير', 'فبراير', 'مارس'].map((month, idx) => (
             <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
               <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                  {Array.from({ length: maxElements }).map((_, barIdx) => {
                     const colors = [['#8b5cf6', '#6d28d9'], ['#ec4899', '#be185d'], ['#3b82f6', '#1d4ed8'], ['#10b981', '#047857']];
                     const color = colors[barIdx % colors.length];
                     const h = 40 + Math.random() * 50;
                     return (
                       <div key={barIdx} style={{ width: maxElements > 5 ? '10px' : '20px', height: `${h}%`, background: `linear-gradient(180deg, ${color[0]} 0%, ${color[1]} 100%)`, borderRadius: '4px 4px 0 0', opacity: 0.9, transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} title={`عنصر ${barIdx + 1}`}></div>
                     );
                  })}
               </div>
               <span style={{ fontSize: '11px', color: '#64748b' }}>{month}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
})()}

{previewActiveTab === 'admin_analytics' && (
                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                      {['📈 مؤشرات الأداء الحية', '📊 التوزيع الجغرافي للتذاكر'].filter(chart => {
                        if (previewRole === 'Field_Engineer') return false; // Role-based filtering simulation
                        return true;
                      }).map((chart, idx) => (
                        <div key={idx} style={{ flex: 1, height: '180px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                          {chart}
                        </div>
                      ))}
                      {previewRole === 'Field_Engineer' && (
                        <div style={{ padding: '30px', background: 'rgba(254, 226, 226, 0.5)', border: '1px solid rgba(252, 165, 165, 0.5)', borderRadius: '16px', color: '#b91c1c', fontSize: '14px', width: '100%', textAlign: 'center', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '32px' }}>🔒</span>
                          ليس لديك صلاحية عرض التحليلات المتقدمة بصلاحية (مهندس ميداني).
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6th Component: admin_archive */}
                  {previewActiveTab === 'admin_archive' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.6)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.8)' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {activeComponents.find(c => c.id === 'admin_archive')?.properties.enabledUIFilters?.map((filter: string, idx: number) => (
                            <select key={idx} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#0f172a', fontSize: '12px', outline: 'none' }}>
                              <option>تصفية: {filter}</option>
                            </select>
                          ))}
                        </div>
                        {activeComponents.find(c => c.id === 'admin_archive')?.properties.enableHistoricalExport && (
                          <button style={{ padding: '8px 16px', background: '#10b981', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
                            تصدير التقرير 📥
                          </button>
                        )}
                      </div>
                      
                      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.8)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <thead style={{ background: 'rgba(241, 245, 249, 0.8)', textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                          <tr>
                            <th style={{ padding: '12px 15px' }}>رقم التذكرة</th>
                            <th style={{ padding: '12px 15px' }}>التصنيف</th>
                            <th style={{ padding: '12px 15px' }}>القسم</th>
                            <th style={{ padding: '12px 15px' }}>الحالة التاريخية</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: '13px', color: '#475569' }}>
                          {[1, 2, 3].map(row => (
                            <tr key={row} style={{ borderTop: '1px solid rgba(226, 232, 240, 0.5)' }}>
                              <td style={{ padding: '15px' }}>#TKT-2026-00{row}</td>
                              <td style={{ padding: '15px' }}>عطل تقني متقدم</td>
                              <td style={{ padding: '15px' }}>العمليات المركزية</td>
                              <td style={{ padding: '15px' }}>
                                <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>مغلقة نهائياً</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {activeComponents.find(c => c.id === 'admin_archive')?.properties.enableTimelineAuditLog && (
                        <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', borderLeft: '4px solid #3b82f6' }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e40af' }}>📜 شريط السجل التاريخي المتكامل (Timeline Audit Log)</h5>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>• 2026-05-30 14:00 - تم إغلاق التذكرة بواسطة (مدير النظام)</div>
                            <div>• 2026-05-28 09:30 - تم تحويل التذكرة للقسم الفني (مهندس ميداني)</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '15px' }}>
                  <span style={{ fontSize: '48px', opacity: 0.5 }}>🖥️</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b' }}>الرجاء اختيار مكون من القائمة الجانبية للمعاينة</div>
                  <div style={{ fontSize: '13px' }}>المربع الوسطي (Main Viewport) جاهز للرندرة الديناميكية</div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
          </div>
      </DragDropContext>
      </div>

      {showNameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(16px)', padding: '40px', borderRadius: '20px', width: '450px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ color: '#0f172a', marginBottom: '20px', fontSize: '20px' }}>تعريف الواجهة الجديدة والتصنيف</h3>
            
            <div style={{ textAlign: 'right', marginBottom: '25px', marginTop: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#6366f1', marginBottom: '12px', display: 'block' }}>1. أولاً: اختر التصنيف المعماري (الدور):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { id: 'IT_ADMIN', label: 'مسؤول نظام', icon: '🔴' },
                  { id: 'OPERATIONAL_MANAGER', label: 'مسؤول تشغيلي', icon: '🟠' },
                  { id: 'OPERATIONAL_USER', label: 'مستخدم تشغيلي', icon: '🔵' },
                  { id: 'END_USER', label: 'مستخدم عادي', icon: '🟢' }
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
                      padding: '12px', 
                      borderRadius: '10px', 
                      border: `1px solid ${interfaceCategory === role.id ? '#3b82f6' : 'rgba(99,102,241,0.08)'}`, 
                      background: interfaceCategory === role.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(241,245,249,0.9)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: interfaceCategory === role.id ? 'bold' : 'normal',
                      color: interfaceCategory === role.id ? '#0f172a' : '#94a3b8',
                      transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px', opacity: interfaceCategory ? 1 : 0.4, transition: 'opacity 0.3s' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: interfaceCategory ? '#6366f1' : '#64748b', marginBottom: '8px', display: 'block' }}>2. ثانياً: أدخل اسم الواجهة:</label>
              <input 
                id="interface_name_input"
                type="text" 
                placeholder={interfaceCategory ? "مثال: واجهة الدعم الفني الخاصة" : "الرجاء اختيار التصنيف أولاً..."}
                value={interfaceName}
                disabled={!interfaceCategory}
                onChange={e => setInterfaceName(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', boxSizing: 'border-box', borderRadius: '10px', border: `1px solid ${interfaceCategory ? 'rgba(255, 255, 255, 0.3)' : 'rgba(99, 102, 241, 0.08)'}`, background: interfaceCategory ? 'rgba(241, 245, 249, 0.95)' : 'rgba(0, 0, 0, 0.1)', color: '#0f172a', fontSize: '15px', outline: 'none', transition: 'all 0.3s', cursor: interfaceCategory ? 'text' : 'not-allowed' }}
                onFocus={e => { if(interfaceCategory) e.target.style.borderColor = '#3b82f6'; }}
                onBlur={e => { if(interfaceCategory) e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
              />
            </div>

            {/* 3. Cascading Dropdowns for Operational Context */}
            {(interfaceCategory === 'OPERATIONAL_USER' || interfaceCategory === 'OPERATIONAL_MANAGER') && (
              <div style={{ textAlign: 'right', marginBottom: '25px', padding: '20px', background: 'rgba(99, 102, 241, 0.04)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#6366f1', marginBottom: '15px', display: 'block' }}>3. ثالثاً: السياق التشغيلي للواجهة:</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {interfaceCategory === 'OPERATIONAL_MANAGER' && (
                    <div style={{ marginBottom: '10px', background: 'rgba(241,245,249,0.9)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                      <label style={{ fontSize: '12px', color: '#6366f1', marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>تحديد مستوى الإدارة للمسؤول <span style={{color: '#ef4444'}}>*</span></label>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input type="radio" name="mgmt_level" value="DEPT_HEAD" checked={managementLevel === 'DEPT_HEAD'} onChange={e => { setManagementLevel(e.target.value); setSelectedSection(''); setSelectedTeam(''); }} style={{ accentColor: '#6366f1' }} /> مدير إدارة
                        </label>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input type="radio" name="mgmt_level" value="SECTION_HEAD" checked={managementLevel === 'SECTION_HEAD'} onChange={e => { setManagementLevel(e.target.value); setSelectedTeam(''); }} style={{ accentColor: '#6366f1' }} /> رئيس قسم
                        </label>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input type="radio" name="mgmt_level" value="TEAM_LEADER" checked={managementLevel === 'TEAM_LEADER'} onChange={e => setManagementLevel(e.target.value)} style={{ accentColor: '#6366f1' }} /> رئيس فريق
                        </label>
                      </div>
                    </div>
                  )}

                  {((interfaceCategory === 'OPERATIONAL_USER') || (interfaceCategory === 'OPERATIONAL_MANAGER' && managementLevel)) && (
                    <>
                      <div>
                        <label style={{ fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'block' }}>الإدارة التشغيلية <span style={{color: '#ef4444'}}>*</span></label>
                        <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedSection(''); setSelectedTeam(''); }} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(241,245,249,0.95)', color: '#0f172a', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                          <option value="">-- اختر الإدارة --</option>
                          {interfaceCategory === 'OPERATIONAL_MANAGER' && managementLevel === 'DEPT_HEAD' && <option value="NEW_DEPARTMENT_PLACEHOLDER" style={{ color: '#fbbf24' }}>+ إضافة مسودة إدارة جديدة قيد الإنشاء</option>}
                          {mockOrgStructure.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      
                      {((interfaceCategory === 'OPERATIONAL_USER') || (managementLevel === 'SECTION_HEAD' || managementLevel === 'TEAM_LEADER')) && selectedDept && selectedDept !== 'NEW_DEPARTMENT_PLACEHOLDER' && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          <label style={{ fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'block' }}>القسم التشغيلي <span style={{color: '#ef4444'}}>*</span></label>
                          <select value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setSelectedTeam(''); }} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(241,245,249,0.95)', color: '#0f172a', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                            <option value="">-- اختر القسم --</option>
                            {mockOrgStructure.find(d => d.id === selectedDept)?.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}

                      {((interfaceCategory === 'OPERATIONAL_USER') || (managementLevel === 'TEAM_LEADER')) && selectedSection && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          <label style={{ fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>الفريق التشغيلي</span>
                            <span style={{ fontSize: '10px', background: 'rgba(99,102,241,0.08)', padding: '2px 6px', borderRadius: '4px', color: interfaceCategory === 'OPERATIONAL_USER' ? '#94a3b8' : '#ef4444' }}>
                              {interfaceCategory === 'OPERATIONAL_USER' ? 'اختياري' : 'إجباري *'}
                            </span>
                          </label>
                          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(241,245,249,0.95)', color: '#0f172a', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                            <option value="">{interfaceCategory === 'OPERATIONAL_USER' ? '-- بدون فريق محدد (تابعية مباشرة للقسم) --' : '-- اختر الفريق --'}</option>
                            {mockOrgStructure.find(d => d.id === selectedDept)?.sections.find(s => s.id === selectedSection)?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <button 
              disabled={(() => {
                if (!interfaceName.trim() || !interfaceCategory) return true;
                if (interfaceCategory === 'END_USER' || interfaceCategory === 'IT_ADMIN') return false;
                if (interfaceCategory === 'OPERATIONAL_USER') return !selectedDept || !selectedSection;
                if (interfaceCategory === 'OPERATIONAL_MANAGER') {
                  if (!managementLevel) return true;
                  if (managementLevel === 'DEPT_HEAD') return !selectedDept;
                  if (managementLevel === 'SECTION_HEAD') return !selectedDept || !selectedSection;
                  if (managementLevel === 'TEAM_LEADER') return !selectedDept || !selectedSection || !selectedTeam;
                }
                return true;
              })()}
              onClick={() => {
                if(interfaceName.trim() && interfaceCategory) {
                  setShowNameModal(false);
                }
              }}
              style={{ width: '100%', padding: '14px', background: (interfaceName.trim() === '' || !interfaceCategory) ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)', color: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: (interfaceName.trim() === '' || !interfaceCategory) ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
            >
              البدء بتصميم الواجهة 🚀
            </button>
            <button 
              onClick={() => { setShowNameModal(false); if(!interfaceName.trim()) setIsManagerMode(true); }}
              style={{ width: '100%', padding: '10px', background: 'transparent', color: '#64748b', border: 'none', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}
            >
              إلغاء الرجوع
            </button>
          </div>
        </div>
      )}

      {/* ─── Save Confirmation Report Modal ─── */}
      {showSaveReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.97)', padding: '40px', borderRadius: '20px', width: '500px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ color: '#059669', marginBottom: '20px', fontSize: '22px', textAlign: 'center' }}>✨ تقرير اعتماد الواجهة التشغيلية</h3>
            
            <div style={{ background: 'rgba(241, 245, 249, 0.9)', borderRadius: '12px', padding: '20px', marginBottom: '25px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>اسم الواجهة:</span>
                <strong style={{ color: '#0f172a', fontSize: '15px' }}>{interfaceName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>الدور الرئيسي (التصنيف):</span>
                <strong style={{ color: '#6366f1', fontSize: '15px' }}>
                  {interfaceCategory === 'IT_ADMIN' && '🔴 مسؤول نظام'}
                  {interfaceCategory === 'OPERATIONAL_MANAGER' && '🟠 مسؤول تشغيلي'}
                  {interfaceCategory === 'OPERATIONAL_USER' && '🔵 مستخدم تشغيلي'}
                  {interfaceCategory === 'END_USER' && '🟢 مستخدم عادي'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>المكونات المفعلة:</span>
                <strong style={{ color: '#10b981', fontSize: '15px' }}>{activeComponents.length} مكونات</strong>
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '14px', textAlign: 'center', marginBottom: '30px', lineHeight: '1.6' }}>
              أنت على وشك اعتماد هذه الواجهة وإدراجها ضمن المنظومة التشغيلية لتكون متاحة للتخصيص والاستخدام. هل أنت متأكد من حفظ هذا التوزيع؟
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  if(interfaceName.trim() && interfaceCategory) {
                    setSavedInterfaces(prev => [...prev, {
                      id: 'ui_final_' + Date.now(),
                      name: interfaceName,
                      roleType: interfaceCategory,
                      lastUpdated: new Date().toISOString().split('T')[0],
                      associated_dept: selectedDept || undefined,
                      associated_section: selectedSection || undefined,
                      associated_team: selectedTeam || null
                    }]);
                    setShowSaveReportModal(false);
                    setInterfaceName('');
                    setInterfaceCategory(null);
                    setSelectedDept('');
                    setSelectedSection('');
                    setSelectedTeam('');
                    setIsManagerMode(true);
                  }
                }}
                style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                اعتماد وحفظ نهائي ✅
              </button>
              <button 
                onClick={() => setShowSaveReportModal(false)}
                style={{ flex: 1, padding: '14px', background: 'rgba(99, 102, 241, 0.04)', color: '#334155', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                الرجوع للتعديل ↩️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Data Loss Warning Modal ─── */}
      {showWarningModal && interfaceToLoad && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.97)', padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ color: '#f87171', margin: '0 0 15px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> تحذير: فقدان العمل غير المحفوظ
            </h3>
            
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              أنت تقوم حالياً بتعديل واجهة تحت اسم <strong style={{ color: '#6366f1' }}>({interfaceName})</strong>.
              <br/><br/>
              محاولة فتح واجهة <strong style={{ color: '#f59e0b' }}>({interfaceToLoad.name})</strong> ستؤدي إلى إزالة كل التعديلات الحالية غير المحفوظة والمكونات الموزعة وإعادة تحميل مساحة العمل بالواجهة المطلوبة.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  // Confirm and Overwrite
                  setInterfaceName(interfaceToLoad.name);
                  setInterfaceCategory(interfaceToLoad.roleType);
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                  setIsManagerMode(false);
                }}
                style={{ flex: 1, padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                موافق، افتح الواجهة
              </button>
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setInterfaceToLoad(null);
                }}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
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
