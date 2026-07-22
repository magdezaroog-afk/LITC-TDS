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

  // Custom Hook for layout logic
  const { systemMode, user } = useAuth();
  
  const [currentUserRole, setCurrentUserRole] = useState<CoreRole>('END_USER');
  useEffect(() => {
    if (user?.role === 'super_admin' || user?.role === 'system_director') setCurrentUserRole('IT_ADMIN');
    else if (user?.role === 'tech_director') setCurrentUserRole('OPERATIONAL_MANAGER');
    else if (user?.role === 'dept_head') setCurrentUserRole('SECTION_HEAD');
    else if (user?.role === 'team_leader') setCurrentUserRole('TEAM_LEADER');
    else setCurrentUserRole('END_USER');
  }, [user]);

  const { submissionSchema, workSchema, customFields, loading, isWorkModeLocked } = useWorkspaceLayout(currentUserRole);

  const schema = systemMode === 'work' ? workSchema : submissionSchema;
  const isBaseLayoutFallback = isWorkModeLocked; // Renamed conceptually

  const getComponentSettings = (id: string) => {
    return schema?.layoutConfig.find(c => c.componentId === id)?.settings || null;
  };

  const isComponentActive = (id: string) => {
    return schema?.layoutConfig.some(c => c.componentId === id) ?? false;
  };

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
      
      {/* Work Mode Logo Background (Only show if in work mode) */}
      {systemMode === 'work' && (
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
            justifyContent: 'center',
            opacity: 0.1
          }}
        >
          <div style={{ fontSize: '180px', marginBottom: '20px' }}>🛡️</div>
          <h1 style={{ fontSize: '72px', margin: 0, fontWeight: '900', letterSpacing: '6px' }}>LITC</h1>
          <p style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '2px' }}>OPERATING SYSTEM</p>
        </div>
      )}

      <header style={{ padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>م</div>
          <div>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'block' }}>مرحباً</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{systemMode === 'work' ? 'مساحة العمل المخصصة' : 'مساحة عمل الموظف'}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <SystemModeToggle isLocked={isBaseLayoutFallback} />
        </div>
      </header>

      {(!schema?.layoutConfig || schema.layoutConfig.filter(c => c.componentId !== 'tool_language_theme').length === 0) ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
            <h2 style={{ color: '#0f172a', fontWeight: '900', marginBottom: '10px' }}>
              {systemMode === 'work' ? 'مساحة العمل فارغة' : 'واجهة الإرسال الرئيسية فارغة'}
            </h2>
            <p style={{ color: '#64748b', fontWeight: '600', lineHeight: 1.6 }}>
              {systemMode === 'work' 
                ? 'لم يتم إضافة أي مكونات لواجهة العمل المخصصة بك بعد.'
                : 'واجهة الإرسال الرئيسية لا تحتوي على مكونات حالياً. (قم بإضافة مكون الإرسال من الإعدادات)'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Workspace Core */}
          <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {schema.layoutConfig
              .filter(c => c.componentId !== 'tool_language_theme')
              .map(comp => {
                switch (comp.componentId) {
                  case 'ticket_create':
                    const ticketCreateSettings = comp.settings || {};
                    return (
                      <div key={comp.componentId} style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '600px' }}>
                          <TicketCreatorForm
                            customFields={customFields}
                            allowedRouteIds={ticketCreateSettings?.destinationRoutes || []}
                            concurrencyPolicy={ticketCreateSettings?.concurrencyPolicy || 'ALLOW_MULTIPLE'}
                            hasActiveTicketInRoute={(routeId) => false}
                            glassPanelStyle={glassPanel}
                            inputStyle={inputStyle}
                          />
                        </div>
                      </div>
                    );
                  
                  case 'ticket_inbox':
                    const inboxSettings = comp.settings || {};
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
                    }

                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name || 'لوحة استعراض التذاكر'}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                          <button 
                            onClick={() => setActiveInboxTab('all')}
                            style={{ padding: '8px 16px', background: activeInboxTab === 'all' ? '#1e293b' : 'transparent', color: activeInboxTab === 'all' ? '#fff' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                          >الكل</button>
                          {activeTabsMap.map(tab => (
                            <button 
                              key={tab.key}
                              onClick={() => setActiveInboxTab(tab.key)}
                              style={{ padding: '8px 16px', background: activeInboxTab === tab.key ? '#1e293b' : 'transparent', color: activeInboxTab === tab.key ? '#fff' : '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >{tab.label}</button>
                          ))}
                        </div>
                        {activeInboxTab !== 'all' && allowedActionsForCurrentTab.length > 0 && (
                          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>الإجراءات المتاحة لك:</span>
                            {allowedActionsForCurrentTab.map((act: string) => (
                              <span key={act} style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{act}</span>
                            ))}
                          </div>
                        )}
                        <UserTicketTracker 
                          tickets={filteredTickets}
                          onExpandJourney={(id) => setExpandedJourneyTicketId(id)}
                        />
                      </div>
                    );

                  case 'admin_archive':
                    const archiveSettings = comp.settings || {};
                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name || 'الأرشيف المركزي'}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        <ArchiveTable 
                           scope={archiveSettings?.archiveScope || 'Department_Only'}
                           allowClosed={archiveSettings?.allowCompletedClosedTickets}
                           allowedFilters={archiveSettings?.enabledUIFilters || []}
                        />
                      </div>
                    );

                  case 'sub_ticket_engine':
                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name || 'التذاكر الفرعية'}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        <div style={{ ...glassPanel, padding: '30px', textAlign: 'center' }}>
                          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔗</div>
                          <h3 style={{ margin: 0, color: '#0f172a' }}>نظام التذاكر الفرعية</h3>
                          <p style={{ color: '#64748b' }}>هذه الوحدة تعمل كمعالج خلفي للتذاكر.</p>
                        </div>
                      </div>
                    );

                  case 'admin_leaderboard':
                    const leadSettings = comp.settings || {};
                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name || 'لوحة المقارنة والأداء'}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        <div style={{ ...glassPanel, padding: '30px' }}>
                           <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                              <select value={leaderboardDim} onChange={e => setLeaderboardDim(e.target.value)} style={inputStyle}>
                                {(leadSettings.allowedDimensions || ['EMP_VS_EMP']).map((d: string) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                           </div>
                           <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                              <span style={{ color: '#64748b', fontWeight: 'bold' }}>رسم بياني للمقارنة سيظهر هنا بناءً على {leaderboardDim}</span>
                           </div>
                        </div>
                      </div>
                    );

                  case 'admin_analytics':
                    const analyticsSettings = comp.settings || {};
                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name || 'التحليل المركزي'}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        <div style={{ ...glassPanel, padding: '30px' }}>
                           {analyticsSettings.filterDestDept && (
                             <select value={analyticsDestDept} onChange={e => setAnalyticsDestDept(e.target.value)} style={{ ...inputStyle, marginBottom: '20px', width: '200px' }}>
                                <option value="ALL">كل الإدارات</option>
                                <option value="IT">تقنية المعلومات</option>
                                <option value="HR">الموارد البشرية</option>
                             </select>
                           )}
                           <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                              <span style={{ color: '#64748b', fontWeight: 'bold' }}>Dashboard Charts for {analyticsDestDept}</span>
                           </div>
                        </div>
                      </div>
                    );

                  case 'admin_operational_console':
                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name || 'قمرة إدارة الكيانات التشغيلية'}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        <div style={{ ...glassPanel, padding: '30px', textAlign: 'center' }}>
                          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎛️</div>
                          <h3 style={{ margin: 0, color: '#0f172a' }}>لوحة التحكم بالكيانات النشطة</h3>
                        </div>
                      </div>
                    );
                    
                  case 'admin_notifications':
                  case 'admin_sovereign_custody_ledger_v10':
                  case 'admin_profile':
                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        <div style={{ ...glassPanel, padding: '30px', textAlign: 'center', color: '#64748b' }}>
                           هذا المكون تم تحميله برمجياً (Placeholder)
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
            })}
          </div>
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
          </>
        )}
    </div>
  );
};
