const fs = require('fs');
const path = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert handleUnassignUser and handleUnassignSelectedUsers
const handlersStr = `
  const handleUnassignUser = async (userId: string) => {
    if (window.confirm('سيتم إرجاع المستخدم إلى الموظفين العاديين وتجريده من الصلاحيات التشغيلية. المتابعة؟')) {
      try {
        await AdminAPI.unassignUser(parseInt(userId), 2);
        setUnassignedUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, departmentId: null, role: { ...u.role, id: 2, name: 'Employee' } } : u));
        alert('تم الإرجاع بنجاح.');
      } catch(e) { console.error(e); alert('حدث خطأ'); }
    }
  };

  const handleUnassignSelectedUsers = async () => {
    if (selectedUsers.size === 0) return;
    if (window.confirm(\`سيتم إرجاع \${selectedUsers.size} مستخدم(ين) إلى الموظفين العاديين. المتابعة؟\`)) {
      try {
        const promises = Array.from(selectedUsers).map(id => AdminAPI.unassignUser(parseInt(id), 2));
        await Promise.all(promises);
        setUnassignedUsers(prev => prev.map(u => selectedUsers.has(String(u.id)) ? { ...u, departmentId: null, role: { ...u.role, id: 2, name: 'Employee' } } : u));
        setSelectedUsers(new Set());
        alert('تم الإرجاع بنجاح.');
      } catch (e) {
        console.error(e); alert('حدث خطأ');
      }
    }
  };
`;

if (!content.includes('handleUnassignUser')) {
  content = content.replace('const filteredPool = unassignedUsers.filter(', handlersStr + '\n  const filteredPool = unassignedUsers.filter(');
}

// Fix the bulk assign buttons header
const oldHeaderButtons = `{selectedUsers.size > 0 && (
                    <button onClick={handleAssignSelectedUsers} style={{ background: APPLE.blue, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      تنسيب المحددين ({selectedUsers.size})
                    </button>
                  )}`;

const newHeaderButtons = `{selectedUsers.size > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleAssignSelectedUsers} style={{ background: APPLE.blue, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                        تنسيب تشغيلي ({selectedUsers.size})
                      </button>
                      <button onClick={handleUnassignSelectedUsers} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                        إرجاع الكادر ({selectedUsers.size})
                      </button>
                    </div>
                  )}`;

content = content.replace(oldHeaderButtons, newHeaderButtons);

// Fix the table rows
const oldTr = `                  filteredPool.map((user: any) => (
                    <tr key={user.id} style={{ borderBottom: \`1px solid \${APPLE.separator}\`, background: selectedUsers.has(String(user.id)) ? '#f0f9ff' : 'transparent' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <input type="checkbox" checked={selectedUsers.has(String(user.id))} onChange={() => {
                          const newSet = new Set(selectedUsers);
                          if (newSet.has(String(user.id))) newSet.delete(String(user.id));
                          else newSet.add(String(user.id));
                          setSelectedUsers(newSet);
                        }} />
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{user.fullName || user.username}</td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.email}</td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-LY') : '-'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button onClick={() => handleAssignUser(String(user.id))} style={{ background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          تنسيب ➔
                        </button>
                      </td>
                    </tr>
                  ))`;

const newTr = `                  filteredPool.map((user: any) => {
                    const isOperational = user.role?.id === 26 || user.departmentId;
                    const rowBg = selectedUsers.has(String(user.id)) ? '#f0f9ff' : (isOperational ? '#dcfce7' : 'transparent');
                    return (
                    <tr key={user.id} style={{ borderBottom: \`1px solid \${APPLE.separator}\`, background: rowBg }}>
                      <td style={{ padding: '16px 20px' }}>
                        <input type="checkbox" checked={selectedUsers.has(String(user.id))} onChange={() => {
                          const newSet = new Set(selectedUsers);
                          if (newSet.has(String(user.id))) newSet.delete(String(user.id));
                          else newSet.add(String(user.id));
                          setSelectedUsers(newSet);
                        }} />
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{user.fullName || user.username}</td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>
                        {user.email} 
                        {user.departmentId && <span style={{ marginRight: '10px', fontSize: '11px', background: '#0052cc', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>منسب لإدارة</span>}
                      </td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-LY') : '-'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        {isOperational ? (
                           <button onClick={() => handleUnassignUser(String(user.id))} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                              إرجاع للحوض ➔
                           </button>
                        ) : (
                           <button onClick={() => handleAssignUser(String(user.id))} style={{ background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                              تنسيب تشغيلي ➔
                           </button>
                        )}
                      </td>
                    </tr>
                    );
                  })`;

if (content.includes('filteredPool.map((user: any) => (')) {
  content = content.replace(oldTr, newTr);
} else {
  console.log("Could not find old tr structure");
}

fs.writeFileSync(path, content);
console.log('Patched correctly');
