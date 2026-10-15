const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const s = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
  });
  console.log('SNAPSHOT_LEN:', s ? s.settingValue.length : 'NULL');
  if (s) {
    console.log('SNAPSHOT_CONTENT:', s.settingValue);
  }
  const d = await prisma.department.findMany();
  console.log('DEPTS:', JSON.stringify(d, null, 2));

  const teams = await prisma.team.findMany();
  console.log('TEAMS:', JSON.stringify(teams, null, 2));

  const ut = await prisma.userTeam.findMany();
  console.log('USER_TEAMS:', JSON.stringify(ut, null, 2));

  const orgTreeSetting = await prisma.systemSetting.findUnique({ where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' } });
  console.log('ORG_TREE_SETTING:', orgTreeSetting ? orgTreeSetting.settingValue : 'NULL');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
