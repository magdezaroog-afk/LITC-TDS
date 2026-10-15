const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const s = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
  const routes = JSON.parse(s.settingValue || '[]');
  console.log('=== Routes in SystemSetting ===');
  routes.forEach(r => {
    console.log(`Route [${r.id}] "${r.name}": managerId=${r.managerId}, managerName="${r.managerName}", dept=${r.targetDepartmentId}, team=${r.targetTeamId}`);
  });

  const fds = await prisma.flowDefinition.findMany({ include: { manager: true } });
  console.log('=== FlowDefinitions in DB ===');
  fds.forEach(f => {
    console.log(`Flow [${f.id}] "${f.name}": managerId=${f.managerId}, manager=${f.manager?.fullName}`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
