const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const buildings = await prisma.systemReference.findMany({
    where: { type: { in: ['BUILDING', 'LOCATION'] } }
  });
  console.log("BUILDINGS IN DB:");
  console.log(buildings);
  
  const tree = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  console.log("TREE IN DB:", tree ? tree.settingValue.substring(0, 100) + '...' : "NULL");
}
main().then(() => process.exit(0));
