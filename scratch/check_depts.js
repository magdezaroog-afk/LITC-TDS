const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const depts = await prisma.department.findMany({ where: { isDeleted: false } });
  console.log("ACTIVE OPERATIONAL DEPARTMENTS:");
  console.dir(depts, { depth: null });
}
main().then(() => process.exit(0));
