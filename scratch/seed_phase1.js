const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function seed() {
  console.log('=== Phase 1: Seeding Roles & DB Structure ===\n');

  // 1. Add missing operational roles (without explicit IDs - SQL Server auto-assigns)
  const neededRoles = ['SYSTEM_ADMIN', 'OPERATIONAL_MANAGER', 'SECTION_HEAD', 'TEAM_LEADER', 'OPERATIONAL_USER', 'END_USER'];
  const existingRoles = await prisma.role.findMany();
  const existingNames = existingRoles.map(r => r.name);
  
  for (const roleName of neededRoles) {
    if (!existingNames.includes(roleName)) {
      await prisma.role.create({ data: { name: roleName } });
      console.log(`  + Created role: ${roleName}`);
    }
  }
  
  // Reload roles to get their auto-assigned IDs
  const allRoles = await prisma.role.findMany();
  const roleMap = {};
  for (const r of allRoles) roleMap[r.name] = r.id;
  console.log('✅ Roles ready:', JSON.stringify(roleMap));

  // 2. Ensure we have the IT Department with proper divisions
  const itDept = await prisma.department.upsert({
    where: { id: 1 },
    create: { id: 1, name: 'إدارة تقنية المعلومات', routingStrategy: 'POOL' },
    update: { name: 'إدارة تقنية المعلومات', routingStrategy: 'POOL' }
  });
  console.log('✅ IT Department ensured, id:', itDept.id);

  // 3. Create divisions (sections) under IT dept
  // Note: Division model = Team in our schema (we use teams as sections too)
  // Actually checking the schema we have Department > Team > UserTeam
  // Let's check what division model we have

  // 4. Fix user roles - assign proper operational roles
  // Fix user roles using dynamic roleMap
  const userRoleUpdates = [
    { id: 3, roleName: 'OPERATIONAL_MANAGER', jobTitle: 'مدير إدارة تقنية المعلومات' },
    { id: 4, roleName: 'SECTION_HEAD', jobTitle: 'رئيس قسم الدعم الفني' },
    { id: 5, roleName: 'TEAM_LEADER', jobTitle: 'قائد فريق الدعم الميداني' },
    { id: 6, roleName: 'OPERATIONAL_USER', jobTitle: 'موظف دعم فني' },
    { id: 7, roleName: 'OPERATIONAL_USER', jobTitle: 'موظف دعم فني' },
    { id: 8, roleName: 'TEAM_LEADER', jobTitle: 'قائد فريق التقييم' },
    { id: 9, roleName: 'OPERATIONAL_USER', jobTitle: 'موظف دعم فني' },
    { id: 10, roleName: 'SECTION_HEAD', jobTitle: 'رئيس قسم الشبكات' },
    { id: 11, roleName: 'TEAM_LEADER', jobTitle: 'قائد فريق الشركات الخارجية' },
    { id: 12, roleName: 'OPERATIONAL_USER', jobTitle: 'موظف دعم فني' },
  ];

  for (const update of userRoleUpdates) {
    const roleId = roleMap[update.roleName];
    if (!roleId) { console.warn(`  ⚠️ Role not found: ${update.roleName}`); continue; }
    await prisma.user.update({
      where: { id: update.id },
      data: { roleId, departmentId: 1, jobTitle: update.jobTitle }
    });
  }
  console.log('✅ User roles updated to operational roles');

  // Create teams without explicit IDs (let DB auto-assign)
  const teamNames = [
    { name: 'قسم الشبكات', departmentId: 1 },
    { name: 'قسم الدعم الفني', departmentId: 1 },
    { name: 'فريق الدعم الميداني', departmentId: 1 },
    { name: 'فريق التقييم الفني', departmentId: 1 },
    { name: 'فريق الشركات الخارجية', departmentId: 1 },
  ];

  // Only create if not already existing
  const existingTeams = await prisma.team.findMany({ where: { isDeleted: false } });
  const existingTeamNames = existingTeams.map(t => t.name);
  
  for (const team of teamNames) {
    if (!existingTeamNames.includes(team.name)) {
      await prisma.team.create({ data: { name: team.name, departmentId: team.departmentId } });
    }
  }
  
  // Reload to get actual IDs
  const allTeams = await prisma.team.findMany({ where: { isDeleted: false, departmentId: 1 } });
  const teamMap = {};
  for (const t of allTeams) teamMap[t.name] = t.id;
  console.log('✅ Teams ready:', JSON.stringify(teamMap));

  // Assign users to teams using dynamic teamMap
  const userTeamAssignments = [
    { userId: 4, teamName: 'قسم الدعم الفني' },
    { userId: 5, teamName: 'فريق الدعم الميداني' },
    { userId: 6, teamName: 'فريق الدعم الميداني' },
    { userId: 7, teamName: 'فريق الدعم الميداني' },
    { userId: 8, teamName: 'فريق التقييم الفني' },
    { userId: 9, teamName: 'قسم الشبكات' },
    { userId: 10, teamName: 'قسم الشبكات' },
    { userId: 11, teamName: 'فريق الشركات الخارجية' },
    { userId: 12, teamName: 'فريق الشركات الخارجية' },
  ];

  for (const assignment of userTeamAssignments) {
    const teamId = teamMap[assignment.teamName];
    if (!teamId) { console.warn(`  ⚠️ Team not found: ${assignment.teamName}`); continue; }
    try {
      await prisma.userTeam.upsert({
        where: { userId_teamId: { userId: assignment.userId, teamId } },
        create: { userId: assignment.userId, teamId },
        update: {}
      });
    } catch(e) { console.warn(`  ⚠️ UserTeam upsert failed for user ${assignment.userId}:`, e.message); }
  }
  console.log('✅ Users assigned to teams');

  // 7. Set passwords for existing users
  const hashedPassword = await argon2.hash('Admin@2026');
  
  // Check if admin user exists, update if yes, create without explicit ID if no
  const existingAdmin = await prisma.user.findFirst({ where: { email: 'admin@litc.ly' } });
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { password: hashedPassword, fullName: 'System Administrator', roleId: roleMap['IT_Admin'] || 1 }
    });
  } else {
    await prisma.user.create({
      data: {
        email: 'admin@litc.ly',
        username: 'admin',
        fullName: 'System Administrator',
        password: hashedPassword,
        roleId: roleMap['IT_Admin'] || 1,
        preferredLang: 'ar',
        ssoRole: 'IT_ADMIN',
        isActive: true
      }
    });
  }

  // Set password for all operational users (id 3-12)
  for (let userId = 3; userId <= 12; userId++) {
    try {
      await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    } catch(e) {}
  }
  console.log('✅ Admin user & passwords set (password: Admin@2026)');

  // 8. Save org tree snapshot using actual DB team IDs
  const orgTreeSnapshot = {
    id: 'root',
    name: 'مؤسسة LITC',
    type: 'ROOT',
    children: [
      {
        id: 'node_top_mgmt',
        name: 'الإدارة العليا',
        type: 'TOP_MANAGEMENT',
        children: [
          {
            id: 'node_it_dept',
            name: 'إدارة تقنية المعلومات',
            type: 'DEPARTMENT',
            dbId: 1,
            children: [
              { id: 'node_net_sec', name: 'قسم الشبكات', type: 'DIVISION', dbTeamId: teamMap['قسم الشبكات'], children: [] },
              { id: 'node_support_sec', name: 'قسم الدعم الفني', type: 'DIVISION', dbTeamId: teamMap['قسم الدعم الفني'], children: [
                { id: 'node_field_team', name: 'فريق الدعم الميداني', type: 'TEAM', dbTeamId: teamMap['فريق الدعم الميداني'], children: [] },
                { id: 'node_eval_team', name: 'فريق التقييم الفني', type: 'TEAM', dbTeamId: teamMap['فريق التقييم الفني'], children: [] },
                { id: 'node_ext_team', name: 'فريق الشركات الخارجية', type: 'TEAM', dbTeamId: teamMap['فريق الشركات الخارجية'], children: [] },
              ]},
            ]
          }
        ]
      }
    ]
  };

  await prisma.systemSetting.upsert({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' },
    create: {
      settingKey: 'LITC_ORG_TREE_SNAPSHOT',
      settingValue: JSON.stringify(orgTreeSnapshot),
      description: 'Global Organizational Tree Visual Layout'
    },
    update: { settingValue: JSON.stringify(orgTreeSnapshot) }
  });
  console.log('✅ Org tree snapshot saved to DB');

  // 9. Verify final state
  console.log('\n=== Verification ===');
  const allUsers = await prisma.user.findMany({
    include: { role: true, department: true, teams: { include: { team: true } } },
    orderBy: { id: 'asc' }
  });
  
  for (const u of allUsers) {
    const teamNames = u.teams.map(ut => ut.team.name).join(', ') || 'No team';
    console.log(`  [${u.id}] ${u.fullName} | Role: ${u.role?.name} | Dept: ${u.department?.name || 'None'} | Teams: ${teamNames}`);
  }

  console.log('\n✅ Phase 1 Complete! DB is now seeded with proper operational structure.');
}

seed().catch(e => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
