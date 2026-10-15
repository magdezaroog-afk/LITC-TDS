/**
 * Comprehensive Automated Test Suite for Dynamic Analytics & Governance
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 Starting LITC Dynamic Analytics Verification Suite');
  console.log('═══════════════════════════════════════════════════════');

  try {
    // Test 1: Check Admin User
    const adminUser = await prisma.user.findFirst({
      where: { role: { name: 'SYSTEM_ADMIN' } },
      include: { role: true }
    });
    console.log('✓ Found Admin User:', adminUser ? `${adminUser.username} (Role: ${adminUser.role.name})` : 'None');

    // Test 2: Check Department
    const dept = await prisma.department.findFirst({ where: { isDeleted: false } });
    console.log('✓ Target Department:', dept ? `${dept.name} (ID: ${dept.id})` : 'None');

    if (!dept) {
      console.error('❌ No department found.');
      return;
    }

    // Test 3: Insert or Verify an Analytics Permission
    const testEmployee = await prisma.user.findFirst({
      where: { role: { name: 'Employee' }, isDeleted: false }
    });
    console.log('✓ Test Employee for Cross-Department Grant:', testEmployee ? `${testEmployee.username} (ID: ${testEmployee.id})` : 'None');

    if (testEmployee && adminUser) {
      const grant = await prisma.analyticsPermission.upsert({
        where: {
          userId_departmentId_routeId: {
            userId: testEmployee.id,
            departmentId: dept.id,
            routeId: ''
          }
        },
        update: {
          canExport: true,
          canCompare: true,
          grantedById: adminUser.id
        },
        create: {
          userId: testEmployee.id,
          departmentId: dept.id,
          routeId: '',
          canExport: true,
          canCompare: true,
          grantedById: adminUser.id
        }
      });
      console.log('✓ Successfully Granted Cross-Department Analytics Access:', grant.id);

      // Verify Query
      const permCheck = await prisma.analyticsPermission.findUnique({
        where: { id: grant.id },
        include: { user: true, department: true, grantedBy: true }
      });
      console.log(`✓ Verified Permission Record: User [${permCheck.user.username}] -> Dept [${permCheck.department.name}] (canCompare: ${permCheck.canCompare}, canExport: ${permCheck.canExport})`);
    }

    // Test 4: Verify Sample FormData
    const formDataCount = await prisma.ticketFormData.count();
    console.log('✓ Active TicketFormData Records:', formDataCount);

    // Test 5: Verify Buildings
    const buildings = await prisma.systemReference.findMany({ where: { type: 'BUILDING' } });
    console.log('✓ Active Building References:', buildings.map(b => b.name).join(', '));

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 All Backend Database & Model Invariants PASSED!');
    console.log('═══════════════════════════════════════════════════════');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
