import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { DynamicCustomField } from '../admin/tabs/DynamicFieldsTab';
import { ArchiveTable } from './ArchiveTable';
import { DynamicUserProfile } from '../profile/DynamicUserProfile';

interface SchemaComponent {
  componentId: string;
  name: string;
  settings: any;
}

interface UiSchema {
  version: string;
  layoutConfig: SchemaComponent[];
}

interface MockTicket {
  id: string;
  title: string;
  status: 'NEW' | 'OPEN' | 'TRANSFERRED' | 'STUCK';
  priority: 'P1' | 'P2' | 'P3';
  destination_department_ids: string[];
  sla_remaining?: string;
  child_tickets?: { id: string, status: 'OPEN' | 'CLOSED' }[];
}

const MOCK_TICKETS: MockTicket[] = [
  { id: 'TCK-1004', title: 'توقف السيرفر الرئيسي للمبيعات', status: 'NEW', priority: 'P1', destination_department_ids: ['IT_SUPPORT', 'IT_NETWORK'], sla_remaining: '00:14:59', child_tickets: [] },
  { id: 'TCK-1005', title: 'عطل في التكييف المركزي', status: 'NEW', priority: 'P2', destination_department_ids: ['MAINTENANCE'], child_tickets: [] },
  { id: 'TCK-1002', title: 'مشكلة في طابعة الدور الثاني', status: 'OPEN', priority: 'P3', destination_department_ids: ['IT_SUPPORT'], sla_remaining: '04:20:00', child_tickets: [{ id: 'SUB-101', status: 'OPEN' }] },
  { id: 'TCK-1006', title: 'طلب ترقية صلاحيات', status: 'TRANSFERRED', priority: 'P2', destination_department_ids: ['IT_SUPPORT'], child_tickets: [] },
  { id: 'TCK-1007', title: 'انقطاع كابل الشبكة الرئيسي', status: 'STUCK', priority: 'P1', destination_department_ids: ['IT_NETWORK'], sla_remaining: '00:00:00', child_tickets: [] },
];

const CURRENT_EMPLOYEE_DEPT = 'IT_SUPPORT'; // For Strict Data Isolation

