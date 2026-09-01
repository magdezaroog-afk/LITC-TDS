const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

c = c.replace(
  /const optionsText = nodesToAdd\.map\(\(n, i\) => \`\$\{i \+ 1\}- \$\{n\.name\}\`\)\.join\('\\n'\);\s*const selectedIdx = window\.prompt\(\`اختر القسم لإنشائه تحت \$\{deptName\}:\\n\$\{optionsText\}\`\);\s*if \(!selectedIdx\) return;\s*const idx = parseInt\(selectedIdx\) - 1;\s*if \(nodesToAdd\[idx\]\) \{\s*const newNode = nodesToAdd\[idx\];\s*setDepartments\(prev => prev\.map\(d => \{\s*if \(d\.id === deptId\) \{\s*return \{\s*\.\.\.d,\s*divisions: \[\.\.\.d\.divisions, \{\s*id: \`div_\$\{Date\.now\(\)\}\`,\s*name: newNode\.name,\s*isIndependent: false,\s*teams: \[\],\s*unassignedUsers: \[\],\s*expanded: true\s*\}\]\s*\};\s*\}\s*return d;\s*\}\)\);\s*\}/,
  `setAddEntityModalOpen({ type: 'DIVISION', parentId: deptId, parentName: deptName, availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);`
);

c = c.replace(
  /const optionsText = nodesToAdd\.map\(\(n, i\) => \`\$\{i \+ 1\}- \$\{n\.name\}\`\)\.join\('\\n'\);\s*const selectedIdx = window\.prompt\(\`اختر الفريق أو الوحدة لإنشائها تحت \$\{divName\}:\\n\$\{optionsText\}\`\);\s*if \(!selectedIdx\) return;\s*const idx = parseInt\(selectedIdx\) - 1;\s*if \(nodesToAdd\[idx\]\) \{\s*const newNode = nodesToAdd\[idx\];\s*setDepartments\(prev => prev\.map\(d => \{\s*if \(d\.id === deptId\) \{\s*return \{\s*\.\.\.d,\s*divisions: d\.divisions\.map\(div => \{\s*if \(div\.id === divId\) \{\s*return \{\s*\.\.\.div,\s*teams: \[\.\.\.div\.teams, \{\s*id: \`team_\$\{Date\.now\(\)\}\`,\s*name: newNode\.name,\s*users: \[\],\s*expanded: true\s*\}\]\s*\};\s*\}\s*return div;\s*\}\)\s*\};\s*\}\s*return d;\s*\}\)\);\s*\}/,
  `setAddEntityModalOpen({ type: 'TEAM', parentId: divId, parentName: divName, deptId, availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);`
);

c = c.replace(
  /const optionsText = availableNodes\.map\(\(n, i\) => \`\$\{i \+ 1\}- \$\{n\.name\}\`\)\.join\('\\n'\);\s*const selectedIdx = window\.prompt\(\`اختر الإدارة لإنشائها:\\n\$\{optionsText\}\`\);\s*if \(!selectedIdx\) return;\s*const idx = parseInt\(selectedIdx\) - 1;\s*if \(availableNodes\[idx\]\) \{\s*const newNode = availableNodes\[idx\];\s*const newDept: OrgDepartment = \{\s*id: \`dept_\$\{Date\.now\(\)\}_\$\{Math\.random\(\)\.toString\(36\)\.substring\(2, 9\)\}\`,\s*name: newNode\.name,\s*divisions: \[\],\s*expanded: true\s*\};\s*setDepartments\(prev => \[\.\.\.prev, newDept\]\);\s*\}/,
  `setAddEntityModalOpen({ type: 'DEPARTMENT', availableNodes: nodesToAdd });\n    setAddEntitySelectedNode(nodesToAdd[0]);`
);

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Modals patched.');
