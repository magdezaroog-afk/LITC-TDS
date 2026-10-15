const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tree = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  if (tree) {
    const parsed = JSON.parse(tree.settingValue);
    console.log(JSON.stringify(parsed, null, 2));
  } else {
    console.log("NO TREE");
  }
}
check().then(() => process.exit(0));
