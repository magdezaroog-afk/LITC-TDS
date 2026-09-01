const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

// 1. Fix commitAddEntity
const oldCommitAdd = `  const commitAddEntity = () => {
    if (!addEntityModalOpen || !addEntitySelectedNode) return;
    
    if (addEntityModalOpen.type === 'DEPARTMENT') {
      const newDept: OrgDepartment = {
        id: \`dept_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`,
        name: addEntitySelectedNode.name,
        divisions: [],
        expanded: true
      };
      setDepartments(prev => [...prev, newDept]);
    }
    
    setAddEntityModalOpen(null);
    setAddEntitySelectedNode(null);
  };`;

const newCommitAdd = `  const commitAddEntity = () => {
    if (!addEntityModalOpen || !addEntitySelectedNode) return;
    
    if (addEntityModalOpen.type === 'DEPARTMENT') {
      const newDept: OrgDepartment = {
        id: \`dept_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`,
        name: addEntitySelectedNode.name,
        divisions: [],
        expanded: true
      };
      setDepartments(prev => [...prev, newDept]);
    } else if (addEntityModalOpen.type === 'DIVISION') {
      setDepartments(prev => prev.map(d => {
        if (d.id === addEntityModalOpen.parentId) {
          return {
            ...d,
            divisions: [...d.divisions, {
              id: \`div_\${Date.now()}\`,
              name: addEntitySelectedNode.name,
              isIndependent: false,
              teams: [],
              unassignedUsers: [],
              expanded: false
            }]
          };
        }
        return d;
      }));
    } else if (addEntityModalOpen.type === 'TEAM') {
      setDepartments(prev => prev.map(d => {
        if (d.id === addEntityModalOpen.deptId) {
          return {
            ...d,
            divisions: d.divisions.map(dv => {
              if (dv.id === addEntityModalOpen.parentId) {
                return {
                  ...dv,
                  teams: [...dv.teams, {
                    id: \`team_\${Date.now()}\`,
                    name: addEntitySelectedNode.name,
                    users: [],
                    expanded: false
                  }]
                };
              }
              return dv;
            })
          };
        }
        return d;
      }));
    }
    
    setAddEntityModalOpen(null);
    setAddEntitySelectedNode(null);
  };`;

c = c.replace(oldCommitAdd, newCommitAdd);
c = c.replace(oldCommitAdd.replace(/\n/g, '\r\n'), newCommitAdd);
c = c.replace(oldCommitAdd.replace(/\r\n/g, '\n'), newCommitAdd);

// 2. Add confirmDeleteModal JSX
const modalJSX = `
      {/* Confirm Delete Modal */}
      {confirmDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', color: OA.red }}>تأكيد الحذف</h3>
            <p style={{ margin: '0 0 24px', color: OA.text }}>
              هل أنت متأكد من حذف {confirmDeleteModal.type === 'DEPARTMENT' ? 'الإدارة' : confirmDeleteModal.type === 'DIVISION' ? 'القسم' : 'الفريق/الوحدة'} <strong>{confirmDeleteModal.name}</strong>؟
              <br/><br/>
              <span style={{ fontSize: '12px', color: OA.textSub }}>هذا الإجراء سيقوم بحذف جميع العناصر الفرعية وإزالة الانتماء التشغيلي للموظفين المرتبطين.</span>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDeleteModal(null)} style={{ flex: 1, background: '#f5f5f5', color: OA.text, border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
              <button onClick={() => executeDeleteEntity(confirmDeleteModal.type, confirmDeleteModal.id)} style={{ flex: 1, background: OA.red, color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
`;

if (c.indexOf('Confirm Delete Modal') === -1) {
  // Insert before the last </div>
  const lastDivIndex = c.lastIndexOf('</div>');
  c = c.substring(0, lastDivIndex) + modalJSX + c.substring(lastDivIndex);
}

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Fixes applied successfully!');
