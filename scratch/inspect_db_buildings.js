const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const refs = await prisma.systemReference.findMany({
    where: { type: { in: ['BUILDING', 'LOCATION'] } }
  });
  console.log('--- SYSTEM REFERENCE BUILDINGS & LOCATIONS ---');
  console.log(JSON.stringify(refs, null, 2));

  const settings = await prisma.systemSetting.findMany({
    where: { settingKey: { in: ['LITC_BUILDINGS_LIST', 'LITC_ORG_TREE_SNAPSHOT'] } },
    select: { settingKey: true, settingValue: true }
  });
  console.log('--- SYSTEM SETTINGS ---');
  settings.forEach(s => {
    console.log(`SettingKey: ${s.settingKey}`);
    if (s.settingKey === 'LITC_BUILDINGS_LIST') {
      console.log('Value:', s.settingValue);
    } else if (s.settingKey === 'LITC_ORG_TREE_SNAPSHOT') {
      try {
        const parsed = JSON.parse(s.settingValue);
        console.log('Org Tree Snapshot sample root count:', Array.isArray(parsed) ? parsed.length : Object.keys(parsed));
        if (Array.isArray(parsed)) {
          console.log('Root nodes:', parsed.map(n => ({ id: n.id, name: n.name, type: n.type })));
        }
      } catch (e) {
        console.log('Error parsing org tree:', e.message);
      }
    }
  });

  // Check tickets creator buildingId or metadata
  const sampleTickets = await prisma.ticket.findMany({
    take: 10,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      ticketNumber: true,
      departmentId: true,
      creator: { select: { id: true, fullName: true, department: true, buildingId: true } },
      routingMetadata: true
    }
  });
  console.log('--- SAMPLE TICKETS ---');
  console.log(JSON.stringify(sampleTickets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
