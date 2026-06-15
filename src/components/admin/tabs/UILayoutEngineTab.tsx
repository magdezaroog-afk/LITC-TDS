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
      <div style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif", color: '#1D1D1F', display: 'flex', flexDirection: 'column', minHeight: '85vh', background: 'transparent' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 20px' }}>

          {!showSavedList ? (
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', padding: '48px 40px', textAlign: 'center', maxWidth: '540px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg, #5856D6, #AF52DE)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 8px 24px rgba(88,86,214,0.3)' }}>⚡</div>
              <h1 style={{ fontSize: '22px', color: '#1D1D1F', marginBottom: '10px', fontWeight: '800', letterSpacing: '-0.4px' }}>محرك هندسة الواجهات</h1>
              <p style={{ fontSize: '14px', color: '#6E6E73', marginBottom: '36px', lineHeight: '1.7' }}>أنشئ وخصّص واجهات النظام لكل دور بمرونة كاملة دون أي قيود تقنية.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => { setIsManagerMode(false); setShowNameModal(true); }}
                  style={{ width: '100%', padding: '14px', background: '#5856D6', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(88,86,214,0.35)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(88,86,214,0.45)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(88,86,214,0.35)'; }}
                >
                  <span style={{ fontSize: '18px' }}>+</span> إنشاء واجهة جديدة
                </button>

                <button
                  onClick={() => setShowSavedList(true)}
                  style={{ width: '100%', padding: '14px', background: '#F5F5F7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(88,86,214,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F5F5F7'}
                >
                  <span>📁</span> الواجهات المحفوظة
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '800px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: '#1D1D1F', margin: 0, fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: 'rgba(88,86,214,0.1)', color: '#5856D6', padding: '6px', borderRadius: '8px', fontSize: '14px' }}>📁</span>
                  الواجهات المحفوظة
                </h3>
                <button
                  onClick={() => setShowSavedList(false)}
                  style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.08)', color: '#1D1D1F', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: "inherit" }}
                >
                  رجوع
                </button>
              </div>
              {savedInterfaces.length === 0 ? (
                <div style={{ color: '#AEAEB2', fontSize: '14px', textAlign: 'center', padding: '40px' }}>لا توجد واجهات محفوظة حالياً.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { key: 'IT_ADMIN', label: 'مسؤول النظام', color: '#FF3B30', icon: '🔴' },
                    { key: 'OPERATIONAL_MANAGER', label: 'المسؤول التشغيلي', color: '#FF9500', icon: '🟠' },
                    { key: 'OPERATIONAL_USER', label: 'المستخدم التشغيلي', color: '#007AFF', icon: '🔵' },
                    { key: 'END_USER', label: 'المستخدم العادي', color: '#34C759', icon: '🟢' }
                  ].map(category => {
                    const categoryInterfaces = savedInterfaces.filter(ui => ui.roleType === category.key);
                    if (categoryInterfaces.length === 0) return null;
                    return (
                      <div key={category.key} style={{ background: '#F5F5F7', borderRadius: '12px', padding: '16px', border: `1px solid ${category.color}20` }}>
                        <h4 style={{ color: category.color, margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{category.icon}</span> {category.label} ({categoryInterfaces.length})
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
                          {categoryInterfaces.map(ui => (
                            <div key={ui.id} style={{ background: '#FFFFFF', borderRadius: '10px', padding: '14px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s ease', cursor: 'default', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                                 onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${category.color}50`; e.currentTarget.style.boxShadow = `0 4px 12px ${category.color}15`; }}
                                 onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1D1D1F' }}>{ui.name}</div>
                              <div style={{ fontSize: '11px', color: '#AEAEB2' }}>آخر تعديل: {ui.lastUpdated}</div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <button onClick={() => handleLoadInterface(ui)} style={{ flex: 1, padding: '6px', background: `${category.color}12`, border: `1px solid ${category.color}30`, color: category.color, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>تعديل</button>
                                <button style={{ flex: 1, padding: '6px', background: '#FFF1F0', border: '1px solid #FECACA', color: '#FF3B30', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>حذف</button>
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

            {/* ── LEFT PANEL: Repository + Inspector ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>

              {/* Component Repository */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden', flexShrink: 0, maxHeight: '45%' }}>
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
                      style={{ display: 'flex', flexDirection: 'row', gap: '10px', overflowX: 'auto', overflowY: 'hidden', padding: '12px 16px', backgroundColor: snapshot.isDraggingOver ? 'rgba(88,86,214,0.03)' : 'transparent', minHeight: '120px', scrollbarWidth: 'none' }}
                    >
                      {[
                        { key: 'submission', label: 'الإرسال', color: '#34C759', icon: '📤' },
                        { key: 'operations', label: 'الاستقبال', color: '#007AFF', icon: '⚙️' },
                        { key: 'intelligence', label: 'الذكاء', color: '#FF9500', icon: '🧠' },
                        { key: 'admin', label: 'الإدارة', color: '#FF3B30', icon: '👑' }
                      ].map(group => {
                        const groupComponents = inactiveComponents.filter(c => c.category === group.key);
                        if (groupComponents.length === 0) return null;
                        return (
                           <div key={group.key} style={{ flex: '0 0 180px', background: '#F5F5F7', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '8px 10px', background: `${group.color}10`, borderBottom: `1px solid ${group.color}18`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px' }}>{group.icon}</span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: group.color }}>{group.label}</span>
                              <span style={{ fontSize: '11px', color: '#AEAEB2', marginInlineStart: 'auto', background: '#FFFFFF', borderRadius: '10px', padding: '1px 6px', border: `1px solid ${group.color}20` }}>{groupComponents.length}</span>
                            </div>
                            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto', flex: 1 }}>
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

                {/* Bottom Control Console */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  background: '#F5F5F7',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  direction: 'rtl'
                }}>
                  {/* Right: Scroll progress indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '120px',
                      height: '4px',
                      background: 'rgba(0, 0, 0, 0.08)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: `${scrollPercent}%`,
                        background: '#5856D6',
                        borderRadius: '2px',
                        transition: 'width 0.15s ease-out'
                      }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600', width: '32px', textAlign: 'left', fontFamily: 'monospace' }}>
                      {Math.round(scrollPercent)}%
                    </span>
                  </div>

                  {/* Left: Premium scroll navigation buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleScrollRepo('left')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(88, 86, 214, 0.08)',
                        border: '1px solid rgba(88, 86, 214, 0.15)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#5856D6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.background = 'rgba(88, 86, 214, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(88, 86, 214, 0.08)'; }}
                    >
                      <span>→</span>
                      <span>السابق</span>
                    </button>
                    <button
                      onClick={() => handleScrollRepo('right')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(88, 86, 214, 0.08)',
                        border: '1px solid rgba(88, 86, 214, 0.15)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#5856D6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.background = 'rgba(88, 86, 214, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(88, 86, 214, 0.08)'; }}
                    >
                      <span>التالي</span>
                      <span>←</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Inspector Panel ── */}
              <div style={{ ...styles.glassBox, flex: 1, overflow: 'hidden' }}>
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
          </div> {/* End col-span-4 */}

          {/* LEFT SIDE (col-span-8): LIVE SANDBOX (MODERN GLASSMORPHISM) ═══ */}
          <div className="col-span-8 flex flex-col h-full overflow-hidden">
            <div className="admin-scroll" style={{ flex: '1', backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)', color: '#1D1D1F', display: 'flex', flexDirection: 'column', maxHeight: '750px', overflowY: 'auto', transition: 'all 0.25s ease' }}>
        
        {/* Sandbox Toolbar */}
        <div style={{ position: 'sticky', top: 0, background: '#F5F5F7', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: '#1D1D1F', fontSize: '14px' }}>
            <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🧪</span> المعاينة الحية للواجهة (Modern Live Preview)
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>محاكاة الدور (Role Testing):</label>
            <select style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#FFFFFF', fontSize: '12px', color: '#1D1D1F', fontWeight: '600', outline: 'none', cursor: 'pointer' }} value={previewRole} onChange={(e) => setPreviewRole(e.target.value)}>
              <option value="Super_Admin">مدير نظام (Super Admin)</option>
              <option value="Dept_Head">رئيس قسم (Dept Head)</option>
              <option value="Field_Engineer">مهندس ميداني (Field Engineer)</option>
            </select>
          </div>
        </div>

        {/* Sandbox Shell Areas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', direction: 'rtl', padding: '20px', gap: '20px' }}>
          
          {/* iOS Style Main Canvas */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', background: '#F2F2F7', borderRadius: '32px', border: '8px solid #1D1D1F', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            
            {/* Top Navbar Zone (Simulated iOS Status Bar Area) */}
            <div style={{ height: '56px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'flex-end', gap: '10px', zIndex: 10 }}>
              {activeComponents.filter(c => c.target_zone === 'Top_Navbar').map(c => (
                <div key={c.id} style={{ padding: '6px 12px', background: '#F5F5F7', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#1D1D1F', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>{c.id === 'admin_profile' ? '👤' : c.id === 'admin_notifications' ? '🔔' : '🌐'}</span> {c.name}
                </div>
              ))}
            </div>

            {/* Viewport and Dynamic Sidebar Wrapper */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              
              {/* Modern Dynamic Navigation Panel */}
              <div style={{ width: '250px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(0,0,0,0.08)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 5 }}>
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
                                  border: isActive ? '1px solid rgba(0,0,0,0.04)' : '1px solid transparent',
                                  boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.05)' : snapshot.isDragging ? '0 12px 24px rgba(0,0,0,0.1)' : 'none',
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
                                  {c.category === 'submission' ? '📤' : c.category === 'operations' ? '⚙️' : c.category === 'intelligence' ? '🧠' : '👑'}
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

              {/* Main Viewport Zone */}
              <div style={{ flex: 1, background: '#FFFFFF', padding: '24px', overflowY: 'auto', paddingBottom: '120px' }} className="scrollbar-thin">

              {previewActiveTab ? (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h2 style={{ margin: '0 0 20px 0', color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '700' }}>
                    <span style={{ width: '4px', height: '20px', background: '#5856D6', borderRadius: '2px' }}></span>
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
                          <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#1D1D1F', fontWeight: '700' }}>توجيه التذكرة (Routing)</h4>
                            <label style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600', display: 'block', marginBottom: '8px' }}>إلى أي إدارة تريد إرسال هذه التذكرة؟ <span style={{ color: '#FF3B30' }}>*</span></label>
                            <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}>
                              <option value="">-- اختر الإدارة المستقبلة --</option>
                              {targets.map((deptId: string) => {
                                const deptName = mockOrgStructure.find(d => d.id === deptId)?.name || deptId;
                                return <option key={deptId} value={deptId}>{deptName}</option>;
                              })}
                            </select>
                          </div>
                        )}

                        <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#1D1D1F', fontWeight: '700' }}>الموقع الفعلي (Physical Location)</h4>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600', display: 'block', marginBottom: '8px' }}>المبنى الحالي <span style={{ color: '#FF3B30' }}>*</span></label>
                              <select 
                                value={selectedBuildingForPreview}
                                onChange={e => setSelectedBuildingForPreview(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}
                              >
                                <option value="">-- المبنى --</option>
                                {corporateLocations.map(loc => (
                                  <option key={loc.id} value={loc.id}>{loc.buildingName}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600', display: 'block', marginBottom: '8px' }}>الإدارة التابع لها أو المكتب <span style={{ color: '#FF3B30' }}>*</span></label>
                              <select 
                                disabled={!selectedBuildingForPreview}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: !selectedBuildingForPreview ? '#EBEBEB' : '#F5F5F7', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit', opacity: !selectedBuildingForPreview ? 0.6 : 1 }}
                              >
                                <option value="">-- الإدارة أو المكتب --</option>
                                {selectedBuildingForPreview && corporateLocations.find(l => l.id === selectedBuildingForPreview)?.offices.map(off => (
                                  <option key={off.id} value={off.id}>{off.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#1D1D1F', fontWeight: '700' }}>تصنيف المشكلة (Issue Taxonomy)</h4>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600', display: 'block', marginBottom: '8px' }}>المشكلة الرئيسية <span style={{ color: '#FF3B30' }}>*</span></label>
                              <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}>
                                <option value="">-- اختر المشكلة الرئيسية --</option>
                                {taxonomyList.map((t: any, i: number) => <option key={i}>{t.main}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600', display: 'block', marginBottom: '8px' }}>المشكلة الفرعية <span style={{ color: '#FF3B30' }}>*</span></label>
                              <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', outline: 'none', color: '#1D1D1F', fontFamily: 'inherit' }}>
                                <option value="">-- اختر المشكلة الفرعية --</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#1D1D1F', fontWeight: '700' }}>تفاصيل التذكرة والمرفقات</h4>
                          
                          <input type="text" placeholder="عنوان التذكرة (اختياري، يولد تلقائياً إن ترك فارغاً)" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', marginBottom: '15px', outline: 'none', fontFamily: 'inherit', color: '#1D1D1F' }} />
                          
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span>وصف المشكلة بالتفصيل {tProps.enforceDescription && <span style={{ color: '#FF3B30' }}>*</span>}</span>
                              <span style={{ fontSize: '10px', color: '#AEAEB2' }}>0 / {maxDesc}</span>
                            </label>
                            <textarea 
                              placeholder="الرجاء كتابة تفاصيل المشكلة هنا..."
                              style={{ width: '100%', padding: '12px', minHeight: '100px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: '#1D1D1F' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span>إرفاق ملفات أو صور {tProps.enforceAttachments && <span style={{ color: '#FF3B30' }}>*</span>}</span>
                              <span style={{ fontSize: '10px', color: '#AEAEB2' }}>الحد الأقصى: {tProps.maxAttachmentSize || 5}MB</span>
                            </label>
                            <div style={{ width: '100%', padding: '20px', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '8px', background: '#F9F9FB', textAlign: 'center', cursor: 'pointer', color: '#6E6E73', fontSize: '13px', fontWeight: '500' }}>
                              + اسحب الملفات هنا أو اضغط للاستعراض
                            </div>
                          </div>
                        </div>

                        <button style={{ width: '100%', padding: '14px', background: '#007AFF', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,122,255,0.3)', transition: 'transform 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
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
      <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#1D1D1F', fontWeight: '700' }}>لوحة التذاكر الواردة</h4>
        
        {/* Context-Aware Tabs Mock */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px' }}>
          {['الجديدة', 'قيد المعالجة', 'معلقة', 'مغلقة'].map((tab, i) => (
             <div key={tab} style={{ padding: '8px 16px', borderRadius: '20px', background: i===0 ? '#E5F1FF' : 'transparent', color: i===0 ? '#007AFF' : '#6E6E73', fontSize: '13px', fontWeight: i===0 ? '700' : '500', cursor: 'pointer' }}>
                {tab}
             </div>
          ))}
        </div>

        {/* Data Filtering Mock */}
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
})()}

{previewActiveTab === 'quick_actions_panel' && (() => {
  const p = activeComponents.find(c => c.id === 'quick_actions_panel')?.properties || {};
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

      {/* Visual Mock for Handshake / Sub-ticket Popup Animation */}
      <div style={{ marginTop: '10px', padding: '20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', boxShadow: '0 12px 24px rgba(0,0,0,0.06)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden' }}>
        {handshake ? (
           <div style={{ position: 'relative', zIndex: 1 }}>
             <h5 style={{ margin: '0 0 10px 0', color: '#FF9500', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                <span style={{ fontSize: '18px' }}>🤝</span> نافذة التحويل المشروط (Handshake Transfer)
             </h5>
             <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6E6E73', lineHeight: '1.6' }}>أنت تقوم بتحويل هذه التذكرة. لن تنتقل الملكية رسمياً حتى يوافق الطرف الآخر. ستظل التذكرة بحالة معلقة.</p>
             <div style={{ display: 'flex', gap: '10px' }}>
               <select style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '13px', outline: 'none', background: '#F5F5F7', fontFamily: 'inherit' }}>
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
      <div style={{ padding: '24px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#1D1D1F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700' }}>
          <span>لوحة التحليل المركزي (OLAP Engine)</span>
          {isOverride && <span style={{ fontSize: '11px', background: '#FFF1F0', color: '#FF3B30', padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA' }}>تجاوز المشرف النشط</span>}
        </h4>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
          {locationF ? (
            <select style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', outline: 'none', background: '#F5F5F7', fontFamily: 'inherit', color: '#1D1D1F' }}>
              <option>📍 تصفية حسب المبنى</option>
              <option>المبنى الرئيسي (طرابلس)</option>
              <option>فرع بنغازي</option>
            </select>
          ) : (
            <div style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#F9F9FB', color: '#AEAEB2', border: '1px dashed rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🔒 تصفية المباني مقفلة</div>
          )}
          
          {taxF ? (
            <select style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', outline: 'none', background: '#F5F5F7', fontFamily: 'inherit', color: '#1D1D1F' }}>
              <option>🗂️ تصفية حسب التصنيف</option>
              <option>أعطال تقنية</option>
              <option>أعطال تشغيلية</option>
            </select>
          ) : (
            <div style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#F9F9FB', color: '#AEAEB2', border: '1px dashed rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🔒 تصفية التصنيفات مقفلة</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 2, height: '220px', background: '#F9F9FB', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <span style={{ fontWeight: '600', color: '#6E6E73' }}>مؤشرات الأداء الزمنية</span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {drilldown ? (
              <div style={{ flex: 1, background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px' }}>🏆 أفضل المهندسين أداءً</span>
                <div style={{ fontSize: '12px', color: '#6E6E73', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontWeight: '500' }}>م. أحمد سالم</span><span>120 تذكرة</span></div>
                <div style={{ fontSize: '12px', color: '#6E6E73', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '500' }}>م. سارة علي</span><span>115 تذكرة</span></div>
              </div>
            ) : (
              <div style={{ flex: 1, background: '#FFF1F0', borderRadius: '12px', border: '1px solid #FECACA', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FF3B30', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', marginBottom: '6px' }}>🔒</span>
                <span style={{ fontSize: '12px', fontWeight: '700' }}>تفاصيل المهندسين محجوبة</span>
                <span style={{ fontSize: '10px', marginTop: '4px' }}>بناءً على قيود الصلاحية</span>
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
          <div key={t} style={{ padding: '8px 18px', background: t === activeType ? '#5856D6' : '#F5F5F7', color: t === activeType ? '#FFFFFF' : '#6E6E73', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: `1px solid ${t === activeType ? '#5856D6' : 'rgba(0,0,0,0.08)'}`, transition: 'all 0.2s' }}>
            {t === 'ENGINEERS' ? 'المهندسين' : t === 'LOCATIONS' ? 'المباني' : 'المشاكل'}
          </div>
        ))}
        {types.length === 0 && <span style={{ fontSize: '13px', color: '#FF3B30' }}>لا توجد أنواع مقارنات مسموحة</span>}
      </div>

      <div style={{ height: '300px', padding: '24px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'flex-end', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: '13px', color: '#1D1D1F', fontWeight: '700' }}>مؤشر الأداء ({activeType === 'ENGINEERS' ? 'أسماء المهندسين' : activeType === 'LOCATIONS' ? 'أسماء المباني' : 'أنواع المشاكل'})</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
           {['يناير', 'فبراير', 'مارس'].map((month, idx) => (
             <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
               <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100%' }}>
                  {Array.from({ length: maxElements }).map((_, barIdx) => {
                     const colors = [['#5856D6', '#AF52DE'], ['#007AFF', '#34C759'], ['#FF9500', '#FF3B30']];
                     const color = colors[barIdx % colors.length];
                     const h = 40 + Math.random() * 50;
                     return (
                       <div key={barIdx} style={{ width: maxElements > 5 ? '12px' : '24px', height: `${h}%`, background: `linear-gradient(180deg, ${color[0]} 0%, ${color[1]} 100%)`, borderRadius: '6px 6px 0 0', opacity: 0.9, transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} title={`عنصر ${barIdx + 1}`}></div>
                     );
                  })}
               </div>
               <span style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600' }}>{month}</span>
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
                        <div key={idx} style={{ flex: 1, height: '180px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D1D1F', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                          {chart}
                        </div>
                      ))}
                      {previewRole === 'Field_Engineer' && (
                        <div style={{ padding: '30px', background: '#FFF1F0', border: '1px solid #FECACA', borderRadius: '16px', color: '#FF3B30', fontSize: '14px', width: '100%', textAlign: 'center', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '32px' }}>🔒</span>
                          ليس لديك صلاحية عرض التحليلات المتقدمة بصلاحية (مهندس ميداني).
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6th Component: admin_archive */}
                  {previewActiveTab === 'admin_archive' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {activeComponents.find(c => c.id === 'admin_archive')?.properties.enabledUIFilters?.map((filter: string, idx: number) => (
                            <select key={idx} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)', background: '#F5F5F7', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#1D1D1F' }}>
                              <option>تصفية: {filter}</option>
                            </select>
                          ))}
                        </div>
                        {activeComponents.find(c => c.id === 'admin_archive')?.properties.enableHistoricalExport && (
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
                              <th style={{ padding: '14px 20px', fontWeight: '600' }}>القسم</th>
                              <th style={{ padding: '14px 20px', fontWeight: '600' }}>الحالة التاريخية</th>
                            </tr>
                          </thead>
                          <tbody style={{ fontSize: '14px', color: '#1D1D1F' }}>
                            {[1, 2, 3].map(row => (
                              <tr key={row} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                <td style={{ padding: '16px 20px', fontWeight: '500' }}>#TKT-2026-00{row}</td>
                                <td style={{ padding: '16px 20px' }}>عطل تقني متقدم</td>
                                <td style={{ padding: '16px 20px' }}>العمليات المركزية</td>
                                <td style={{ padding: '16px 20px' }}>
                                  <span style={{ padding: '4px 10px', background: '#E8F5E9', color: '#34C759', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>مغلقة نهائياً</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {activeComponents.find(c => c.id === 'admin_archive')?.properties.enableTimelineAuditLog && (
                        <div style={{ marginTop: '10px', padding: '20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', borderRight: '4px solid #007AFF', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1D1D1F', fontWeight: '700' }}>📜 شريط السجل التاريخي المتكامل (Timeline Audit Log)</h5>
                          <div style={{ fontSize: '13px', color: '#6E6E73', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#007AFF' }}/> 2026-05-30 14:00 - تم إغلاق التذكرة بواسطة (مدير النظام)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF9500' }}/> 2026-05-28 09:30 - تم تحويل التذكرة للقسم الفني (مهندس ميداني)</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#AEAEB2', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', background: '#F5F5F7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🖱️</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1D1D1F' }}>حدد مكوناً من مساحة العمل</div>
                  <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '250px', lineHeight: '1.6' }}>سيتم عرض المعاينة الحية للمكون المختار هنا ليتسنى لك رؤية التعديلات بشكل تفاعلي.</div>
                </div>
              )}
                        </div> {/* End flex wrapper */}
            
            </div>
          </div>
          </div>
        </div>
        </div>
        </div>

      </DragDropContext>
      </div>

      {showNameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '24px', width: '500px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#1D1D1F', marginBottom: '24px', fontSize: '22px', fontWeight: '800' }}>تعريف الواجهة والتصنيف (Configuration)</h3>
            
            <div style={{ textAlign: 'right', marginBottom: '25px', marginTop: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#1D1D1F', marginBottom: '12px', display: 'block' }}>1. أولاً: اختر التصنيف المعماري (Role / Persona):</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'IT_ADMIN', label: 'مسؤول نظام', icon: '💻' },
                  { id: 'OPERATIONAL_MANAGER', label: 'مسؤول تشغيلي', icon: '📊' },
                  { id: 'OPERATIONAL_USER', label: 'مستخدم تشغيلي', icon: '🛠️' },
                  { id: 'END_USER', label: 'مستخدم عادي', icon: '👤' }
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
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
