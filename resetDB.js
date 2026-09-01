const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function resetDB() {
  try {
    const passwordHash = await argon2.hash('1213456789');

    // Get all users
    const users = await prisma.user.findMany();

    for (const u of users) {
      if (u.fullName === 'System Administrator' || u.fullName === 'System Director') {
        // Update password and keep them as admin
        await prisma.user.update({
          where: { id: u.id },
          data: { password: passwordHash, roleId: 22 }
        });
        console.log('Updated Admin:', u.fullName);
      } else {
        // Reset role to 2 (Employee), remove department, update password
        await prisma.user.update({
          where: { id: u.id },
          data: {
            roleId: 2,
            departmentId: null,
            password: passwordHash
          }
        });
        console.log('Reset User:', u.fullName);
      }
    }
    
    // Clear userTeam relationships for non-admins
    const nonAdminIds = users
      .filter(u => u.fullName !== 'System Administrator' && u.fullName !== 'System Director')
      .map(u => u.id);
      
    if (nonAdminIds.length > 0) {
      const delResult = await prisma.userTeam.deleteMany({
        where: { userId: { in: nonAdminIds } }
      });
      console.log('Cleared userTeam links:', delResult.count);
    }

    console.log('Database reset complete.');
  } catch (err) {
    console.error('Error resetting DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetDB();
