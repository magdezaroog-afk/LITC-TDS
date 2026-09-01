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
import { Plus, LayoutDashboard, Ticket, Star, ShieldCheck } from 'lucide-react';

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;
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
                      
                      // Find inbox component to read governance settings
                      const inboxComp = schema.layout.find((c: any) => c.componentId === 'ticket_inbox');
                      const inboxSettings = inboxComp?.properties || {};
                      const preventNewTicket = inboxSettings.preventNewTicketIfPendingRating === true;
                      const preventConcurrent = ticketCreateSettings?.concurrencyPolicy === 'PREVENT_CONCURRENT';

                      const checkActiveTicket = (routeId: string) => {
                        let lockedReason: boolean | string = false;
                        for (const t of userActiveTickets) {
                          if (t.routeId === routeId) {
                            if (t.status !== 'CLOSED' && t.status !== 'RESOLVED' && preventConcurrent) {
                              lockedReason = 'لديكم طلب مفتوح';
                              break;
                            }
                            if (t.status === 'RESOLVED' && preventNewTicket) {
                              if (!t.rating || t.rating === 0) {
                                lockedReason = 'طلب بانتظار التقييم';
                                break;
                              }
                            }
                          }
                        }
                        return lockedReason;
                      };

                      return (
                        <div key={comp.componentId} style={{ display: 'flex', justifyContent: 'center' }}>
                          <div style={{ width: '100%', maxWidth: '600px' }}>
                            <TicketCreatorForm
                              customFields={customFields}
                              allowedRouteIds={ticketCreateSettings?.destinationRoutes || []}
                              concurrencyPolicy={ticketCreateSettings?.concurrencyPolicy || 'ALLOW_MULTIPLE'}
                              hasActiveTicketInRoute={checkActiveTicket}
                              glassPanelStyle={glassPanel}
                              inputStyle={inputStyle}
                            />
                          </div>
                        </div>
                      );
                    
