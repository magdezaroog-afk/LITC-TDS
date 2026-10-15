const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const buildings = await prisma.systemReference.findMany({
    where: { type: { in: ['BUILDING', 'LOCATION'] }, isActive: true }
  });
  console.log('Current DB buildings:', buildings);

  // Simulate what saveBuildings did when receiving data from frontend
  const b = buildings[0];
  console.log('Testing with b:', b);
  try {
    const targetGlobalId = b.id || b.globalId;
    console.log('targetGlobalId evaluates to:', targetGlobalId, typeof targetGlobalId);
    await prisma.systemReference.upsert({
      where: { globalId: targetGlobalId },
      create: { globalId: String(targetGlobalId), name: b.name, type: 'BUILDING', isActive: true },
      update: { name: b.name, type: 'BUILDING', isActive: true }
    });
    console.log('Success!');
  } catch (err) {
    console.error('CRASHED! Reason:', err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
