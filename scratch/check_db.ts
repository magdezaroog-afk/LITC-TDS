import { prisma } from '../src/db/client';

async function check() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  console.log('Users in DB:', users.map(u => ({ id: u.id, username: u.username, roleId: u.roleId, roleName: u.role?.name })));

  const roles = await prisma.role.findMany();
  console.log('Roles in DB:', roles);
}

check().catch(console.error);
