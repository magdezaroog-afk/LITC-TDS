const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  const user = await prisma.user.findFirst({ where: { username: 'Ahmed.Alnakoua' } });
  if (!user) return console.log('User not found');
  console.log('User:', user.id, user.departmentId);
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        department: { disconnect: true },
        role: { connect: { id: 26 } }
      }
    });
    console.log('Success');
  } catch (e) {
    console.error('Error:', e.message);
  }
}
main().finally(() => prisma.$disconnect());
