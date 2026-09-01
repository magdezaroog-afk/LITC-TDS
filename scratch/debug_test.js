const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const s = await p.systemSetting.findUnique({ where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' } });
  console.log('Dept snapshot exists:', !!s);
  if (s) console.log('  Value (first 200):', s.settingValue.slice(0, 200));

  const u13 = await p.user.findUnique({ where: { id: 13 }, select: { id: true, fullName: true, isDeleted: true, isActive: true } });
  console.log('\nUser 13:', JSON.stringify(u13));
  
  const u20 = await p.user.findUnique({ where: { id: 20 }, select: { id: true, fullName: true, roleId: true, isDeleted: true } });
  console.log('User 20 (test user):', JSON.stringify(u20));

  await p.$disconnect();
}
main().catch(e => { console.error(e.message); p.$disconnect(); });
