const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const roles = await prisma.role.findMany();
  console.log(roles.map(r => r.id + ': ' + r.name).join('\n'));
}
run().catch(console.error).finally(() => prisma.$disconnect());
