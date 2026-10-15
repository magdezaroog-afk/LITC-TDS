const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const s = await p.systemSetting.findUnique({ where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' } });
  if (!s?.settingValue) return console.log('No tree setting');
  const tree = JSON.parse(s.settingValue);
  
  function printNode(n, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}- [${n.type}] ${n.name} (id: ${n.id})`);
    if (n.children) {
      n.children.forEach(c => printNode(c, depth + 1));
    }
  }

  printNode(tree);
}

main().catch(console.error).finally(() => p.$disconnect());
