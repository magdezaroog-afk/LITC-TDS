import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { ArchiveTable } from '../../components/dashboard/ArchiveTable';
import { loadRoutes, TicketRouteDefinition } from '../admin/tabs/TicketRoutingTab';
import { TicketJourneyTimeline } from '../../components/dashboard/TicketJourneyTimeline';
import { MOCK_JOURNEYS } from '../../components/dashboard/mockJourneyData';
import { TicketCreatorForm } from '../../components/organisms/TicketCreatorForm';
import { UserTicketTracker } from '../../components/organisms/UserTicketTracker';
import { useAuth } from '../../engine/auth/AuthContext';
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

import { ExternalComponentRenderer } from '../../components/runtime/ExternalComponentRenderer';
import { UnifiedProfileDropdown } from '../../components/infrastructure/UnifiedProfileDropdown';
import { NotificationBell } from '../../components/infrastructure/NotificationBell';
import { SystemModeToggle } from '../../components/molecules/SystemModeToggle';
import { Plus, LayoutDashboard, Ticket } from 'lucide-react';

export const EmployeeWorkspace: React.FC = () => {
  const theme = useTheme();

  const [currentUserRole, setCurrentUserRole] = useState<CoreRole>('OPERATIONAL_MANAGER');
  
  // Custom Hook for layout logic
  const { systemMode } = useAuth();
  const { schema, customFields, loading, getComponentSettings, isComponentActive } = useWorkspaceLayout(currentUserRole);

  const [expandedJourneyTicketId, setExpandedJourneyTicketId] = useState<string | null>(null);
  const [currentUserDept, setCurrentUserDept] = useState<string>('IT_SUPPORT');
  
  // Phase 3: Runtime Policy Mask
  const [dynamicPolicy, setDynamicPolicy] = useState<any>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await fetch('/api/v1/auth/user-policy/GLOBAL_POLICY?userId=1', {
          headers: { 'Authorization': 'Bearer system_token_123' }
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.policy) {
            setDynamicPolicy(JSON.parse(json.policy));
          } else {
            setDynamicPolicy(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic policy', err);
      }
    };
    fetchPolicy();
  }, [currentUserRole]);

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
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.03)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    color: '#0f172a',
    marginBottom: '15px',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <h2 style={{ color: '#2563eb', fontWeight: 'bold' }}>جاري تهيئة واجهة الموظف...</h2>
      </div>
    );
  }

  const langSettings = getComponentSettings('tool_language_theme');
  const ticketCreateSettings = getComponentSettings('ticket_create');

  const sectionHeaderStyle: React.CSSProperties = {
    margin: '0 0 20px 0', 
    color: '#0f172a', 
    fontSize: '22px', 
    fontWeight: '800',
    position: 'relative',
    display: 'inline-block'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)',
      backgroundSize: '24px 24px',
      color: '#0f172a', 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
      direction: 'rtl' 
    }}>
      
      {systemMode === 'work' ? (
        <>
        {/* Work Mode Logo Background */}
        <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: '180px', filter: 'drop-shadow(0 0 50px rgba(37, 99, 235, 0.6))', marginBottom: '20px' }}
              >
                🛡️
              </motion.div>
              <h1 style={{ fontSize: '72px', color: '#1e40af', margin: 0, fontWeight: '900', letterSpacing: '6px' }}>LITC</h1>
              <p style={{ fontSize: '28px', color: '#334155', fontWeight: '800', letterSpacing: '2px' }}>OPERATING SYSTEM</p>
            </div>
        </>
      ) : (
        <>
          <header style={{ padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>م</div>
              <div>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'block' }}>مرحباً، مجدي</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>مساحة عمل الموظف</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', transition: 'all 0.2s hover:border-blue-300' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', margin: 0 }}>محاكاة الدور:</label>
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
                style={{ background: 'transparent', border: 'none', color: '#0f172a', fontSize: '13px', fontWeight: '700', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <option value="IT_ADMIN">💻 IT Admin</option>
                <option value="OPERATIONAL_MANAGER">📊 Dept Head (Manager)</option>
                <option value="OPERATIONAL_USER">🛠️ Section Head (User)</option>
                <option value="END_USER">👤 Field Engineer (End User)</option>
              </select>
            </div>
          </header>

          {/* Main Workspace Core */}
          <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* Top Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {[
                { label: 'إجمالي التذاكر', val: MOCK_TICKETS.length, color: '#3b82f6', icon: '📝' },
                { label: 'قيد المعالجة', val: MOCK_TICKETS.filter(t => t.status === 'OPEN').length, color: '#10b981', icon: '🔄' },
                { label: 'عاجل P1', val: MOCK_TICKETS.filter(t => t.priority === 'P1').length, color: '#ef4444', icon: '⚡' },
                { label: 'تذاكر عالقة', val: MOCK_TICKETS.filter(t => t.status === 'STUCK').length, color: '#f59e0b', icon: '⚠️' }
              ].map((kpi, i) => (
                <div key={i} style={{ ...glassPanel, padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', borderRight: `4px solid ${kpi.color}` }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>{kpi.val}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginTop: '4px' }}>{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              
              {/* Right Sidebar: Ticket Creator */}
              <div style={{ flex: '1 1 350px', position: 'sticky', top: '100px' }}>
                {isComponentActive('ticket_create') ? (
                  <TicketCreatorForm
                    customFields={customFields}
                    allowedRouteIds={ticketCreateSettings?.destinationRoutes || []}
                    concurrencyPolicy={ticketCreateSettings?.concurrencyPolicy || 'ALLOW_MULTIPLE'}
                    hasActiveTicketInRoute={(routeId) => false}
                    glassPanelStyle={glassPanel}
                    inputStyle={inputStyle}
                  />
                ) : (
                  <aside style={{ ...glassPanel, alignSelf: 'start', opacity: 0.7, textAlign: 'center' }}>
                    <span style={{ display: 'block', padding: '40px 0', fontWeight: '600', color: '#64748b' }}>مكون إنشاء التذاكر معطل من قبل النظام.</span>
                  </aside>
                )}
              </div>

              {/* Center: Active Tickets Grid */}
              <main style={{ flex: '3 1 700px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div>
                  <h2 style={sectionHeaderStyle}>
                    لوحة تتبع البلاغات النشطة
                    <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                  </h2>
                </div>

                {isComponentActive('ticket_inbox') ? (() => {
                  const inboxSettings = getComponentSettings('ticket_inbox');
                  const tabsConfig = inboxSettings?.tabsConfig || {};
                  
                  const activeTabsMap: { key: 'all' | 'OPEN' | 'NEW' | 'TRANSFERRED' | 'STUCK', label: string }[] = [
                    { key: 'NEW', label: 'الجديدة' },
                    { key: 'OPEN', label: 'المفتوحة' },
                    { key: 'TRANSFERRED', label: 'المحولة' },
                    { key: 'STUCK', label: 'العالقة' },
                  ].filter(t => tabsConfig[t.key]?.active);

                  let filteredTickets = MOCK_TICKETS.filter(t => 
                    (activeInboxTab === 'all' || t.status === activeInboxTab) && 
                    t.destination_department_ids.includes(CURRENT_EMPLOYEE_DEPT)
                  );

                  if (dynamicPolicy && dynamicPolicy.archiveScope) {
                    if (dynamicPolicy.archiveScope === 'PERSONAL') {
                      filteredTickets = filteredTickets.filter(t => t.priority === 'P1');
                    } else if (dynamicPolicy.archiveScope === 'TEAM') {
                      filteredTickets = filteredTickets.filter(t => ['P1', 'P2'].includes(t.priority));
                    }
                  }

                  let allowedActionsForCurrentTab = tabsConfig[activeInboxTab]?.actions || [];

                  if (dynamicPolicy && dynamicPolicy.triageSwitches) {
                    if (dynamicPolicy.triageSwitches.canClaimSelf === false) {
                      allowedActionsForCurrentTab = allowedActionsForCurrentTab.filter((a: string) => a !== 'CLAIM');
                    }
                    if (dynamicPolicy.triageSwitches.canForwardInternally === false) {
                      allowedActionsForCurrentTab = allowedActionsForCurrentTab.filter((a: string) => a !== 'TRANSFER');
                    }
                  }

                  return (
                    <div style={{ ...glassPanel, padding: '30px' }}>
                      {/* Modern Pill-style Tabs */}
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {activeTabsMap.length > 0 ? activeTabsMap.map(tab => {
                          const isActive = activeInboxTab === tab.key;
                          const count = MOCK_TICKETS.filter(t => t.status === tab.key && t.destination_department_ids.includes(CURRENT_EMPLOYEE_DEPT)).length;
                          return (
                            <button 
                              key={tab.key}
                              onClick={() => setActiveInboxTab(tab.key)}
                              style={{ 
                                padding: '10px 20px', border: 'none', 
                                background: isActive ? '#2563eb' : '#f1f5f9', 
                                cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                                color: isActive ? '#fff' : '#64748b',
                                borderRadius: '30px',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                              }}
                              onMouseOver={(e) => { if(!isActive) e.currentTarget.style.background = '#e2e8f0' }}
                              onMouseOut={(e) => { if(!isActive) e.currentTarget.style.background = '#f1f5f9' }}
                            >
                              {tab.label}
                              <span style={{ background: isActive ? 'rgba(255,255,255,0.2)' : '#cbd5e1', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: isActive ? '#fff' : '#475569' }}>{count}</span>
                            </button>
                          )
                        }) : (
                          <span style={{ fontSize: '13px', color: '#94a3b8' }}>لم يقم الأدمن بتفعيل أي تبويبات وارد.</span>
                        )}
                      </div>

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
                    </div>
                  );
                })() : (
                  <div style={{ ...glassPanel, padding: '40px', textAlign: 'center', opacity: 0.7 }}>
                    <span style={{ fontWeight: '600', color: '#64748b' }}>مكون التذاكر الواردة معطل من قبل النظام.</span>
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
              
              const mac = analyticsSettings?.managerAnalyticsControl || {};
              const drilldown = isOverride || currentUserRole === 'IT_ADMIN' || currentUserRole === 'OPERATIONAL_MANAGER' || mac.allowEngineerDrilldown;
              const locationF = isOverride || currentUserRole === 'IT_ADMIN' || currentUserRole === 'OPERATIONAL_MANAGER' || mac.allowLocationFilter;
              const taxF = isOverride || currentUserRole === 'IT_ADMIN' || currentUserRole === 'OPERATIONAL_MANAGER' || mac.allowTaxonomyFilter;
              
              let effectiveScope = scope;
              if (isFieldEngineer) {
                effectiveScope = 'PERSONAL';
              } else if (isSectionHead) {
                effectiveScope = 'SECTION';
              }
              
              return (
                <div style={{ ...glassPanel, padding: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={sectionHeaderStyle}>
                      التحليل المركزي وذكاء الأعمال (BI)
                      <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                    </h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '13px', padding: '8px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: '30px', fontWeight: '700' }}>
                        نطاق الاستعلام: {effectiveScope === 'PERSONAL' ? 'شخصي' : effectiveScope === 'SECTION' ? 'قسم فرعي' : effectiveScope === 'TEAM' ? 'فريق العمل' : 'شامل'}
                      </span>
                      {isOverride && <span style={{ fontSize: '13px', background: '#fef2f2', color: '#ef4444', padding: '8px 16px', borderRadius: '30px', fontWeight: '700' }}>👑 تجاوز الأدمين</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', padding: '24px', background: '#f8fafc', borderRadius: '16px', flexWrap: 'wrap', border: '1px solid #e2e8f0' }}>
                    {analyticsSettings?.enableDateRangeFilter && (
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>النطاق الزمني</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input type="date" style={inputStyle} />
                          <input type="date" style={inputStyle} />
                        </div>
                      </div>
                    )}
                    
                    {locationF ? (
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>المبنى (Location)</label>
                        <select style={inputStyle}>
                          <option>📍 جميع المباني</option>
                          <option>المبنى الرئيسي (HQ)</option>
                          <option>فرع مصراتة</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>المبنى (Location)</label>
                        <div style={{ padding: '12px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', fontSize: '12px', textAlign: 'center', border: '1px dashed #fca5a5', fontWeight: 'bold' }}>🔒 محجوب</div>
                      </div>
                    )}
                    
                    {taxF ? (
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>التصنيف (Taxonomy)</label>
                        <select style={inputStyle}>
                          <option>🗂️ جميع التصنيفات</option>
                          <option>أعطال تقنية</option>
                          <option>أعطال شبكات</option>
                          <option>صيانة عامة</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>التصنيف (Taxonomy)</label>
                        <div style={{ padding: '12px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', fontSize: '12px', textAlign: 'center', border: '1px dashed #fca5a5', fontWeight: 'bold' }}>🔒 محجوب</div>
                      </div>
                    )}

                    {analyticsSettings?.filterDestDept && (
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>الوجهة (Destination)</label>
                        <select 
                          style={inputStyle}
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

                  {activeCharts.includes('kpi_cards') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                      <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', borderRight: '4px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>{analyticsDestDept === 'ALL' ? MOCK_TICKETS.length : MOCK_TICKETS.filter(t => t.destination_department_ids.includes(analyticsDestDept)).length}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginTop: '8px' }}>إجمالي التذاكر (المفلترة)</div>
                      </div>
                      <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', borderRight: '4px solid #10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>{MOCK_TICKETS.filter(t => t.status === 'OPEN').length}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginTop: '8px' }}>التذاكر المفتوحة</div>
                      </div>
                      <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', borderRight: '4px solid #ef4444', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>{MOCK_TICKETS.filter(t => t.priority === 'P1').length}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginTop: '8px' }}>خرق SLA محتمل</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {activeCharts.includes('bar_chart') && (
                      <div style={{ height: '280px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <span style={{ fontSize: '48px', marginBottom: '16px' }}>📊</span>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>رسم عمودي لتصنيف الأعطال</span>
                        <span style={{ fontSize: '12px', marginTop: '8px' }}>(Data reacts to: {analyticsDestDept})</span>
                      </div>
                    )}
                    {activeCharts.includes('line_chart') && (
                      <div style={{ height: '280px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <span style={{ fontSize: '48px', marginBottom: '16px' }}>📈</span>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>توجّه الأداء الزمني (SLA Trend)</span>
                      </div>
                    )}
                    {activeCharts.includes('pie_chart') && (
                      <div style={{ height: '280px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <span style={{ fontSize: '48px', marginBottom: '16px' }}>🥧</span>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>توزيع التذاكر حسب الموظفين</span>
                      </div>
                    )}
                    
                    <div style={{ height: '280px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>🏆 أفضل المهندسين أداءً</span>
                      {drilldown ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}><span style={{ fontWeight: '700' }}>م. أحمد سالم</span><span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>120 تذكرة</span></div>
                          <div style={{ fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}><span style={{ fontWeight: '700' }}>م. سارة علي</span><span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>115 تذكرة</span></div>
                          <div style={{ fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '700' }}>م. خليل إبراهيم</span><span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>98 تذكرة</span></div>
                        </div>
                      ) : (
                        <div style={{ flex: 1, background: '#fef2f2', borderRadius: '12px', border: '1px dashed #fca5a5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', textAlign: 'center', padding: '20px' }}>
                          <span style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</span>
                          <span style={{ fontSize: '14px', fontWeight: '800' }}>تفاصيل المهندسين محجوبة</span>
                          <span style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>بناءً على قيود الصلاحية المفروضة</span>
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
              const enabledFilters = archiveSettings?.enabledUIFilters || [];
              const scope = archiveSettings?.archiveScope || 'Department_Only';
              
              return (
                <div style={{ ...glassPanel, padding: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                      <h2 style={sectionHeaderStyle}>
                        🗄️ الأرشيف المركزي الآمن
                        <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                      </h2>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Strict Isolation Guardrails Active.</p>
                    </div>
                    <span style={{ fontSize: '13px', padding: '8px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: '30px', fontWeight: '700', border: '1px solid #bfdbfe' }}>
                      Scope: {scope.replace('_', ' ')}
                    </span>
                  </div>

                  {enabledFilters.length > 0 && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                      {enabledFilters.includes('operator_name') && (
                        <input type="text" placeholder="تصفية باسم الموظف (Operator)..." style={{ ...inputStyle, marginBottom: 0, flex: 1, minWidth: '200px' }} />
                      )}
                      {enabledFilters.includes('end_user_name') && (
                        <input type="text" placeholder="تصفية باسم المستخدم النهائي..." style={{ ...inputStyle, marginBottom: 0, flex: 1, minWidth: '200px' }} />
                      )}
                      {enabledFilters.includes('issue_type') && (
                        <select style={{ ...inputStyle, marginBottom: 0, flex: 1, minWidth: '200px' }}>
                          <option value="">كل أنواع البلاغات</option>
                          <option value="it">دعم فني</option>
                          <option value="network">شبكات</option>
                        </select>
                      )}
                      {enabledFilters.includes('building_location') && (
                        <select style={{ ...inputStyle, marginBottom: 0, flex: 1, minWidth: '200px' }}>
                          <option value="">كل المباني</option>
                          <option value="HQ">المقر الرئيسي</option>
                        </select>
                      )}
                      <button style={{ padding: '0 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', transition: 'all 0.2s hover:bg-blue-700' }}>تطبيق</button>
                    </div>
                  )}

                  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ textAlign: 'right', padding: '16px 24px', fontWeight: '700' }}>رقم التذكرة</th>
                          <th style={{ textAlign: 'right', padding: '16px 24px', fontWeight: '700' }}>الوصف</th>
                          <th style={{ textAlign: 'center', padding: '16px 24px', fontWeight: '700' }}>تاريخ الإغلاق</th>
                          <th style={{ textAlign: 'center', padding: '16px 24px', fontWeight: '700' }}>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archiveSettings?.allowCompletedClosedTickets && (
                          <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: '#2563eb', fontWeight: '800', fontSize: '15px' }}>TCK-9901</td>
                            <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '600' }}>تحديث سيرفرات المقر الرئيسي</td>
                            <td style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b' }}>2026-05-25 14:00</td>
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              <span style={{ padding: '6px 16px', background: '#dcfce7', color: '#166534', borderRadius: '30px', fontSize: '12px', fontWeight: '800' }}>
                                مغلقة (Completed)
                              </span>
                            </td>
                          </tr>
                        )}
                        {archiveSettings?.allowSupplementaryAdditionalTickets && (
                          <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: '#2563eb', fontWeight: '800', fontSize: '15px' }}>SUB-9901-A</td>
                            <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '600' }}>تمديد كوابل الشبكة (ملحق)</td>
                            <td style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b' }}>2026-05-26 09:30</td>
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                              <span style={{ padding: '6px 16px', background: '#eff6ff', color: '#1e40af', borderRadius: '30px', fontSize: '12px', fontWeight: '800' }}>
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
                <div style={{ ...glassPanel, background: 'rgba(15, 23, 42, 0.95)', padding: '0', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '24px' }}>
                  {/* 1. Digital Identity Card & Banner */}
                  <div style={{ height: '140px', background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', position: 'relative', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <button style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.3s', fontWeight: '600' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>تغيير الغلاف 📷</button>
                  </div>
                  
                  <div style={{ padding: '0 40px 40px 40px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', border: '6px solid #0f172a', marginTop: '-50px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', color: '#fff', boxShadow: '0 4px 20px rgba(2, 132, 199, 0.6)' }}>
                          👨‍💻
                        </div>
                        <div style={{ paddingTop: '12px' }}>
                          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '26px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            مجدي الزروق
                            <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', textShadow: 'none', fontWeight: '800' }}>رئيس قسم التشغيل (Read-Only) 🔒</span>
                          </h2>
                          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>majdi@litc.ly • قسم تقنية المعلومات</p>
                          {profileSettings?.identityProvider === 'Microsoft_SSO' && (
                            <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '11px', color: '#38bdf8', border: '1px solid #0369a1', padding: '4px 10px', borderRadius: '8px', background: 'rgba(3, 105, 161, 0.2)', fontWeight: '800' }}>⚡ Verified by Microsoft Graph API</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '30px 0' }} />

                    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                      {/* 2. Professional & Contact Specifications */}
                      <div style={{ flex: '1 1 50%', minWidth: '320px' }}>
                        <h3 style={{ color: '#38bdf8', fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><span>📞</span> معلومات الاتصال والوظيفة</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>رقم الهاتف الأساسي</label>
                            <input type="text" defaultValue="0911234567" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', transition: 'border 0.3s', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#38bdf8'} onBlur={(e) => e.target.style.borderColor = 'rgba(56, 189, 248, 0.3)'} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>هاتف الطوارئ (ثانوي)</label>
                            <input type="text" placeholder="إضافة رقم..." style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', transition: 'border 0.3s', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#38bdf8'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>الرقم الوظيفي (Enterprise ID) 🔒</label>
                            <input type="text" value="EMP-88392" readOnly style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: '#64748b', fontSize: '14px', cursor: 'not-allowed', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>المسمى الوظيفي المعتمد 🔒</label>
                            <input type="text" value="مهندس نظم تقنية" readOnly style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: '#64748b', fontSize: '14px', cursor: 'not-allowed', outline: 'none' }} />
                          </div>
                        </div>
                      </div>

                      {/* 3. Dynamic UI Customization Suite */}
                      {profileSettings?.allowThemeCustomization && (
                        <div style={{ flex: '1 1 40%', minWidth: '320px', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <h3 style={{ color: '#c084fc', fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><span>🎨</span> تخصيص المظهر الديناميكي (Theme)</h3>
                          
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px' }}>لوحة الألوان النيون (Neon Palettes):</label>
                          <div style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.4)', borderRadius: '24px' }}>
                              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 10px #0ea5e9' }}></div>
                              <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '800' }}>Cyber Blue</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.6, padding: '8px 16px', borderRadius: '24px', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '1'} onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}>
                              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#10b981' }}></div>
                              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '700' }}>Emerald</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.6, padding: '8px 16px', borderRadius: '24px', transition: 'opacity 0.3s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '1'} onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}>
                              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#a855f7' }}></div>
                              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '700' }}>Aurora Purple</span>
                            </div>
                          </div>

                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '12px' }}>شفافية الزجاج (Glassmorphic Opacity):</label>
                          <input type="range" min="0" max="100" defaultValue="60" style={{ width: '100%', cursor: 'pointer', accentColor: '#c084fc' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#64748b', marginTop: '8px' }}>
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
                      <div style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,8,23,1) 100%)', borderTop: '1px solid rgba(56, 189, 248, 0.2)', padding: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span>🔔 إعدادات التنبيهات ونظام تصعيد SLA</span>
                          </h2>
                          {forceWhatsApp && (
                            <span style={{ fontSize: '13px', padding: '6px 16px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', borderRadius: '16px', border: '1px solid rgba(249, 115, 22, 0.4)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                              <span>⚠️</span> مفروض بواسطة النظام: إشعارات WhatsApp للطوارئ
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                          {/* Standard User Alerts Matrix */}
                          <div style={{ flex: '1 1 45%', minWidth: '350px' }}>
                            <h3 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>الإشعارات التشغيلية الأساسية (Personal Level)</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ color: '#64748b', textAlign: 'left' }}>
                                  <th style={{ paddingBottom: '12px', fontWeight: '700', textAlign: 'right' }}>نوع الحدث</th>
                                  <th style={{ paddingBottom: '12px', fontWeight: '700', textAlign: 'center' }}>🖥️ System</th>
                                  <th style={{ paddingBottom: '12px', fontWeight: '700', textAlign: 'center' }}>📧 Email</th>
                                  <th style={{ paddingBottom: '12px', fontWeight: '700', textAlign: 'center', color: '#10b981' }}>💬 WhatsApp</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { label: 'إغلاق تذكرة (Ticket Completed)', sys: true, em: true, wa: false },
                                  { label: 'إعادة تعيين (Ticket Reassigned)', sys: true, em: false, wa: false },
                                  { label: 'نقل لقسم آخر (Department Transfer)', sys: true, em: true, wa: false },
                                  { label: 'إنشاء تذكرة ملحقة (Sub-ticket Created)', sys: true, em: false, wa: false },
                                ].map((evt, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '12px 0', color: '#cbd5e1', fontWeight: '600' }}>{evt.label}</td>
                                    <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked={evt.sys} style={{ accentColor: '#38bdf8', transform: 'scale(1.2)' }} /></td>
                                    <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked={evt.em} style={{ accentColor: '#38bdf8', transform: 'scale(1.2)' }} /></td>
                                    <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked={evt.wa} style={{ accentColor: '#10b981', transform: 'scale(1.2)' }} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Managerial SLA Alerts Matrix */}
                          <div style={{ flex: '1 1 45%', minWidth: '350px', background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ color: '#f97316', fontSize: '14px', fontWeight: '800', marginBottom: '20px', borderBottom: '1px solid rgba(249, 115, 22, 0.2)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>🛡️</span> إشعارات الحوكمة والتصعيد الإداري (Managerial Only)
                            </h3>
                            
                            <div style={{ marginBottom: '24px' }}>
                              {[
                                { label: 'حالة إنجاز المهام للمرؤوسين' },
                                { label: 'التذاكر الواردة الجديدة للقسم' },
                                { label: 'التذاكر المحولة من أقسام خارجية' },
                              ].map((evt, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600' }}>{evt.label}</span>
                                  <div style={{ display: 'flex', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}><input type="checkbox" defaultChecked style={{ accentColor: '#38bdf8', transform: 'scale(1.1)' }} /> 🖥️</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}><input type="checkbox" defaultChecked style={{ accentColor: '#38bdf8', transform: 'scale(1.1)' }} /> 📧</label>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <h4 style={{ fontSize: '13px', color: '#ef4444', fontWeight: '800', marginBottom: '16px' }}>⏳ محددات التصعيد الزمني (SLA Breach Triggers)</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>تأخر المهندس في الاستجابة وفتح التذكرة</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <input type="number" defaultValue="15" disabled={lockSLA} style={{ width: '60px', padding: '8px', background: lockSLA ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', fontSize: '13px', textAlign: 'center', cursor: lockSLA ? 'not-allowed' : 'text', outline: 'none' }} />
                                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>دقيقة</span>
                                  <span style={{ background: '#10b981', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', opacity: forceWhatsApp ? 1 : 0.6 }}>📱 WhatsApp</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                                <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>تأخر في المعالجة (تخطي المدة المتوقعة)</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <input type="number" defaultValue="2" disabled={lockSLA} style={{ width: '60px', padding: '8px', background: lockSLA ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', fontSize: '13px', textAlign: 'center', cursor: lockSLA ? 'not-allowed' : 'text', outline: 'none' }} />
                                  <select disabled={lockSLA} style={{ padding: '8px', background: lockSLA ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: lockSLA ? 'not-allowed' : 'pointer', outline: 'none' }}>
                                    <option>ساعة</option>
                                    <option>يوم</option>
                                  </select>
                                  <span style={{ background: '#10b981', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', opacity: forceWhatsApp ? 1 : 0.6 }}>📱 WhatsApp</span>
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

            {/* Expanded Ticket Journey Modal */}
            {expandedJourneyTicketId && MOCK_JOURNEYS[expandedJourneyTicketId] && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90000 }}>
                <div style={{ background: '#fff', width: '550px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative', border: '1px solid #e2e8f0' }}>
                  <button 
                    onClick={() => setExpandedJourneyTicketId(null)}
                    style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s hover:bg-slate-200 hover:text-slate-900' }}
                  >
                    ✕
                  </button>
                  <div style={{ padding: '24px 24px 0 24px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>رحلة التذكرة</h3>
                  </div>
                  <TicketJourneyTimeline ticketId={expandedJourneyTicketId} nodes={MOCK_JOURNEYS[expandedJourneyTicketId]} compactMode={false} />
                </div>
              </div>
            )}
            
          </div>
        </>
      )}
    </div>
  );
};
