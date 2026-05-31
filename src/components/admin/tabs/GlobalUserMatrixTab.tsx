import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../engine/ui-loader/ThemeProvider';
import { GarbageCollectionCore } from '../../../services/GarbageCollectionCore';

export const GlobalUserMatrixTab: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('litc_token') || 'system_token_123';
      const res = await fetch('/api/v1/admin/operational/users', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      
      // Inject mock data for UI testing if backend doesn't provide it yet
      const mappedData = (Array.isArray(data) ? data : []).map(u => ({
        ...u,
        departmentName: u.departmentName || 'تقنية المعلومات',
        subTeamName: u.subTeamName || 'فريق الدعم',
        status: u.status || 'ACTIVE' // 'ACTIVE' | 'FROZEN'
      }));
      setUsers(mappedData);
      setSelectedUserIds([]);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectUser = (id: number) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleBulkFreeze = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`هل أنت متأكد من تجميد ${selectedUserIds.length} حساب(ات) لحظياً؟`)) return;
    
    // Reactively update UI instantly
    setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, status: 'FROZEN' } : u));
    
    // Security: Flush sessions locally via GC-CORE for all selected users
    selectedUserIds.forEach(id => {
      GarbageCollectionCore.flushUserSessions(id.toString());
    });

    // Mock backend call
    try {
      const token = localStorage.getItem('litc_token') || 'system_token_123';
      await fetch('/api/v1/admin/operational/users/bulk-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userIds: selectedUserIds })
      });
      // Clear selection after success
      setSelectedUserIds([]);
    } catch (e) {
      console.error('Failed to freeze users', e);
    }
  };

  const handleBulkChangeDept = async () => {
    if (selectedUserIds.length === 0 || !selectedDept) return;
    
    // Reactively update UI instantly
    setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, departmentName: selectedDept.split('/')[0], subTeamName: selectedDept.split('/')[1] || '' } : u));
    
    // Mock backend call
    try {
      const token = localStorage.getItem('litc_token') || 'system_token_123';
      await fetch('/api/v1/admin/operational/users/bulk-reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userIds: selectedUserIds, departmentStr: selectedDept })
      });
      setShowDeptDropdown(false);
      setSelectedUserIds([]);
      setSelectedDept('');
    } catch (e) {
      console.error('Failed to change dept', e);
    }
  };

  const handleAction = (userId: number, actionType: string) => {
    alert(`تنفيذ إجراء [${actionType}] على المستخدم رقم ${userId} - (قيد التطوير)`);
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  };

  const thStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    textAlign: 'start',
    background: 'rgba(0, 82, 204, 0.25)',
    borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
    fontSize: '13px',
    fontWeight: 'bold'
  };

  const tdStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    fontSize: '13px'
  };

  const actionButtonStyle = (bgColor: string, color: string = '#fff'): React.CSSProperties => ({
    padding: '6px 12px',
    background: bgColor,
    border: 'none',
    borderRadius: '6px',
    color: color,
    cursor: 'pointer',
    fontSize: '12px',
    marginInlineStart: '8px',
    fontWeight: 'bold'
  });

  return (
    <div>
      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>المصفوفة التنظيمية للمستخدمين (The Global User Matrix)</span>
        <button onClick={fetchUsers} style={actionButtonStyle('rgba(255,255,255,0.1)')}>تحديث القائمة</button>
      </h3>

      {/* Bulk Actions Panel */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', gap: '15px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>أكشن جماعي ({selectedUserIds.length} محدد):</span>
        
        <div style={{ position: 'relative' }}>
          <button 
            disabled={selectedUserIds.length === 0} 
            onClick={() => setShowDeptDropdown(!showDeptDropdown)}
            style={{ ...actionButtonStyle('rgba(255, 171, 0, 0.8)'), opacity: selectedUserIds.length === 0 ? 0.5 : 1 }}
          >
            تغيير القسم الجماعي
          </button>
          
          {showDeptDropdown && (
            <div style={{ position: 'absolute', top: '100%', marginTop: '5px', background: '#172b4d', border: '1px solid #0052cc', borderRadius: '6px', padding: '10px', zIndex: 10, minWidth: '200px' }}>
              <select 
                style={{ width: '100%', padding: '8px', marginBottom: '10px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
              >
                <option value="">-- اختر القسم الجديد --</option>
                <option value="تقنية المعلومات/فريق الشبكات">تقنية المعلومات / فريق الشبكات</option>
                <option value="تقنية المعلومات/فريق السيرفرات">تقنية المعلومات / فريق السيرفرات</option>
                <option value="الصيانة/المرافق">الصيانة / المرافق</option>
              </select>
              <button onClick={handleBulkChangeDept} style={{ width: '100%', padding: '6px', background: '#0052cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>تطبيق النقل</button>
            </div>
          )}
        </div>

        <button 
          disabled={selectedUserIds.length === 0} 
          onClick={handleBulkFreeze}
          style={{ ...actionButtonStyle('rgba(222, 53, 11, 0.9)'), opacity: selectedUserIds.length === 0 ? 0.5 : 1 }}
        >
          تجميد الحسابات اللحظي (حظر)
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>جاري التحميل...</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={users.length > 0 && selectedUserIds.length === users.length}
                  onChange={handleToggleSelectAll}
                />
              </th>
              <th style={thStyle}># معرف</th>
              <th style={thStyle}>الاسم الكامل</th>
              <th style={thStyle}>اسم المستخدم (@)</th>
              <th style={thStyle}>التنسيب الإداري</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>إجراءات فردية</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((u) => (
              <tr key={u.id} style={{ background: selectedUserIds.includes(u.id) ? 'rgba(0, 82, 204, 0.15)' : 'rgba(255,255,255,0.01)', transition: 'background 0.2s' }}>
                <td style={tdStyle}>
                  <input 
                    type="checkbox" 
                    checked={selectedUserIds.includes(u.id)}
                    onChange={() => handleToggleSelectUser(u.id)}
                  />
                </td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{u.id}</td>
                <td style={tdStyle}>{u.fullName}</td>
                <td style={{ ...tdStyle, color: theme.colors.primary }}>@{u.username}</td>
                <td style={tdStyle}>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: '#00d665' }}>🏢 {u.departmentName}</span><br/>
                    <span style={{ color: '#aaa', marginInlineStart: '15px' }}>↳ {u.subTeamName}</span>
                  </div>
                </td>
                <td style={tdStyle}>
                  {u.status === 'ACTIVE' ? (
                    <span style={{ padding: '4px 8px', background: 'rgba(0, 255, 120, 0.2)', color: '#00ff78', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>نشط</span>
                  ) : (
                    <span style={{ padding: '4px 8px', background: 'rgba(222, 53, 11, 0.2)', color: '#ff5630', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>مجمد</span>
                  )}
                </td>
                <td style={tdStyle}>
                  <button onClick={() => handleAction(u.id, 'PROMOTE')} style={actionButtonStyle('rgba(0, 82, 204, 0.8)')}>ترقية</button>
                  {u.status === 'ACTIVE' ? (
                    <button onClick={() => {
                       // Individual freeze fallback
                       setUsers(prev => prev.map(user => user.id === u.id ? { ...user, status: 'FROZEN' } : user));
                       GarbageCollectionCore.flushUserSessions(u.id.toString());
                    }} style={actionButtonStyle('rgba(222, 53, 11, 0.8)')}>تجميد</button>
                  ) : (
                    <button onClick={() => {
                       // Individual unfreeze fallback
                       setUsers(prev => prev.map(user => user.id === u.id ? { ...user, status: 'ACTIVE' } : user));
                    }} style={actionButtonStyle('rgba(0, 255, 120, 0.8)', '#000')}>تفعيل</button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center' }}>لا يوجد مستخدمين لعرضهم</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
