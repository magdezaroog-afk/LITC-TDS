const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectOrgTree() {
  const setting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  if (!setting) {
    console.log('No LITC_ORG_TREE_SNAPSHOT found!');
    return;
  }
  const tree = JSON.parse(setting.settingValue);
  console.log('Is Array?', Array.isArray(tree));
  console.log('Top keys or root items:', Array.isArray(tree) ? tree.length : Object.keys(tree));
  
  function printNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}- [${node.id}] ${node.name} (${node.type || 'node'}) - Children: ${node.children ? node.children.length : 0}`);
    if (node.children && depth < 3) {
      node.children.forEach(c => printNode(c, depth + 1));
    }
  }

  if (Array.isArray(tree)) {
    tree.forEach(root => printNode(root));
  } else {
    printNode(tree);
  }
}

inspectOrgTree().catch(console.error).finally(() => prisma.$disconnect());
