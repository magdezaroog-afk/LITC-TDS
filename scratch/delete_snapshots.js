const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting snapshots...');
  const res = await prisma.systemSetting.deleteMany({
    where: { 
      settingKey: {
        in: ['LITC_OPERATIONAL_DEPARTMENTS_JSON']
      }
    }
  });
  console.log(`Deleted ${res.count} snapshot records from SystemSettings.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
