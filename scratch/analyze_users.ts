import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Delete dummy accounts
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['operator@litc.ly', 'employee@litc.ly']
        }
      }
    });
    console.log('Dummy accounts deleted.');
  } catch (e) {
    console.log('Error deleting dummy accounts:', e.message);
  }

  // 2. Query all users
  const users = await prisma.user.findMany({
    include: {
      role: true,
      department: true,
      interfaces: true,
    }
  });

  console.log('\n--- EXISTING USERS IN THE SYSTEM ---');
  for (const u of users) {
    console.log(`- ${u.fullName} (${u.email})`);
    console.log(`  Role: ${u.role?.name}`);
    console.log(`  Department: ${u.department?.name || 'None'}`);
    console.log(`  Interfaces: ${u.interfaces.map(i => i.interfaceType).join(', ') || 'None'}`);
    console.log(`  ---`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
