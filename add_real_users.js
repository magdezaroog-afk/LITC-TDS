const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  
  const emails = [
    'Ahmed.Alnakoua@litc.ly',
    'mahmoud.alahammali@litc.ly',
    'mohamed.alosta@litc.ly',
    'nidhal.abughamja@litc.ly',
    'nasruldeen.ramadhan@litc.ly',
    'anas.abuzayyan@litc.ly',
    'Ahmed.almajdi@litc.ly',
    'abdalrahman.ragi@litc.ly',
    'abdelmalk.albi@litc.ly',
    'abdulhamid.taajaldeen@litc.ly',
    'abdulsalam.mohammed@litc.ly',
    'abdulwahab.zarrugh@litc.ly',
    'ahmed.alfourti@litc.ly',
    'ali.dhalaa@litc.ly',
    'majdi.alzarrouk@litc.ly',
    'admin@litc.ly'
  ];
  
  for (const email of emails) {
    if (email === 'admin@litc.ly') continue;
    
    const username = email.split('@')[0];
    const u = {
      username: username,
      email: email,
      fullName: username,
      roleId: 2,
      isActive: true,
      isDeleted: false
    };
    
    // Find by email OR username and delete them to reset
    await prisma.user.deleteMany({
      where: { OR: [{ email: email }, { username: username }] }
    });
    
    await prisma.user.create({ data: u });
  }
  
  console.log('Real users added successfully.');
}
main().finally(() => prisma.$disconnect());
