const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adminEmail = 'admin@litc.ly';
  
  // Find standard role (END_USER or Employee)
  let standardRole = await prisma.role.findFirst({ where: { name: 'Employee' } });
  if (!standardRole) {
    standardRole = await prisma.role.findFirst({ where: { name: 'END_USER' } });
  }

  const adminRole = await prisma.role.findFirst({ where: { name: 'System_Admin' } });

  console.log(`Resetting everyone except admin to role: ${standardRole.name} (${standardRole.id})`);

  // Reset all users (except admin)
  await prisma.user.updateMany({
    where: { email: { not: adminEmail } },
    data: { roleId: standardRole.id, departmentId: null }
  });

  // Ensure admin is System_Admin and not in department pool
  await prisma.user.updateMany({
    where: { email: adminEmail },
    data: { roleId: adminRole.id }
  });

  console.log('Database reset complete.');
}
run();
