const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  
  await prisma.$executeRawUnsafe('UPDATE "User" SET "departmentId" = null;');
  await prisma.$executeRawUnsafe('UPDATE "User" SET "roleId" = 1 WHERE "username" != \'admin\';');
  
  const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (admin) {
    await prisma.$executeRawUnsafe('UPDATE "User" SET "roleId" = 3 WHERE "id" = ' + admin.id + ';');
    console.log('Reset admin account to SUPER_ADMIN');
  }
  
  try {
    await prisma.$executeRawUnsafe('DELETE FROM "UserTeam";');
  } catch (e) { console.log(e); }
  
  console.log('Reset completed successfully');
}
main().finally(() => prisma.$disconnect());
