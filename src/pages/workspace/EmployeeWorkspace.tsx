import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { ArchiveTable } from '../../components/dashboard/ArchiveTable';
import { loadRoutes, TicketRouteDefinition } from '../admin/tabs/TicketRoutingTab';
import { TicketJourneyTimeline } from '../../components/dashboard/TicketJourneyTimeline';
import { MOCK_JOURNEYS } from '../../components/dashboard/mockJourneyData';
import { TicketCreatorForm } from '../../components/organisms/TicketCreatorForm';
import { UserTicketTracker } from '../../components/organisms/UserTicketTracker';
import { useWorkspaceLayout, CoreRole } from '../../hooks/useWorkspaceLayout';

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




import { UnifiedProfileDropdown } from '../../components/infrastructure/UnifiedProfileDropdown';
import { NotificationBell } from '../../components/infrastructure/NotificationBell';

export const EmployeeWorkspace: React.FC = () => {
  const theme = useTheme();

  const [currentUserRole, setCurrentUserRole] = useState<CoreRole>('OPERATIONAL_MANAGER');
  
  // Custom Hook for layout logic
  const { schema, customFields, loading, getComponentSettings, isComponentActive } = useWorkspaceLayout(currentUserRole);

  const [expandedJourneyTicketId, setExpandedJourneyTicketId] = useState<string | null>(null);
  const [currentUserDept, setCurrentUserDept] = useState<string>('IT_SUPPORT');

  const [savedRoutes, setSavedRoutes] = useState<TicketRouteDefinition[]>([]);
  const [activeInboxTab, setActiveInboxTab] = useState<MockTicket['status'] | 'all'>('OPEN');

  // Analytics State
  const [analyticsDestDept, setAnalyticsDestDept] = useState<string>('ALL');

  // Benchmarking State
  const [leaderboardDim, setLeaderboardDim] = useState<string>('EMP_VS_EMP');
  const [leaderboardTarget1, setLeaderboardTarget1] = useState<string>('EMP_A');
  const [leaderboardTarget2, setLeaderboardTarget2] = useState<string>('EMP_B');

  // Load ticket routes
  useEffect(() => {
    setSavedRoutes(loadRoutes());
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f4f5f7 0%, #e1e5eb 100%)', color: '#172b4d', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", direction: 'rtl' }}>
      
      {/* Top Header */}
      <header style={{ ...glassPanel, borderRadius: '0', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <UnifiedProfileDropdown currentUserRole={currentUserRole} />
          <NotificationBell />
          {/* Simulated User Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(9, 30, 66, 0.04)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(9, 30, 66, 0.08)', marginInlineStart: '15px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#0052cc', margin: 0 }}>محاكاة موظف النظام:</label>
            <select 
              value={currentUserRole} 
              onChange={(e) => {
                const role = e.target.value as CoreRole;
                setCurrentUserRole(role);
                if (role === 'IT_ADMIN') {
                  setCurrentUserDept('IT_SUPPORT');
                } else if (role === 'OPERATIONAL_MANAGER') {
                  setCurrentUserDept('IT_SUPPORT');
                } else if (role === 'OPERATIONAL_USER') {
                  setCurrentUserDept('IT_SUPPORT');
                } else {
                  setCurrentUserDept('MAINTENANCE');
                }
              }} 
              style={{ background: 'transparent', border: 'none', color: '#172b4d', fontSize: '11px', fontWeight: '700', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <option value="IT_ADMIN">💻 IT Admin</option>
              <option value="OPERATIONAL_MANAGER">📊 Dept Head (Manager)</option>
              <option value="OPERATIONAL_USER">🛠️ Section Head (User)</option>
              <option value="END_USER">👤 Field Engineer (End User)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

          
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
          <TicketCreatorForm
            customFields={customFields}
            allowedRouteIds={ticketCreateSettings?.destinationRoutes || []}
            concurrencyPolicy={ticketCreateSettings?.concurrencyPolicy || 'ALLOW_MULTIPLE'}
            hasActiveTicketInRoute={(routeId) => false} // TODO: Implement open ticket check once global state is available
            glassPanelStyle={glassPanel}
            inputStyle={inputStyle}
          />
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
            
            const activeTabsMap: { key: 'all' | 'OPEN' | 'NEW' | 'TRANSFERRED' | 'STUCK', label: string }[] = [
              { key: 'NEW', label: 'التذاكر الجديدة' },
              { key: 'OPEN', label: 'التذاكر المفتوحة' },
              { key: 'TRANSFERRED', label: 'التذاكر المحولة' },
              { key: 'STUCK', label: 'التذاكر العالقة' },
            ].filter(t => tabsConfig[t.key]?.active);

            // Filter tickets based on status AND strict data isolation
            const filteredTickets = MOCK_TICKETS.filter(t => 
              (activeInboxTab === 'all' || t.status === activeInboxTab) && 
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

                {/* Cleaned Pure Component for Tickets */}
                <UserTicketTracker 
                  layoutType="grid"
                  tickets={filteredTickets as any}
                  activeTab={activeInboxTab}
                  onTicketClick={(ticketId) => console.log('Open Ticket Modal', ticketId)}
                  allowedActions={allowedActionsForCurrentTab}
                  slaEnabled={isComponentActive('tool_sla_timer')}
                  subTicketsConfig={{
                    enabled: isComponentActive('ticket_sub'),
                    concurrencyMode: getComponentSettings('ticket_sub')?.concurrencyMode || 'PARALLEL',
                    maxSubTickets: getComponentSettings('ticket_sub')?.maxSubTickets || 10
                  }}
                  journeys={MOCK_JOURNEYS}
                  onJourneyClick={setExpandedJourneyTicketId}
                />
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

        const isOverride = analyticsSettings?.adminOverride || false;
        const isSectionHead = currentUserRole === 'OPERATIONAL_USER';
        const isFieldEngineer = currentUserRole === 'END_USER';
        
        // Dynamic controls derived from builder policies
        const mac = analyticsSettings?.managerAnalyticsControl || {};
        const drilldown = isOverride || currentUserRole === 'IT_ADMIN' || currentUserRole === 'OPERATIONAL_MANAGER' || mac.allowEngineerDrilldown;
        const locationF = isOverride || currentUserRole === 'IT_ADMIN' || currentUserRole === 'OPERATIONAL_MANAGER' || mac.allowLocationFilter;
        const taxF = isOverride || currentUserRole === 'IT_ADMIN' || currentUserRole === 'OPERATIONAL_MANAGER' || mac.allowTaxonomyFilter;
        
        // Scope isolation logic
        let effectiveScope = scope;
        if (isFieldEngineer) {
          effectiveScope = 'PERSONAL';
        } else if (isSectionHead) {
          effectiveScope = 'SECTION';
        }
        
        return (
          <div style={{ marginTop: '30px', ...glassPanel, padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#172b4d', fontSize: '20px' }}>التحليل المركزي وذكاء الأعمال (BI)</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(0, 101, 255, 0.1)', color: '#0052cc', borderRadius: '20px', fontWeight: 'bold' }}>
                  نطاق الاستعلام الفعلي: {effectiveScope === 'PERSONAL' ? 'شخصي (الموظف)' : effectiveScope === 'SECTION' ? 'قسم فرعي' : effectiveScope === 'TEAM' ? 'فريق العمل' : 'شامل'}
                </span>
                {isOverride && <span style={{ fontSize: '11px', background: '#ffebe6', color: '#ff5630', padding: '4px 8px', borderRadius: '6px' }}>👑 تجاوز الأدمين مفعل</span>}
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
              
              {locationF ? (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>المبنى (Location)</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)', color: '#172b4d' }}>
                    <option>📍 جميع المباني</option>
                    <option>المبنى الرئيسي (HQ)</option>
                    <option>فرع مصراتة</option>
                  </select>
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#ff5630', marginBottom: '5px' }}>المبنى (Location)</label>
                  <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255, 86, 48, 0.05)', color: '#ff5630', fontSize: '11px', textAlign: 'center', border: '1px dashed rgba(255,86,48,0.3)', fontWeight: 'bold' }}>🔒 فلتر الموقع محجوب</div>
                </div>
              )}
              
              {taxF ? (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>التصنيف (Taxonomy)</label>
                  <select style={{ width: '100%', padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)', color: '#172b4d' }}>
                    <option>🗂️ جميع التصنيفات</option>
                    <option>أعطال تقنية</option>
                    <option>أعطال شبكات</option>
                    <option>صيانة عامة</option>
                  </select>
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#ff5630', marginBottom: '5px' }}>التصنيف (Taxonomy)</label>
                  <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255, 86, 48, 0.05)', color: '#ff5630', fontSize: '11px', textAlign: 'center', border: '1px dashed rgba(255,86,48,0.3)', fontWeight: 'bold' }}>🔒 فلتر التصنيف محجوب</div>
                </div>
              )}

              {analyticsSettings?.filterDestDept && (
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#5e6c84', marginBottom: '5px' }}>الوجهة (Destination)</label>
                  <select 
                    style={{ width: '100%', padding: '8px', border: '1px solid rgba(9,30,66,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.5)', color: '#172b4d' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
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
              
              {/* Drilldown panel */}
              <div style={{ height: '250px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>🏆 أفضل المهندسين أداءً</span>
                {drilldown ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#5e6c84', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '5px' }}><span style={{ fontWeight: '500' }}>م. أحمد سالم</span><span>120 تذكرة</span></div>
                    <div style={{ fontSize: '12px', color: '#5e6c84', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '5px' }}><span style={{ fontWeight: '500' }}>م. سارة علي</span><span>115 تذكرة</span></div>
                    <div style={{ fontSize: '12px', color: '#5e6c84', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '500' }}>م. خليل إبراهيم</span><span>98 تذكرة</span></div>
                  </div>
                ) : (
                  <div style={{ flex: 1, background: 'rgba(255, 86, 48, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 86, 48, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ff5630', textAlign: 'center', padding: '10px' }}>
                    <span style={{ fontSize: '24px', marginBottom: '6px' }}>🔒</span>
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>تفاصيل المهندسين محجوبة</span>
                    <span style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>بناءً على قيود الصلاحية المفروضة من المشرف</span>
                  </div>
                )}
              </div>
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


      {/* Dynamic User Profile Component */}
      {isComponentActive('tool_user_profile') && (
        <div style={{ marginTop: '30px' }}>
          <DynamicUserProfile />
        </div>
      )}

      {/* Expanded Ticket Journey Modal */}
      {expandedJourneyTicketId && MOCK_JOURNEYS[expandedJourneyTicketId] && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(9, 30, 66, 0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: '500px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 8px 30px rgba(9, 30, 66, 0.25)', position: 'relative' }}>
            <button 
              onClick={() => setExpandedJourneyTicketId(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#5e6c84' }}
            >
              ✕
            </button>
            <TicketJourneyTimeline ticketId={expandedJourneyTicketId} nodes={MOCK_JOURNEYS[expandedJourneyTicketId]} compactMode={false} />
          </div>
        </div>
      )}
    </div>
  );
};
