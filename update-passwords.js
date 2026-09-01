const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { role: true } });
  
  for (const user of users) {
    let newPasswordStr = 'LITC@123';
    let newUsername = user.username;
    const lowerUsername = user.username.toLowerCase();
    
    // Check specific users
    if (lowerUsername === 'majdi' || 
        lowerUsername === 'superadmin' || 
        lowerUsername === 'qais' || 
        lowerUsername === 'aws' ||
        lowerUsername === 'qais.admin' ||
        lowerUsername === 'aws.admin' ||
        lowerUsername.includes('admin')) {
      
      newPasswordStr = '11224433';
    }

    if (lowerUsername === 'qais.admin') newUsername = 'qais';
    if (lowerUsername === 'aws.admin') newUsername = 'aws';

    const hashedPassword = await argon2.hash(newPasswordStr);
    
    const updateData = {
      password: hashedPassword,
      username: newUsername
    };

    if (lowerUsername === 'qais.admin' || lowerUsername === 'aws.admin' || lowerUsername === 'qais' || lowerUsername === 'aws') {
       updateData.role = {
           connect: { name: 'EMPLOYEE' } // Assuming role name is EMPLOYEE
       };
    }

    try {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
        console.log(`Updated user ${user.username} -> ${newUsername} with password ${newPasswordStr}`);
    } catch (e) {
        console.error(`Failed to update user ${user.username}`, e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
