import React from 'react';
import { JourneyNode } from './mockJourneyData';

interface TicketJourneyTimelineProps {
  ticketId: string;
  nodes: JourneyNode[];
  compactMode?: boolean;
}

export const TicketJourneyTimeline: React.FC<TicketJourneyTimelineProps> = ({ ticketId, nodes, compactMode = false }) => {
  const getIconForType = (type: string, status: string) => {
    if (status === 'PENDING') return '⏳';
    switch (type) {
      case 'SUBMITTED': return '📤';
      case 'ROUTED': return '🔄';
      case 'ASSIGNED': return '👤';
      case 'SUB_TICKET_SPAWNED': return '🔀';
      case 'SUB_TICKET_RESOLVED': return '✅';
      case 'RESOLVED': return '🎯';
      case 'EVALUATED': return '⭐';
      case 'REJECTED': return '❌';
      default: return '📍';
    }
  };

  const getColorForStatus = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#36B37E'; // Green
      case 'ACTIVE': return '#0052CC'; // Blue
      case 'PENDING': return '#DFE1E6'; // Gray
      default: return '#DFE1E6';
    }
  };

  if (compactMode) {
    // Compact Mode: Simple horizontal progress bar for the card footer
    return (
      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(9,30,66,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          {nodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <div 
                title={node.title}
                style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  background: node.status === 'PENDING' ? '#F4F5F7' : getColorForStatus(node.status) + '20',
                  color: node.status === 'PENDING' ? '#A5ADBA' : getColorForStatus(node.status),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                  border: `2px solid ${node.status === 'PENDING' ? '#DFE1E6' : getColorForStatus(node.status)}`,
                  boxShadow: node.status === 'ACTIVE' ? '0 0 0 3px rgba(0,82,204,0.1)' : 'none',
                  zIndex: 2,
                  flexShrink: 0
                }}
              >
                {getIconForType(node.type, node.status)}
              </div>
              {idx < nodes.length - 1 && (
                <div style={{ 
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: nodes[idx + 1].status === 'PENDING' ? '#DFE1E6' : getColorForStatus(node.status),
                  opacity: nodes[idx + 1].status === 'PENDING' ? 0.5 : 1
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#5E6C84', marginTop: '8px', fontWeight: 'bold' }}>
          اضغط لعرض مسار الرحلة بالكامل
        </div>
      </div>
    );
  }

  // Full Mode: Vertical Detailed Timeline Map
  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#172B4D', fontSize: '18px', textAlign: 'center' }}>
        مسار التذكرة #{ticketId}
      </h3>
      <div style={{ position: 'relative', paddingLeft: '20px', paddingRight: '20px' }}>
        {/* Main Line */}
        <div style={{ position: 'absolute', top: '10px', bottom: '10px', right: '35px', width: '4px', background: 'linear-gradient(to bottom, #36B37E 0%, #0052CC 50%, #DFE1E6 100%)', borderRadius: '2px' }} />
        
        {nodes.map((node, idx) => (
          <div key={node.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '30px', position: 'relative' }}>
            {/* Node Icon */}
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              border: `3px solid ${getColorForStatus(node.status)}`,
              boxShadow: node.status === 'ACTIVE' ? '0 0 15px ' + getColorForStatus(node.status) + '80' : 'none',
              zIndex: 2, marginLeft: '15px'
            }}>
              {getIconForType(node.type, node.status)}
            </div>

            {/* Node Content */}
            <div style={{ 
              flex: 1, background: node.status === 'PENDING' ? '#FAFBFC' : '#fff', 
              border: '1px solid ' + (node.status === 'ACTIVE' ? '#0052CC' : '#DFE1E6'),
              borderRadius: '8px', padding: '12px 16px',
              boxShadow: node.status === 'ACTIVE' ? '0 4px 12px rgba(0,82,204,0.1)' : 'none',
              opacity: node.status === 'PENDING' ? 0.6 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#172B4D', fontSize: '14px' }}>{node.title}</strong>
                {node.timestamp && <span style={{ fontSize: '11px', color: '#5E6C84', background: '#EBECF0', padding: '2px 6px', borderRadius: '4px' }}>{node.timestamp}</span>}
              </div>
              
              {node.department && (
                <div style={{ fontSize: '12px', color: '#0052CC', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🏢</span> {node.department}
                </div>
              )}
              {node.assignee && (
                <div style={{ fontSize: '12px', color: '#36B37E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>👨‍🔧</span> {node.assignee}
                </div>
              )}

              {/* Sub Tickets Branching */}
              {node.subTickets && node.subTickets.length > 0 && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#F4F5F7', borderRadius: '6px', borderRight: '3px solid #FFAB00' }}>
                  <div style={{ fontSize: '11px', color: '#5E6C84', fontWeight: 'bold', marginBottom: '6px' }}>تفرع داخلي (طلب مساعدة):</div>
                  {node.subTickets.map(st => (
                    <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#fff', padding: '6px 8px', borderRadius: '4px', marginBottom: '4px', border: '1px solid #DFE1E6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{st.status === 'OPEN' ? '⏳' : '✅'}</span>
                        <span style={{ color: '#172B4D', fontWeight: 'bold' }}>{st.id}</span>
                        <span style={{ color: '#5E6C84' }}>- {st.title}</span>
                      </div>
                      <div style={{ color: '#0052CC', fontSize: '11px' }}>{st.department}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
