const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: { id: true, email: true, username: true, fullName: true, roleId: true, isActive: true }
    });
    console.log('=== Users in DB ===');
    console.log(JSON.stringify(users, null, 2));

    const roles = await prisma.role.findMany({ select: { id: true, name: true } });
    console.log('\n=== Roles in DB ===');
    console.log(JSON.stringify(roles, null, 2));

    const departments = await prisma.department.findMany({
      where: { isDeleted: false },
      include: { teams: { where: { isDeleted: false } } }
    });
    console.log('\n=== Departments in DB ===');
    console.log(JSON.stringify(departments, null, 2));

    const systemSettings = await prisma.systemSetting.findMany({ take: 5 });
    console.log('\n=== System Settings ===');
    console.log(JSON.stringify(systemSettings, null, 2));
  } catch (e) {
    console.error('DB Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
