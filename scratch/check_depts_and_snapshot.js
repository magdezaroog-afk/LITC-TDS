const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany({
    include: { teams: true, users: true }
  });
  console.log('=== DEPARTMENTS IN DB ===');
  console.log(JSON.stringify(depts, null, 2));

  const opJson = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
  });
  console.log('=== LITC_OPERATIONAL_DEPARTMENTS_JSON ===');
  if (opJson) {
    console.log(opJson.settingValue);
  } else {
    console.log('NULL');
  }

  const treeSnap = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  console.log('=== LITC_ORG_TREE_SNAPSHOT ===');
  if (treeSnap) {
    console.log(treeSnap.settingValue.slice(0, 1000));
  } else {
    console.log('NULL');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
