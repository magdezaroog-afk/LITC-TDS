const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

c = c.replace(/const optionsText = nodesToAdd\.map\(\(n, i\) => \`\$\{i \+ 1\}- \$\{n\.name\}\`\)\.join\('\\n'\);\r?\n\s+const selectedIdx = window\.prompt\([\s\S]*?\r?\n\s+\}\)\);\r?\n\s+\}/,
  `setAddEntityModalOpen({ type: 'DIVISION', parentId: deptId, parentName: deptName, availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);`);

c = c.replace(/const optionsText = nodesToAdd\.map\(\(n, i\) => \`\$\{i \+ 1\}- \$\{n\.name\}\`\)\.join\('\\n'\);\r?\n\s+const selectedIdx = window\.prompt\([\s\S]*?\r?\n\s+\}\)\);\r?\n\s+\}/,
  `setAddEntityModalOpen({ type: 'TEAM', parentId: divId, parentName: divName, deptId, availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);`);

c = c.replace(/const optionsText = availableNodes\.map\(\(n, i\) => \`\$\{i \+ 1\}- \$\{n\.name\}\`\)\.join\('\\n'\);\r?\n\s+const selectedIdx = window\.prompt\([\s\S]*?setDepartments\(prev => \[\.\.\.prev, newDept\]\);\r?\n\s+\}/,
  `setAddEntityModalOpen({ type: 'DEPARTMENT', availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);`);

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Done!');
