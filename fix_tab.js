const fs = require('fs');
let text = fs.readFileSync('src/pages/admin/tabs/InstitutionalStructureTab.tsx', 'utf8');

// 1. Remove filter from pool
text = text.replace('const poolUsers = data.users.filter((u: any) => !u.departmentId);', 'const poolUsers = data.users.filter((u: any) => u.role?.id !== 22 && u.role?.id !== 1 && u.username !== \'admin\');');

// 2. Change handleAssignUser state update
text = text.replace('setUnassignedUsers(prev => prev.filter(u => String(u.id) !== String(userId)));', 'setUnassignedUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, role: { ...u.role, id: 26, name: \'مستخدم تشغيلي\' } } : u));');

// 3. Change handleAssignSelectedUsers state update
text = text.replace('setUnassignedUsers(prev => prev.filter(u => !selectedUsers.has(String(u.id))));', 'setUnassignedUsers(prev => prev.map(u => selectedUsers.has(String(u.id)) ? { ...u, role: { ...u.role, id: 26, name: \'مستخدم تشغيلي\' } } : u));');

const targetRender = `                  filteredPool.map((user: any) => (
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

const newRender = `                  filteredPool.map((user: any) => {
                      let bgColor = 'transparent';
                      let statusText = '';
                      let btnVisible = true;
                      
                      if (user.departmentId) {
                         const hue = (user.departmentId * 137.5) % 360;
                         bgColor = \`hsla(\${hue}, 70%, 90%, 0.6)\`;
                         statusText = user.department?.name ? \`منسب للإدارة: \${user.department.name}\` : 'منسب لإدارة';
                         btnVisible = false;
                      } else if (user.role?.id === 26 || (user.role?.name && user.role.name.includes('تشغيلي'))) {
                         bgColor = '#dcfce7';
                         statusText = 'بالكادر التشغيلي (قيد التوزيع)';
                         btnVisible = false;
                      }
                      if (selectedUsers.has(String(user.id))) bgColor = '#f0f9ff';
                      
                      return (
                    <tr key={user.id} style={{ borderBottom: \`1px solid \${APPLE.separator}\`, background: bgColor }}>
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
                        {btnVisible ? (
                          <button onClick={() => handleAssignUser(String(user.id))} style={{ background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                            تنسيب ➔
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: APPLE.textSecondary, fontWeight: 'bold' }}>{statusText}</span>
                        )}
                      </td>
                    </tr>
                    );
                  })`;

text = text.replace(targetRender, newRender);

fs.writeFileSync('src/pages/admin/tabs/InstitutionalStructureTab.tsx', text);
