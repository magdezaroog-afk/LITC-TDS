const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const flowDefs = await prisma.flowDefinition.findMany({
    include: { userPermissions: true }
  });
  console.log('Flow Definitions count:', flowDefs.length);
  for (const f of flowDefs) {
    console.log(`- ID: ${f.id}, Name: ${f.name}, ManagerId: ${f.managerId}, priorityConfigJson: ${f.priorityConfigJson}`);
    console.log(`  Permissions count: ${f.userPermissions.length}`);
    for (const p of f.userPermissions) {
      console.log(`    User ${p.userId}: canPull=${p.canPull}, canResolve=${p.canResolve}, canTransferInternal=${p.canTransferInternal}`);
    }
  }

  const routesSetting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'litc_ticket_routes' }
  });
  if (routesSetting?.settingValue) {
    const routes = JSON.parse(routesSetting.settingValue);
    console.log('Routes in litc_ticket_routes:', routes.map(r => ({ id: r.id, name: r.name, managerId: r.managerId, managerName: r.managerName })));
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
