const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
  console.log('Exists in DB:', !!s);
  if (s && s.settingValue) {
    console.log('Raw length:', s.settingValue.length);
    const routes = JSON.parse(s.settingValue);
    console.log('Routes count:', routes.length);
    routes.forEach((r, idx) => {
      console.log(`\nRoute #${idx + 1}: id=${r.id}, name=${r.name}`);
      console.log('  formConfig:', JSON.stringify(r.formConfig));
    });
  } else {
    console.log('No routes in DB.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
