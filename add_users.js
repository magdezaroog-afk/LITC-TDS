const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  const users = [
    { username: 'mohamed', email: 'mohamed@litc.ly', fullName: 'محمد أحمد', roleId: 2, isActive: true, isDeleted: false },
    { username: 'ali', email: 'ali@litc.ly', fullName: 'علي محمود', roleId: 2, isActive: true, isDeleted: false },
    { username: 'fatima', email: 'fatima@litc.ly', fullName: 'فاطمة سالم', roleId: 2, isActive: true, isDeleted: false },
    { username: 'khaled', email: 'khaled@litc.ly', fullName: 'خالد عبد الله', roleId: 2, isActive: true, isDeleted: false },
    { username: 'sarah', email: 'sarah@litc.ly', fullName: 'سارة حسن', roleId: 2, isActive: true, isDeleted: false }
  ];
  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { username: u.username } });
    if (!exists) {
      await prisma.user.create({ data: u });
    } else {
      await prisma.user.update({ where: { username: u.username }, data: u });
    }
  }
  console.log('Dummy users added successfully.');
}
main().finally(() => prisma.$disconnect());
