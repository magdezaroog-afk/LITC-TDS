const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const ui = await prisma.interface.findUnique({ where: { id: 'cmuzb8pjp0001hb2j1zh6xbrm' } });
  console.log('UI row for 1059:', ui);
}

check().catch(console.error).finally(() => prisma.$disconnect());
