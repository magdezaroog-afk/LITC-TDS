import React, { useState, useEffect } from 'react';

export interface SavedInterface {
  id: string;
  name: string;
  roleType: string;
  lastUpdated: string;
}

export interface LayoutEngineLandingProps {
  savedInterfaces: SavedInterface[];
  setSavedInterfaces: (val: SavedInterface[]) => void;
  handleLoadInterface: (ui: SavedInterface) => void;
  onStartNewLayout: (payload: { name: string; roleType: string; config?: any }) => void;
}

export const LayoutEngineLanding: React.FC<LayoutEngineLandingProps> = ({
  savedInterfaces,
  setSavedInterfaces,
  handleLoadInterface,
  onStartNewLayout
}) => {
  const [view, setView] = useState<'LANDING' | 'WIZARD' | 'SAVED'>('LANDING');
  
  // Wizard State
  const [wizardCard, setWizardCard] = useState<'FUNCTIONAL' | 'OPERATOR' | 'LEADERSHIP' | null>(null);
  const [formDept, setFormDept] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formTeam, setFormTeam] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('');
  const [formLeadershipTitle, setFormLeadershipTitle] = useState<'Director' | 'Section Head' | 'Team Lead' | ''>('');

  // Staff Management State
  const [manageLayoutId, setManageLayoutId] = useState<string | null>(null);
  const [mockUsers, setMockUsers] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');

  // Fetch users for Staff Management simulation
  useEffect(() => {
    if (manageLayoutId) {
      const stored = localStorage.getItem('litc_operational_users');
      if (stored) {
        setMockUsers(JSON.parse(stored));
      } else {
        // Mock fallback
        setMockUsers([
          { id: '1', name: 'أحمد الموظف', email: 'ahmad@litc.ly', ssoRole: 'EMPLOYEE', layoutId: 'ui_2' },
          { id: '2', name: 'خالد المدير', email: 'khalid@litc.ly', ssoRole: 'OPERATIONAL_MANAGER', layoutId: 'ui_3' }
        ]);
      }
    }
  }, [manageLayoutId]);

  const saveUsersToStorage = (users: any[]) => {
    setMockUsers(users);
    localStorage.setItem('litc_operational_users', JSON.stringify(users));
    // Dispatch custom event to simulate atomic DB sync
    window.dispatchEvent(new Event('litc_users_updated'));
  };

  const handleWizardSubmit = () => {
    // Context Validation
    if (wizardCard === 'OPERATOR') {
      if (!formRoleTitle || !formDept) {
        alert('يجب تحديد المسمى الوظيفي والإدارة لبيئة مشغل العمليات.');
        return;
      }
    }
    if (wizardCard === 'LEADERSHIP') {
      if (!formLeadershipTitle) {
        alert('يجب تحديد مستوى القيادة.');
        return;
      }
      if (formLeadershipTitle === 'Director' && !formDept) {
        alert('يجب تحديد الإدارة لمدير الإدارة.');
        return;
      }
      if (formLeadershipTitle === 'Section Head' && (!formDept || !formSection)) {
        alert('يجب تحديد الإدارة والقسم لرئيس القسم.');
        return;
      }
      if (formLeadershipTitle === 'Team Lead' && (!formDept || !formSection || !formTeam)) {
        alert('يجب تحديد الإدارة، القسم، والفريق لقائد الفريق.');
        return;
      }
    }

    const roleTypeMap = {
      'FUNCTIONAL': 'END_USER',
      'OPERATOR': 'OPERATIONAL_USER',
      'LEADERSHIP': 'OPERATIONAL_MANAGER'
    };

    onStartNewLayout({
      name: `تكوين جديد - ${wizardCard}`,
      roleType: roleTypeMap[wizardCard || 'FUNCTIONAL'],
      config: { formDept, formSection, formTeam, formRoleTitle, formLeadershipTitle }
    });
  };

  const renderLanding = () => (
    <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px' }}>
      <div 
        onClick={() => setView('WIZARD')}
        style={{ width: '300px', height: '200px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '48px', marginBottom: '15px' }}>✨</span>
        <h2 style={{ margin: 0, fontSize: '20px' }}>[+] إنشاء واجهة جديدة</h2>
        <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>معالج بناء الواجهات الذكي</p>
      </div>

      <div 
        onClick={() => setView('SAVED')}
        style={{ width: '300px', height: '200px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '48px', marginBottom: '15px' }}>📂</span>
        <h2 style={{ margin: 0, fontSize: '20px' }}>الواجهات المحفوظة</h2>
        <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>إدارة التعيينات والواجهات المؤسسية</p>
      </div>
    </div>
  );

  const renderWizard = () => (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px' }}>
      <button onClick={() => setView('LANDING')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px', fontSize: '15px', fontWeight: 'bold' }}>← العودة</button>
      <h2 style={{ color: '#0f172a', marginBottom: '30px', textAlign: 'center' }}>معالج إنشاء واجهة جديدة</h2>
      
      {/* 3 Glassmorphism Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '20px' }}>
        {[
          { id: 'FUNCTIONAL', title: 'بيئة عمل وظيفية', sub: '(إرسال البلاغات / الطلبات)', color: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
          { id: 'OPERATOR', title: 'بيئة مشغل عمليات', sub: '(استقبال الطلبات / المعالجة)', color: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
          { id: 'LEADERSHIP', title: 'بيئة قيادة تشغيلية', sub: '(مراقبة / إدارة)', color: 'rgba(139, 92, 246, 0.1)', border: '#8b5cf6' }
        ].map(card => (
          <div 
            key={card.id}
            onClick={() => setWizardCard(card.id as any)}
            style={{ 
              flex: '0 0 300px', height: '180px', padding: '25px', cursor: 'pointer',
              background: wizardCard === card.id ? card.color : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)', borderRadius: '20px',
              border: `2px solid ${wizardCard === card.id ? card.border : 'transparent'}`,
              boxShadow: wizardCard === card.id ? `0 15px 30px ${card.color}` : '0 10px 25px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: wizardCard === card.id ? card.border : '#334155', fontSize: '18px' }}>{card.title}</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Context-Driven Dynamic Form */}
      {wizardCard && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ color: '#0f172a', marginBottom: '20px' }}>تخصيص المحددات التنظيمية (Context Form)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {wizardCard === 'LEADERSHIP' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>مستوى القيادة *</label>
                <select value={formLeadershipTitle} onChange={e => setFormLeadershipTitle(e.target.value as any)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- اختر المستوى --</option>
                  <option value="Director">مدير إدارة (Director)</option>
                  <option value="Section Head">رئيس قسم (Section Head)</option>
                  <option value="Team Lead">قائد فريق (Team Lead)</option>
                </select>
              </div>
            )}

            {wizardCard === 'OPERATOR' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>المسمى الوظيفي للمشغل *</label>
                <input type="text" value={formRoleTitle} onChange={e => setFormRoleTitle(e.target.value)} placeholder="مثال: مهندس دعم أطراف طرفية" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            )}

            {(wizardCard === 'OPERATOR' || wizardCard === 'LEADERSHIP' || wizardCard === 'FUNCTIONAL') && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  الإدارة التأسيسية {wizardCard !== 'FUNCTIONAL' ? '*' : '(اختياري)'}
                </label>
                <select value={formDept} onChange={e => setFormDept(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- اختر الإدارة --</option>
                  <option value="IT">إدارة تقنية المعلومات</option>
                  <option value="HR">إدارة الموارد البشرية</option>
                </select>
              </div>
            )}

            {(wizardCard === 'OPERATOR' || (wizardCard === 'LEADERSHIP' && (formLeadershipTitle === 'Section Head' || formLeadershipTitle === 'Team Lead'))) && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  القسم التابع {wizardCard === 'LEADERSHIP' ? '*' : '(اختياري)'}
                </label>
                <select value={formSection} onChange={e => setFormSection(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- اختر القسم --</option>
                  <option value="NETWORK">قسم الشبكات</option>
                  <option value="SUPPORT">قسم الدعم الفني</option>
                </select>
              </div>
            )}

            {(wizardCard === 'OPERATOR' || (wizardCard === 'LEADERSHIP' && formLeadershipTitle === 'Team Lead')) && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  الفريق {wizardCard === 'LEADERSHIP' ? '*' : '(اختياري)'}
                </label>
                <select value={formTeam} onChange={e => setFormTeam(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- اختر الفريق --</option>
                  <option value="T1">فريق التدخل السريع</option>
                  <option value="T2">فريق الصيانة</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'left' }}>
             <button onClick={handleWizardSubmit} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
               اعتماد ومتابعة التصميم ←
             </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSavedLayouts = () => (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px' }}>
      <button onClick={() => setView('LANDING')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px', fontSize: '15px', fontWeight: 'bold' }}>← العودة</button>
      <h2 style={{ color: '#0f172a', marginBottom: '30px' }}>الواجهات المؤسسية المحفوظة</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {savedInterfaces.map(ui => (
          <div key={ui.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
               <div>
                 <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0f172a' }}>{ui.name}</h3>
                 <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '12px' }}>{ui.roleType}</span>
               </div>
               <button onClick={() => handleLoadInterface(ui)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>تعديل الواجهة</button>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
               <button 
                 onClick={() => setManageLayoutId(manageLayoutId === ui.id ? null : ui.id)}
                 style={{ width: '100%', background: 'transparent', border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '8px', color: '#475569', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
               >
                 {manageLayoutId === ui.id ? 'إخفاء إدارة الموظفين' : 'إدارة الموظفين المنسبين (Assigned Staff)'}
               </button>

               {manageLayoutId === ui.id && (
                 <div style={{ marginTop: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                   <div style={{ marginBottom: '15px' }}>
                     <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#334155' }}>الموظفون الحاليون:</h4>
                     {mockUsers.filter(u => u.layoutId === ui.id).length === 0 ? (
                       <div style={{ fontSize: '12px', color: '#94a3b8' }}>لا يوجد موظفين منسبين.</div>
                     ) : (
                       mockUsers.filter(u => u.layoutId === ui.id).map(user => (
                         <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px', borderRadius: '6px', marginBottom: '5px', border: '1px solid #e2e8f0' }}>
                           <div>
                             <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{user.name}</div>
                             <div style={{ fontSize: '10px', color: '#64748b' }}>{user.email}</div>
                           </div>
                           <button 
                             onClick={() => saveUsersToStorage(mockUsers.map(u => u.id === user.id ? { ...u, layoutId: null } : u))}
                             style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                           >
                             سحب الصلاحية
                           </button>
                         </div>
                       ))
                     )}
                   </div>

                   <div style={{ display: 'flex', gap: '8px' }}>
                     <input 
                       type="text" 
                       placeholder="بريد الموظف (لإضافته)..." 
                       value={newUserEmail}
                       onChange={e => setNewUserEmail(e.target.value)}
                       style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                     />
                     <button 
                       onClick={() => {
                         if (!newUserEmail) return;
                         const existingUser = mockUsers.find(u => u.email === newUserEmail);
                         if (existingUser) {
                           saveUsersToStorage(mockUsers.map(u => u.id === existingUser.id ? { ...u, layoutId: ui.id } : u));
                         } else {
                           const newUser = { id: Date.now().toString(), name: 'مستخدم جديد', email: newUserEmail, ssoRole: 'EMPLOYEE', layoutId: ui.id };
                           saveUsersToStorage([...mockUsers, newUser]);
                         }
                         setNewUserEmail('');
                       }}
                       style={{ background: '#10b981', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                     >
                       إضافة
                     </button>
                   </div>
                   <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
                     ملاحظة: التعديل هنا يُزامن قاعدة البيانات تلقائياً للتواجد الهيكلي.
                   </div>
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '85vh', background: '#f8fafc', fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif" }}>
      {view === 'LANDING' && renderLanding()}
      {view === 'WIZARD' && renderWizard()}
      {view === 'SAVED' && renderSavedLayouts()}
    </div>
  );
};
