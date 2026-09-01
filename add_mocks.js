const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const data = [
    { globalId: 'b_demo_1', name: 'المبنى الرئيسي ببنغازي', type: 'BUILDING' },
    { globalId: 'l_demo_2', name: 'محطة التحلية طرابلس', type: 'LOCATION' },
    { globalId: 'b_demo_3', name: 'مكتب مصراتة', type: 'BUILDING' }
  ];
  
  // Clear first if needed
  await prisma.systemReference.deleteMany({
    where: { type: { in: ['BUILDING', 'LOCATION'] } }
  });

  await prisma.systemReference.createMany({
    data: data.map(d => ({
      globalId: d.globalId,
      type: d.type,
      name: d.name,
      isActive: true
    }))
  });
  console.log('Mocks added to DB');
}
run().catch(console.error).finally(() => prisma.$disconnect());
