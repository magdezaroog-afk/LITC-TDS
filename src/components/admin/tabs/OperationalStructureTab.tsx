import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../engine/ui-loader/ThemeProvider';
import { OperationalEntitiesConsole } from '../OperationalEntitiesConsole';

export const OperationalStructureTab: React.FC = () => {
  const theme = useTheme();

  const [newDeptName, setNewDeptName] = useState('');
  const [headOfDept, setHeadOfDept] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Dynamic Departments State
  const [departments, setDepartments] = useState<any[]>([
    { id: 1, name: 'تقنية المعلومات (IT)', routingStrategy: 'POOL', isDelegated: false, isTeam: false },
    { id: 2, name: 'فريق الشبكات', routingStrategy: 'ROUND_ROBIN', isDelegated: true, isTeam: true, parentId: 1 },
    { id: 3, name: 'الصيانة والمرافق', routingStrategy: 'MANUAL', isDelegated: false, isTeam: false }
  ]);

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim() || !headOfDept.trim()) return;
    setCreating(true);
    setMessage(null);
    try {
      // Create locally for immediate UI update
      const newDept = { id: Date.now(), name: newDeptName, routingStrategy: 'POOL', isDelegated: false, isTeam: false };
      setDepartments(prev => [...prev, newDept]);

      const res = await fetch('/api/v1/admin/operational/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer system_token_123'
        },
        body: JSON.stringify({ name: newDeptName, headUserId: headOfDept })
      });
      if (res.ok) {
        setMessage('✅ تم إنشاء القسم وتعيين الرئيس بنجاح.');
        setNewDeptName('');
        setHeadOfDept('');
      } else {
        setMessage('❌ فشل إنشاء القسم (قد يكون موجوداً مسبقاً).');
      }
    } catch (err) {
      setMessage('❌ حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleToggleDelegation = (id: number) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, isDelegated: !d.isDelegated } : d));
    // Mock API call to update DB
  };

  const handleChangeStrategy = (id: number, newStrategy: string) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, routingStrategy: newStrategy } : d));
    // Mock API call to update DB
  };

  const glassPanelTop: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backdropFilter: 'blur(10px)',
    textAlign: 'start'
  };

  const glassPanelBottom: React.CSSProperties = {
    background: 'rgba(23, 43, 77, 0.4)',
    border: '1px solid rgba(0, 82, 204, 0.3)',
    borderRadius: '12px',
    padding: theme.spacing.lg,
    backdropFilter: 'blur(10px)',
    textAlign: 'start'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px'
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    padding: '4px 8px',
    fontSize: '12px',
    width: 'auto',
    display: 'inline-block'
  };

  return (
    <div style={{ textAlign: 'start' }}>
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '20px' }}>
        إدارة الهيكل التشغيلي (Operational Structure Core)
      </h3>

      {/* Top Panel: Inputs & Department Control Layer */}
      <div style={glassPanelTop}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          
          <div>
            <h4 style={{ color: theme.colors.primary, marginBottom: '20px', fontSize: '15px' }}>إنشاء الكيانات التشغيلية</h4>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', opacity: 0.9 }}>اسم القسم الجديد:</label>
              <input 
                type="text" 
                style={inputStyle} 
                placeholder="مثال: قسم الأمن السيبراني" 
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', opacity: 0.9 }}>معرف رئيس القسم (ID):</label>
              <input 
                type="text" 
                style={inputStyle} 
                placeholder="مثال: admin_101" 
                value={headOfDept}
                onChange={(e) => setHeadOfDept(e.target.value)}
              />
            </div>
            
            <button 
              onClick={handleCreateDepartment}
              disabled={creating}
              style={{
                width: '100%',
                padding: '10px',
                background: 'linear-gradient(90deg, #0052cc 0%, #0065ff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0, 82, 204, 0.3)'
              }}
            >
              {creating ? 'جاري الإنشاء...' : 'إنشاء واعتماد القسم'}
            </button>
            {message && <div style={{ marginTop: '10px', fontSize: '13px', color: message.includes('✅') ? '#00ff78' : '#ffab00' }}>{message}</div>}
          </div>

          <div style={{ borderInlineStart: '1px solid rgba(255,255,255,0.1)', paddingInlineStart: '20px' }}>
            <h4 style={{ color: theme.colors.primary, marginBottom: '15px', fontSize: '15px' }}>طبقة التحكم الاستراتيجي (Department Control Layer)</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
              {departments.map(dept => (
                <div key={dept.id} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginLeft: dept.isTeam ? '20px' : '0',
                  borderLeft: dept.isTeam ? '2px solid rgba(0, 82, 204, 0.5)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: dept.isTeam ? 'normal' : 'bold' }}>
                      {dept.isTeam ? '↳ ' : '🏢 '}{dept.name}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <select 
                      style={selectStyle} 
                      value={dept.routingStrategy} 
                      onChange={(e) => handleChangeStrategy(dept.id, e.target.value)}
                    >
                      <option value="POOL">توزيع ذاتي (حوض القسم)</option>
                      <option value="MANUAL">فرز وتحويل يدوي</option>
                      <option value="ROUND_ROBIN">توزيع تلقائي دائري</option>
                      <option value="LEAST_BUSY">توزيع حسب الأقل انشغالاً</option>
                    </select>

                    <button 
                      onClick={() => handleToggleDelegation(dept.id)}
                      style={{
                        padding: '4px 10px',
                        background: dept.isDelegated ? 'rgba(0, 255, 120, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: `1px solid ${dept.isDelegated ? '#00ff78' : 'rgba(255,255,255,0.2)'}`,
                        color: dept.isDelegated ? '#00ff78' : '#aaa',
                        borderRadius: '20px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                      }}
                    >
                      {dept.isDelegated ? '✔️ تفويض مفعل (لرئيس القسم)' : '🔒 تفويض مقفل (إلزامي)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Panel: Fully isolated Drag & Drop */}
      <div style={glassPanelBottom}>
        <h4 style={{ color: theme.colors.primary, marginBottom: '15px', fontSize: '15px', textAlign: 'center' }}>
          مساحة العمل الرسومية - تنسيب وتوزيع المهندسين (Drag & Drop Console)
        </h4>
        <div style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
          <OperationalEntitiesConsole />
        </div>
      </div>
      
    </div>
  );
};

