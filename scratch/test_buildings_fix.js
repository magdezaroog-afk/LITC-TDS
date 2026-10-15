const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSaveBuildings(buildingsInput) {
  return await prisma.$transaction(async (tx) => {
    const activeIds = [];
    const activeGlobalIds = [];

    for (let idx = 0; idx < buildingsInput.length; idx++) {
      const b = buildingsInput[idx];
      const type = (b.type === 'LOCATION' || b.type === 'BUILDING') ? b.type : 'BUILDING';
      const name = String(b.name || '').trim();
      if (!name) continue;

      let existingRecord = null;

      // 1. Try to find by integer ID if provided
      const numericId = typeof b.id === 'number' ? b.id : (typeof b.id === 'string' && /^\d+$/.test(b.id) ? parseInt(b.id, 10) : null);
      if (numericId) {
        existingRecord = await tx.systemReference.findUnique({ where: { id: numericId } });
      }

      // 2. Try to find by globalId if not found yet
      if (!existingRecord && b.globalId && typeof b.globalId === 'string') {
        existingRecord = await tx.systemReference.findUnique({ where: { globalId: b.globalId } });
      }

      if (existingRecord) {
        const updated = await tx.systemReference.update({
          where: { id: existingRecord.id },
          data: { name, type, isActive: true }
        });
        activeIds.push(updated.id);
        activeGlobalIds.push(updated.globalId);
      } else {
        const newGlobalId = (typeof b.globalId === 'string' && b.globalId.trim()) 
          ? b.globalId.trim() 
          : (typeof b.id === 'string' && b.id.startsWith('b_') ? b.id : `b_${Date.now()}_${idx}`);
        
        const created = await tx.systemReference.create({
          data: {
            globalId: newGlobalId,
            name,
            type,
            isActive: true
          }
        });
        activeIds.push(created.id);
        activeGlobalIds.push(created.globalId);
      }
    }

    // Soft delete any buildings/locations NOT in active list
    await tx.systemReference.updateMany({
      where: {
        type: { in: ['BUILDING', 'LOCATION'] },
        id: { notIn: activeIds }
      },
      data: { isActive: false }
    });

    const currentActive = await tx.systemReference.findMany({
      where: { type: { in: ['BUILDING', 'LOCATION'] }, isActive: true },
      select: { id: true, globalId: true, name: true, type: true, parentId: true },
      orderBy: { id: 'asc' }
    });

    return currentActive;
  });
}

async function run() {
  console.log('--- Initial Buildings ---');
  const initial = await prisma.systemReference.findMany({
    where: { type: { in: ['BUILDING', 'LOCATION'] }, isActive: true }
  });
  console.log(initial);

  console.log('\n--- Test 1: Renaming existing and adding new ---');
  const payload = [
    { id: initial[0].id, globalId: initial[0].globalId, name: 'المقر الرئيسي المحدث', type: 'BUILDING' },
    { globalId: `b_test_${Date.now()}`, name: 'فرع سبها الجديد', type: 'BUILDING' }
  ];
  const afterUpdate = await testSaveBuildings(payload);
  console.log('Result after update (renamed 1, deleted others, added 1):', afterUpdate);

  console.log('\n--- Restoring initial test state ---');
  await prisma.systemReference.updateMany({
    where: { globalId: { in: ['b_demo_1', 'l_demo_2', 'b_demo_3'] } },
    data: { isActive: true }
  });
  await prisma.systemReference.update({
    where: { globalId: 'b_demo_1' },
    data: { name: 'المبنى الرئيسي ببنغازي' }
  });
  await prisma.systemReference.deleteMany({
    where: { globalId: { startsWith: 'b_test_' } }
  });
  console.log('Cleanup complete!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
