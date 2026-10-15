const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deptId = 9;
  console.log('Testing delete department id:', deptId);
  try {
    // 1. Soft-delete department in SQL
    const res = await prisma.department.update({
      where: { id: deptId },
      data: { isDeleted: true }
    });
    console.log('Soft deleted successfully:', res);
  } catch (err) {
    console.error('Error soft-deleting department:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
