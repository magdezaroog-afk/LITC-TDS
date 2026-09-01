const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

const startTeam = c.indexOf("    const optionsText = nodesToAdd.map((n, i) => `${i + 1}- ${n.name} (${n.type})`).join('\\n');");
if (startTeam !== -1) {
  const endTeam = c.indexOf("      }));\n    }", startTeam) + 16;
  if (endTeam > 16) {
    const replaceWith = "    setAddEntityModalOpen({ type: 'TEAM', parentId: divId, parentName: divName, deptId, availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);";
    c = c.substring(0, startTeam) + replaceWith + c.substring(endTeam);
  }
}

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Team modal correctly patched!');
