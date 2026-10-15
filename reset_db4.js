const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  
  await prisma.$executeRawUnsafe('UPDATE "User" SET "departmentId" = null;');
  await prisma.$executeRawUnsafe('UPDATE "User" SET "roleId" = 2 WHERE "username" != \'admin\';'); // 2 is Employee
  
  const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (admin) {
    await prisma.$executeRawUnsafe('UPDATE "User" SET "roleId" = 22 WHERE "id" = ' + admin.id + ';'); // 22 is SYSTEM_ADMIN
    console.log('Reset admin account to SYSTEM_ADMIN');
  }
  
  try {
    await prisma.$executeRawUnsafe('DELETE FROM "UserTeam";');
  } catch (e) { console.log(e); }
  
  console.log('Reset completed successfully');
}
main().finally(() => prisma.$disconnect());
