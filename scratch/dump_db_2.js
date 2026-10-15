const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const buildings = await prisma.systemReference.findMany({
    where: { type: { in: ['BUILDING', 'LOCATION'] } }
  });
  console.log("ALL BUILDINGS IN DB:");
  console.log(buildings);
}
main().then(() => process.exit(0));
