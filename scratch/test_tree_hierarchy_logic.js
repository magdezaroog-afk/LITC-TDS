const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getTopLevelDepartments(tree) {
  if (!tree) return [];
  const results = [];
  const DEPT_TYPES = ['إدارة', 'مكتب', 'إدارة عليا'];

  function traverse(node) {
    if (!node) return;
    if (DEPT_TYPES.includes(node.type)) {
      results.push({ id: node.id, name: node.name, type: node.type, rawNode: node });
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(tree);
  return results;
}

function findNodeInTree(tree, idOrName) {
  if (!tree) return null;
  if (tree.id === idOrName || tree.name === idOrName) return tree;
  if (Array.isArray(tree.children)) {
    for (const child of tree.children) {
      const found = findNodeInTree(child, idOrName);
      if (found) return found;
    }
  }
  return null;
}

function getDivisionsForDepartment(tree, deptIdOrName) {
  const deptNode = findNodeInTree(tree, deptIdOrName);
  if (!deptNode || !Array.isArray(deptNode.children)) return [];

  const divisions = [];
  const DIV_TYPES = ['قسم', 'دائرة'];
  const DEPT_TYPES = ['إدارة', 'مكتب', 'إدارة عليا'];

  function scan(node) {
    if (!node) return;
    if (DIV_TYPES.includes(node.type)) {
      divisions.push({ id: node.id, name: node.name, type: node.type, rawNode: node });
    }
    // Also check child divisions unless it's a completely separate administration
    if (Array.isArray(node.children)) {
      for (const c of node.children) {
        if (!DEPT_TYPES.includes(c.type)) {
          scan(c);
        }
      }
    }
  }

  for (const child of deptNode.children) {
    scan(child);
  }
  return divisions;
}

function getTeamsForDivision(tree, divisionIdOrName) {
  const divNode = findNodeInTree(tree, divisionIdOrName);
  if (!divNode || !Array.isArray(divNode.children)) return [];

  const teams = [];
  const TEAM_TYPES = ['وحدة', 'فريق'];

  function scan(node) {
    if (!node) return;
    if (TEAM_TYPES.includes(node.type)) {
      teams.push({ id: node.id, name: node.name, type: node.type, rawNode: node });
    }
    if (Array.isArray(node.children)) {
      for (const c of node.children) {
        scan(c);
      }
    }
  }

  for (const child of divNode.children) {
    scan(child);
  }
  return teams;
}

async function run() {
  const setting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  const tree = JSON.parse(setting.settingValue);

  const depts = getTopLevelDepartments(tree);
  console.log('Top Departments Count:', depts.length);
  console.log('Sample depts:', depts.slice(0, 5).map(d => `${d.type}: ${d.name}`));

  const itDept = depts.find(d => d.name.includes('تقنية المعلومات'));
  console.log('\nTesting with:', itDept?.name);
  const divs = getDivisionsForDepartment(tree, itDept.id);
  console.log('Divisions under IT Dept:', divs.map(d => `${d.type}: ${d.name}`));

  const appsDiv = divs.find(d => d.name.includes('التطبيقات'));
  console.log('\nTesting with division:', appsDiv?.name);
  const teams = getTeamsForDivision(tree, appsDiv.id);
  console.log('Teams/Units under Apps Division:', teams.map(t => `${t.type}: ${t.name}`));
}

run().catch(console.error).finally(() => prisma.$disconnect());
