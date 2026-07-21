import React, { useState } from 'react';

type SupervisorRole = 'TEAM_LEAD' | 'SECTION_HEAD' | 'OPERATIONAL_DIRECTOR';

interface Engineer {
  id: string;
  name: string;
  workload: number;
}

interface SupervisorPolicyModalProps {
  engineer: Engineer;
  supervisorRole: SupervisorRole;
  allEngineers: Engineer[];
  onClose: () => void;
}

export const SupervisorPolicyModal: React.FC<SupervisorPolicyModalProps> = ({ engineer, supervisorRole, allEngineers, onClose }) => {
  const [archiveScope, setArchiveScope] = useState<'PERSONAL' | 'TEAM' | 'DEPARTMENT' | 'GLOBAL_OPERATIONAL'>('PERSONAL');
  const [triageSwitches, setTriageSwitches] = useState({
    canClaimSelf: true,
    canForwardInternally: true,
    canRejectWithComment: false,
    canInterceptAndReassign: false,
    canCommentGlobally: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSelectDepartment = supervisorRole === 'SECTION_HEAD' || supervisorRole === 'OPERATIONAL_DIRECTOR';
  const canSelectGlobal = supervisorRole === 'OPERATIONAL_DIRECTOR';

  const handleCopyPolicy = (sourceId: string) => {
    // In a real app, this would fetch the policy of the selected user and apply it to state.
    setMessage(`✅ تم نسخ السياسة بنجاح.`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/admin/operational/user-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer DUMMY_TOKEN' },
        body: JSON.stringify({
          targetUserId: engineer.id.replace('eng_', ''), // Mock conversion to number/id
          componentKey: 'GLOBAL_POLICY',
          policyData: { archiveScope, triageSwitches },
          changeSummary: `Updated scope to ${archiveScope} with triage settings.`
        })
      });
      if (response.ok) {
        setMessage('✅ تم الحفظ بنجاح.');
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage('❌ فشل الحفظ.');
      }
    } catch (err) {
      setMessage('❌ فشل الاتصال بالخادم.');
    } finally {
      setIsSaving(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(9, 30, 66, 0.5)', zIndex: 90000,
    display: 'flex', justifyContent: 'flex-end',
    direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, sans-serif"
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    width: '450px',
    height: '100%',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column',
    borderLeft: '1px solid rgba(255,255,255,0.2)',
    padding: '30px'
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dfe1e6',
    background: '#fafbfc', outline: 'none', marginBottom: '20px'
  };

  const switchRowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #ebecf0'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#172b4d' }}>⚙️ سياسة المكونات</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ background: '#f4f5f7', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #0052cc' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#0052cc' }}>{engineer.name}</h3>
          <span style={{ fontSize: '12px', color: '#5e6c84' }}>المعرف التشغيلي: {engineer.id}</span>
        </div>

        {/* Copy Policy Utility */}
        <div style={{ marginBottom: '25px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select style={{ ...selectStyle, marginBottom: 0, flex: 1 }} onChange={(e) => handleCopyPolicy(e.target.value)}>
            <option value="">-- [📋 نسخ السياسة لموظف آخر...] --</option>
            {allEngineers.filter(e => e.id !== engineer.id).map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* Archive Settings */}
        <h4 style={{ margin: '0 0 10px 0', color: '#172b4d' }}>Archive Component Settings</h4>
        <select 
          style={selectStyle} 
          value={archiveScope}
          onChange={(e) => setArchiveScope(e.target.value as any)}
        >
          <option value="PERSONAL">شخصي (PERSONAL)</option>
          <option value="TEAM">مستوى الفريق (TEAM)</option>
          <option value="DEPARTMENT" disabled={!canSelectDepartment}>مستوى القسم (DEPARTMENT) {(!canSelectDepartment) ? '🔒' : ''}</option>
          <option value="GLOBAL_OPERATIONAL" disabled={!canSelectGlobal}>مستوى الإدارة الشاملة (GLOBAL_OPERATIONAL) {(!canSelectGlobal) ? '🔒' : ''}</option>
        </select>

        {/* Triage Switches */}
        <h4 style={{ margin: '10px 0', color: '#172b4d' }}>Triage Component Switches</h4>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {Object.entries(triageSwitches).map(([key, val]) => (
            <div key={key} style={switchRowStyle}>
              <span style={{ fontSize: '13px', color: '#42526e', fontWeight: 500 }}>{key}</span>
              <div 
                style={{
                  width: '40px', height: '22px', background: val ? '#34C759' : '#e5e5ea',
                  borderRadius: '20px', position: 'relative', cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onClick={() => setTriageSwitches(prev => ({ ...prev, [key]: !prev[key as keyof typeof triageSwitches] }))}
              >
                <div style={{
                  width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                  position: 'absolute', top: '2px', left: val ? '20px' : '2px',
                  transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
          ))}
        </div>

        {message && <div style={{ padding: '10px', background: '#e3fcef', color: '#006644', borderRadius: '8px', fontSize: '12px', textAlign: 'center', marginBottom: '15px' }}>{message}</div>}

        <button 
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '12px', background: 'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)',
            color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold',
            cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
        </button>

      </div>
    </div>
  );
};
