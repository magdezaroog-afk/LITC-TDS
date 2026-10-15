const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting users...');

  // Reset admin (ID: 20)
  await prisma.user.update({
    where: { id: 20 },
    data: {
      role: { connect: { id: 22 } }, // SYSTEM_ADMIN
      department: { disconnect: true },
      // division and team might not exist as direct relations on User, let me check the error message.
      // The error message from before said: `department?: DepartmentUpdateOneWithoutUsersNestedInput`, `teams?: UserTeamUpdateManyWithoutUserNestedInput`
    }
  });
  console.log('Admin user (id: 20) reset to SYSTEM_ADMIN.');

  // Reset all other users to END_USER (ID: 27)
  const usersToUpdate = await prisma.user.findMany({ where: { id: { not: 20 } } });
  
  let count = 0;
  for (const u of usersToUpdate) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        role: { connect: { id: 27 } }, // END_USER
        department: { disconnect: true },
        // teams is a many-to-many through UserTeam, let's clear it
        teams: { deleteMany: {} }
      }
    });
    count++;
  }

  console.log(`Reset ${count} other users to END_USER and removed from any structures.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
