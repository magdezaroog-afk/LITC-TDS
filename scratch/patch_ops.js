const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

c = c.replace(
  /const res = await fetch\('\/api\/v1\/org-structure\/tree', \{ headers: \{ 'X-Auth-Mode': 'cookie' \} \}\);/g,
  `const res = await fetch('/api/v1/org-structure/tree', { headers: { 'X-Auth-Mode': 'cookie' }, credentials: 'include' });`
);

c = c.replace(
  /const res = await fetch\('\/api\/v1\/org-structure\/departments', \{\r?\n\s+headers: \{ 'X-Auth-Mode': 'cookie' \}\r?\n\s+\}\);/g,
  `const res = await fetch('/api/v1/org-structure/departments', {\n          headers: { 'X-Auth-Mode': 'cookie' },\n          credentials: 'include'\n        });`
);

c = c.replace(
  /const res = await fetch\('\/api\/v1\/admin\/operational\/users', \{ headers: \{ 'X-Auth-Mode': 'cookie' \} \}\);/g,
  `const res = await fetch('/api/v1/admin/operational/users', { headers: { 'X-Auth-Mode': 'cookie' }, credentials: 'include' });`
);

// Fix normalized arrays
c = c.replace(
  /setDepartments\(data\.length \? data : initialDepartments\);/g,
  `const normalizedData = (data.length ? data : initialDepartments).map((d: any) => ({
            ...d,
            divisions: Array.isArray(d.divisions) ? d.divisions.map((div: any) => ({
              ...div,
              teams: Array.isArray(div.teams) ? div.teams.map((t: any) => ({
                ...t,
                users: Array.isArray(t.users) ? t.users : []
              })) : [],
              unassignedUsers: Array.isArray(div.unassignedUsers) ? div.unassignedUsers : []
            })) : []
          }));
          setDepartments(normalizedData);`
);

// Fix save departments (csrf)
c = c.replace(
  /fetch\('\/api\/v1\/org-structure\/departments', \{\r?\n\s+method: 'POST',\r?\n\s+headers: \{ \r?\n\s+'Content-Type': 'application\/json',\r?\n\s+'X-Auth-Mode': 'cookie' \r?\n\s+\},\r?\n\s+body: JSON\.stringify\(\{ departments \}\)\r?\n\s+\}\)\.catch\(err => console\.error\('Failed to save departments', err\)\);/g,
  `const saveDepts = async () => {
        try {
          const csrfRes = await fetch('/api/v1/csrf-token', { credentials: 'include' });
          if (!csrfRes.ok) return;
          const { csrfToken } = await csrfRes.json();
          
          await fetch('/api/v1/org-structure/departments', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Auth-Mode': 'cookie',
              'CSRF-Token': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ departments })
          });
        } catch (err) {
          console.error('Failed to save departments', err);
        }
      };
      saveDepts();`
);

// Fix getChildNodesByType crash
c = c.replace(
  /const getNodesByType = \(tree: OrgNode, types: string\[\]\): OrgNode\[\] => \{\r?\n\s+let result: OrgNode\[\] = \[\];\r?\n\s+if \(types\.includes\(tree\.type\)\) result\.push\(tree\);\r?\n\s+for \(const child of tree\.children\) \{/g,
  `const getNodesByType = (tree: OrgNode | null, types: string[]): OrgNode[] => {
    if (!tree) return [];
    let result: OrgNode[] = [];
    if (types.includes(tree.type)) result.push(tree);
    for (const child of tree.children || []) {`
);

c = c.replace(
  /const getChildNodesByType = \(parentId: string, tree: OrgNode, types: string\[\]\): OrgNode\[\] => \{\r?\n\s+const findNode = \(n: OrgNode\): OrgNode \| null => \{\r?\n\s+if \(n\.name === parentId \|\| n\.id === parentId\) return n; \/\/ Match by name or ID\r?\n\s+for \(const c of n\.children\) \{/g,
  `const getChildNodesByType = (parentId: string, tree: OrgNode | null, types: string[]): OrgNode[] => {
    if (!tree) return [];
    const findNode = (n: OrgNode): OrgNode | null => {
      if (!n) return null;
      if (n.name === parentId || n.id === parentId) return n; // Match by name or ID
      for (const c of n.children || []) {`
);

c = c.replace(
  /return parentNode\.children\.filter\(c => types\.includes\(c\.type\)\);/g,
  `return (parentNode.children || []).filter(c => types.includes(c.type));`
);

// Fix map crash
c = c.replace(
  /const existingDivNames = dept\.divisions\.map\(d => d\.name\);/g,
  `const existingDivNames = (dept.divisions || []).map(d => d.name);`
);

c = c.replace(
  /const div = dept\.divisions\.find\(d => d\.id === divId\);\r?\n\s+if \(!div\) return;\r?\n\r?\n\s+const existingTeamNames = div\.teams\.map\(t => t\.name\);/g,
  `const div = (dept.divisions || []).find(d => d.id === divId);\n    if (!div) return;\n\n    const existingTeamNames = (div.teams || []).map(t => t.name);`
);

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Patch complete.');
