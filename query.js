const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, roleId: true, isActive: true }
    });
    console.log(`Found ${users.length} total users.`);
    console.log(users.slice(0, 10));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