export const EmployeeWorkspace: React.FC = () => {
  const theme = useTheme();

  const [schema, setSchema] = useState<UiSchema | null>(null);
  const [customFields, setCustomFields] = useState<DynamicCustomField[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeInboxTab, setActiveInboxTab] = useState<string>('NEW');

  // Analytics State
  const [analyticsDestDept, setAnalyticsDestDept] = useState<string>('ALL');

  // Benchmarking State
  const [leaderboardDim, setLeaderboardDim] = useState<string>('EMP_VS_EMP');
  const [leaderboardTarget1, setLeaderboardTarget1] = useState<string>('EMP_A');
  const [leaderboardTarget2, setLeaderboardTarget2] = useState<string>('EMP_B');

  // Mocking the fetch of the layout configuration from the server
  useEffect(() => {
    const fetchSchema = async () => {
      // Fetch dynamic fields from local storage
      const savedFields = localStorage.getItem('litc_dynamic_fields');
      if (savedFields) {
        try {
          setCustomFields(JSON.parse(savedFields));
        } catch (e) {}
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      // Fetch dynamic layout components from local storage if available
      const savedLayout = localStorage.getItem('litc_layout_components');
      let finalLayoutConfig = [
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

      if (savedLayout) {
        try {
          const parsedLayout = JSON.parse(savedLayout) as any[];
          // Filter only active components
          const activeLayout = parsedLayout.filter(c => c.isActive);
          if (activeLayout.length > 0) {
            // Keep basic system utilities
            const systemUtils = [
              { componentId: 'tool_language_theme', name: 'اللغات والمظهر', settings: { defaultLang: 'ar', allowUserSwitch: true } },
              { componentId: 'tool_sla_timer', name: 'مؤقت الـ SLA', settings: {} },
              { componentId: 'sub_ticket_engine', name: 'محرك التذاكر الفرعية', settings: { concurrencyMode: 'SEQUENTIAL', maxSubTickets: 2, routingScope: 'INTERNAL_TEAM', enableDescription: true } },
            ];

            const userConfigured = activeLayout.map(c => ({
              componentId: c.id,
              name: c.name,
              settings: c.properties || {}
            }));

            // Combine system utils with configured layout (ensuring no duplicates)
            const combined: any[] = [...systemUtils];
            userConfigured.forEach(item => {
              if (!combined.some(s => s.componentId === item.componentId)) {
                combined.push(item);
              }
            });
            finalLayoutConfig = combined;
          }
        } catch (e) {
          console.error("Error parsing saved layout components:", e);
        }
      }

      setSchema({
        version: "v43.5",
        layoutConfig: finalLayoutConfig
      });
      setLoading(false);
    };
    fetchSchema();
  }, []);

  const getComponentSettings = (id: string) => {
    return schema?.layoutConfig.find(c => c.componentId === id)?.settings || null;
  };

  const isComponentActive = (id: string) => {
    return schema?.layoutConfig.some(c => c.componentId === id) ?? false;
  };

  const glassPanel: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '20px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
    color: '#172b4d'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 15px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(9, 30, 66, 0.1)',
    borderRadius: '8px',
    color: '#172b4d',
    marginBottom: '15px',
    fontSize: '13px',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f5f7' }}>
        <h2 style={{ color: '#0052cc', fontWeight: 'bold' }}>جاري تهيئة واجهة الموظف...</h2>
      </div>
    );
  }

  const langSettings = getComponentSettings('tool_language_theme');
  const ticketCreateSettings = getComponentSettings('ticket_create');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const rules = ticketCreateSettings || {};
    const maxSizeMB = rules.maxAttachmentSizeMB || 5;
    const allowedExts = (rules.allowedExtensions || '*').split(',').map((s: string) => s.trim().toLowerCase());

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setFileError(`حجم الملف يتجاوز الحد المسموح (${maxSizeMB}MB)`);
      e.target.value = '';
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (allowedExts[0] !== '*' && !allowedExts.includes(fileExt)) {
      setFileError(`امتداد الملف غير مسموح. المسموح: ${rules.allowedExtensions}`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleTicketSubmit = () => {
    const rules = ticketCreateSettings || {};
    const destinations = rules.destinationRoutes || ['IT_SUPPORT'];
    
    if (rules.mandatoryAttachments && !selectedFile) {
      alert('الرجاء إرفاق الملف الإلزامي قبل الإرسال.');
      return;
    }

    const payload = {
      title: 'تذكرة جديدة', // placeholder
      fields: fieldValues,
      destination_department_ids: destinations,
      hasVoiceToText: isRecording,
      hasAttachment: !!selectedFile
    };

    console.log('✅ تم إرسال التذكرة بنجاح بالخلفية:', payload);
    alert('تم توجيه التذكرة إلى الأقسام التالية: \n' + destinations.join('\n'));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f4f5f7 0%, #e1e5eb 100%)', color: '#172b4d', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", direction: 'rtl' }}>
      
      {/* Top Header */}
      <header style={{ ...glassPanel, borderRadius: '0', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>م</div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#172b4d' }}>محمد الموظف</h4>
            <span style={{ fontSize: '12px', color: '#5e6c84' }}>قسم الدعم الفني</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ cursor: 'pointer', position: 'relative' }}>
            🔔
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff5630', color: '#fff', fontSize: '10px', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>3</span>
          </div>
          
          {isComponentActive('tool_language_theme') && langSettings?.allowUserSwitch && (
            <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', background: '#fff', cursor: 'pointer', fontSize: '12px', color: '#172b4d' }}>
              <option value="ar" selected={langSettings.defaultLang === 'ar'}>العربية</option>
              <option value="en" selected={langSettings.defaultLang === 'en'}>English</option>
            </select>
          )}
        </div>
      </header>

      {/* Main Workspace Core */}
      <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Right Sidebar: Ticket Creator */}
        {isComponentActive('ticket_create') ? (
          <aside style={{ ...glassPanel, alignSelf: 'start' }}>
            <h3 style={{ borderBottom: '2px solid #0052cc', display: 'inline-block', paddingBottom: '5px', marginBottom: '20px', color: '#0052cc', fontSize: '16px' }}>إنشاء بلاغ جديد</h3>
            
            <label style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: 'bold' }}>عنوان البلاغ</label>
            <input type="text" style={inputStyle} placeholder="وصف موجز للمشكلة..." />
            
            <label style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: 'bold' }}>تفاصيل البلاغ</label>
            <div style={{ position: 'relative' }}>
              <textarea style={{ ...inputStyle, height: '100px', resize: 'none' }} placeholder="الرجاء وصف المشكلة بدقة..."></textarea>
              {ticketCreateSettings?.enableVoiceToText && (
                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  style={{
                    position: 'absolute', left: '10px', bottom: '25px', 
                    background: isRecording ? '#ff5630' : 'rgba(0, 82, 204, 0.1)', 
                    color: isRecording ? '#fff' : '#0052cc',
                    border: 'none', borderRadius: '50%', width: '30px', height: '30px', 
                    cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
                  }}
                  title="تفعيل الإدخال الصوتي"
                >
                  🎤
                </button>
              )}
            </div>
            
            {ticketCreateSettings?.showPriorityField && (
              <>
                <label style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: 'bold' }}>أولوية التذكرة</label>
                <select style={inputStyle}>
                  <option value="LOW">عادية</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="HIGH">عاجلة</option>
                  <option value="CRITICAL">طوارئ (P1)</option>
                </select>
              </>
            )}

            {ticketCreateSettings?.injectedFields && customFields.filter(f => ticketCreateSettings.injectedFields.includes(f.id)).map(field => {
              
              // Determine options based on dependencies
              let options = field.options || [];
              if (field.dependsOn && field.dependencyMap) {
                const parentValue = fieldValues[field.dependsOn];
                if (parentValue && field.dependencyMap[parentValue]) {
                  options = field.dependencyMap[parentValue];
                }
              }

              return (
                <div key={field.id} style={{ background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#0052cc', marginBottom: '8px', fontWeight: 'bold' }}>{field.name}</label>
                  <select 
                    style={inputStyle} 
                    value={fieldValues[field.id] || ''} 
                    onChange={e => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
                  >
                    <option value="">-- اختر --</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              );
            })}
            
            {ticketCreateSettings?.enableAttachments && (
              <>
                <label style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: 'bold' }}>
                  المرفقات {ticketCreateSettings?.mandatoryAttachments && <span style={{ color: '#ff5630' }}>* (إلزامي)</span>}
                  <span style={{ fontSize: '10px', color: '#888', display: 'block' }}>الحجم المسموح: {ticketCreateSettings?.maxAttachmentSizeMB || 5}MB | الامتدادات: {ticketCreateSettings?.allowedExtensions || '*'}</span>
                </label>
                <input type="file" onChange={handleFileChange} style={{ ...inputStyle, padding: '6px', background: 'transparent', border: '1px dashed #b3bac5' }} />
                {fileError && <div style={{ color: '#ff5630', fontSize: '12px', marginTop: '-10px', marginBottom: '10px', padding: '8px', background: '#ffebe6', borderRadius: '4px' }}>⚠️ {fileError}</div>}
              </>
            )}

            <button onClick={handleTicketSubmit} disabled={!!fileError} style={{ width: '100%', padding: '12px', background: fileError ? '#ebecf0' : 'linear-gradient(90deg, #0052cc 0%, #0065ff 100%)', color: fileError ? '#a5adba' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: fileError ? 'not-allowed' : 'pointer', boxShadow: fileError ? 'none' : '0 4px 15px rgba(0, 82, 204, 0.2)', transition: 'all 0.2s', marginTop: '10px' }}>
              إرسال البلاغ فوراً
            </button>
          </aside>
        ) : (
          <aside style={{ ...glassPanel, alignSelf: 'start', opacity: 0.5, textAlign: 'center' }}>
            <span style={{ display: 'block', padding: '40px 0' }}>مكون إنشاء التذاكر معطل من قبل النظام.</span>
          </aside>
        )}

        {/* Center: Active Tickets Grid */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#172b4d', fontSize: '20px' }}>لوحة تتبع البلاغات النشطة</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255, 86, 48, 0.1)', color: '#ff5630', borderRadius: '20px', fontWeight: 'bold' }}>عاجل: {MOCK_TICKETS.filter(t => t.priority === 'P1').length}</span>
              <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(0, 101, 255, 0.1)', color: '#0052cc', borderRadius: '20px', fontWeight: 'bold' }}>قيد المعالجة: {MOCK_TICKETS.filter(t => t.status === 'OPEN').length}</span>
            </div>
          </div>

          {isComponentActive('ticket_inbox') ? (() => {
            const inboxSettings = getComponentSettings('ticket_inbox');
            const tabsConfig = inboxSettings?.tabsConfig || {};
            
            const activeTabsMap = [
              { key: 'NEW', label: 'التذاكر الجديدة' },
              { key: 'OPEN', label: 'التذاكر المفتوحة' },
              { key: 'TRANSFERRED', label: 'التذاكر المحولة' },
              { key: 'STUCK', label: 'التذاكر العالقة' },
            ].filter(t => tabsConfig[t.key]?.active);

            // Filter tickets based on status AND strict data isolation
            const filteredTickets = MOCK_TICKETS.filter(t => 
              t.status === activeInboxTab && 
              t.destination_department_ids.includes(CURRENT_EMPLOYEE_DEPT)
            );

            const allowedActionsForCurrentTab = tabsConfig[activeInboxTab]?.actions || [];

            return (
              <>
                {/* Dynamic Tabs Navigation */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '10px' }}>
                  {activeTabsMap.length > 0 ? activeTabsMap.map(tab => (
                    <button 
                      key={tab.key}
                      onClick={() => setActiveInboxTab(tab.key)}
                      style={{ 
                        padding: '8px 16px', border: 'none', background: 'transparent', 
                        cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                        color: activeInboxTab === tab.key ? '#0052cc' : '#5e6c84',
                        borderBottom: activeInboxTab === tab.key ? '3px solid #0052cc' : '3px solid transparent'
                      }}
                    >
                      {tab.label}
                    </button>
                  )) : (
                    <span style={{ fontSize: '13px', color: '#888' }}>لم يقم الأدمن بتفعيل أي تبويبات وارد.</span>
                  )}
                </div>

                {/* Ticket Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                    <div key={ticket.id} style={{ ...glassPanel, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: ticket.priority === 'P1' ? '#ff5630' : ticket.priority === 'P2' ? '#ffab00' : '#0052cc' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <span style={{ fontSize: '11px', color: ticket.priority === 'P1' ? '#ff5630' : '#0052cc', fontWeight: 'bold', background: ticket.priority === 'P1' ? 'rgba(255,86,48,0.1)' : 'rgba(0,82,204,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                          {ticket.priority === 'P1' ? 'طوارئ' : ticket.priority === 'P2' ? 'عاجل' : 'متوسط'} ({ticket.priority})
                        </span>
                        <span style={{ fontSize: '12px', color: '#5e6c84' }}>#{ticket.id}</span>
                      </div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#172b4d' }}>{ticket.title}</h4>
                      
                      {isComponentActive('tool_sla_timer') && ticket.sla_remaining && (
                        <div style={{ background: ticket.priority === 'P1' ? 'rgba(255, 86, 48, 0.05)' : 'rgba(0, 82, 204, 0.05)', border: ticket.priority === 'P1' ? '1px solid rgba(255, 86, 48, 0.2)' : '1px solid rgba(0, 82, 204, 0.1)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                          <span style={{ fontSize: '20px' }}>⏳</span>
                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: ticket.priority === 'P1' ? '#ff5630' : '#0052cc', fontWeight: 'bold' }}>الوقت المتبقي</span>
                            <span style={{ display: 'block', fontSize: '14px', color: '#172b4d', fontWeight: 'bold', fontFamily: 'monospace' }}>{ticket.sla_remaining}</span>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Action Buttons */}
                      {allowedActionsForCurrentTab.length > 0 && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                          {allowedActionsForCurrentTab.includes('CLAIM') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>استلام التذكرة</button>}
                          {allowedActionsForCurrentTab.includes('OPEN') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>فتح للمعالجة</button>}
                          {allowedActionsForCurrentTab.includes('TRANSFER') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'transparent', color: '#0052cc', border: '1px solid #0052cc', borderRadius: '4px', cursor: 'pointer' }}>تحويل</button>}
                          {allowedActionsForCurrentTab.includes('REASSIGN') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'transparent', color: '#5e6c84', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer' }}>إسناد لموظف</button>}
                          {allowedActionsForCurrentTab.includes('CLOSE') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#36b37e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>إغلاق التذكرة</button>}
                        </div>
                      )}

                      {/* Sub-Tickets Engine Governance */}
                      {isComponentActive('ticket_sub') && ticket.status === 'OPEN' && (() => {
                        const subSettings = getComponentSettings('ticket_sub');
                        const concurrencyMode = subSettings?.concurrencyMode || 'PARALLEL';
                        const maxSubTickets = subSettings?.maxSubTickets || 10;
                        const childTickets = ticket.child_tickets || [];
                        const openChildTickets = childTickets.filter((ct: any) => ct.status === 'OPEN').length;
                        
                        const isSequentialLocked = concurrencyMode === 'SEQUENTIAL' && openChildTickets > 0;
                        const isMaxLocked = childTickets.length >= maxSubTickets;

                        return (
                          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(9,30,66,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <h5 style={{ margin: 0, fontSize: '13px', color: '#172b4d' }}>التذاكر الفرعية ({childTickets.length}/{maxSubTickets})</h5>
                              {concurrencyMode === 'SEQUENTIAL' && <span style={{ fontSize: '10px', background: '#ffebe6', color: '#ff5630', padding: '2px 6px', borderRadius: '4px' }}>نمط تسلسلي صارم</span>}
                            </div>
                            
                            {isSequentialLocked ? (
                              <div style={{ background: 'rgba(255, 86, 48, 0.05)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,86,48,0.2)', textAlign: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#ff5630', fontWeight: 'bold' }}>🔒 يجب اكتمال التذكرة الفرعية القائمة أولاً</span>
                              </div>
                            ) : isMaxLocked ? (
                              <div style={{ background: 'rgba(255, 171, 0, 0.05)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,171,0,0.2)', textAlign: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#ffab00', fontWeight: 'bold' }}>🚫 تم الوصول للحد الأقصى للتذاكر الفرعية</span>
                              </div>
                            ) : (
                              <button style={{ width: '100%', padding: '8px', fontSize: '12px', background: 'transparent', color: '#0052cc', border: '1px dashed #0052cc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                + إنشاء تذكرة فرعية جديدة
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )) : (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#5e6c84', ...glassPanel }}>
                      لا توجد تذاكر في هذه الحالة حالياً ضمن اختصاص قسمك.
                    </div>
                  )}
                </div>
              </>
            );
          })() : (
            <div style={{ ...glassPanel, padding: '40px', textAlign: 'center', opacity: 0.5 }}>
              مكون التذاكر الواردة معطل من قبل النظام.
            </div>
          )}
        </main>
      </div>

      {/* Central Analytics & BI Engine */}
      {isComponentActive('admin_analytics') && (() => {
        const analyticsSettings = getComponentSettings('admin_analytics');
        const activeCharts = analyticsSettings?.activeCharts || [];
        const scope = analyticsSettings?.dataScope || 'PERSONAL';
        
        return (
          <div style={{ marginTop: '30px', ...glassPanel, padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#172b4d', fontSize: '20px' }}>التحليل المركزي وذكاء الأعمال (BI)</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(0, 101, 255, 0.1)', color: '#0052cc', borderRadius: '20px', fontWeight: 'bold' }}>نطاق الاستعلام: {scope === 'PERSONAL' ? 'شخصي' : scope === 'TEAM' ? 'فريق' : 'شامل'}</span>
              </div>
            </div>

            {/* Advanced Filters Bar */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', flexWrap: 'wrap' }}>
              {analyticsSettings?.enableDateRangeFilter && (
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>النطاق الزمني</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="date" style={{ flex: 1, padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)' }} />
                    <input type="date" style={{ flex: 1, padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)' }} />
                  </div>
                </div>
              )}
              
              {analyticsSettings?.filterDestDept && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>الوجهة (Destination)</label>
                  <select 
                    style={{ width: '100%', padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)' }}
                    value={analyticsDestDept}
                    onChange={e => setAnalyticsDestDept(e.target.value)}
                  >
                    <option value="ALL">جميع الأقسام</option>
                    <option value="IT_SUPPORT">الدعم الفني</option>
                    <option value="MAINTENANCE">الصيانة العامة</option>
                  </select>
                </div>
              )}
            </div>

            {/* KPI Cards */}
            {activeCharts.includes('kpi_cards') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '5px' }}>إجمالي التذاكر (المفلترة)</span>
                  <strong style={{ fontSize: '28px', color: '#172b4d' }}>{analyticsDestDept === 'ALL' ? MOCK_TICKETS.length : MOCK_TICKETS.filter(t => t.destination_department_ids.includes(analyticsDestDept)).length}</strong>
                </div>
                <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '5px' }}>التذاكر المفتوحة</span>
                  <strong style={{ fontSize: '28px', color: '#0052cc' }}>{MOCK_TICKETS.filter(t => t.status === 'OPEN').length}</strong>
                </div>
                <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#5e6c84', marginBottom: '5px' }}>خرق SLA محتمل</span>
                  <strong style={{ fontSize: '28px', color: '#ff5630' }}>{MOCK_TICKETS.filter(t => t.priority === 'P1').length}</strong>
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              {activeCharts.includes('bar_chart') && (
                <div style={{ height: '250px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5e6c84' }}>
                  <span style={{ fontSize: '40px', marginBottom: '10px' }}>📊</span>
                  <span style={{ fontWeight: 'bold' }}>رسم عمودي لتصنيف الأعطال</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>(Data reacts to Destination: {analyticsDestDept})</span>
                </div>
              )}
              {activeCharts.includes('line_chart') && (
                <div style={{ height: '250px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5e6c84' }}>
                  <span style={{ fontSize: '40px', marginBottom: '10px' }}>📈</span>
                  <span style={{ fontWeight: 'bold' }}>توجّه الأداء الزمني (SLA Trend)</span>
                </div>
              )}
              {activeCharts.includes('pie_chart') && (
                <div style={{ height: '250px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5e6c84' }}>
                  <span style={{ fontSize: '40px', marginBottom: '10px' }}>🥧</span>
                  <span style={{ fontWeight: 'bold' }}>توزيع التذاكر حسب الموظفين</span>
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* Advanced Comparison & Benchmarking Engine */}
      {isComponentActive('admin_leaderboard') && (() => {
        const lbSettings = getComponentSettings('admin_leaderboard');
        const allowedDimensions = lbSettings?.allowedDimensions || [];
        const allowedMetrics = lbSettings?.allowedMetrics || [];
        const displayModes = lbSettings?.displayModes || [];
        
        // Mock calculations for variance
        const val1 = leaderboardTarget1 === 'EMP_A' ? 45 : 30;
        const val2 = leaderboardTarget2 === 'EMP_B' ? 38 : 42;
        const variance = val2 - val1;
        const variancePercent = Math.round((variance / val1) * 100);

        return (
          <div style={{ marginTop: '30px', ...glassPanel, padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#172b4d', fontSize: '20px' }}>محرك المقارنة المتقدمة (Benchmarking)</h2>
              <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(54, 179, 126, 0.1)', color: '#36b37e', borderRadius: '20px', fontWeight: 'bold' }}>تفاعل لحظي (Zero-Lag)</span>
            </div>

            {/* Benchmarking Controls */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>محور المقارنة</label>
                <select 
                  style={{ width: '100%', padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)' }}
                  value={leaderboardDim}
                  onChange={e => setLeaderboardDim(e.target.value)}
                >
                  {allowedDimensions.includes('EMP_VS_EMP') && <option value="EMP_VS_EMP">موظف ضد موظف</option>}
                  {allowedDimensions.includes('DEPT_VS_DEPT') && <option value="DEPT_VS_DEPT">قسم ضد قسم</option>}
                  {allowedDimensions.includes('TIME_VS_TIME') && <option value="TIME_VS_TIME">فترة ضد فترة</option>}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#0052cc', marginBottom: '5px' }}>الطرف الأول (Target A)</label>
                <select 
                  style={{ width: '100%', padding: '8px', border: '1px solid rgba(0,82,204,0.3)', borderRadius: '6px', background: 'rgba(0,82,204,0.05)' }}
                  value={leaderboardTarget1}
                  onChange={e => setLeaderboardTarget1(e.target.value)}
                >
                  <option value="EMP_A">أحمد (موظف أ)</option>
                  <option value="EMP_C">خالد (موظف ج)</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#ff5630', marginBottom: '5px' }}>الطرف الثاني (Target B)</label>
                <select 
                  style={{ width: '100%', padding: '8px', border: '1px solid rgba(255,86,48,0.3)', borderRadius: '6px', background: 'rgba(255,86,48,0.05)' }}
                  value={leaderboardTarget2}
                  onChange={e => setLeaderboardTarget2(e.target.value)}
                >
                  <option value="EMP_B">سارة (موظف ب)</option>
                  <option value="EMP_D">منى (موظف د)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Variance Table */}
              {displayModes.includes('VARIANCE_TABLE') && (
                <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', color: '#172b4d', marginTop: 0, marginBottom: '15px' }}>مصفوفة الفروقات الرقمية (Variance Matrix)</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(9,30,66,0.1)', color: '#5e6c84' }}>
                        <th style={{ textAlign: 'right', padding: '8px' }}>المعيار</th>
                        <th style={{ textAlign: 'center', padding: '8px' }}>الطرف الأول</th>
                        <th style={{ textAlign: 'center', padding: '8px' }}>الطرف الثاني</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>الانحراف (Variance %)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowedMetrics.includes('VOLUME') && (
                        <tr style={{ borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
                          <td style={{ padding: '12px 8px' }}>حجم التذاكر المنجزة</td>
                          <td style={{ textAlign: 'center', color: '#0052cc', fontWeight: 'bold' }}>{val1}</td>
                          <td style={{ textAlign: 'center', color: '#ff5630', fontWeight: 'bold' }}>{val2}</td>
                          <td style={{ textAlign: 'left', fontWeight: 'bold', color: variance > 0 ? '#36b37e' : '#ff5630' }}>
                            {variance > 0 ? '+' : ''}{variancePercent}%
                          </td>
                        </tr>
                      )}
                      {allowedMetrics.includes('SLA') && (
                        <tr style={{ borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
                          <td style={{ padding: '12px 8px' }}>خروقات הـ SLA</td>
                          <td style={{ textAlign: 'center', color: '#0052cc', fontWeight: 'bold' }}>3</td>
                          <td style={{ textAlign: 'center', color: '#ff5630', fontWeight: 'bold' }}>1</td>
                          <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#36b37e' }}>
                            -66% (تحسن)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Side-by-Side Chart */}
              {displayModes.includes('SIDE_BAR') && (
                <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5e6c84', padding: '20px', minHeight: '200px' }}>
                  <span style={{ fontSize: '40px', marginBottom: '10px' }}>📊</span>
                  <span style={{ fontWeight: 'bold', color: '#172b4d' }}>الرسم العمودي المزدوج (Side-by-Side)</span>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '15px', alignItems: 'flex-end', height: '100px' }}>
                    {/* Mock Bars */}
                    <div style={{ width: '40px', background: '#0052cc', height: `${val1}%`, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '5px', color: '#fff', fontSize: '10px' }}>A</div>
                    <div style={{ width: '40px', background: '#ff5630', height: `${val2}%`, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '5px', color: '#fff', fontSize: '10px' }}>B</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* Central Archive Component */}
      {isComponentActive('admin_archive') && (() => {
        const archiveSettings = getComponentSettings('admin_archive');
        return (
          <div style={{ marginTop: '30px' }}>
            <ArchiveTable settings={archiveSettings as any} />
          </div>
        );
      })()}

      {/* Central Archive Component */}
      {isComponentActive('admin_archive') && (() => {
        const archiveSettings = getComponentSettings('admin_archive');
        const enabledFilters = archiveSettings?.enabledUIFilters || [];
        const scope = archiveSettings?.archiveScope || 'Department_Only';
        
        return (
          <div style={{ marginTop: '30px', ...glassPanel, padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#172b4d', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>🗄️ الأرشيف المركزي الآمن</span>
                  <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    Scope: {scope.replace('_', ' ')}
                  </span>
                </h2>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6b778c' }}>Strict Isolation Guardrails Active.</p>
              </div>
            </div>

            {/* Dynamic UI Filters (based on Admin Matrix) */}
            {enabledFilters.length > 0 && (
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {enabledFilters.includes('operator_name') && (
                  <input type="text" placeholder="تصفية باسم الموظف (Operator)..." style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', fontSize: '13px' }} />
                )}
                {enabledFilters.includes('end_user_name') && (
                  <input type="text" placeholder="تصفية باسم المستخدم النهائي..." style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', fontSize: '13px' }} />
                )}
                {enabledFilters.includes('issue_type') && (
                  <select style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="">كل أنواع البلاغات</option>
                    <option value="it">دعم فني</option>
                    <option value="network">شبكات</option>
                  </select>
                )}
                {enabledFilters.includes('building_location') && (
                  <select style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="">كل المباني</option>
                    <option value="HQ">المقر الرئيسي</option>
                  </select>
                )}
                <button style={{ padding: '0 20px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>تطبيق</button>
              </div>
            )}

            {/* Glassmorphic Archive Grid */}
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(9,30,66,0.04)', color: '#5e6c84', borderBottom: '2px solid rgba(9,30,66,0.1)' }}>
                    <th style={{ textAlign: 'right', padding: '15px' }}>رقم التذكرة</th>
                    <th style={{ textAlign: 'right', padding: '15px' }}>الوصف</th>
                    <th style={{ textAlign: 'center', padding: '15px' }}>تاريخ الإغلاق</th>
                    <th style={{ textAlign: 'center', padding: '15px' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {archiveSettings?.allowCompletedClosedTickets && (
                    <tr style={{ borderBottom: '1px solid rgba(9,30,66,0.05)', transition: 'background 0.2s', cursor: 'pointer' }}>
                      <td style={{ padding: '15px', fontFamily: 'monospace', color: '#0ea5e9', fontWeight: 'bold', fontSize: '14px' }}>TCK-9901</td>
                      <td style={{ padding: '15px', color: '#172b4d' }}>تحديث سيرفرات المقر الرئيسي</td>
                      <td style={{ padding: '15px', textAlign: 'center', color: '#5e6c84' }}>2026-05-25 14:00</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ padding: '6px 12px', background: '#e3fcef', color: '#006644', border: '1px solid #79f2c0', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                          مغلقة (Completed)
                        </span>
                      </td>
                    </tr>
                  )}
                  {archiveSettings?.allowSupplementaryAdditionalTickets && (
                    <tr style={{ borderBottom: '1px solid rgba(9,30,66,0.05)', transition: 'background 0.2s', cursor: 'pointer' }}>
                      <td style={{ padding: '15px', fontFamily: 'monospace', color: '#0ea5e9', fontWeight: 'bold', fontSize: '14px' }}>SUB-9901-A</td>
                      <td style={{ padding: '15px', color: '#172b4d' }}>تمديد كوابل الشبكة (ملحق)</td>
                      <td style={{ padding: '15px', textAlign: 'center', color: '#5e6c84' }}>2026-05-26 09:30</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ padding: '6px 12px', background: '#deebff', color: '#0747a6', border: '1px solid #b3d4ff', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                          ملحقة (Supplementary)
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Dynamic User Profile Component */}
      {isComponentActive('admin_profile') && (() => {
        const profileSettings = getComponentSettings('admin_profile');
        
        return (
          <div style={{ marginTop: '30px', ...glassPanel, background: 'rgba(15, 23, 42, 0.9)', padding: '0', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            {/* 1. Digital Identity Card & Banner */}
            <div style={{ height: '120px', background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', position: 'relative', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <button style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>تغيير الغلاف 📷</button>
            </div>
            
            <div style={{ padding: '0 30px 30px 30px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', border: '4px solid #0f172a', marginTop: '-45px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '36px', color: '#fff', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.5)' }}>
                    👨‍💻
                  </div>
                  <div style={{ paddingTop: '10px' }}>
                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      مجدي الزروق
                      <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', textShadow: 'none' }}>رئيس قسم التشغيل (Read-Only) 🔒</span>
                    </h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>majdi@litc.ly • قسم تقنية المعلومات</p>
                    {profileSettings?.identityProvider === 'Microsoft_SSO' && (
                      <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', color: '#38bdf8', border: '1px solid #0369a1', padding: '3px 8px', borderRadius: '6px', background: 'rgba(3, 105, 161, 0.15)', fontWeight: 'bold' }}>⚡ Verified by Microsoft Graph API</span>
                    )}
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '25px 0' }} />

              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* 2. Professional & Contact Specifications */}
                <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
                  <h3 style={{ color: '#38bdf8', fontSize: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>📞</span> معلومات الاتصال والوظيفة</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>رقم الهاتف الأساسي</label>
                      <input type="text" defaultValue="0911234567" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', color: '#f8fafc', fontSize: '13px', transition: 'border 0.3s' }} onFocus={(e) => e.target.style.borderColor = '#38bdf8'} onBlur={(e) => e.target.style.borderColor = 'rgba(56, 189, 248, 0.2)'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>هاتف الطوارئ (ثانوي)</label>
                      <input type="text" placeholder="إضافة رقم..." style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '13px', transition: 'border 0.3s' }} onFocus={(e) => e.target.style.borderColor = '#38bdf8'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>الرقم الوظيفي (Enterprise ID) 🔒</label>
                      <input type="text" value="EMP-88392" readOnly style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#64748b', fontSize: '13px', cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px' }}>المسمى الوظيفي المعتمد 🔒</label>
                      <input type="text" value="مهندس نظم تقنية" readOnly style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#64748b', fontSize: '13px', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic UI Customization Suite */}
                {profileSettings?.allowThemeCustomization && (
                  <div style={{ flex: '1 1 40%', minWidth: '300px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ color: '#c084fc', fontSize: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>🎨</span> تخصيص المظهر الديناميكي (Theme)</h3>
                    
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>لوحة الألوان النيون (Neon Palettes):</label>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '20px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 8px #0ea5e9' }}></div>
                        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 'bold' }}>Cyber Blue</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.6, padding: '6px 12px', borderRadius: '20px', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '1'} onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                        <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Emerald</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.6, padding: '6px 12px', borderRadius: '20px', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '1'} onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#a855f7' }}></div>
                        <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Aurora Purple</span>
                      </div>
                    </div>

                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>شفافية الزجاج (Glassmorphic Opacity):</label>
                    <input type="range" min="0" max="100" defaultValue="60" style={{ width: '100%', cursor: 'pointer', accentColor: '#c084fc' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '5px' }}>
                      <span>شفاف جداً</span>
                      <span>داكن صلب</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Embedded Notification & SLA Alert System */}
            {isComponentActive('admin_notifications') && (() => {
              const notifSettings = getComponentSettings('admin_notifications');
              const lockSLA = notifSettings?.lockSLAThresholds || false;
              const forceWhatsApp = notifSettings?.forceWhatsappCritical || false;

              return (
                <div style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,8,23,1) 100%)', borderTop: '1px solid rgba(56, 189, 248, 0.2)', padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🔔 إعدادات التنبيهات ونظام تصعيد SLA</span>
                    </h2>
                    {forceWhatsApp && (
                      <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>⚠️</span> مفروض بواسطة النظام: إشعارات WhatsApp للطوارئ
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    {/* Standard User Alerts Matrix */}
                    <div style={{ flex: '1 1 45%', minWidth: '350px' }}>
                      <h3 style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>الإشعارات التشغيلية الأساسية (Personal Level)</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ color: '#64748b', textAlign: 'left' }}>
                            <th style={{ paddingBottom: '10px', fontWeight: 'normal' }}>نوع الحدث</th>
                            <th style={{ paddingBottom: '10px', fontWeight: 'normal', textAlign: 'center' }}>🖥️ System</th>
                            <th style={{ paddingBottom: '10px', fontWeight: 'normal', textAlign: 'center' }}>📧 Email</th>
                            <th style={{ paddingBottom: '10px', fontWeight: 'normal', textAlign: 'center', color: '#10b981' }}>💬 WhatsApp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: 'إغلاق تذكرة (Ticket Completed)', sys: true, em: true, wa: false },
                            { label: 'إعادة تعيين (Ticket Reassigned)', sys: true, em: false, wa: false },
                            { label: 'نقل لقسم آخر (Department Transfer)', sys: true, em: true, wa: false },
                            { label: 'إنشاء تذكرة ملحقة (Sub-ticket Created)', sys: true, em: false, wa: false },
                          ].map((evt, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '10px 0', color: '#cbd5e1' }}>{evt.label}</td>
                              <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked={evt.sys} style={{ accentColor: '#38bdf8' }} /></td>
                              <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked={evt.em} style={{ accentColor: '#38bdf8' }} /></td>
                              <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked={evt.wa} style={{ accentColor: '#10b981' }} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Managerial SLA Alerts Matrix */}
                    <div style={{ flex: '1 1 45%', minWidth: '350px', background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.03) 0%, rgba(249, 115, 22, 0.03) 100%)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '20px', borderRadius: '12px' }}>
                      <h3 style={{ color: '#f97316', fontSize: '13px', marginBottom: '15px', borderBottom: '1px solid rgba(249, 115, 22, 0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🛡️</span> إشعارات الحوكمة والتصعيد الإداري (Managerial Only)
                      </h3>
                      
                      <div style={{ marginBottom: '20px' }}>
                        {[
                          { label: 'حالة إنجاز المهام للمرؤوسين' },
                          { label: 'التذاكر الواردة الجديدة للقسم' },
                          { label: 'التذاكر المحولة من أقسام خارجية' },
                        ].map((evt, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{evt.label}</span>
                            <div style={{ display: 'flex', gap: '15px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}><input type="checkbox" defaultChecked style={{ accentColor: '#38bdf8' }} /> 🖥️</label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}><input type="checkbox" defaultChecked style={{ accentColor: '#38bdf8' }} /> 📧</label>
                            </div>
                          </div>
                        ))}
                      </div>

                      <h4 style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>⏳ محددات التصعيد الزمني (SLA Breach Triggers)</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                          <span style={{ fontSize: '12px', color: '#f8fafc' }}>تأخر المهندس في الاستجابة وفتح التذكرة</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="number" defaultValue="15" disabled={lockSLA} style={{ width: '50px', padding: '5px', background: lockSLA ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', fontSize: '12px', textAlign: 'center', cursor: lockSLA ? 'not-allowed' : 'text' }} />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>دقيقة</span>
                            <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', opacity: forceWhatsApp ? 1 : 0.5 }}>📱 WhatsApp</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.1)' }}>
                          <span style={{ fontSize: '12px', color: '#f8fafc' }}>تأخر في المعالجة (تخطي المدة المتوقعة)</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="number" defaultValue="2" disabled={lockSLA} style={{ width: '50px', padding: '5px', background: lockSLA ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', fontSize: '12px', textAlign: 'center', cursor: lockSLA ? 'not-allowed' : 'text' }} />
                            <select disabled={lockSLA} style={{ padding: '5px', background: lockSLA ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: lockSLA ? 'not-allowed' : 'pointer' }}>
                              <option>ساعة</option>
                              <option>يوم</option>
                            </select>
                            <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', opacity: forceWhatsApp ? 1 : 0.5 }}>📱 WhatsApp</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}
      {isComponentActive('admin_sovereign_custody_ledger_v10') && (() => {
        const ledgerSettings = getComponentSettings('admin_sovereign_custody_ledger_v10');
        const allowedFilters = ledgerSettings?.allowedReportFilters || [];
        const allowedColumns = ledgerSettings?.allowedReportColumns || [];
        
        return (
          <div style={{ marginTop: '30px', ...glassPanel, padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#172b4d', fontSize: '20px' }}>منظومة العُهد والمخازن السيادية V10 (Custody Ledger)</h2>
              <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255, 171, 0, 0.1)', color: '#ffab00', borderRadius: '20px', fontWeight: 'bold' }}>Sovereign Audit Log</span>
            </div>

            {/* Dynamic Report Wizard / Filter Bar */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', flexWrap: 'wrap' }}>
              {allowedFilters.includes('BY_ITEM_TYPE') && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>تصنيف العهدة (Item Type)</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)' }}>
                    <option value="">جميع الأصناف</option>
                    <option value="IT">معدات تقنية</option>
                    <option value="FURNITURE">أثاث مكتبي</option>
                  </select>
                </div>
              )}
              {allowedFilters.includes('BY_DATE_RANGE') && (
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>تاريخ الصرف</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="date" style={{ flex: 1, padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)' }} />
                  </div>
                </div>
              )}
              {allowedFilters.includes('BY_TARGET_TICKET') && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>رقم التذكرة المرتبطة</label>
                  <input type="text" placeholder="مثال: TCK-1002" style={{ width: '100%', padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)' }} />
                </div>
              )}
            </div>

            {/* Custody Grid Table */}
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(9,30,66,0.1)', color: '#5e6c84' }}>
                    <th style={{ textAlign: 'right', padding: '8px' }}>رمز العهدة</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>الوصف</th>
                    {allowedColumns.includes('SHOW_RECEIVER_IDENTITY') && <th style={{ textAlign: 'center', padding: '8px' }}>المستلم الفعلي</th>}
                    {allowedColumns.includes('SHOW_EXACT_TIMESTAMP') && <th style={{ textAlign: 'center', padding: '8px' }}>تاريخ ووقت الصرف الدقيق</th>}
                    {allowedColumns.includes('SHOW_VERIFICATION_STATUS') && <th style={{ textAlign: 'center', padding: '8px' }}>حالة الاعتماد</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>IT-LPT-092</td>
                    <td style={{ padding: '12px 8px' }}>لابتوب Dell Latitude</td>
                    {allowedColumns.includes('SHOW_RECEIVER_IDENTITY') && <td style={{ textAlign: 'center', color: '#0052cc' }}>محمد الموظف</td>}
                    {allowedColumns.includes('SHOW_EXACT_TIMESTAMP') && <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>2026-05-30 14:05:22</td>}
                    {allowedColumns.includes('SHOW_VERIFICATION_STATUS') && <td style={{ textAlign: 'center' }}><span style={{ padding: '4px 8px', background: '#e3fcef', color: '#006644', borderRadius: '4px', fontSize: '11px' }}>معتمد موثق ✔️</span></td>}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>IT-SCR-104</td>
                    <td style={{ padding: '12px 8px' }}>شاشة Samsung 27"</td>
                    {allowedColumns.includes('SHOW_RECEIVER_IDENTITY') && <td style={{ textAlign: 'center', color: '#0052cc' }}>محمد الموظف</td>}
                    {allowedColumns.includes('SHOW_EXACT_TIMESTAMP') && <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>2026-05-28 09:12:00</td>}
                    {allowedColumns.includes('SHOW_VERIFICATION_STATUS') && <td style={{ textAlign: 'center' }}><span style={{ padding: '4px 8px', background: '#ffebe6', color: '#ff5630', borderRadius: '4px', fontSize: '11px' }}>قيد توقيع المدير ⏳</span></td>}
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        );
      })()}

      {/* Dynamic User Profile Component */}
      {isComponentActive('tool_user_profile') && (
        <div style={{ marginTop: '30px' }}>
          <DynamicUserProfile />
        </div>
      )}

    </div>
  );
};
