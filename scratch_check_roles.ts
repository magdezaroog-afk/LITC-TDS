import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const role = await prisma.role.findFirst({ where: { name: 'OPERATIONAL_USER' } });
  if (role) {
    console.log('OPERATIONAL_USER ID:', role.id);
  } else {
    console.log('OPERATIONAL_USER role not found!');
    const anyRole = await prisma.role.findFirst();
    if (anyRole) {
      console.log('Found some role:', anyRole.name, anyRole.id);
    }
  }
  await prisma.$disconnect();
}
run();
