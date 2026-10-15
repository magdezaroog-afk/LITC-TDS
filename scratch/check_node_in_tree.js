const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const treeSnap = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  if (treeSnap && treeSnap.settingValue) {
    const tree = JSON.parse(treeSnap.settingValue);
    function check(n) {
      if (n.name && n.name.includes('ببب')) console.log('FOUND IN TREE:', n);
      if (n.children) n.children.forEach(check);
    }
    check(tree);
    console.log('Done checking tree.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
