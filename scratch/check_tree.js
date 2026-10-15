const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  if (!setting) {
    console.log('No LITC_ORG_TREE_SNAPSHOT found!');
    return;
  }
  const tree = JSON.parse(setting.settingValue);
  console.log('Tree root:', { id: tree.id, name: tree.name, type: tree.type, childrenCount: tree.children?.length });

  function printNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}- [${node.type}] ${node.name} (${node.children ? node.children.length : 0} children)`);
    if (node.children) {
      node.children.forEach(c => printNode(c, depth + 1));
    }
  }

  printNode(tree);
}

main().catch(console.error).finally(() => prisma.$disconnect());
