import { prisma } from './src/db/client';
import { TicketStateService } from './src/services/TicketStateService';
import { 
  UnauthorizedTransitionError, 
  ConcurrencyConflictError 
} from './src/errors/customErrors';

async function main() {
  console.log('=== STARTING TICKET STATE TRANSITION TEST WORKFLOW ===\n');
  const service = new TicketStateService();

  // 0. تنظيف مسبق للبيانات القديمة إن وجدت لضمان قابلية إعادة التشغيل
  console.log('Step 0: Cleaning up potential stale test data from previous runs...');
  try {
    await prisma.ticketLog.deleteMany({ where: { action: { contains: 'state_id=' } } });
    await prisma.auditLog.deleteMany({ where: { action: 'STATE_TRANSITION', userAgent: 'TicketStateService' } });
    await prisma.ticket.deleteMany({ where: { title: 'Database connection delay' } });
    await prisma.user.deleteMany({ where: { username: { in: ['eng_john', 'user_jane'] } } });
    await prisma.location.deleteMany({ where: { building: 'LITC HQ' } });
    await prisma.issueCategory.deleteMany({ where: { name: 'Software Problems' } });
    await prisma.ticketStateTransition.deleteMany({
      where: {
        triggerEndpoint: 'http://example.com/api/webhooks/status-update'
      }
    });
    await prisma.ticketState.deleteMany({ where: { name: { in: ['TEST_OPEN', 'TEST_IN_PROGRESS'] } } });
    await prisma.role.deleteMany({ where: { name: { in: ['Test_Engineer', 'Test_User'] } } });
    console.log('Pre-cleanup completed.');
  } catch (e) {
    console.log('No stale data found to clean or error ignored:', e);
  }

  // 1. تهيئة البيانات التجريبية (Setup Test Data)
  console.log('Step 1: Setting up mock data...');

  const roleEng = await prisma.role.create({
    data: { name: 'Test_Engineer', defaultCanViewInternal: true }
  });

  const roleUser = await prisma.role.create({
    data: { name: 'Test_User', defaultCanViewInternal: false }
  });

  const stateOpen = await prisma.ticketState.create({
    data: { name: 'TEST_OPEN', label: 'Open' }
  });

  const stateInProgress = await prisma.ticketState.create({
    data: { name: 'TEST_IN_PROGRESS', label: 'In Progress' }
  });

  const transition = await prisma.ticketStateTransition.create({
    data: {
      fromStateId: stateOpen.id,
      toStateId: stateInProgress.id,
      roleId: roleEng.id,
      triggerEndpoint: 'http://example.com/api/webhooks/status-update'
    }
  });

  const transitionBack = await prisma.ticketStateTransition.create({
    data: {
      fromStateId: stateInProgress.id,
      toStateId: stateOpen.id,
      roleId: roleEng.id
    }
  });

  const loc = await prisma.location.create({
    data: { building: 'LITC HQ', floor: '3rd', office: '304' }
  });

  const cat = await prisma.issueCategory.create({
    data: { name: 'Software Problems' }
  });

  const userEng = await prisma.user.create({
    data: {
      username: 'eng_john',
      email: 'john@litc-ts.com',
      fullName: 'Engineer John',
      roleId: roleEng.id,
      defaultLocationId: loc.id,
      resetToken: 'token_eng_john',
      updatedAt: new Date()
    }
  });

  const userNormal = await prisma.user.create({
    data: {
      username: 'user_jane',
      email: 'jane@litc-ts.com',
      fullName: 'User Jane',
      roleId: roleUser.id,
      defaultLocationId: loc.id,
      resetToken: 'token_user_jane',
      updatedAt: new Date()
    }
  });

  const ticket = await prisma.ticket.create({
    data: {
      title: 'Database connection delay',
      description: 'Slow queries on production DB',
      stateId: stateOpen.id,
      categoryId: cat.id,
      locationId: loc.id,
      version: 0,
      updatedAt: new Date()
    }
  });

  console.log(`Mock data created successfully. Ticket ID: ${ticket.id}, Current State ID: ${ticket.stateId}, Version: ${ticket.version}\n`);

  try {
    // 2. اختبار الانتقالات المتاحة للمهندس (Test Available Transitions for Engineer)
    console.log('Test 2: Checking available transitions for Engineer...');
    const engTransitions = await service.getAvailableTransitions(ticket.id, userEng.id);
    console.log(`Found ${engTransitions.length} transition(s) for Engineer John.`);
    if (engTransitions.length === 1 && engTransitions[0].toStateId === stateInProgress.id) {
      console.log('✓ SUCCESS: Engineer is allowed to transition from OPEN to IN_PROGRESS.');
    } else {
      throw new Error('✗ FAILED: Expected 1 transition to TEST_IN_PROGRESS.');
    }

    // 3. اختبار الانتقالات المتاحة للمستخدم العادي (Test Available Transitions for Normal User)
    console.log('\nTest 3: Checking available transitions for Normal User...');
    const userTransitions = await service.getAvailableTransitions(ticket.id, userNormal.id);
    console.log(`Found ${userTransitions.length} transition(s) for User Jane.`);
    if (userTransitions.length === 0) {
      console.log('✓ SUCCESS: Normal User is not allowed to transition.');
    } else {
      throw new Error('✗ FAILED: User Jane should not have transitions.');
    }

    // 4. اختبار محاولة انتقال غير مصرح بها للمستخدم العادي (Test Unauthorized Transition Execution)
    console.log('\nTest 4: Attempting unauthorized transition by Normal User...');
    try {
      await service.executeTransition(ticket.id, userNormal.id, stateInProgress.id, 0);
      throw new Error('✗ FAILED: Expected UnauthorizedTransitionError to be thrown.');
    } catch (err: any) {
      if (err instanceof UnauthorizedTransitionError) {
        console.log(`✓ SUCCESS: Blocked unauthorized transition as expected. Error message: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 5. اختبار الانتقال الناجح للمهندس (Test Successful Transition Execution by Engineer)
    console.log('\nTest 5: Executing authorized transition by Engineer John (version 0)...');
    const updatedTicket = await service.executeTransition(ticket.id, userEng.id, stateInProgress.id, 0);
    console.log(`Transition succeeded! New Ticket State ID: ${updatedTicket.stateId}, New Version: ${updatedTicket.version}`);
    if (updatedTicket.stateId === stateInProgress.id && updatedTicket.version === 1) {
      console.log('✓ SUCCESS: Ticket moved to IN_PROGRESS and version incremented.');
    } else {
      throw new Error('✗ FAILED: Ticket state or version incorrect.');
    }

    // 6. التحقق من وجود السجلات والتدقيق (Verify Logs and Audit Entries)
    console.log('\nTest 6: Verifying log and audit records...');
    const ticketLog = await prisma.ticketLog.findFirst({
      where: { ticketId: ticket.id }
    });
    console.log(`Found TicketLog: "${ticketLog?.action}"`);

    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: ticket.id, action: 'STATE_TRANSITION' }
    });
    console.log(`Found AuditLog: Action = ${auditLog?.action}, Changes = "${auditLog?.changes}"`);

    if (ticketLog && auditLog) {
      console.log('✓ SUCCESS: Ticket logs and audit logs successfully written.');
    } else {
      throw new Error('✗ FAILED: Logs or Audit entries are missing.');
    }

    // 7. اختبار قفل التزامن المتوازي (Test Optimistic Concurrency Lock)
    console.log('\nTest 7: Attempting stale transition (using version 0 instead of 1)...');
    try {
      await service.executeTransition(ticket.id, userEng.id, stateOpen.id, 0);
      throw new Error('✗ FAILED: Expected ConcurrencyConflictError to be thrown.');
    } catch (err: any) {
      if (err instanceof ConcurrencyConflictError) {
        console.log(`✓ SUCCESS: Blocked stale update via Optimistic Concurrency Control. Error message: "${err.message}"`);
      } else {
        throw err;
      }
    }

  } finally {
    // 8. تنظيف قاعدة البيانات (Cleanup Database)
    console.log('\nStep 8: Cleaning up test data...');
    await prisma.ticketLog.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.auditLog.deleteMany({ where: { entityId: ticket.id, entity: 'Ticket' } });
    await prisma.ticket.delete({ where: { id: ticket.id } });
    await prisma.user.deleteMany({ where: { id: { in: [userEng.id, userNormal.id] } } });
    await prisma.location.delete({ where: { id: loc.id } });
    await prisma.issueCategory.delete({ where: { id: cat.id } });
    await prisma.ticketStateTransition.deleteMany({ where: { id: { in: [transition.id, transitionBack.id] } } });
    await prisma.ticketState.deleteMany({ where: { id: { in: [stateOpen.id, stateInProgress.id] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleEng.id, roleUser.id] } } });
    console.log('Cleanup finished. Database is pristine.');
  }

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

main()
  .catch((err) => {
    console.error('\n✗ TEST RUN FAILED WITH ERROR:', err);
    process.exit(1);
  });
