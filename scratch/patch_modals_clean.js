const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

// Replace handleAddDivision prompt
const startDiv = c.indexOf("    const optionsText = nodesToAdd.map((n, i) => `${i + 1}- ${n.name}`).join('\\n');");
if (startDiv !== -1) {
  const endDiv = c.indexOf("      }));\n    }", startDiv) + 16;
  if (endDiv > 16) {
    const replaceWith = "    setAddEntityModalOpen({ type: 'DIVISION', parentId: deptId, parentName: deptName, availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);";
    c = c.substring(0, startDiv) + replaceWith + c.substring(endDiv);
  }
}

// Replace handleAddTeam prompt
const startTeam = c.indexOf("    const optionsText = nodesToAdd.map((n, i) => `${i + 1}- ${n.name}`).join('\\n');", startDiv + 100);
if (startTeam !== -1) {
  const endTeam = c.indexOf("      }));\n    }", startTeam) + 16;
  if (endTeam > 16) {
    const replaceWith = "    setAddEntityModalOpen({ type: 'TEAM', parentId: divId, parentName: divName, deptId, availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);";
    c = c.substring(0, startTeam) + replaceWith + c.substring(endTeam);
  }
}

// Replace handleAddDepartment prompt
const startDept = c.indexOf("    const optionsText = availableNodes.map((n, i) => `${i + 1}- ${n.name}`).join('\\n');");
if (startDept !== -1) {
  const endDept = c.indexOf("    setDepartments(prev => [...prev, newDept]);\n    }", startDept) + 54;
  if (endDept > 54) {
    const replaceWith = "    setAddEntityModalOpen({ type: 'DEPARTMENT', availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);";
    c = c.substring(0, startDept) + replaceWith + c.substring(endDept);
  }
}

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Modals cleanly patched via substring!');