case 'ticket_inbox':
                    const inboxProps = comp.properties || {};
                    
                    const timelineVisibility = inboxProps.timelineVisibility || 'ALL_STEPS';
                    const requireRatingToClose = inboxProps.requireRatingToClose !== undefined ? inboxProps.requireRatingToClose : true;
                    const allowCancellation = inboxProps.allowCancellation || false;

                    return (
                      <div key={comp.componentId} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                          <h2 style={sectionHeaderStyle}>
                            {comp.name || 'لوحة استعراض التذاكر المرسلة'}
                            <div style={{ position: 'absolute', bottom: '-4px', right: 0, width: '40px', height: '4px', background: 'linear-gradient(90deg, #2563eb, transparent)', borderRadius: '2px' }}></div>
                          </h2>
                        </div>
                        
                        {userActiveTickets.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {userActiveTickets.map(ticket => {
                              // If requireRatingToClose is false and status is RESOLVED but not rated, it could be auto-closed. 
                              // But for now, let's just honor the property in the rating UI.
                              if (ticket.status === 'CLOSED') return null;

                              const activeRating = ticket.rating || 0;
                              const ratingComment = ticket.ratingComment || '';
                              
                              // Filter history based on timelineVisibility
                              let displayHistory = ticket.history || [];
                              if (timelineVisibility === 'MAJOR_MILESTONES') {
                                displayHistory = displayHistory.filter((n: any, idx: number) => {
                                  // Keep first (new), and any pending/completed/active that represent major milestones.
                                  // Usually we can just hide 'ACTIVE' if it's an internal transfer, but let's just keep the ends and current.
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
                                  {/* Colorful header band */}
                                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: ticket.routeColor }} />

                                  {/* Top Meta info */}
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
                                      {allowCancellation && ticket.status === 'NEW' && (
                                        <button 
                                          onClick={() => {
                                            ticket.status = 'CLOSED';
                                            localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                            setUserActiveTickets([...userActiveTickets]);
                                            window.dispatchEvent(new Event('litc_settings_updated'));
                                          }}
                                          style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
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

                                  {/* Interactive Timeline Map */}
                                  <div style={{ marginBottom: '24px', padding: '16px', background: '#fafbfc', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
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

                                  {/* Rating Card (Active ONLY when RESOLVED) */}
                                  {ticket.status === 'RESOLVED' ? (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      style={{
                                        background: 'linear-gradient(135deg, #10b98108, #3b82f605)',
                                        border: '1.5px dashed #10b98180',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        textAlign: 'center'
                                      }}
                                    >
                                      <h4 style={{ margin: '0 0 8px 0', color: '#065f46', fontSize: '16px', fontWeight: 800 }}>✨ تم حل المشكلة بنجاح! الرجاء تقييم الخدمة لإغلاق الطلب</h4>
                                      <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#047857' }}>تقييمك يعزز جودة الخدمة ويسجل مباشرة لجميع الموظفين الذين ساهموا في حل المشكلة.</p>

                                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            size={32}
                                            onClick={() => {
                                              ticket.rating = star;
                                              localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                              setUserActiveTickets([...userActiveTickets]);
                                            }}
                                            style={{
                                              cursor: 'pointer',
                                              fill: star <= activeRating ? '#fbbf24' : 'none',
                                              color: star <= activeRating ? '#fbbf24' : '#cbd5e1',
                                              transition: 'transform 0.2s'
                                            }}
                                          />
                                        ))}
                                      </div>

                                      <textarea
                                        placeholder="أضف ملاحظاتك أو كلمة شكر للفريق... (اختياري)"
                                        value={ratingComment}
                                        onChange={(e) => {
                                          ticket.ratingComment = e.target.value;
                                          localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                          setUserActiveTickets([...userActiveTickets]);
                                        }}
                                        style={{
                                          width: '100%', maxWidth: '400px', height: '60px',
                                          padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                          fontSize: '12px', outline: 'none', resize: 'none', margin: '0 auto 12px', display: 'block'
                                        }}
                                      />

                                      <button
                                        onClick={() => {
                                          if (requireRatingToClose && activeRating === 0) {
                                            alert('الرجاء اختيار عدد النجوم للتقييم أولاً.');
                                            return;
                                          }
                                          ticket.status = 'CLOSED';
                                          localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                          setUserActiveTickets([...userActiveTickets]);
                                          window.dispatchEvent(new Event('storage'));
                                          window.dispatchEvent(new Event('litc_settings_updated'));
                                        }}
                                        style={{
                                          background: '#10b981', color: '#fff', border: 'none',
                                          padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                                          cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                                        }}
                                      >
                                        <ShieldCheck size={16} /> تقديم التقييم وإغلاق الطلب
                                      </button>
                                      
                                      {!requireRatingToClose && (
                                        <div style={{ marginTop: '12px' }}>
                                          <button 
                                            onClick={() => {
                                              ticket.status = 'CLOSED';
                                              localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                              setUserActiveTickets([...userActiveTickets]);
                                              window.dispatchEvent(new Event('storage'));
                                              window.dispatchEvent(new Event('litc_settings_updated'));
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                                            تخطي وإغلاق الطلب بدون تقييم
                                          </button>
                                        </div>
                                      )}
                                    </motion.div>
                                  ) : (
                                    /* Simulator Control Strip */
                                    <div style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                      padding: '10px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px',
                                      border: '1px solid rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '8px'
                                    }}>
                                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>🧪 محاكاة:</span>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        {ticket.status === 'NEW' && (
                                          <button onClick={() => {
                                            ticket.status = 'OPEN';
                                            if (ticket.history && ticket.history[1]) ticket.history[1].status = 'COMPLETED';
                                            if (ticket.history && ticket.history[2]) ticket.history[2].status = 'ACTIVE';
                                            localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                            setUserActiveTickets([...userActiveTickets]);
                                            window.dispatchEvent(new Event('litc_settings_updated'));
                                          }} style={{ padding: '4px 8px', fontSize: '11px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>قبول ومعالجة</button>
                                        )}
                                        {ticket.status === 'OPEN' && (
                                          <button onClick={() => {
                                            ticket.status = 'TRANSFERRED';
                                            ticket.currentHandler = "إدارة أمن المعلومات";
                                            if (ticket.history && ticket.history[2]) {
                                              ticket.history[2].title = "تحويل";
                                              ticket.history[2].department = "أمن المعلومات";
                                            }
                                            localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                            setUserActiveTickets([...userActiveTickets]);
                                            window.dispatchEvent(new Event('litc_settings_updated'));
                                          }} style={{ padding: '4px 8px', fontSize: '11px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>تحويل</button>
                                        )}
                                        {(ticket.status === 'OPEN' || ticket.status === 'TRANSFERRED') && (
                                          <button onClick={() => {
                                            ticket.status = 'RESOLVED';
                                            if (ticket.history && ticket.history[2]) ticket.history[2].status = 'COMPLETED';
                                            if (ticket.history && ticket.history[3]) ticket.history[3].status = 'COMPLETED';
                                            localStorage.setItem('litc_user_active_tickets', JSON.stringify(userActiveTickets));
                                            setUserActiveTickets([...userActiveTickets]);
                                            window.dispatchEvent(new Event('litc_settings_updated'));
                                          }} style={{ padding: '4px 8px', fontSize: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>حل</button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                            لا توجد تذاكر مرسلة نشطة حالياً.
                          </div>
                        )}
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
