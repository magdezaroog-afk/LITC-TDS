import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial IT_Admin user...');

  // 1. Create or find IT_Admin Role
  let role = await prisma.role.findFirst({
    where: { name: 'IT_Admin' }
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'IT_Admin'
      }
    });
    console.log(`Created Role IT_Admin with ID: ${role.id}`);
  } else {
    console.log(`Found Role IT_Admin with ID: ${role.id}`);
  }

  // 2. Create the Admin User
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@litc.ly' }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@litc.ly',
        fullName: 'System Administrator',
        password: 'admin', // in a real system this would be hashed
        isActive: true,
        roleId: role.id
      }
    });
    console.log(`Created Admin User: ${admin.email} (ID: ${admin.id})`);
  } else {
    // Ensure the role is correct
    if (admin.roleId !== role.id) {
      admin = await prisma.user.update({
        where: { email: 'admin@litc.ly' },
        data: { roleId: role.id }
      });
      console.log(`Updated Admin User role to IT_Admin`);
    } else {
      console.log(`Admin User already exists and has correct role.`);
    }
  }

  console.log('Seed completed successfully. The security lock is broken!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
