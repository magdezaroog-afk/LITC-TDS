const fs = require('fs');
const path = 'src/pages/admin/tabs/OperationalStructure/OperationalStructureTabCore.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `       if (action === 'ASSIGN' && destDeptId) {`;

const newCode = `       if (action === 'UNASSIGN') {
          setOperationalUsers(opPrev => opPrev.filter(u => !usersToMoveIds.includes(u.id)));
       }

       if (action === 'ASSIGN' && destDeptId) {`;

if (content.includes("if (action === 'ASSIGN' && destDeptId)")) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content);
  console.log('Patched executeUniversalMove');
} else {
  console.log('Could not find target line');
}
