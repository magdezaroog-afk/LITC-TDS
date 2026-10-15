const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ include: { role: true } });
  const admins = users.filter(u => u.role && u.role.name === 'System_Admin');
  console.log('Admins:', admins.map(u => u.email + ' -> ' + u.role.name));
  await prisma.$disconnect();
}
run();
