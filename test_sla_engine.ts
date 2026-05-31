import { prisma } from './src/db/client';
import { SLAEngineService } from './src/services/SLAEngineService';
import { SlaMonitorJob } from './src/jobs/SlaMonitorJob';

async function main() {
  console.log('=== STARTING SLA ENGINE & AUTO-ESCALATION INTEGRATION TEST ===\n');
  
  const slaService = new SLAEngineService();
  const monitorJob = new SlaMonitorJob();

  // 1. تهيئة البيانات التجريبية وساعات العمل (Setup Business Hours & Calendar)
  console.log('Step 1: Setting up Gulf business hours, holiday, and states...');

  // Step 0: Clean potential stale data
  try {
    await prisma.ticketStatusSlaTracker.deleteMany({ where: { ticket: { title: 'Test SLA Ticket' } } });
    await prisma.ticketLog.deleteMany({ where: { action: { contains: 'SLA' } } });
    await prisma.auditLog.deleteMany({ where: { userAgent: 'TicketStateService' } });
    await prisma.notificationQueue.deleteMany({ where: { subject: { contains: 'SLA Breach' } } });
    await prisma.ticket.deleteMany({ where: { title: 'Test SLA Ticket' } });
    await prisma.statusSlaRule.deleteMany({ where: { actionType: 'ESCALATE' } });
    await prisma.user.deleteMany({ where: { username: 'system' } });
    await prisma.issueCategory.deleteMany({ where: { name: 'IT SLA Category' } });
    await prisma.ticketStateTransition.deleteMany({ where: { triggerEndpoint: 'sla-test-webhook' } });
    await prisma.ticketState.deleteMany({ where: { name: { in: ['TEST_OPEN', 'TEST_ESCALATED'] } } });
    await prisma.role.deleteMany({ where: { name: 'SYSTEM_ROLE' } });
    await prisma.businessHours.deleteMany();
    await prisma.holiday.deleteMany();
  } catch (e) {
    console.log('Pre-cleanup error (ignored):', e);
  }

  // Create Business Hours (Sunday to Thursday 8:00 - 17:00, Friday/Saturday are non-workdays)
  const workingDays = [0, 1, 2, 3, 4];
  const weekendDays = [5, 6];

  for (const day of workingDays) {
    await prisma.businessHours.create({
      data: { dayOfWeek: day, startTime: '08:00', endTime: '17:00', isWorkDay: true }
    });
  }
  for (const day of weekendDays) {
    await prisma.businessHours.create({
      data: { dayOfWeek: day, startTime: '00:00', endTime: '00:00', isWorkDay: false }
    });
  }

  // Create Wednesday, 2026-05-27 as a holiday (Test holiday skip)
  const nationalDay = new Date(Date.UTC(2026, 4, 27, 0, 0, 0)); // 27 May 2026
  await prisma.holiday.create({
    data: { name: 'National Day', holidayDate: nationalDay }
  });

  const stateOpen = await prisma.ticketState.create({
    data: { name: 'TEST_OPEN', label: 'Open' }
  });

  const stateEscalated = await prisma.ticketState.create({
    data: { name: 'TEST_ESCALATED', label: 'Escalated' }
  });

  const defaultRole = await prisma.role.create({
    data: { name: 'SYSTEM_ROLE' }
  });

  // Create mock system user to ensure SlaMonitorJob runs with correct Role ID
  const systemUser = await prisma.user.create({
    data: {
      username: 'system',
      email: 'system@litc-ts.com',
      fullName: 'System Engine',
      roleId: defaultRole.id,
      resetToken: 'system_token_123',
      updatedAt: new Date()
    }
  });

  // Setup Escalation Transition rule
  const transition = await prisma.ticketStateTransition.create({
    data: {
      fromStateId: stateOpen.id,
      toStateId: stateEscalated.id,
      roleId: defaultRole.id,
      triggerEndpoint: 'sla-test-webhook'
    }
  });

  const cat = await prisma.issueCategory.create({
    data: { name: 'IT SLA Category' }
  });

  // SLA Rule: 120 minutes (2 business hours) in OPEN state, action is ESCALATE
  const slaRule = await prisma.statusSlaRule.create({
    data: {
      stateId: stateOpen.id,
      categoryId: cat.id,
      maxDurationMins: 120,
      escalationLevel: 1,
      actionType: 'ESCALATE'
    }
  });

  console.log('Business hours and states successfully initialized.\n');

  try {
    // 2. اختبار الإضافة القياسية (Test 2: Standard working hours addition)
    console.log('Test 2: Adding 120 minutes starting Sunday 10:00 AM UTC (Expect same day 12:00 PM)...');
    const start1 = new Date(Date.UTC(2026, 4, 24, 10, 0, 0)); // Sunday 10:00 AM
    const deadline1 = await slaService.addBusinessMinutes(start1, 120);
    console.log(`Calculated deadline: ${deadline1.toUTCString()}`);
    if (deadline1.getUTCHours() === 12 && deadline1.getUTCMinutes() === 0 && deadline1.getUTCDay() === 0) {
      console.log('✓ SUCCESS: Standard business hours addition matched exactly.');
    } else {
      throw new Error('✗ FAILED: Standard business hours addition failed.');
    }

    // 3. اختبار البداية خارج أوقات العمل (Test 3: Start outside working hours)
    console.log('\nTest 3: Adding 120 minutes starting Sunday 5:00 AM UTC (Before business start at 8:00 AM)...');
    const start2 = new Date(Date.UTC(2026, 4, 24, 5, 0, 0)); // Sunday 5:00 AM
    const deadline2 = await slaService.addBusinessMinutes(start2, 120);
    console.log(`Calculated deadline: ${deadline2.toUTCString()}`);
    if (deadline2.getUTCHours() === 10 && deadline2.getUTCMinutes() === 0 && deadline2.getUTCDay() === 0) {
      console.log('✓ SUCCESS: Outside working hours start delayed to start of business day successfully.');
    } else {
      throw new Error('✗ FAILED: Outside working hours start addition failed.');
    }

    // 4. اختبار تخطي نهاية الأسبوع (Test 4: Weekend skip)
    console.log('\nTest 4: Adding 120 minutes starting Thursday 4:00 PM UTC (Expect Sunday 9:00 AM - skips Friday/Saturday)...');
    const start3 = new Date(Date.UTC(2026, 4, 28, 16, 0, 0)); // Thursday 4:00 PM (1 hour left of business day)
    const deadline3 = await slaService.addBusinessMinutes(start3, 120);
    console.log(`Calculated deadline: ${deadline3.toUTCString()}`);
    if (deadline3.getUTCDay() === 0 && deadline3.getUTCHours() === 9 && deadline3.getUTCMinutes() === 0) {
      console.log('✓ SUCCESS: Weekend skipped and remaining minutes added on first working day.');
    } else {
      throw new Error('✗ FAILED: Weekend skip addition failed.');
    }

    // 5. اختبار تخطي الإجازة الرسمية (Test 5: Holiday skip)
    console.log('\nTest 5: Adding 120 minutes starting Tuesday 4:30 PM UTC (Expect Thursday 9:30 AM - skips Wednesday Holiday)...');
    const start4 = new Date(Date.UTC(2026, 4, 26, 16, 30, 0)); // Tuesday 4:30 PM (30 mins left)
    const deadline4 = await slaService.addBusinessMinutes(start4, 120);
    console.log(`Calculated deadline: ${deadline4.toUTCString()}`);
    if (deadline4.getUTCDay() === 4 && deadline4.getUTCHours() === 9 && deadline4.getUTCMinutes() === 30) {
      console.log('✓ SUCCESS: Wednesday holiday successfully skipped, deadline landed on Thursday morning.');
    } else {
      throw new Error('✗ FAILED: Holiday skip addition failed.');
    }

    // 6. اختبار مراقب الـ SLA والتصعيد التلقائي (Test 6: Integration & Auto-Escalation)
    console.log('\nTest 6: Simulating SLA breach and automatic escalation...');
    
    // Create a mock ticket that has been modified 5 days ago (causing it to breach the 120 mins SLA)
    const pastTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); 
    const ticket = await prisma.ticket.create({
      data: {
        title: 'Test SLA Ticket',
        description: 'Testing background monitor breach and state transition escalation',
        stateId: stateOpen.id,
        categoryId: cat.id,
        version: 0,
        createdAt: pastTime,
        updatedAt: pastTime
      }
    });

    // Compute SLA and create compliant tracker
    const deadlineDate = await slaService.calculateSlaDeadline(ticket.id);
    console.log(`Ticket SLA Tracker created with deadline: ${deadlineDate.toUTCString()}`);

    // Verify tracker is created as COMPLIANT
    let tracker = await prisma.ticketStatusSlaTracker.findFirst({
      where: { ticketId: ticket.id }
    });
    console.log(`Initial Tracker status: "${tracker?.slaStatus}"`);

    // Execute SlaMonitor Job check manually to trigger escalation
    console.log('Running SlaMonitorJob checkSlaBreaches() to find breaches...');
    await monitorJob.checkSlaBreaches();

    // Verify tracker is now BREACHED
    tracker = await prisma.ticketStatusSlaTracker.findFirst({
      where: { ticketId: ticket.id }
    });
    console.log(`Updated Tracker status: "${tracker?.slaStatus}", Breached at: ${tracker?.breachedAt?.toISOString()}`);

    // Verify Ticket state is transitioned to ESCALATED
    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id }
    });
    console.log(`Updated Ticket State ID: ${updatedTicket?.stateId} (Expected ESCALATED ID: ${stateEscalated.id})`);

    // Verify Notification Queue
    const notification = await prisma.notificationQueue.findFirst({
      where: { recipient: 'admin@litc-ts.com', subject: { contains: `Ticket #${ticket.id}` } }
    });
    console.log(`Queued Notification: Subject = "${notification?.subject}", Status = "${notification?.status}"`);

    if (tracker?.slaStatus === 'BREACHED' && updatedTicket?.stateId === stateEscalated.id && notification) {
      console.log('✓ SUCCESS: SLA breach detected, ticket transitioned to ESCALATED, and notification queued.');
    } else {
      throw new Error('✗ FAILED: Breach detection or escalation integration failed.');
    }

  } finally {
    // 7. التنظيف (Cleanup)
    console.log('\nStep 7: Cleaning up test calendar and ticket data...');
    const testTicket = await prisma.ticket.findFirst({ where: { title: 'Test SLA Ticket' } });
    if (testTicket) {
      await prisma.ticketStatusSlaTracker.deleteMany({ where: { ticketId: testTicket.id } });
      await prisma.ticketLog.deleteMany({ where: { ticketId: testTicket.id } });
      await prisma.auditLog.deleteMany({ where: { entityId: testTicket.id, entity: 'Ticket' } });
      await prisma.notificationQueue.deleteMany({ where: { subject: { contains: `Ticket #${testTicket.id}` } } });
      await prisma.ticket.delete({ where: { id: testTicket.id } });
    }
    await prisma.statusSlaRule.deleteMany({ where: { id: slaRule.id } });
    await prisma.user.deleteMany({ where: { username: 'system' } });
    await prisma.issueCategory.deleteMany({ where: { name: 'IT SLA Category' } });
    await prisma.ticketStateTransition.delete({ where: { id: transition.id } });
    await prisma.ticketState.deleteMany({ where: { id: { in: [stateOpen.id, stateEscalated.id] } } });
    await prisma.role.deleteMany({ where: { id: defaultRole.id } });
    await prisma.businessHours.deleteMany();
    await prisma.holiday.deleteMany();
    console.log('Cleanup completed. Database is pristine.');
  }

  console.log('\n=== ALL SLA ENGINE TESTS PASSED SUCCESSFULLY! ===');
}

main()
  .catch((err) => {
    console.error('\n✗ TEST RUN FAILED WITH ERROR:', err);
    process.exit(1);
  });
