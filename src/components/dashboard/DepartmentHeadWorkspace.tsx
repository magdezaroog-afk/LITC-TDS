import React, { useState, useEffect } from 'react';

// Mock types
type RoutingStrategy = 'POOL' | 'MANUAL' | 'ROUND_ROBIN' | 'LEAST_BUSY';

interface Ticket {
  id: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

interface Engineer {
  id: string;
  name: string;
  workload: number;
}

export const DepartmentHeadWorkspace: React.FC = () => {
  const [isDelegated, setIsDelegated] = useState<boolean>(true); // Controlled by Admin (Mock)
  const [strategy, setStrategy] = useState<RoutingStrategy>('MANUAL');
  
  const [unassignedTickets, setUnassignedTickets] = useState<Ticket[]>([
    { id: 'TCK-2041', title: 'توقف نظام البريد الإلكتروني للقسم', priority: 'HIGH', createdAt: '10:05 AM' },
    { id: 'TCK-2045', title: 'طلب صلاحيات استثنائية للموظف الجديد', priority: 'MEDIUM', createdAt: '10:45 AM' },
    { id: 'TCK-2050', title: 'اختراق محتمل في سيرفر الملفات', priority: 'CRITICAL', createdAt: '11:10 AM' }
  ]);

  const [engineers] = useState<Engineer[]>([
    { id: 'eng_1', name: 'أحمد صالح', workload: 2 },
    { id: 'eng_2', name: 'سارة خالد', workload: 5 },
    { id: 'eng_3', name: 'فهد عبدالله', workload: 1 }
  ]);

  const [assignments, setAssignments] = useState<Record<string, string>>({}); // ticketId -> engineerId
  const [message, setMessage] = useState<string | null>(null);

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStrategy(e.target.value as RoutingStrategy);
  };

  const handleEngineerSelect = (ticketId: string, engineerId: string) => {
    setAssignments(prev => ({ ...prev, [ticketId]: engineerId }));
  };

  const handleAssignTicket = (ticketId: string) => {
    const engineerId = assignments[ticketId];
    if (!engineerId) return;

    // Simulate Assignment & Removal
    setUnassignedTickets(prev => prev.filter(t => t.id !== ticketId));
    setMessage(`✅ تم إسناد التذكرة ${ticketId} بنجاح.`);
    setTimeout(() => setMessage(null), 3000);
  };

  const glassPanel: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '25px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
    color: '#172b4d'
  };

  const selectStyle: React.CSSProperties = {
    padding: '10px 15px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(9, 30, 66, 0.1)',
    borderRadius: '8px',
    color: '#172b4d',
    fontSize: '13px',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
    width: '100%'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f4f5f7 0%, #e1e5eb 100%)', color: '#172b4d', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", direction: 'rtl' }}>
      
      {/* Top Header */}
      <header style={{ ...glassPanel, borderRadius: '0', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(9,30,66,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6554c0 0%, #403294 100%)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>ر</div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#172b4d' }}>رئيس القسم</h4>
            <span style={{ fontSize: '12px', color: '#5e6c84' }}>قسم الدعم الفني وتقنية المعلومات</span>
          </div>
        </div>
        <div>
          {message && <span style={{ background: '#e3fcef', color: '#006644', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{message}</span>}
        </div>
      </header>

      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Delegation Control Panel */}
        <section style={glassPanel}>
          <h2 style={{ color: '#0052cc', borderBottom: '2px solid #0052cc', display: 'inline-block', paddingBottom: '5px', marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>
            لوحة التحكم الاستراتيجية للقسم
          </h2>
          
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>آلية التوزيع المعمول بها حالياً:</label>
              {isDelegated ? (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <select style={selectStyle} value={strategy} onChange={handleStrategyChange}>
                    <option value="POOL">توزيع ذاتي (حوض القسم)</option>
                    <option value="MANUAL">الفرز والتحويل اليدوي</option>
                    <option value="ROUND_ROBIN">توزيع تلقائي دائري</option>
                    <option value="LEAST_BUSY">توزيع حسب الأقل انشغالاً</option>
                  </select>
                  <span style={{ fontSize: '12px', color: '#006644', background: '#e3fcef', padding: '4px 10px', borderRadius: '4px', whiteSpace: 'nowrap' }}>✔️ التفويض مفعل لديك</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <select style={{ ...selectStyle, opacity: 0.6, background: '#ebecf0' }} disabled value={strategy}>
                    <option value="POOL">توزيع ذاتي (حوض القسم)</option>
                    <option value="MANUAL">الفرز والتحويل اليدوي</option>
                  </select>
                  <span style={{ fontSize: '12px', color: '#bf2600', background: '#ffebe6', padding: '4px 10px', borderRadius: '4px', whiteSpace: 'nowrap' }}>🔒 التوزيع مدار سيادياً من الإدارة</span>
                </div>
              )}
            </div>
            
            <div style={{ flex: 1, background: 'rgba(9, 30, 66, 0.04)', padding: '15px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.6', color: '#42526e' }}>
              <strong>ملاحظة:</strong> إذا قمت باختيار "الفرز والتحويل اليدوي"، ستتمكن من رؤية التذاكر المعلقة أدناه وتوجيهها للمهندسين المتوفرين مباشرة.
            </div>
          </div>
        </section>

        {/* Manual Triage Console */}
        {strategy === 'MANUAL' && (
          <section style={glassPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#ff5630', margin: 0, fontSize: '18px' }}>منصة الفرز اليدوي (Unassigned Tickets)</h2>
              <span style={{ background: 'rgba(255, 86, 48, 0.1)', color: '#ff5630', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                المعلق: {unassignedTickets.length} تذكرة
              </span>
            </div>

            {unassignedTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#5e6c84' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🎉</span>
                لا توجد تذاكر معلقة. لقد قمت بإسناد جميع المهام بنجاح!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {unassignedTickets.map(ticket => (
                  <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #dfe1e6', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    
                    <div style={{ flex: 2 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: ticket.priority === 'CRITICAL' ? '#bf2600' : ticket.priority === 'HIGH' ? '#ff5630' : '#0052cc' }}>
                          [{ticket.priority}]
                        </span>
                        <span style={{ fontSize: '12px', color: '#5e6c84' }}>{ticket.id}</span>
                        <span style={{ fontSize: '11px', color: '#97a0af' }}>{ticket.createdAt}</span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>{ticket.title}</h4>
                    </div>

                    <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <select 
                        style={{ ...selectStyle, width: '200px' }}
                        value={assignments[ticket.id] || ''}
                        onChange={(e) => handleEngineerSelect(ticket.id, e.target.value)}
                      >
                        <option value="" disabled>-- اختر مهندساً --</option>
                        {engineers.map(eng => (
                          <option key={eng.id} value={eng.id}>{eng.name} (مهام: {eng.workload})</option>
                        ))}
                      </select>

                      <button 
                        onClick={() => handleAssignTicket(ticket.id)}
                        disabled={!assignments[ticket.id]}
                        style={{
                          padding: '10px 15px',
                          background: assignments[ticket.id] ? 'linear-gradient(90deg, #0052cc 0%, #0065ff 100%)' : '#ebecf0',
                          color: assignments[ticket.id] ? '#fff' : '#a5adba',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: assignments[ticket.id] ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        إسناد وتشغيل
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
};
