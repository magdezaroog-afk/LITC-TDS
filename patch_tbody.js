const fs = require('fs');
const path = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
let content = fs.readFileSync(path, 'utf8');

const newTbody = `              <tbody>
                {filteredPool.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: APPLE.textSecondary }}>
                      {poolSearchQuery ? 'لا توجد نتائج بحث تطابق مدخلاتك.' : 'الحوض فارغ حالياً.'}
                    </td>
                  </tr>
                ) : (
                  filteredPool.map((user: any) => {
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
                  })
                )}
              </tbody>`;

const start = content.indexOf('<tbody>');
const end = content.indexOf('</tbody>') + '</tbody>'.length;
content = content.substring(0, start) + newTbody + content.substring(end);

fs.writeFileSync(path, content);
console.log('Replaced tbody successfully.');
