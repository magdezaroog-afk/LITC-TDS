const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
  if (!s) {
    console.log('No routes found');
    return;
  }
  const routes = JSON.parse(s.settingValue);
  let updated = 0;
  routes.forEach(r => {
    if (r.name.includes('دعم فني') || r.id.includes('it')) {
      r.formConfig = {
        ...r.formConfig,
        showScheduleEngine: true,
        mandatorySchedule: false,
        scheduleLabel: 'الجدولة الزمنية / فترة الدعم والطلب',
        scheduleMode: 'ANY',
        showDelegateUser: true,
        mandatoryDelegateUser: false,
        delegateUserLabel: 'الموظف البديل / تسليم المهام'
      };
      updated++;
    }
  });
  await prisma.systemSetting.update({
    where: { settingKey: 'litc_ticket_routes' },
    data: { settingValue: JSON.stringify(routes) }
  });
  console.log(`Updated ${updated} routes in DB with active schedule engine and delegate user!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
