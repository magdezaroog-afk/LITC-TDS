import React, { useState } from 'react';
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
  // Additional configs for pure presentation without internal state or context
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
  const glassPanel: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '20px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
    color: '#172b4d'
  };

  const isGrid = layoutType === 'grid';
  
  const containerStyle: React.CSSProperties = isGrid 
    ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }
    : { display: 'flex', flexDirection: 'column', gap: '20px' };

  return (
    <div style={containerStyle}>
      {tickets.length > 0 ? tickets.map(ticket => (
        <div key={ticket.id} style={{ ...glassPanel, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: ticket.priority === 'P1' ? '#ff5630' : ticket.priority === 'P2' ? '#ffab00' : '#0052cc' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <span style={{ fontSize: '11px', color: ticket.priority === 'P1' ? '#ff5630' : '#0052cc', fontWeight: 'bold', background: ticket.priority === 'P1' ? 'rgba(255,86,48,0.1)' : 'rgba(0,82,204,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              {ticket.priority === 'P1' ? 'طوارئ' : ticket.priority === 'P2' ? 'عاجل' : 'متوسط'} ({ticket.priority})
            </span>
            <span style={{ fontSize: '12px', color: '#5e6c84' }}>#{ticket.id}</span>
          </div>
          
          <h4 
            style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#172b4d', cursor: 'pointer' }}
            onClick={() => onTicketClick(ticket.id)}
          >
            {ticket.title}
          </h4>
          
          {slaEnabled && ticket.sla_remaining && (
            <div style={{ background: ticket.priority === 'P1' ? 'rgba(255, 86, 48, 0.05)' : 'rgba(0, 82, 204, 0.05)', border: ticket.priority === 'P1' ? '1px solid rgba(255, 86, 48, 0.2)' : '1px solid rgba(0, 82, 204, 0.1)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: ticket.priority === 'P1' ? '#ff5630' : '#0052cc', fontWeight: 'bold' }}>الوقت المتبقي</span>
                <span style={{ display: 'block', fontSize: '14px', color: '#172b4d', fontWeight: 'bold', fontFamily: 'monospace' }}>{ticket.sla_remaining}</span>
              </div>
            </div>
          )}

          {/* Dynamic Action Buttons */}
          {allowedActions.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
              {allowedActions.includes('CLAIM') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>استلام التذكرة</button>}
              {allowedActions.includes('OPEN') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>فتح للمعالجة</button>}
              {allowedActions.includes('TRANSFER') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'transparent', color: '#0052cc', border: '1px solid #0052cc', borderRadius: '4px', cursor: 'pointer' }}>تحويل</button>}
              {allowedActions.includes('REASSIGN') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'transparent', color: '#5e6c84', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer' }}>إسناد لموظف</button>}
              {allowedActions.includes('CLOSE') && <button style={{ flex: 1, padding: '8px', fontSize: '12px', background: '#36b37e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>إغلاق التذكرة</button>}
            </div>
          )}

          {/* Sub-Tickets Engine Governance */}
          {subTicketsConfig.enabled && ticket.status === 'OPEN' && (() => {
            const concurrencyMode = subTicketsConfig.concurrencyMode;
            const maxSubTickets = subTicketsConfig.maxSubTickets;
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

          {/* Ticket Journey Timeline (Compact Mode) */}
          {journeys[ticket.id] && (
            <div style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '5px', borderRadius: '8px', marginTop: '15px' }}
                 onClick={() => onJourneyClick?.(ticket.id)}
                 onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,82,204,0.05)'}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <TicketJourneyTimeline ticketId={ticket.id} nodes={journeys[ticket.id]} compactMode={true} />
            </div>
          )}
        </div>
      )) : (
        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#5e6c84', ...glassPanel }}>
          لا توجد تذاكر في هذه الحالة حالياً ضمن اختصاص قسمك.
        </div>
      )}
    </div>
  );
};
