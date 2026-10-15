const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  
  const roles = await prisma.role.findMany();
  console.log('Roles:', roles.map(r => ({ id: r.id, name: r.name })));
  
  const assignedCount = users.filter(u => u.departmentId !== null).length;
  console.log('Users with departmentId:', assignedCount);
  
  const systemAdmins = users.filter(u => u.roleId === 22);
  console.log('System Admins:', systemAdmins.map(u => ({ id: u.id, email: u.email })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
