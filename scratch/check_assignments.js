const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const assignments = await prisma.userInterfaceAssignment.findMany({ where: { userId: 1059 } });
  console.log('Assignments for user 1059:', assignments);

  const allAssignments = await prisma.userInterfaceAssignment.findMany();
  console.log('Total assignments in system:', allAssignments.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
