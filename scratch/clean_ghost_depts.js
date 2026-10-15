const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning ghost/leftover departments ---');
  // Delete department 9 (ببب)
  const delTeams = await prisma.team.deleteMany({
    where: { departmentId: 9 }
  });
  console.log('Deleted teams under dept 9:', delTeams);

  const delDept = await prisma.department.deleteMany({
    where: { name: 'ببب' }
  });
  console.log('Deleted dept ببب:', delDept);

  // Clear operational snapshot setting to clean state []
  await prisma.systemSetting.upsert({
    where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' },
    update: { settingValue: '[]' },
    create: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON', settingValue: '[]' }
  });
  console.log('Set LITC_OPERATIONAL_DEPARTMENTS_JSON to []');

  // Verify
  const depts = await prisma.department.findMany();
  console.log('Active depts now:', depts.filter(d => !d.isDeleted));
}

main().catch(console.error).finally(() => prisma.$disconnect());
