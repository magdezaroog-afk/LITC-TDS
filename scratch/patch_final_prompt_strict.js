const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');
const oldCode = `    const optionsText = nodesToAdd.map((n, i) => \`\${i + 1}- \${n.name} (\${n.type})\`).join('\\n');
    const selectedIdx = window.prompt(\`اختر الوحدة/الفريق لإنشائه تحت \${divName}:\\n\${optionsText}\`);
    
    if (!selectedIdx) return;
    const idx = parseInt(selectedIdx) - 1;
    if (nodesToAdd[idx]) {
      const newNode = nodesToAdd[idx];
      setDepartments(prev => prev.map(d => {
        if (d.id === deptId) {
          return {
            ...d,
            divisions: d.divisions.map(dv => {
              if (dv.id === divId) {
                return {
                  ...dv,
                  teams: [...dv.teams, {
                    id: \`team_\${Date.now()}\`,
                    name: newNode.name,
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
    }`;

const newCode = `    setAddEntityModalOpen({ type: 'TEAM', parentId: divId, parentName: divName, deptId, availableNodes: nodesToAdd });
    setAddEntitySelectedNode(nodesToAdd[0]);`;

// Try both \r\n and \n replacements
c = c.replace(oldCode, newCode);
c = c.replace(oldCode.replace(/\r\n/g, '\n'), newCode);
c = c.replace(oldCode.replace(/\n/g, '\r\n'), newCode);

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Final prompt strictly replaced!');
