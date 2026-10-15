import { prisma } from '../src/db/client';

async function check() {
  const u1059 = await prisma.user.findUnique({
    where: { id: 1059 },
    select: { id: true, username: true, fullName: true, departmentId: true, roleId: true, role: true }
  });
  console.log('User 1059 (Majdi):', JSON.stringify(u1059));

  const perms = await prisma.flowUserPermission.findMany({
    where: { flowId: 'route_it_1788081440290' }
  });
  console.log('Flow permissions:', JSON.stringify(perms));

  const depts = await prisma.department.findMany({
    select: { id: true, name: true }
  });
  console.log('SQL Depts count:', depts.length);

  const opJson = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
  });
  if (opJson?.settingValue) {
    const parsed = JSON.parse(opJson.settingValue);
    console.log('Operational Depts count:', parsed.length);
    console.log('Structure:');
    for (const d of parsed) {
      console.log(`- Dept: [${d.id}] "${d.name}"`);
      if (d.divisions && d.divisions.length > 0) {
        for (const div of d.divisions) {
          console.log(`    * Division: [${div.id}] "${div.name}" (Teams: ${div.teams?.length || 0})`);
        }
      }
    }
  }

  // Check current flow definitions and priorityConfigJson
  const flows = await prisma.flowDefinition.findMany({
    select: { id: true, name: true, managerId: true, priorityConfigJson: true }
  });
  console.log('Flows:');
  for (const f of flows) {
    console.log(`- Flow: [${f.id}] "${f.name}", managerId: ${f.managerId}`);
    if (f.priorityConfigJson) {
      console.log(`    priorityConfig: ${f.priorityConfigJson}`);
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
