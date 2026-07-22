import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';

export const PersonaSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [allSystemUsers, setAllSystemUsers] = useState<any[]>([]);
  const [testUsersIds, setTestUsersIds] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    // Load all users
    const storedUsers = localStorage.getItem('mockOperationalUsers');
    if (storedUsers) {
      try {
        setAllSystemUsers(JSON.parse(storedUsers));
      } catch (e) {
        console.error("Failed to parse system users");
      }
    }
    
    // Load saved test users list
    const storedSimulation = localStorage.getItem('litc_simulation_users');
    if (storedSimulation) {
      try {
        setTestUsersIds(JSON.parse(storedSimulation));
      } catch (e) {
        setTestUsersIds(['op1', 'op2', 'op6', 'op4']);
      }
    } else {
      // Default to the 4 users if no simulation list saved
      const defaultIds = ['op1', 'op2', 'op6', 'op4'];
      setTestUsersIds(defaultIds);
      localStorage.setItem('litc_simulation_users', JSON.stringify(defaultIds));
    }
  }, []);

  const testUsers = useMemo(() => {
    return allSystemUsers.filter(u => testUsersIds.includes(u.id));
  }, [allSystemUsers, testUsersIds]);

  const filteredSearchUsers = useMemo(() => {
    if (!searchQuery.trim()) return allSystemUsers;
    return allSystemUsers.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.employeeId && u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allSystemUsers, searchQuery]);

  const handleOpenTest = (userId: string) => {
    window.location.href = `/?login_as_user=${userId}`;
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIds = testUsersIds.filter(id => id !== userId);
    setTestUsersIds(newIds);
    localStorage.setItem('litc_simulation_users', JSON.stringify(newIds));
  };

  const openAddModal = () => {
    setSelectedUserIds([...testUsersIds]);
    setSearchQuery('');
    setShowAddModal(true);
  };

  const saveSimulationUsers = () => {
    setTestUsersIds(selectedUserIds);
    localStorage.setItem('litc_simulation_users', JSON.stringify(selectedUserIds));
    setShowAddModal(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const isSuperAdmin = user?.role === 'system_director' || user?.role === 'super_admin';
  const isTestUser = testUsersIds.includes(user?.id || '');

  if (!isSuperAdmin && !isTestUser) {
    return null;
  }

  return (
    <>
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
          }}
          title="محاكاة أدوار النظام"
        >
          🎭
        </button>
        
        {isOpen && (
          <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '20px', padding: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '8px', direction: 'rtl', minWidth: '260px' }}>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b', marginBottom: '8px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
              محاكاة المستخدمين الحقيقيين
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {testUsers.map(tu => (
                <div 
                  key={tu.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: user?.id === tu.id ? 'rgba(37, 99, 235, 0.9)' : 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: user?.id === tu.id ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <button
                    onClick={() => handleOpenTest(tu.id)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: user?.id === tu.id ? '#fff' : '#334155', textAlign: 'right', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px' }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{tu.name}</span>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>{tu.role === 'NONE' || !tu.role ? 'بدون دور' : tu.role}</span>
                    </span>
                    {user?.id === tu.id ? <span>✅</span> : <span>🔗</span>}
                  </button>
                  {isSuperAdmin && (
                    <button 
                      onClick={(e) => removeUser(tu.id, e)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s hover:bg-red-100' }}
                      title="إزالة من القائمة"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
              {testUsers.length === 0 && (
                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '10px' }}>
                  القائمة فارغة
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <button 
                onClick={openAddModal}
                style={{ marginTop: '8px', background: '#f1f5f9', color: '#0f172a', border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s hover:bg-slate-200' }}
              >
                ➕ إضافة مستخدمين للمحاكاة
              </button>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000, direction: 'rtl' }}>
          <div style={{ background: '#fff', width: '450px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '900', textAlign: 'center' }}>إضافة مستخدمين للاختبار</h3>
            
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الرقم الوظيفي..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSearchUsers.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedUserIds.includes(u.id)}
                    onChange={() => toggleUserSelection(u.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{u.name}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{u.role === 'NONE' || !u.role ? 'بدون دور' : u.role} • {u.employeeId}</span>
                  </div>
                </label>
              ))}
              {filteredSearchUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>لا توجد نتائج مطابقة لبحثك</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>إلغاء</button>
              <button onClick={saveSimulationUsers} style={{ flex: 2, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>حفظ التعديلات ({selectedUserIds.length})</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
