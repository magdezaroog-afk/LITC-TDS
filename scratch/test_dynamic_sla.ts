import app from '../src/app';
import { DatabaseController } from '../src/backend/controllers/DatabaseController';
import { WorkflowEngine, Ticket } from '../src/engine/workflow/WorkflowEngine';
import { SLABackgroundWorker } from '../src/engine/workflow/WorkflowEngine';
import { EventBus } from '../src/engine/events/EventBus';
import { Server } from 'http';

async function runDynamicSLATest() {
  console.log('=== STARTING DYNAMIC SLA ESCALATION WORKER TEST ===\n');

  // Step 1: Start API server
  console.log('Step 1: Starting Express API Server...');
  let server: Server;
  await new Promise<void>((resolve) => {
    server = app.listen(5660, () => {
      console.log('Test server running on port 5660');
      resolve();
    });
  });

  try {
    // 2. Test SLA REST Endpoint retrieval
    console.log('\nTest A: Requesting GET /admin/sla-config/IT...');
    let res = await fetch('http://localhost:5660/api/v1/admin/sla-config/IT', {
      headers: { 'Authorization': 'Bearer system_token_123' }
    });
    let data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Initial SLA config:', data);

    if (res.status === 200 && data.serviceType === 'IT' && data.isEscalationEnabled === true) {
      console.log('✓ Success: Initial SLA configurations retrieved correctly.');
    } else {
      throw new Error('✗ Failure: Initial SLA configuration retrieval failed.');
    }

    // 3. Test SLA REST Endpoint update
    console.log('\nTest B: Updating SLA threshold to 1 minute...');
    res = await fetch('http://localhost:5660/api/v1/admin/sla-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer system_token_123'
      },
      body: JSON.stringify({
        serviceType: 'IT',
        isEscalationEnabled: true,
        thresholdMinutes: 1,
        escalationTargetRole: 'IT_Admin'
      })
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);
    console.log('Update response:', data);

    if (res.status === 200 && data.status === 'success') {
      console.log('✓ Success: SLA configurations updated to 1 minute threshold.');
    } else {
      throw new Error('✗ Failure: SLA configuration update failed.');
    }

    // 4. Verify DB has updated configurations
    const currentConfig = await DatabaseController.executeGetSLAConfig('IT');
    console.log('Current DB SLA configurations:', currentConfig);
    if (currentConfig?.thresholdMinutes === 1 && currentConfig?.isEscalationEnabled === true) {
      console.log('✓ Success: DB state matches updated configs.');
    } else {
      throw new Error('✗ Failure: DB configs mismatch.');
    }

    // 5. Test SLA Escalation on ticket exceeding 1 minute threshold
    console.log('\nTest C: Simulating open ticket exceeding 1 minute threshold...');
    
    // Create mock ticket in WorkflowEngine created 3 minutes ago
    const ticketId = 'TKT-SLA-BREACH-101';
    const mockTicket: Ticket = {
      id: ticketId,
      title: 'شاشة معطلة بالكامل',
      description: 'الشاشة لا تعمل بالقسم المالي',
      status: 'new',
      mainCategory: 'IT',
      subCategory: 'Hardware',
      attachments: [],
      location: 'Office 12',
      department: 'IT',
      creatorId: 'usr-employee',
      childTicketIds: [],
      workflowPath: [],
      version: 1,
      createdAt: Date.now() - 3 * 60 * 1000 // 3 minutes ago
    };
    WorkflowEngine.saveTicket(mockTicket);
    console.log('Created mock ticket with createdAt = 3 minutes ago.');

    // Track EventBus TICKET_ESCALATED event
    let eventFired = false;
    let eventPayload: any = null;
    const handleEscalated = (payload: any) => {
      eventFired = true;
      eventPayload = payload;
      console.log('✓ EventBus captured TICKET_ESCALATED event:', payload);
    };
    EventBus.on('TICKET_ESCALATED', handleEscalated);

    // Connect mock session to route the broadcast
    const { RealTimeSynchronizer } = await import('../src/services/RealTimeSynchronizer');
    RealTimeSynchronizer.connect(['dept_handler_IT'], 'IT', 'test-sla-session');

    // Run SLA background check
    console.log('Triggering SLABackgroundWorker.checkDynamicSLABreaches()...');
    await SLABackgroundWorker.checkDynamicSLABreaches();

    // Verify ticket got escalated
    const checkedTicket = WorkflowEngine.getTicket(ticketId);
    console.log('Checked ticket state after check:', checkedTicket);

    if (checkedTicket?.isEscalated === true && checkedTicket?.escalatedTo === 'IT_Admin' && eventFired) {
      console.log('✓ Success: Ticket successfully escalated and broadcasted in real-time!');
    } else {
      throw new Error('✗ Failure: SLA Escalation worker did not escalate the ticket.');
    }

    // Cleanup EventBus listener & session
    RealTimeSynchronizer.disconnect('test-sla-session');
    EventBus.off('TICKET_ESCALATED', handleEscalated);

    // 6. Test disabling escalation entirely
    console.log('\nTest D: Disabling SLA escalation via REST API...');
    res = await fetch('http://localhost:5660/api/v1/admin/sla-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer system_token_123'
      },
      body: JSON.stringify({
        serviceType: 'IT',
        isEscalationEnabled: false,
        thresholdMinutes: 1,
        escalationTargetRole: 'IT_Admin'
      })
    });
    data = await res.json() as any;
    console.log(`HTTP Status: ${res.status}`);

    if (res.status === 200 && data.status === 'success') {
      console.log('✓ Success: SLA escalation disabled.');
    } else {
      throw new Error('✗ Failure: Disabling SLA escalation failed.');
    }

    // Create another ticket created 3 minutes ago
    const secondTicketId = 'TKT-SLA-BREACH-102';
    const mockTicket2: Ticket = {
      id: secondTicketId,
      title: 'مشكلة اتصال بالشبكة',
      description: 'انقطاع الاتصال بالشبكة اللاسلكية',
      status: 'new',
      mainCategory: 'IT',
      subCategory: 'Network',
      attachments: [],
      location: 'Office 15',
      department: 'IT',
      creatorId: 'usr-employee',
      childTicketIds: [],
      workflowPath: [],
      version: 1,
      createdAt: Date.now() - 3 * 60 * 1000 // 3 minutes ago
    };
    WorkflowEngine.saveTicket(mockTicket2);

    eventFired = false;
    EventBus.on('TICKET_ESCALATED', handleEscalated);

    // Run SLA background check again
    console.log('Triggering SLABackgroundWorker.checkDynamicSLABreaches() again...');
    await SLABackgroundWorker.checkDynamicSLABreaches();

    const checkedTicket2 = WorkflowEngine.getTicket(secondTicketId);
    console.log('Checked ticket state after check (escalation disabled):', checkedTicket2);

    if (checkedTicket2?.isEscalated !== true && !eventFired) {
      console.log('✓ Success: Escalation was bypassed because IsEscalationEnabled = 0.');
    } else {
      throw new Error('✗ Failure: Escalation happened despite being disabled!');
    }

    EventBus.off('TICKET_ESCALATED', handleEscalated);

    // Revert DB configuration to defaults
    console.log('\nReverting DB SLA configs to defaults...');
    await DatabaseController.executeUpdateSLAConfig('IT', true, 120, 'IT_Admin');

  } finally {
    console.log('\nStep 3: Shutting down Express server...');
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('Test server closed.');
        resolve();
      });
    });
  }

  console.log('\n=== ALL DYNAMIC SLA ESCALATION WORKER TESTS PASSED! ===');
}

runDynamicSLATest().catch((err) => {
  console.error('\n✗ TEST RUN ENCOUNTERED AN ERROR:', err);
  process.exit(1);
});
