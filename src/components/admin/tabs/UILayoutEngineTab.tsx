import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export type ComponentCategory = 'tickets' | 'admin' | 'tools';

export interface UIComponentDefinition {
  id: string;
  name: string;
  category: ComponentCategory;
  isActive: boolean;
  target_zone?: 'Top_Navbar' | 'Dynamic_Sidebar' | 'Main_Viewport' | 'Status_Footer';
  properties: Record<string, any>;
}

const initialComponents: UIComponentDefinition[] = [
  // ─── Tickets ───
  { id: 'ticket_create', name: 'إنشاء وتوجيه التذاكر', category: 'tickets', isActive: true, target_zone: 'Main_Viewport', properties: { destinationRoutes: ['IT_SUPPORT'], mandatoryAttachments: false, slaConditions: true, issueTypeCustomization: 'DEFAULT', voiceToText: true, showPriority: true, injectedDynamicFields: [], attachmentsEnabled: true, attachmentMaxSizeMB: 5, attachmentAllowedExtensions: ['PDF', 'ZIP', 'JPG'], routingDestination: 'AUTO', cascadingDropdowns: {}, dependencyMapping: {} } },
  { id: 'ticket_inbox', name: 'التذاكر الواردة متعددة التبويبات', category: 'tickets', isActive: true, target_zone: 'Main_Viewport', properties: { tabsConfig: { NEW: { active: true, actions: ['OPEN', 'RECEIVE', 'PREVIEW'] }, OPEN: { active: true, actions: ['TRANSFER', 'ASSIGN', 'CLOSE', 'ESCALATE'] }, TRANSFERRED: { active: true, actions: ['ACCEPT', 'REJECT', 'REROUTE'] }, STUCK: { active: false, actions: ['ESCALATE', 'REOPEN'] } } } },
  { id: 'sub_ticket_engine', name: 'محرك التذاكر الفرعية وحوكمة الوصف', category: 'tickets', isActive: false, target_zone: 'Main_Viewport', properties: { enableDescription: true, maxDescriptionLength: 500, concurrencyMode: 'SEQUENTIAL', maxSubTickets: 2, routingScope: 'INTERNAL_TEAM', isEscalated: false, escalatedTo: 'IT_Admin' } },
  
  // ─── Admin ───
  { id: 'admin_analytics', name: 'التحليل المركزي وذكاء الأعمال', category: 'admin', isActive: true, target_zone: 'Main_Viewport', properties: { dataScope: 'TEAM', filterDestDept: true, activeCharts: ['kpi_cards', 'bar_chart'], allowedFilters: ['BUILDING', 'ISSUE_TYPE', 'DEPARTMENT', 'DATE_RANGE'], dateRangeEnabled: true, allowedScope: ['PERSONAL', 'TEAM', 'SPECIFIC_EMPLOYEE'], routingFilters: { transferredFrom: true, transferredTo: true, subTickets: true } } },
  { id: 'admin_leaderboard', name: 'المقارنة (Leaderboard)', category: 'admin', isActive: false, target_zone: 'Main_Viewport', properties: { allowedDimensions: ['EMP_VS_EMP', 'DEPT_VS_DEPT'], allowedMetrics: ['VOLUME', 'SPEED', 'SLA'], displayModes: ['SIDE_BAR', 'VARIANCE_TABLE'], injectedFieldForComparison: '' } },
  { id: 'admin_archive', name: 'الأرشيف المركزي', category: 'admin', isActive: true, target_zone: 'Main_Viewport', properties: { archiveScope: 'Department_Only', allowCompletedClosedTickets: true, allowSupplementaryAdditionalTickets: true, enabledUIFilters: ['operator_name', 'end_user_name', 'issue_type', 'building_location'], enableTimelineAuditLog: true, enableHistoricalExport: true } },
  { id: 'admin_profile', name: 'الملف الشخصي الديناميكي', category: 'admin', isActive: true, target_zone: 'Top_Navbar', properties: { allowThemeCustomization: true, identityProvider: 'Microsoft_SSO', manualInputFallback: true, neonPalette: 'Cyber Blue', glassOpacity: 0.6 } },
  { id: 'admin_notifications', name: 'نظام الإشعارات وتنبيهات SLA', category: 'admin', isActive: false, target_zone: 'Top_Navbar', properties: { forceWhatsApp: true, forceWhatsappCritical: true, lockSLAThresholds: false, isToastEnabled: true, isBellEnabled: true, toggleTicketComplete: true, toggleReassignment: true, toggleExternalTransfer: true, toggleSubTicketCreation: true, subordinatePerformanceAlerts: true, incomingTicketWatch: true, slaDelayMinutes: 15, inApp: true, office365Email: true, emergencyWhatsApp: true, SLA_Thresholds: ['15m', '1h', '24h'] } },
  { id: 'admin_sovereign_custody_ledger_v10', name: 'منظومة العُهد والمخازن السيادية الشاملة V10', category: 'admin', isActive: true, target_zone: 'Main_Viewport', properties: { itemDefinitionAuthority: 'DEPT_HEAD_ONLY', flexibleApprovalChain: 'DEPT_HEAD_ONLY', allowManagerToEnforceRules: true, enableGranularPolicyAssignment: true, enableAssetLineageTracking: true, allowAdvancedReportExport: true, reportVisibilityScope: 'DEPARTMENT_WIDE', allowedReportFilters: ['BY_ITEM_TYPE', 'BY_DATE_RANGE', 'BY_TARGET_TICKET'], allowedReportColumns: ['SHOW_RECEIVER_IDENTITY', 'SHOW_EXACT_TIMESTAMP', 'SHOW_VERIFICATION_STATUS'] } },
  { id: 'admin_operational_console', name: 'قمرة إدارة الكيانات التشغيلية', category: 'admin', isActive: false, target_zone: 'Main_Viewport', properties: { allowedViews: ['TREE', 'FLAT'], enableDragAndDrop: true, maxDepth: 5, routingStrategy: 'POOL', isDelegated: false } },
  { id: 'admin_policy_center', name: 'مركز سياسات التنبيهات', category: 'admin', isActive: false, target_zone: 'Main_Viewport', properties: { notificationType: 'Neon Toast', intervalReminder: 300, eventTypeBinding: 'ALL' } },
  
  // ─── Tools ───
  { id: 'tool_language_theme', name: 'اللغات والمظهر', category: 'tools', isActive: false, target_zone: 'Top_Navbar', properties: { defaultLanguage: 'ar', allowUserSwitch: true, darkModeEnabled: true, neonGlowColor: '#00e5ff' } },
  { id: 'tool_sla_timer', name: 'مؤقت الـ SLA', category: 'tools', isActive: false, target_zone: 'Status_Footer', properties: { defaultSlaMinutes: 120, IsEscalationEnabled: true, EscalationTargetRole: 'IT_Admin' } },
  { id: 'tool_roles_perms', name: 'إدارة الأدوار والصلاحيات', category: 'tools', isActive: false, target_zone: 'Main_Viewport', properties: { linkedRole: 'Employee', accessLevel: 'READ_ONLY', CanTransfer: false, CanClose: false } },
  { id: 'tool_knowledge_base', name: 'الروبوت التفاعلي / قاعدة المعرفة', category: 'tools', isActive: false, target_zone: 'Main_Viewport', properties: { endpoint: '/api/v1/bot/query', allowPublicAccess: false, requireApprovalToPublish: true } },
  { id: 'tool_export', name: 'تصدير التقارير الديناميكية', category: 'tools', isActive: false, target_zone: 'Main_Viewport', properties: { exportFormats: ['PDF', 'EXCEL', 'CSV'], autoSchedule: false } },
  { id: 'tool_dynamic_fields', name: 'الحقول الديناميكية الهرمية', category: 'tools', isActive: false, target_zone: 'Main_Viewport', properties: { allowNestedFields: true, maxFieldsPerEntity: 20 } },
  { id: 'tool_ai_bot', name: 'الروبوت التفاعلي المساعد', category: 'tools', isActive: false, target_zone: 'Main_Viewport', properties: { aiModel: 'GPT-4', knowledgeBaseSync: true, autoReplyTickets: false } },
  { id: 'tool_audit_log', name: 'سجل التدقيق (Audit Log)', category: 'tools', isActive: false, target_zone: 'Main_Viewport', properties: { maxInMemory: 50, appendOnly: true } }
];

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#070B14',
    color: '#ffffff',
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
    color: '#22d3ee',
    margin: 0,
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0
  },
  saveBtn: {
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr 1fr',
    gap: '24px',
    height: 'calc(100vh - 120px)'
  },
  glassBox: {
    backgroundColor: '#0c1322',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
  },
  boxHeader: {
    backgroundColor: '#0f172a',
    padding: '16px',
    borderBottom: '1px solid rgba(6, 182, 212, 0.3)',
    textAlign: 'center' as const
  },
  boxTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#34d399'
  },
  boxSub: {
    margin: '4px 0 0 0',
    fontSize: '10px',
    color: '#94a3b8'
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 120px)',
    padding: '0 8px',
  },
  item: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#e2e8f0',
    transition: 'all 0.2s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'grab'
  },
  itemActive: {
    border: '1px solid #22d3ee',
    backgroundColor: '#164e63'
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
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    color: '#22d3ee',
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
    backgroundColor: '#334155',
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

export function UILayoutEngineTab() {
  const [components, setComponents] = useState<UIComponentDefinition[]>(initialComponents);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // --- Interactive Live Sandbox States ---
  const [previewRole, setPreviewRole] = useState<string>('Super_Admin');
  const [previewActiveTab, setPreviewActiveTab] = useState<string>('');
  const [previewDynamicFields, setPreviewDynamicFields] = useState<any[]>([]);
  const [previewDesc, setPreviewDesc] = useState<string>('');

  // --- Landing Manager State ---
  const [isManagerMode, setIsManagerMode] = useState<boolean>(true);
  const [showSavedList, setShowSavedList] = useState<boolean>(false);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [interfaceName, setInterfaceName] = useState<string>('');

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

  if (isManagerMode) {
    return (
      <div style={{...styles.container, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)'}}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '50px', textAlign: 'center', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔮</div>
          <h1 style={{ fontSize: '28px', color: '#f8fafc', marginBottom: '15px', fontWeight: 'bold' }}>مدير حوكمة وتخصيص واجهات النظام - LITC</h1>
          <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '40px', lineHeight: '1.6' }}>مرحباً بك في المحرك السيادي لتخصيص الواجهات. يمكنك إنشاء واجهات جديدة من الصفر بمرونة فائقة، أو تعديل الواجهات المحفوظة مسبقاً لدعم عمليات النظام.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              onClick={() => {
                setIsManagerMode(false);
                setShowNameModal(true);
              }}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)'; }}
            >
              <span>➕</span> إنشاء واجهة جديدة
            </button>
            
            <button 
              onClick={() => setShowSavedList(!showSavedList)}
              style={{ width: '100%', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <span>📁</span> الواجهات الجاهزة والمحفوظة
            </button>
          </div>

          {showSavedList && (
            <div style={{ marginTop: '20px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', padding: '15px', textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px', textAlign: 'center' }}>لا توجد واجهات محفوظة حالياً.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{...styles.container, filter: showNameModal ? 'blur(10px)' : 'none', pointerEvents: showNameModal ? 'none' : 'auto', transition: 'filter 0.3s ease' }}>
        <div style={{...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
          <h2 style={styles.title}>محرك تصميم الواجهات السياقية (Contextual UI Engine)</h2>
          <p style={styles.subtitle}>تخصيص الخصائص الذكية (Inspector) وبناء واجهات المستخدمين سيادياً بـ Zero-Lag.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsManagerMode(true)}
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            ⬅️ العودة لمدير الواجهات
          </button>
          <button style={styles.saveBtn}>حفظ التوزيع النهائي</button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={styles.grid}>
          
          {/* RIGHT: INACTIVE REPOSITORY */}
          <div style={styles.glassBox}>
            <div style={styles.boxHeader}>
              <h3 style={{...styles.boxTitle, color: '#38bdf8'}}>📦 مستودع المكونات المعطلة</h3>
              <p style={styles.boxSub}>اسحب المكون للوحة الفعالة لتركيبه</p>
            </div>
            <Droppable droppableId="inactive-repository">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  style={{...styles.scrollArea, backgroundColor: snapshot.isDraggingOver ? 'rgba(56, 189, 248, 0.05)' : 'transparent'}}
                >
                  {inactiveComponents.map((comp, index) => {
                    const prevCategory = index > 0 ? inactiveComponents[index - 1].category : null;
                    const showHeader = prevCategory !== comp.category;
                    const categoryTitles: Record<string, string> = {
                      'tickets': '🎫 قسم التذاكر والعمليات',
                      'admin': '🏢 قسم الإدارة المركزية والمراقبة',
                      'tools': '🛠️ قسم الأدوات المساعدة والإعدادات'
                    };
                    return (
                      <React.Fragment key={comp.id}>
                        {showHeader && (
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#00e5ff', margin: '20px 0 10px 0', borderBottom: '1px dashed rgba(0, 229, 255, 0.3)', paddingBottom: '5px' }}>
                            {categoryTitles[comp.category] || comp.category}
                          </div>
                        )}
                        <Draggable draggableId={comp.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...styles.item,
                                ...provided.draggableProps.style,
                                backgroundColor: snapshot.isDragging ? '#1e1b4b' : styles.item.backgroundColor
                              }}
                            >
                              <div><span style={{color: '#64748b', marginRight: '8px'}}>⋮⋮</span> {comp.name}</div>
                            </div>
                          )}
                        </Draggable>
                      </React.Fragment>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* CENTER: ACTIVE CANVAS */}
          <div style={{...styles.glassBox, backgroundColor: '#0a0f1c'}}>
            <div style={styles.boxHeader}>
              <h3 style={styles.boxTitle}>مساحة العمل التشغيلية (Active Canvas)</h3>
              <p style={styles.boxSub}>{activeComponents.length} مكونات قيد التشغيل</p>
            </div>
            <div style={{flex: 1, padding: '24px', display: 'flex', justifyContent: 'center', overflowY: 'auto'}}>
              <div style={{width: '100%', maxWidth: '500px', backgroundColor: 'rgba(12, 19, 34, 0.8)', border: '2px dashed #334155', borderRadius: '12px', padding: '16px'}}>
                <Droppable droppableId="active-canvas">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      style={{minHeight: '400px', backgroundColor: snapshot.isDraggingOver ? 'rgba(34, 211, 238, 0.05)' : 'transparent'}}
                    >
                      {activeComponents.length === 0 ? (
                        <div style={{textAlign: 'center', color: '#64748b', marginTop: '100px', fontSize: '12px'}}>
                          اسحب المكونات من المستودع لتفعيلها هنا
                        </div>
                      ) : (
                        activeComponents.map((comp, index) => (
                          <Draggable key={comp.id} draggableId={comp.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedComponentId(comp.id)}
                                style={{
                                  ...styles.item,
                                  ...(selectedComponentId === comp.id ? styles.itemActive : {}),
                                  ...provided.draggableProps.style
                                }}
                              >
                                <div><span style={{color: '#64748b', marginRight: '8px', cursor: 'grab'}}>☰</span> {comp.name}</div>
                                <span style={{fontSize: '10px', color: '#94a3b8', background: '#000', padding: '2px 6px', borderRadius: '4px'}}>{comp.category.toUpperCase()}</span>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>

          {/* LEFT: INSPECTOR PANEL */}
          <div style={styles.glassBox}>
            <div style={styles.boxHeader}>
              <h3 style={{...styles.boxTitle, color: '#c084fc'}}>⚙️ خصائص المكون (Inspector)</h3>
              <p style={styles.boxSub}>حدد مكوناً للتعديل</p>
            </div>
            <div style={styles.scrollArea}>
              {selectedComponent ? (
                <div>
                  <div style={{backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '20px'}}>
                    <div style={{fontSize: '10px', color: '#64748b', marginBottom: '4px'}}>المعرف (ID)</div>
                    <div style={{fontFamily: 'monospace', fontSize: '11px', color: '#c084fc'}}>{selectedComponent.id}</div>
                    <div style={{fontSize: '10px', color: '#64748b', marginTop: '12px', marginBottom: '4px'}}>الاسم</div>
                    <div style={{fontSize: '12px', fontWeight: 'bold'}}>{selectedComponent.name}</div>
                  </div>

                  {/* CUSTOM PANELS */}
                  {selectedComponent.id === 'admin_sovereign_custody_ledger_v10' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>الفلاتر التشغيلية المتاحة لتوليد التقارير:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'BY_ITEM_TYPE', label: 'فرز حسب الصنف الفردي أو المجموعات' },
                          { id: 'BY_DATE_RANGE', label: 'فرز حسب النطاق الزمني والتاريخ' },
                          { id: 'BY_TARGET_TICKET', label: 'فرز برقم التذكرة أو المهمة التشغيلية' },
                          { id: 'BY_JUSTIFICATION_REASON', label: 'فرز حسب مبررات وأسباب الصرف' }
                        ].map(filter => {
                          const filters = selectedComponent.properties.allowedReportFilters || [];
                          const isChecked = filters.includes(filter.id);
                          return (
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
                          );
                        })}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>أعمدة البيانات المسموح بظهورها في التقرير:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'SHOW_ISSUER_IDENTITY', label: 'عرض هوية المسؤول المفوِّض للصرف' },
                          { id: 'SHOW_RECEIVER_IDENTITY', label: 'عرض هوية الموظف المستلم الفعلي' },
                          { id: 'SHOW_EXACT_TIMESTAMP', label: 'عرض الوقت والتاريخ الفعلي بالثانية' },
                          { id: 'SHOW_VERIFICATION_STATUS', label: 'عرض حالة وموثوقية إجراء الصرف' }
                        ].map(col => {
                          const columns = selectedComponent.properties.allowedReportColumns || [];
                          const isChecked = columns.includes(col.id);
                          return (
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
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_archive Inspector ═══ */}
                  {selectedComponent.id === 'admin_archive' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص الأرشيف المركزي:</h5>
                      
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.enableTimelineAuditLog || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'enableTimelineAuditLog', e.target.checked)} />
                          تفعيل شريط السجل التاريخي المتكامل (Timeline Audit Log) 📜
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.enableHistoricalExport || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'enableHistoricalExport', e.target.checked)} />
                          تفعيل زر تصدير التقارير التاريخية (Excel/PDF) 📥
                        </label>
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>فلاتر الأرشيف المحقونة بالواجهة:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'building_location', label: 'المبنى والموقع' },
                          { id: 'department', label: 'القسم' },
                          { id: 'issue_type', label: 'تصنيفات الأعطال الحرة (من localStorage)' }
                        ].map(filter => {
                          const filters = selectedComponent.properties.enabledUIFilters || [];
                          const isChecked = filters.includes(filter.id);
                          return (
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
                          );
                        })}
                      </div>
                    </div>
                  )}



                  {selectedComponent.id === 'ticket_inbox' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
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
                          <div key={tab.key} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', color: tabCfg.active ? '#00e5ff' : '#ccc' }}>
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
                            
                            {tabCfg.active && (
                              <div style={{ paddingRight: '20px', marginTop: '8px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>الإجراءات المتاحة:</div>
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
                                      <label key={action} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', padding: '3px 8px', background: isChecked ? 'rgba(0, 229, 255, 0.1)' : 'transparent', border: `1px solid ${isChecked ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '6px' }}>
                                        <input type="checkbox" checked={isChecked} onChange={e => {
                                          let newActions = [...currentActions];
                                          if (e.target.checked) newActions.push(action); else newActions = newActions.filter((a: string) => a !== action);
                                          const newTabsConfig = { ...tabsConfig, [tab.key]: { ...tabCfg, actions: newActions } };
                                          handlePropertyChange(selectedComponent.id, 'tabsConfig', newTabsConfig);
                                        }} />
                                        {actionLabels[action] || action}
                                      </label>
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
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص وحوكمة التذاكر الفرعية:</h5>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>1. ضوابط المحتوى</h6>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '5px' }}>
                          <input type="checkbox" checked={selectedComponent.properties.enableDescription || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'enableDescription', e.target.checked)} />
                          تفعيل حقل الوصف
                        </label>
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
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>2. وضع التزامن (Concurrency Mode)</h6>
                        <select style={styles.input} value={selectedComponent.properties.concurrencyMode || 'SEQUENTIAL'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'concurrencyMode', e.target.value)}>
                          <option value="SEQUENTIAL">تسلسلي (Sequential)</option>
                          <option value="PARALLEL">متزامن (Parallel)</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>3. الحد الأقصى للتذاكر الفرعية</h6>
                        <input type="number" style={{ ...styles.input, width: '80px', padding: '5px' }} 
                          value={selectedComponent.properties.maxSubTickets || 2}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'maxSubTickets', parseInt(e.target.value))} />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>4. نطاق التوجيه (Routing Scope)</h6>
                        <select style={styles.input} value={selectedComponent.properties.routingScope || 'INTERNAL_TEAM'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'routingScope', e.target.value)}>
                          <option value="INTERNAL_TEAM">الفريق الداخلي فقط</option>
                          <option value="SAME_DEPARTMENT">نفس القسم</option>
                          <option value="CROSS_DEPARTMENT">أقسام مختلفة</option>
                          <option value="GLOBAL">كل الكيانات</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedComponent.id === 'tool_roles_perms' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>مستوى الصلاحيات (Access Level):</h5>
                      <select 
                        style={styles.input} 
                        value={selectedComponent.properties.accessLevel || 'READ_ONLY'}
                        onChange={e => handlePropertyChange(selectedComponent.id, 'accessLevel', e.target.value)}
                      >
                        <option value="READ_ONLY">قراءة فقط (Read Only)</option>
                        <option value="EDIT">تعديل (Edit)</option>
                        <option value="FULL_ACCESS">تحكم كامل (Full Access)</option>
                      </select>
                    </div>
                  )}

                  {/* ═══ ticket_create Inspector ═══ */}
                  {selectedComponent.id === 'ticket_create' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص إنشاء وتوجيه التذاكر:</h5>
                      
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.attachmentsEnabled || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'attachmentsEnabled', e.target.checked)} />
                          السماح بالمرفقات للمستخدم
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.mandatoryAttachments || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'mandatoryAttachments', e.target.checked)} />
                          إجبار المستخدم على إرفاق ملف
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.slaConditions || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'slaConditions', e.target.checked)} />
                          ربط التذكرة بشروط الـ SLA فور إنشائها
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.voiceToText || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'voiceToText', e.target.checked)} />
                          تفعيل الإدخال الصوتي الذكي (تحويل الصوت إلى نص)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.showPriority || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'showPriority', e.target.checked)} />
                          إظهار حقل مستوى الأولوية
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.mandatoryDescription || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'mandatoryDescription', e.target.checked)} />
                          إجبار المستخدم على كتابة وصف المشكلة
                        </label>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>الحد الأقصى للمرفق (ميجابايت):</h6>
                        <input type="number" style={{ ...styles.input, width: '80px', padding: '5px' }} value={selectedComponent.properties.attachmentMaxSizeMB || 5}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'attachmentMaxSizeMB', parseInt(e.target.value))} />
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>أنواع المرفقات المسموح بها:</h6>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                        </div>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>توجيه التذكرة التلقائي المزدوج:</h6>
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
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_analytics Inspector ═══ */}
                  {selectedComponent.id === 'admin_analytics' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>نطاق الاستعلام (Data Scope):</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {['PERSONAL', 'TEAM', 'SPECIFIC_EMPLOYEE'].map(scope => (
                          <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="dataScope" 
                              checked={selectedComponent.properties.dataScope === scope}
                              onChange={() => handlePropertyChange(selectedComponent.id, 'dataScope', scope)}
                            />
                            {scope === 'PERSONAL' ? 'شخصي (Personal)' : scope === 'TEAM' ? 'الفريق (Team)' : 'موظف محدد (Specific)'}
                          </label>
                        ))}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>الفلاتر الديناميكية المتاحة:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'BUILDING', label: 'فلتر حسب المبنى' },
                          { id: 'ISSUE_TYPE', label: 'فلتر حسب نوع المشكلة' },
                          { id: 'DEPARTMENT', label: 'فلتر حسب القسم' },
                          { id: 'DATE_RANGE', label: 'فلتر النطاق الزمني' }
                        ].map(f => {
                          const filters = selectedComponent.properties.allowedFilters || [];
                          return (
                            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={filters.includes(f.id)} onChange={e => {
                                let nf = [...filters];
                                if (e.target.checked) nf.push(f.id); else nf = nf.filter((x: string) => x !== f.id);
                                handlePropertyChange(selectedComponent.id, 'allowedFilters', nf);
                              }} />
                              {f.label}
                            </label>
                          );
                        })}
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.filterDestDept || false} onChange={e => handlePropertyChange(selectedComponent.id, 'filterDestDept', e.target.checked)} />
                        تفعيل فلتر التوجيه (القسم الوجهة)
                      </label>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px', marginTop: '15px' }}>الرسوم البيانية المفعلة:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'kpi_cards', label: 'بطاقات KPI' },
                          { id: 'line_chart', label: 'رسم خطي (Line)' },
                          { id: 'bar_chart', label: 'رسم عمودي (Bar)' },
                          { id: 'pie_chart', label: 'رسم دائري (Pie)' }
                        ].map(c => {
                          const charts = selectedComponent.properties.activeCharts || [];
                          return (
                            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={charts.includes(c.id)} onChange={e => {
                                let nc = [...charts];
                                if (e.target.checked) nc.push(c.id); else nc = nc.filter((x: string) => x !== c.id);
                                handlePropertyChange(selectedComponent.id, 'activeCharts', nc);
                              }} />
                              {c.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_leaderboard Inspector ═══ */}
                  {selectedComponent.id === 'admin_leaderboard' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>محاور المقارنة المتاحة (Dimensions):</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'EMP_VS_EMP', label: 'موظف مقابل موظف' },
                          { id: 'DEPT_VS_DEPT', label: 'قسم مقابل قسم' },
                          { id: 'TIME_VS_TIME', label: 'فترة زمنية مقابل فترة' },
                          { id: 'FIELD_VS_FIELD', label: 'مستدلة حرة مقابل مستدلة' }
                        ].map(d => {
                          const dims = selectedComponent.properties.allowedDimensions || [];
                          return (
                            <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={dims.includes(d.id)} onChange={e => {
                                let nd = [...dims];
                                if (e.target.checked) nd.push(d.id); else nd = nd.filter((x: string) => x !== d.id);
                                handlePropertyChange(selectedComponent.id, 'allowedDimensions', nd);
                              }} />
                              {d.label}
                            </label>
                          );
                        })}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>مقاييس الأداء (Metrics):</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[
                          { id: 'VOLUME', label: 'حجم التذاكر (Volume)' },
                          { id: 'SPEED', label: 'سرعة الإغلاق (Speed)' },
                          { id: 'SLA', label: 'نسبة خرق الـ SLA' }
                        ].map(m => {
                          const metrics = selectedComponent.properties.allowedMetrics || [];
                          return (
                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={metrics.includes(m.id)} onChange={e => {
                                let nm = [...metrics];
                                if (e.target.checked) nm.push(m.id); else nm = nm.filter((x: string) => x !== m.id);
                                handlePropertyChange(selectedComponent.id, 'allowedMetrics', nm);
                              }} />
                              {m.label}
                            </label>
                          );
                        })}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>أوضاع العرض (Display Modes):</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'SIDE_BAR', label: 'رسم عمودي مزدوج (Side-by-Side Bar)' },
                          { id: 'VARIANCE_TABLE', label: 'جدول نسبة التغيير (Variance %)' }
                        ].map(dm => {
                          const modes = selectedComponent.properties.displayModes || [];
                          return (
                            <label key={dm.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={modes.includes(dm.id)} onChange={e => {
                                let nmodes = [...modes];
                                if (e.target.checked) nmodes.push(dm.id); else nmodes = nmodes.filter((x: string) => x !== dm.id);
                                handlePropertyChange(selectedComponent.id, 'displayModes', nmodes);
                              }} />
                              {dm.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_archive Inspector ═══ */}
                  {selectedComponent.id === 'admin_archive' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>نطاق الوصول (Archive Scope):</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {['Personal_Only', 'Department_Only', 'Building_Only', 'Global_Access'].map(scope => (
                          <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                            <input type="radio" name="archiveScope" checked={selectedComponent.properties.archiveScope === scope}
                              onChange={() => handlePropertyChange(selectedComponent.id, 'archiveScope', scope)} />
                            {scope.replace(/_/g, ' ')}
                          </label>
                        ))}
                      </div>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>أنواع التذاكر المسموحة:</h5>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.allowCompletedClosedTickets || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'allowCompletedClosedTickets', e.target.checked)} />
                        التذاكر المنجزة والمغلقة (Completed/Closed)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '15px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.allowSupplementaryAdditionalTickets || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'allowSupplementaryAdditionalTickets', e.target.checked)} />
                        التذاكر الفرعية/الإضافية (Supplementary)
                      </label>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>فلاتر الواجهة المتاحة للمستخدم:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'operator_name', label: 'تصفية باسم الموظف (Operator)' },
                          { id: 'end_user_name', label: 'تصفية باسم المستخدم النهائي' },
                          { id: 'issue_type', label: 'تصفية بنوع المشكلة' },
                          { id: 'building_location', label: 'تصفية بالمبنى/الموقع' }
                        ].map(f => {
                          const filters = selectedComponent.properties.enabledUIFilters || [];
                          return (
                            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={filters.includes(f.id)} onChange={e => {
                                let nf = [...filters];
                                if (e.target.checked) nf.push(f.id); else nf = nf.filter((x: string) => x !== f.id);
                                handlePropertyChange(selectedComponent.id, 'enabledUIFilters', nf);
                              }} />
                              {f.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_profile Inspector ═══ */}
                  {selectedComponent.id === 'admin_profile' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص الملف الشخصي الديناميكي:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.allowThemeCustomization || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'allowThemeCustomization', e.target.checked)} />
                          السماح بتخصيص المظهر (Theme Customization)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.manualInputFallback || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'manualInputFallback', e.target.checked)} />
                          تفعيل الإدخال اليدوي كبديل (Manual Input Fallback)
                        </label>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>مزود الهوية (Identity Provider):</h6>
                        <select style={styles.input} value={selectedComponent.properties.identityProvider || 'Microsoft_SSO'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'identityProvider', e.target.value)}>
                          <option value="Microsoft_SSO">Microsoft SSO</option>
                          <option value="Google_Workspace">Google Workspace</option>
                          <option value="Active_Directory">Active Directory On-Premise</option>
                          <option value="Internal_DB">قاعدة البيانات الداخلية</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>لوحة الألوان المضيئة (Neon Palette):</h6>
                        <select style={styles.input} value={selectedComponent.properties.neonPalette || 'Cyber Blue'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'neonPalette', e.target.value)}>
                          <option value="Cyber Blue">Cyber Blue</option>
                          <option value="Emerald Green">Emerald Green</option>
                          <option value="Neon Purple">Neon Purple</option>
                          <option value="Crimson Red">Crimson Red</option>
                        </select>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>شفافية المظهر الزجاجي (Glass Opacity):</h6>
                        <input type="range" min="0.1" max="1.0" step="0.1" style={{ width: '100%' }}
                          value={selectedComponent.properties.glassOpacity || 0.6}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'glassOpacity', parseFloat(e.target.value))} />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{selectedComponent.properties.glassOpacity || 0.6}</span>
                      </div>
                    </div>
                  )}

                  {/* ═══ tool_language_theme Inspector ═══ */}
                  {selectedComponent.id === 'tool_language_theme' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>خصائص اللغات والمظهر:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.allowUserSwitch || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'allowUserSwitch', e.target.checked)} />
                          السماح للمستخدم بتغيير اللغة (User Switch)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={selectedComponent.properties.darkModeEnabled || false} 
                            onChange={e => handlePropertyChange(selectedComponent.id, 'darkModeEnabled', e.target.checked)} />
                          تفعيل النمط الداكن الافتراضي (Dark Mode)
                        </label>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>اللغة الافتراضية (Default Language):</h6>
                        <select style={styles.input} value={selectedComponent.properties.defaultLanguage || 'ar'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'defaultLanguage', e.target.value)}>
                          <option value="ar">العربية (Arabic)</option>
                          <option value="en">الإنجليزية (English)</option>
                        </select>
                      </div>

                      <div>
                        <h6 style={{ fontSize: '12px', color: '#00e5ff', margin: '0 0 10px 0' }}>لون التوهج (Neon Glow Color):</h6>
                        <input type="color" style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          value={selectedComponent.properties.neonGlowColor || '#00e5ff'}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'neonGlowColor', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* ═══ admin_notifications Inspector ═══ */}
                  {selectedComponent.id === 'admin_notifications' && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#f97316', marginBottom: '10px' }}>⚠️ ضوابط الحوكمة السيادية:</h5>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.forceWhatsappCritical || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'forceWhatsappCritical', e.target.checked)} />
                        فرض إشعارات WhatsApp للأحداث الحرجة 📱
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '15px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.lockSLAThresholds || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'lockSLAThresholds', e.target.checked)} />
                        قفل تعديل مدد الـ SLA (منع المدراء من التخفيض) 🔒
                      </label>

                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>حدود التصعيد الزمني (SLA Thresholds):</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '13px', color: '#0052cc', marginBottom: '10px' }}>طرق العرض المتاحة:</h5>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                        {[{ id: 'TREE', label: 'شجري (Tree View)' }, { id: 'FLAT', label: 'مسطح (Flat View)' }].map(v => {
                          const views = selectedComponent.properties.allowedViews || [];
                          return (
                            <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                              <input type="checkbox" checked={views.includes(v.id)} onChange={e => {
                                let nv = [...views];
                                if (e.target.checked) nv.push(v.id); else nv = nv.filter((x: string) => x !== v.id);
                                handlePropertyChange(selectedComponent.id, 'allowedViews', nv);
                              }} />
                              {v.label}
                            </label>
                          );
                        })}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', cursor: 'pointer', marginBottom: '10px' }}>
                        <input type="checkbox" checked={selectedComponent.properties.enableDragAndDrop || false}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'enableDragAndDrop', e.target.checked)} />
                        تفعيل السحب والإفلات (Drag & Drop)
                      </label>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', opacity: 0.8, marginBottom: '5px' }}>العمق الأقصى للشجرة (Max Depth):</label>
                        <input type="number" style={{ ...styles.input, width: '80px', padding: '5px' }}
                          value={selectedComponent.properties.maxDepth || 5}
                          onChange={e => handlePropertyChange(selectedComponent.id, 'maxDepth', parseInt(e.target.value))} />
                      </div>
                    </div>
                  )}

                  <h4 style={{fontSize: '12px', color: '#c084fc', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px'}}>الخصائص المتقدمة المشتركة</h4>
                  
                  {Object.keys(selectedComponent.properties).length === 0 ? (
                    <div style={{textAlign: 'center', fontSize: '12px', color: '#64748b', padding: '20px'}}>لا توجد خصائص إضافية</div>
                  ) : (
                    <div>
                      {Object.entries(selectedComponent.properties).filter(([k]) => !['destinationRoutes', 'tabsConfig', 'enableDescription', 'maxDescriptionLength', 'accessLevel', 'allowedReportFilters', 'allowedReportColumns', 'allowedFilters', 'activeCharts', 'dataScope', 'filterDestDept', 'allowedDimensions', 'allowedMetrics', 'displayModes', 'archiveScope', 'allowCompletedClosedTickets', 'allowSupplementaryAdditionalTickets', 'enabledUIFilters', 'forceWhatsappCritical', 'lockSLAThresholds', 'SLA_Thresholds', 'allowedViews', 'enableDragAndDrop', 'maxDepth', 'concurrencyMode', 'maxSubTickets', 'routingScope', 'attachmentsEnabled', 'mandatoryAttachments', 'attachmentMaxSizeMB', 'slaConditions', 'voiceToText', 'showPriority', 'allowThemeCustomization', 'manualInputFallback', 'identityProvider', 'neonPalette', 'glassOpacity', 'allowUserSwitch', 'darkModeEnabled', 'defaultLanguage', 'neonGlowColor', 'enableTimelineAuditLog', 'enableHistoricalExport', 'issueTypeCustomization', 'injectedDynamicFields', 'attachmentAllowedExtensions', 'routingDestination', 'cascadingDropdowns', 'dependencyMapping'].includes(k)).map(([key, val]) => {
                        // Boolean toggle
                        if (typeof val === 'boolean') {
                          return (
                            <div key={key} style={{...styles.propBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: '12px', color: '#cbd5e1'}}>{propertyLabelsAr[key] || key}</span>
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
                              <div style={{fontSize: '12px', color: '#cbd5e1', marginBottom: '8px'}}>{propertyLabelsAr[key] || key}</div>
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
                            <div style={{fontSize: '12px', color: '#cbd5e1', marginBottom: '4px'}}>{propertyLabelsAr[key] || key}</div>
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
                  <div style={{fontSize: '12px', color: '#94a3b8'}}>حدد مكوناً من مساحة العمل<br/>لاستعراض وتخصيص الخصائص</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </DragDropContext>

      {/* ═══ INTERACTIVE LIVE SANDBOX (MODERN GLASSMORPHISM) ═══ */}
      <div className="scrollbar-thin" style={{ marginTop: '40px', background: 'linear-gradient(135deg, #f8fafc 0%, #f3f4f6 50%, rgba(239, 246, 255, 0.8) 100%)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(148, 163, 184, 0.2)', color: '#1e293b', display: 'flex', flexDirection: 'column', maxHeight: '750px', overflowY: 'auto', paddingRight: '8px' }}>
        
        {/* Sandbox Toolbar */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.8)', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
          <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
            <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🧪</span> المعاينة الحية للواجهة (Modern Live Preview)
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>محاكاة الدور (Role Testing):</label>
            <select style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: 'rgba(255,255,255,0.9)', fontSize: '12px', color: '#334155', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', outline: 'none', cursor: 'pointer' }} value={previewRole} onChange={(e) => setPreviewRole(e.target.value)}>
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
              <div key={c.id} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', boxShadow: '0 4px 6px rgba(148, 163, 184, 0.1)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>{c.id === 'admin_profile' ? '👤' : c.id === 'admin_notifications' ? '🔔' : '🌐'}</span> {c.name}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
            {/* Dynamic Sidebar Zone */}
            <div style={{ width: '260px', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(226, 232, 240, 0.4)', padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>القائمة الملاحية (DYNAMIC SIDEBAR)</div>
              {activeComponents.filter(c => c.target_zone === 'Main_Viewport').map(c => (
                <div key={c.id} 
                  onClick={() => setPreviewActiveTab(c.id)}
                  style={{ padding: '12px 18px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: previewActiveTab === c.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent', color: previewActiveTab === c.id ? '#0284c7' : '#475569', border: previewActiveTab === c.id ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent', boxShadow: previewActiveTab === c.id ? '0 4px 6px rgba(56, 189, 248, 0.1)' : 'none' }}
                  onMouseEnter={(e) => { if (previewActiveTab !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={(e) => { if (previewActiveTab !== c.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {c.name}
                </div>
              ))}
            </div>

            {/* Main Viewport Zone */}
            <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(226, 232, 240, 0.4)', padding: '30px', overflowY: 'auto' }}>
              {previewActiveTab ? (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h2 style={{ margin: '0 0 25px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '24px', background: '#0ea5e9', borderRadius: '4px' }}></span>
                    {activeComponents.find(c => c.id === previewActiveTab)?.name || 'غير معروف'}
                  </h2>
                  
                  {previewActiveTab === 'ticket_create' && (() => {
                    const tProps = activeComponents.find(c => c.id === 'ticket_create')?.properties || {};
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* SLA Glowing Badge */}
                        {tProps.slaConditions && (
                          <div style={{ alignSelf: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }}></span>
                            خاضع لشروط الـ SLA - مؤقت نشط
                          </div>
                        )}

                        {/* Title & Description with Voice Input */}
                        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>تفاصيل التذكرة الأساسية</h4>
                          <input type="text" placeholder="عنوان التذكرة" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#fff', marginBottom: '15px', outline: 'none' }} />
                          <div style={{ position: 'relative', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <label style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                                وصف المشكلة بالتفصيل
                                {tProps.mandatoryDescription && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                              </label>
                            </div>
                            <textarea 
                              placeholder="وصف المشكلة بالتفصيل..." 
                              value={previewDesc}
                              onChange={e => setPreviewDesc(e.target.value)}
                              style={{ width: '100%', padding: '12px', minHeight: '100px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#fff', outline: 'none', resize: 'none' }}></textarea>
                            {tProps.voiceToText && (
                              <button style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 12px rgba(14, 165, 233, 0.5)' }}>
                                <span style={{ fontSize: '16px', color: '#fff' }}>🎙️</span>
                              </button>
                            )}
                          </div>
                          {tProps.showPriority && (
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '8px', fontWeight: 'bold' }}>مستوى أهمية البلاغ</label>
                              <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.5)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', outline: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#334155', fontWeight: 'bold' }}>
                                <option>عادية</option>
                                <option>متوسطة</option>
                                <option>حرجة جداً طارئة</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Dynamic Fields Section */}
                        {previewDynamicFields.length > 0 && (
                          <div style={{ padding: '20px', background: 'rgba(248, 250, 252, 0.6)', borderRadius: '12px', border: '1px solid rgba(203, 213, 225, 0.5)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            <h4 style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#334155', fontWeight: 'bold' }}>الحقول الديناميكية المرتبطة:</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              {previewDynamicFields.map(f => (
                                <div key={f.id}>
                                  <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '8px', fontWeight: 'bold' }}>{f.name}</label>
                                  <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.8)', background: '#fff', outline: 'none', transition: 'border 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onFocus={(e) => e.target.style.borderColor = '#0ea5e9'} onBlur={(e) => e.target.style.borderColor = 'rgba(203, 213, 225, 0.8)'}>
                                    <option>اختر...</option>
                                    {f.options?.map((opt: string) => <option key={opt}>{opt}</option>)}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Attachments Drag & Drop Zone */}
                        {tProps.attachmentsEnabled && (
                          <label style={{ marginTop: '12px', padding: '24px', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)', border: '2px dashed rgba(147, 197, 253, 1)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}>
                            <input type="file" style={{ display: 'none' }} />
                            <span style={{ fontSize: '32px' }}>☁️</span>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#3b82f6' }}>اسحب وأفلت ملفات الدعم هنا، أو اضغط لتصفح واختيار ملف من جهازك</span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              الحد الأقصى: {tProps.attachmentMaxSizeMB || 5} ميجابايت | الأنواع المدعومة: {(tProps.attachmentAllowedExtensions || []).length > 0 ? tProps.attachmentAllowedExtensions.join(', ') : 'الكل'}
                            </span>
                            {tProps.mandatoryAttachments && (
                              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}>مرفق إلزامي</span>
                            )}
                          </label>
                        )}

                        <button 
                          disabled={tProps.mandatoryDescription && previewDesc.trim() === ''}
                          style={{ 
                            width: '100%', padding: '14px', 
                            background: tProps.mandatoryDescription && previewDesc.trim() === '' ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #059669)', 
                            color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', 
                            cursor: tProps.mandatoryDescription && previewDesc.trim() === '' ? 'not-allowed' : 'pointer', 
                            boxShadow: tProps.mandatoryDescription && previewDesc.trim() === '' ? 'none' : '0 0 20px rgba(16, 185, 129, 0.4)', 
                            transition: 'all 0.3s' 
                          }} 
                          onMouseEnter={(e) => { 
                            if (!(tProps.mandatoryDescription && previewDesc.trim() === '')) {
                              e.currentTarget.style.transform = 'translateY(-2px)'; 
                              e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.6)'; 
                            }
                          }} 
                          onMouseLeave={(e) => { 
                            if (!(tProps.mandatoryDescription && previewDesc.trim() === '')) {
                              e.currentTarget.style.transform = 'translateY(0)'; 
                              e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)'; 
                            }
                          }}>
                          إرسال التذكرة إلى الأقسام المحددة 🚀
                        </button>
                      </div>
                    );
                  })()}

                  {previewActiveTab === 'admin_analytics' && (
                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                      {['📈 مؤشرات الأداء الحية', '📊 التوزيع الجغرافي للتذاكر'].filter(chart => {
                        if (previewRole === 'Field_Engineer') return false; // Role-based filtering simulation
                        return true;
                      }).map((chart, idx) => (
                        <div key={idx} style={{ flex: 1, height: '180px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
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
                            <select key={idx} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', outline: 'none' }}>
                              <option>تصفية: {filter}</option>
                            </select>
                          ))}
                        </div>
                        {activeComponents.find(c => c.id === 'admin_archive')?.properties.enableHistoricalExport && (
                          <button style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
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
                        <tbody style={{ fontSize: '13px', color: '#334155' }}>
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
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '15px' }}>
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

      {showNameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(16px)', padding: '40px', borderRadius: '20px', width: '400px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '20px', fontSize: '20px' }}>تسمية الواجهة الجديدة</h3>
            <input 
              autoFocus
              type="text" 
              placeholder="مثال: واجهة مركز الدعم الفني" 
              value={interfaceName}
              onChange={e => setInterfaceName(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', fontSize: '15px', marginBottom: '20px', outline: 'none', transition: 'border-color 0.3s' }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
            <button 
              disabled={interfaceName.trim() === ''}
              onClick={() => setShowNameModal(false)}
              style={{ width: '100%', padding: '14px', background: interfaceName.trim() === '' ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: interfaceName.trim() === '' ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
            >
              إنشاء وبدء التصميم 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
}
