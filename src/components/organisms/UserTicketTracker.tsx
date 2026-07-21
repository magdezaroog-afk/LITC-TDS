import React from 'react';
import { TicketJourneyTimeline } from '../dashboard/TicketJourneyTimeline';

export interface UserTicket {
  id: string;
  title: string;
  status: string;
  priority: 'P1' | 'P2' | 'P3';
  destination_department_ids: string[];
  sla_remaining?: string;
  child_tickets?: { id: string, status: 'OPEN' | 'CLOSED' }[];
}

export interface UserTicketTrackerProps {
  layoutType: 'rows' | 'grid';
  tickets: UserTicket[];
  activeTab: string;
  onTicketClick: (ticketId: string) => void;
  allowedActions?: string[];
  slaEnabled?: boolean;
  subTicketsConfig?: {
    enabled: boolean;
    concurrencyMode: string;
    maxSubTickets: number;
  };
  journeys?: Record<string, any>;
  onJourneyClick?: (ticketId: string) => void;
}

const priorityConfig = {
  P1: { label: 'طوارئ', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: '🔴' },
  P2: { label: 'عاجل', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '🟡' },
  P3: { label: 'عادي', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', icon: '🔵' },
};

const statusLabels: Record<string, { label: string; icon: string; color: string }> = {
  NEW: { label: 'جديدة', icon: '✨', color: '#8b5cf6' },
  OPEN: { label: 'قيد المعالجة', icon: '⚙️', color: '#3b82f6' },
  TRANSFERRED: { label: 'محوّلة', icon: '↗️', color: '#f59e0b' },
  STUCK: { label: 'عالقة', icon: '⚠️', color: '#ef4444' },
};

export const UserTicketTracker: React.FC<UserTicketTrackerProps> = ({
  layoutType,
  tickets,
  activeTab,
  onTicketClick,
  allowedActions = [],
  slaEnabled = false,
  subTicketsConfig = { enabled: false, concurrencyMode: 'PARALLEL', maxSubTickets: 10 },
  journeys = {},
  onJourneyClick
}) => {
  const isGrid = layoutType === 'grid';
  
  const containerStyle: React.CSSProperties = isGrid 
    ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }
    : { display: 'flex', flexDirection: 'column', gap: '12px' };

  return (
    <div style={containerStyle}>
      {tickets.length > 0 ? tickets.map(ticket => {
        const pConfig = priorityConfig[ticket.priority];
        const sConfig = statusLabels[ticket.status] || statusLabels.OPEN;

        return (
          <div 
            key={ticket.id} 
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';
            }}
          >
            {/* Priority gradient bar */}
            <div style={{ height: '4px', background: pConfig.gradient, width: '100%' }} />

            <div style={{ padding: '18px 20px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '11px', fontWeight: 700, color: pConfig.color, 
                    background: pConfig.bg, border: `1px solid ${pConfig.border}`,
                    padding: '4px 10px', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {pConfig.icon} {pConfig.label}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, color: sConfig.color,
                    background: `${sConfig.color}10`, border: `1px solid ${sConfig.color}30`,
                    padding: '4px 10px', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {sConfig.icon} {sConfig.label}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                  #{ticket.id}
                </span>
              </div>

              {/* Title */}
              <h4 
                style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#1e293b', lineHeight: 1.5, cursor: 'pointer', transition: 'color 0.2s' }}
                onClick={() => onTicketClick(ticket.id)}
                onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.color = '#1e293b'}
              >
                {ticket.title}
              </h4>

              {/* SLA Timer */}
              {slaEnabled && ticket.sla_remaining && (() => {
                const parts = ticket.sla_remaining.split(':');
                const hours = parseInt(parts[0]);
                const isUrgent = hours === 0;
                const progressPct = isUrgent ? 95 : Math.max(10, 100 - hours * 10);
                const barColor = isUrgent ? '#ef4444' : hours <= 2 ? '#f59e0b' : '#10b981';
                return (
                  <div style={{ background: isUrgent ? 'rgba(239,68,68,0.04)' : 'rgba(59,130,246,0.04)', border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)'}`, padding: '12px 14px', borderRadius: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isUrgent ? '#ef4444' : '#64748b' }}>⏱️ الوقت المتبقي</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: isUrgent ? '#ef4444' : '#1e293b' }}>{ticket.sla_remaining}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${barColor}, ${barColor}88)`, width: `${progressPct}%`, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              {allowedActions.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {allowedActions.includes('CLAIM') && <button style={{ flex: 1, padding: '9px 14px', fontSize: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>📥 استلام</button>}
                  {allowedActions.includes('OPEN') && <button style={{ flex: 1, padding: '9px 14px', fontSize: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>🔓 فتح</button>}
                  {allowedActions.includes('TRANSFER') && <button style={{ flex: 1, padding: '9px 14px', fontSize: '12px', fontWeight: 700, background: 'transparent', color: '#6366f1', border: '1.5px solid #c7d2fe', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#6366f1'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#c7d2fe'; }}>↗️ تحويل</button>}
                  {allowedActions.includes('REASSIGN') && <button style={{ flex: 1, padding: '9px 14px', fontSize: '12px', fontWeight: 700, background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>👤 إسناد</button>}
                  {allowedActions.includes('CLOSE') && <button style={{ flex: 1, padding: '9px 14px', fontSize: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>✅ إغلاق</button>}
                </div>
              )}

              {/* Sub-Tickets */}
              {subTicketsConfig.enabled && ticket.status === 'OPEN' && (() => {
                const childTickets = ticket.child_tickets || [];
                const openChildTickets = childTickets.filter((ct: any) => ct.status === 'OPEN').length;
                const isSequentialLocked = subTicketsConfig.concurrencyMode === 'SEQUENTIAL' && openChildTickets > 0;
                const isMaxLocked = childTickets.length >= subTicketsConfig.maxSubTickets;
                return (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>📋 الفرعية ({childTickets.length}/{subTicketsConfig.maxSubTickets})</span>
                      {subTicketsConfig.concurrencyMode === 'SEQUENTIAL' && <span style={{ fontSize: '10px', background: '#fef2f2', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>تسلسلي</span>}
                    </div>
                    {isSequentialLocked ? (
                      <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>🔒 أكمل التذكرة الفرعية الحالية أولاً</span>
                      </div>
                    ) : isMaxLocked ? (
                      <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', border: '1px solid #fde68a', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 700 }}>🚫 الحد الأقصى</span>
                      </div>
                    ) : (
                      <button style={{ width: '100%', padding: '10px', fontSize: '12px', fontWeight: 700, background: 'rgba(37,99,235,0.04)', color: '#2563eb', border: '1.5px dashed #93c5fd', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.04)'}>+ تذكرة فرعية</button>
                    )}
                  </div>
                );
              })()}

              {/* Journey */}
              {journeys[ticket.id] && (
                <div style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '8px', borderRadius: '10px', marginTop: '14px' }} onClick={() => onJourneyClick?.(ticket.id)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <TicketJourneyTimeline ticketId={ticket.id} nodes={journeys[ticket.id]} compactMode={true} />
                </div>
              )}
            </div>
          </div>
        );
      }) : (
        <div style={{ gridColumn: '1 / -1', padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.9)', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#64748b' }}>لا توجد تذاكر في هذه الحالة</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>ستظهر التذاكر هنا عند ورودها ضمن اختصاص قسمك</div>
        </div>
      )}
    </div>
  );
};
