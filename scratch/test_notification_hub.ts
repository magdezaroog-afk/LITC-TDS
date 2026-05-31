import { DatabaseController } from '../src/backend/controllers/DatabaseController';
import { EventBus } from '../src/engine/events/EventBus';
import { prisma } from '../src/db/client';

async function testNotificationHub() {
  console.log('=== STARTING SOVEREIGN REAL-TIME NOTIFICATION HUB INTEGRATION TEST ===\n');

  // Store original config to restore later
  let originalITConfig: any = null;
  let originalMaintenanceConfig: any = null;
  let originalHRConfig: any = null;
  
  let adminRole: any = null;
  let createdAdminRole = false;

  try {
    // Ensure IT_Admin role exists in Prisma
    adminRole = await prisma.role.findFirst({
      where: { name: 'IT_Admin' }
    });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: 'IT_Admin' }
      });
      createdAdminRole = true;
      console.log('Seeded IT_Admin role in Prisma database with ID:', adminRole.id);
    } else {
      console.log('Found existing IT_Admin role in Prisma database with ID:', adminRole.id);
    }

    console.log('Step 1: Storing original configurations...');
    originalITConfig = await DatabaseController.executeGetNotificationConfig('IT');
    originalMaintenanceConfig = await DatabaseController.executeGetNotificationConfig('Maintenance');
    originalHRConfig = await DatabaseController.executeGetNotificationConfig('HR');
    console.log('Stored configs:', { originalITConfig, originalMaintenanceConfig, originalHRConfig });

    // =========================================================================
    // Test Case 1: Direct DB Configuration Operations
    // =========================================================================
    console.log('\n--- Test Case 1: Direct DB Configuration Operations ---');
    
    console.log('Updating IT config: Toast = true, Bell = false');
    await DatabaseController.executeUpdateNotificationConfig('IT', true, false);
    
    let config = await DatabaseController.executeGetNotificationConfig('IT');
    if (!config || config.isToastEnabled !== true || config.isBellEnabled !== false) {
      throw new Error(`✗ FAILED: DB Update failed to apply or retrieve correct configuration. Got: ${JSON.stringify(config)}`);
    }
    console.log('✓ SUCCESS: DB Update applied and retrieved correct configuration.');

    console.log('Updating IT config: Toast = false, Bell = true');
    await DatabaseController.executeUpdateNotificationConfig('IT', false, true);
    
    config = await DatabaseController.executeGetNotificationConfig('IT');
    if (!config || config.isToastEnabled !== false || config.isBellEnabled !== true) {
      throw new Error(`✗ FAILED: DB Update failed to apply or retrieve correct configuration. Got: ${JSON.stringify(config)}`);
    }
    console.log('✓ SUCCESS: DB Update applied and retrieved correct configuration.');

    // =========================================================================
    // Test Case 2: REST Endpoint Route Handlers
    // =========================================================================
    console.log('\n--- Test Case 2: REST Endpoint Route Handlers ---');

    // Test GET /admin/notification-config/:serviceType
    console.log('Calling getNotificationConfig handler for Maintenance...');
    const reqGet = { 
      params: { serviceType: 'Maintenance' },
      user: { id: 1, roleId: adminRole.id }
    } as any;
    let getStatus = 200;
    let getData: any = null;
    const resGet = {
      status: (code: number) => { getStatus = code; return resGet; },
      json: (data: any) => { getData = data; return resGet; }
    } as any;
    
    await DatabaseController.getNotificationConfig(reqGet, resGet);
    console.log('GET Response:', { status: getStatus, data: getData });
    if (getStatus !== 200 || !getData || getData.serviceType !== 'Maintenance') {
      throw new Error('✗ FAILED: getNotificationConfig route handler failed.');
    }
    console.log('✓ SUCCESS: getNotificationConfig route handler successfully returned configurations.');

    // Test PUT /admin/notification-config
    console.log('Calling updateNotificationConfig handler for HR (Toast = false, Bell = false)...');
    const reqPut = { 
      body: { serviceType: 'HR', isToastEnabled: false, isBellEnabled: false },
      user: { id: 1, roleId: adminRole.id }
    } as any;
    let putStatus = 200;
    let putData: any = null;
    const resPut = {
      status: (code: number) => { putStatus = code; return resPut; },
      json: (data: any) => { putData = data; return resPut; }
    } as any;

    await DatabaseController.updateNotificationConfig(reqPut, resPut);
    console.log('PUT Response:', { status: putStatus, data: putData });
    if (putStatus !== 200 || !putData || putData.status !== 'success') {
      throw new Error('✗ FAILED: updateNotificationConfig route handler failed.');
    }

    const hrConfig = await DatabaseController.executeGetNotificationConfig('HR');
    if (!hrConfig || hrConfig.isToastEnabled !== false || hrConfig.isBellEnabled !== false) {
      throw new Error(`✗ FAILED: updateNotificationConfig did not apply to database. Got: ${JSON.stringify(hrConfig)}`);
    }
    console.log('✓ SUCCESS: updateNotificationConfig route handler successfully updated database configuration.');

    // =========================================================================
    // Test Case 3: EventBus and Channel Control Simulation
    // =========================================================================
    console.log('\n--- Test Case 3: EventBus & Channel Control Simulation ---');

    const userDept = 'IT';
    let notifications: any[] = [];
    let toasts: any[] = [];

    // Mock active settings
    let mockSettings = { isToastEnabled: true, isBellEnabled: false };

    // Set up EventBus listeners
    const handleTicketTransferred = (event: any) => {
      if (event && event.ticketId && event.department === userDept) {
        if (mockSettings.isBellEnabled) {
          notifications.push({ id: event.ticketId, title: 'تحويل تذكرة', content: 'Bell' });
        }
        if (mockSettings.isToastEnabled) {
          toasts.push({ id: event.ticketId, title: 'تحويل تذكرة', content: 'Toast' });
        }
      }
    };

    EventBus.on('TICKET_TRANSFERRED', handleTicketTransferred);

    // Scenario 3.1: Toast Enabled, Bell Disabled
    console.log('Scenario 3.1: Simulated settings (Toast = true, Bell = false). Triggering ticket transfer...');
    EventBus.emit('TICKET_TRANSFERRED', { ticketId: 'ticket-123', department: 'IT' });
    
    console.log('Resulting Notifications:', notifications);
    console.log('Resulting Toasts:', toasts);
    
    if (notifications.length !== 0 || toasts.length !== 1) {
      throw new Error('✗ FAILED: Channel block failed. Expected 0 notifications and 1 toast.');
    }
    console.log('✓ SUCCESS: Bell notification blocked, Toast notification triggered.');

    // Reset state and settings
    notifications = [];
    toasts = [];
    mockSettings = { isToastEnabled: false, isBellEnabled: true };

    // Scenario 3.2: Toast Disabled, Bell Enabled
    console.log('Scenario 3.2: Simulated settings (Toast = false, Bell = true). Triggering ticket transfer...');
    EventBus.emit('TICKET_TRANSFERRED', { ticketId: 'ticket-456', department: 'IT' });
    
    console.log('Resulting Notifications:', notifications);
    console.log('Resulting Toasts:', toasts);
    
    if (notifications.length !== 1 || toasts.length !== 0) {
      throw new Error('✗ FAILED: Channel block failed. Expected 1 notification and 0 toasts.');
    }
    console.log('✓ SUCCESS: Toast notification blocked, Bell notification triggered.');

    // Clean up EventBus listener
    EventBus.off('TICKET_TRANSFERRED', handleTicketTransferred);

    console.log('\n=== ALL TEST CASES PASSED SUCCESSFULLY ===');
  } catch (err: any) {
    console.error('\n✗ TEST RUN ENCOUNTERED FAILURE:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    console.log('\nStep 4: Restoring original database configurations...');
    try {
      if (originalITConfig) {
        await DatabaseController.executeUpdateNotificationConfig('IT', originalITConfig.isToastEnabled, originalITConfig.isBellEnabled);
      }
      if (originalMaintenanceConfig) {
        await DatabaseController.executeUpdateNotificationConfig('Maintenance', originalMaintenanceConfig.isToastEnabled, originalMaintenanceConfig.isBellEnabled);
      }
      if (originalHRConfig) {
        await DatabaseController.executeUpdateNotificationConfig('HR', originalHRConfig.isToastEnabled, originalHRConfig.isBellEnabled);
      }
      console.log('✓ Original database configurations successfully restored.');
    } catch (restoreErr) {
      console.error('Warning: Failed to restore original configurations:', restoreErr);
    }
    
    try {
      if (createdAdminRole && adminRole) {
        await prisma.role.delete({ where: { id: adminRole.id } });
        console.log('✓ Cleaned up seeded IT_Admin role in Prisma database.');
      }
    } catch (cleanErr) {
      console.error('Warning: Failed to clean up seeded IT_Admin role:', cleanErr);
    }

    // Force exit to close connection pools
    process.exit(0);
  }
}

testNotificationHub();
