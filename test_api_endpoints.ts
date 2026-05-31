import app from './src/app';
import { prisma } from './src/db/client';
import { Server } from 'http';

async function main() {
  console.log('=== STARTING EXPRESS API & MIDDLEWARE INTEGRATION TEST ===\n');

  // 1. تهيئة البيانات التجريبية (Setup Mock Database Data)
  console.log('Step 1: Setting up mock database records...');
  
  // Clean any potential stale data
  try {
    await prisma.ticketStatusSlaTracker.deleteMany({ where: { ticket: { title: 'API Test Ticket' } } });
    await prisma.ticketLog.deleteMany({ where: { action: { contains: 'state_id=' } } });
    await prisma.auditLog.deleteMany({ where: { userAgent: 'TicketStateService' } });
    await prisma.ticket.deleteMany({ where: { title: 'API Test Ticket' } });
    await prisma.user.deleteMany({ where: { username: { in: ['api_eng', 'api_user'] } } });
    await prisma.location.deleteMany({ where: { building: 'LITC API HQ' } });
    await prisma.issueCategory.deleteMany({ where: { name: 'API Support Category' } });
    await prisma.ticketStateTransition.deleteMany({ where: { triggerEndpoint: 'api-test-webhook' } });
    await prisma.ticketState.deleteMany({ where: { name: { in: ['API_OPEN', 'API_PROCESSING'] } } });
    await prisma.role.deleteMany({ where: { name: { in: ['API_ENG_ROLE', 'API_USER_ROLE'] } } });
    await prisma.uITemplate.deleteMany({ where: { name: 'API Test Template' } });
    await prisma.uITheme.deleteMany({ where: { themeName: 'API Test Theme' } });
  } catch (e) {
    console.log('Pre-cleanup error (ignored):', e);
  }

  const theme = await prisma.uITheme.create({
    data: { themeName: 'API Test Theme', primaryColor: '#ff0055', secondaryColor: '#fff0f5' }
  });

  const template = await prisma.uITemplate.create({
    data: { name: 'API Test Template', themeId: theme.id }
  });

  const roleEng = await prisma.role.create({
    data: { name: 'API_ENG_ROLE', templateId: template.id }
  });

  const roleUser = await prisma.role.create({
    data: { name: 'API_USER_ROLE', templateId: template.id }
  });

  const stateOpen = await prisma.ticketState.create({
    data: { name: 'API_OPEN', label: 'Open' }
  });

  const stateProcessing = await prisma.ticketState.create({
    data: { name: 'API_PROCESSING', label: 'Processing' }
  });

  const transition = await prisma.ticketStateTransition.create({
    data: {
      fromStateId: stateOpen.id,
      toStateId: stateProcessing.id,
      roleId: roleEng.id,
      triggerEndpoint: 'api-test-webhook'
    }
  });

  const transitionBack = await prisma.ticketStateTransition.create({
    data: {
      fromStateId: stateProcessing.id,
      toStateId: stateOpen.id,
      roleId: roleEng.id,
      triggerEndpoint: 'api-test-webhook'
    }
  });

  const loc = await prisma.location.create({
    data: { building: 'LITC API HQ', floor: '1st', office: '101' }
  });

  const cat = await prisma.issueCategory.create({
    data: { name: 'API Support Category' }
  });

  const userEng = await prisma.user.create({
    data: {
      username: 'api_eng',
      email: 'api_eng@litc-ts.com',
      fullName: 'API Engineer John',
      roleId: roleEng.id,
      defaultLocationId: loc.id,
      resetToken: 'token_api_eng',
      updatedAt: new Date()
    }
  });

  const userNormal = await prisma.user.create({
    data: {
      username: 'api_user',
      email: 'api_user@litc-ts.com',
      fullName: 'API User Jane',
      roleId: roleUser.id,
      defaultLocationId: loc.id,
      resetToken: 'token_api_user',
      updatedAt: new Date()
    }
  });

  const ticket = await prisma.ticket.create({
    data: {
      title: 'API Test Ticket',
      description: 'Verifying REST calls and errors mapping',
      stateId: stateOpen.id,
      categoryId: cat.id,
      locationId: loc.id,
      version: 0,
      updatedAt: new Date()
    }
  });

  console.log('Database records initialized. Starting API server programmatically on port 5656...');

  // 2. تشغيل خادم الاختبار (Start Test Server)
  let server: Server;
  await new Promise<void>((resolve) => {
    server = app.listen(5656, () => {
      console.log('API Server listening on http://localhost:5656');
      resolve();
    });
  });

  try {
    // Test A: Access without credentials (Expect 401)
    console.log('\nTest A: Requesting GET /api/v1/ui/config without auth headers...');
    let res = await fetch('http://localhost:5656/api/v1/ui/config?stateId=' + stateOpen.id + '&ticketType=TECHNICAL');
    let data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response JSON:', data);
    if (res.status === 401 && data.status === 'error') {
      console.log('✓ SUCCESS: Authenticator blocked request with 401.');
    } else {
      throw new Error('✗ FAILED: Expected 401 Unauthorized.');
    }

    // Test B: Access with correct auth, but bad parameters (Expect 400)
    console.log('\nTest B: Requesting GET /api/v1/ui/config with auth but missing stateId...');
    res = await fetch('http://localhost:5656/api/v1/ui/config?ticketType=TECHNICAL', {
      headers: {
        'x-user-id': userEng.id.toString(),
        'x-role-id': roleEng.id.toString()
      }
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response JSON:', data);
    if (res.status === 400 && data.status === 'error') {
      console.log('✓ SUCCESS: Blocked bad query parameter with 400.');
    } else {
      throw new Error('✗ FAILED: Expected 400 Bad Request.');
    }

    // Test C: Access with correct auth and correct parameters (Expect 200)
    console.log('\nTest C: Requesting GET /api/v1/ui/config with valid credentials...');
    res = await fetch(`http://localhost:5656/api/v1/ui/config?stateId=${stateOpen.id}&ticketType=TECHNICAL`, {
      headers: {
        'x-user-id': userEng.id.toString(),
        'x-role-id': roleEng.id.toString()
      }
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Resolved Template Name: "${data.data?.templateName}"`);
    console.log(`Resolved Theme: Primary="${data.data?.theme?.primaryColor}"`);
    if (res.status === 200 && data.status === 'success' && data.data?.templateName === 'API Test Template') {
      console.log('✓ SUCCESS: Resolved UI Layout successfully through API.');
    } else {
      throw new Error('✗ FAILED: UI resolution REST call failed.');
    }

    // Test D: Unauthorized State Transition (Expect 403 Forbidden via Global Error Handler)
    console.log('\nTest D: Requesting POST /api/v1/tickets/:id/transitions by normal user Jane (unauthorized)...');
    res = await fetch(`http://localhost:5656/api/v1/tickets/${ticket.id}/transitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userNormal.id.toString(),
        'x-role-id': roleUser.id.toString()
      },
      body: JSON.stringify({
        targetStateId: stateProcessing.id,
        version: 0
      })
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Global Error Handler Response:', data);
    if (res.status === 403 && data.errorName === 'UnauthorizedTransitionError') {
      console.log('✓ SUCCESS: Global error handler mapped UnauthorizedTransitionError to 403 Forbidden.');
    } else {
      throw new Error('✗ FAILED: Global error handler failed to map 403.');
    }

    // Test E: Execute Successful State Transition (Expect 200 OK)
    console.log('\nTest E: Requesting POST /api/v1/tickets/:id/transitions by Engineer John (authorized, version 0)...');
    res = await fetch(`http://localhost:5656/api/v1/tickets/${ticket.id}/transitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userEng.id.toString(),
        'x-role-id': roleEng.id.toString()
      },
      body: JSON.stringify({
        targetStateId: stateProcessing.id,
        version: 0
      })
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response JSON:', data);
    if (res.status === 200 && data.status === 'success' && data.data?.stateId === stateProcessing.id && data.data?.version === 1) {
      console.log('✓ SUCCESS: Ticket state transitioned successfully via REST call.');
    } else {
      throw new Error('✗ FAILED: REST transition execution failed.');
    }

    // Test F: Stale Version / Concurrency Conflict (Expect 409 Conflict via Global Error Handler)
    console.log('\nTest F: Requesting POST /api/v1/tickets/:id/transitions again with version 0 (stale version)...');
    res = await fetch(`http://localhost:5656/api/v1/tickets/${ticket.id}/transitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userEng.id.toString(),
        'x-role-id': roleEng.id.toString()
      },
      body: JSON.stringify({
        targetStateId: stateOpen.id, // transition back to stateOpen
        version: 0 // stale version (actual is 1)
      })
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Global Error Handler Response:', data);
    if (res.status === 409 && data.errorName === 'ConcurrencyConflictError') {
      console.log('✓ SUCCESS: Global error handler mapped ConcurrencyConflictError to 409 Conflict.');
    } else {
      throw new Error('✗ FAILED: Global error handler failed to map 409.');
    }

  } finally {
    // 3. إيقاف الخادم وتنظيف قاعدة البيانات (Shutdown & Clean)
    console.log('\nStep 3: Shutting down test server and cleaning database...');
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('API Server closed.');
        resolve();
      });
    });

    const testTicket = await prisma.ticket.findFirst({ where: { title: 'API Test Ticket' } });
    if (testTicket) {
      await prisma.ticketStatusSlaTracker.deleteMany({ where: { ticketId: testTicket.id } });
      await prisma.ticketLog.deleteMany({ where: { ticketId: testTicket.id } });
      await prisma.auditLog.deleteMany({ where: { entityId: testTicket.id, entity: 'Ticket' } });
      await prisma.ticket.delete({ where: { id: testTicket.id } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [userEng.id, userNormal.id] } } });
    await prisma.location.delete({ where: { id: loc.id } });
    await prisma.issueCategory.delete({ where: { id: cat.id } });
    await prisma.ticketStateTransition.deleteMany({ where: { id: { in: [transition.id, transitionBack.id] } } });
    await prisma.ticketState.deleteMany({ where: { id: { in: [stateOpen.id, stateProcessing.id] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleEng.id, roleUser.id] } } });
    await prisma.uITemplate.delete({ where: { id: template.id } });
    await prisma.uITheme.delete({ where: { id: theme.id } });
    console.log('Cleanup completed. Database is pristine.');
  }

  console.log('\n=== ALL API & MIDDLEWARE INTEGRATION TESTS PASSED! ===');
}

main()
  .catch((err) => {
    console.error('\n✗ TEST RUN FAILED WITH ERROR:', err);
    process.exit(1);
  });
