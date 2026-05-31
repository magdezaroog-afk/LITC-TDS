import { DatabaseController } from '../src/backend/controllers/DatabaseController';
import { RealTimeSynchronizer } from '../src/services/RealTimeSynchronizer';
import { EventBus } from '../src/engine/events/EventBus';
import { prisma } from '../src/db/client';

async function testLiveConfigPropagation() {
  console.log('=== STARTING SOVEREIGN LIVE CONFIGURATION BROADCASTER INTEGRATION TEST ===\n');

  // Storing original configs to restore later
  let originalITNotifConfig: any = null;
  let originalITSLAConfig: any = null;
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
    originalITNotifConfig = await DatabaseController.executeGetNotificationConfig('IT');
    originalITSLAConfig = await DatabaseController.executeGetSLAConfig('IT');
    console.log('Original IT configs stored.');

    // Step 2: Establish client connection on RealTimeSynchronizer
    console.log('Step 2: Connecting client session to RealTimeSynchronizer...');
    RealTimeSynchronizer.connect(['admin'], 'IT', 'session-test-config');

    // Step 3: Register EventBus listener to track live config updates
    console.log('Step 3: Registering EventBus listener for CONFIG_UPDATED event...');
    let configUpdatedEventPayloads: any[] = [];
    const handleConfigUpdated = (event: any) => {
      console.log('Captured CONFIG_UPDATED Event Payload:', event);
      configUpdatedEventPayloads.push(event);
    };
    EventBus.on('CONFIG_UPDATED', handleConfigUpdated);

    // =========================================================================
    // Test Case 1: Notification Config Update Propagation
    // =========================================================================
    console.log('\n--- Test Case 1: Notification Config Update Propagation ---');
    const reqNotifPut = {
      body: { serviceType: 'IT', isToastEnabled: false, isBellEnabled: true },
      user: { id: 1, roleId: adminRole.id }
    } as any;
    const resNotifPut = {
      status: (code: number) => resNotifPut,
      json: (data: any) => resNotifPut
    } as any;

    await DatabaseController.updateNotificationConfig(reqNotifPut, resNotifPut);

    // Assert CONFIG_UPDATED event received for Notification Update
    if (configUpdatedEventPayloads.length !== 1) {
      throw new Error('✗ FAILED: CONFIG_UPDATED event was not captured.');
    }
    const notifEvent = configUpdatedEventPayloads[0];
    if (notifEvent.ServiceType !== 'IT' || notifEvent.ConfigType !== 'NOTIF' || !notifEvent.Timestamp) {
      throw new Error(`✗ FAILED: Event payload contains incorrect attributes: ${JSON.stringify(notifEvent)}`);
    }
    // Verify security constraints: no raw bits/booleans/DB attributes leaked, only metadata
    const extraKeys = Object.keys(notifEvent).filter(k => !['ServiceType', 'Timestamp', 'ConfigType'].includes(k));
    if (extraKeys.length > 0) {
      throw new Error(`✗ FAILED: Security leak detected! Unexpected keys in payload: ${extraKeys.join(', ')}`);
    }
    console.log('✓ SUCCESS: Notification configuration updated and propagated successfully.');

    // Reset event payloads
    configUpdatedEventPayloads = [];

    // =========================================================================
    // Test Case 2: SLA Config Update Propagation
    // =========================================================================
    console.log('\n--- Test Case 2: SLA Config Update Propagation ---');
    const reqSLAPut = {
      body: { serviceType: 'IT', isEscalationEnabled: true, thresholdMinutes: 180, escalationTargetRole: 'IT_Admin' },
      user: { id: 1, roleId: adminRole.id }
    } as any;
    const resSLAPut = {
      status: (code: number) => resSLAPut,
      json: (data: any) => resSLAPut
    } as any;

    await DatabaseController.updateSLAConfig(reqSLAPut, resSLAPut);

    // Assert CONFIG_UPDATED event received for SLA Update
    if (configUpdatedEventPayloads.length !== 1) {
      throw new Error('✗ FAILED: CONFIG_UPDATED event was not captured.');
    }
    const slaEvent = configUpdatedEventPayloads[0];
    if (slaEvent.ServiceType !== 'IT' || slaEvent.ConfigType !== 'SLA' || !slaEvent.Timestamp) {
      throw new Error(`✗ FAILED: Event payload contains incorrect attributes: ${JSON.stringify(slaEvent)}`);
    }
    const extraSlaKeys = Object.keys(slaEvent).filter(k => !['ServiceType', 'Timestamp', 'ConfigType'].includes(k));
    if (extraSlaKeys.length > 0) {
      throw new Error(`✗ FAILED: Security leak detected! Unexpected keys in payload: ${extraSlaKeys.join(', ')}`);
    }
    console.log('✓ SUCCESS: SLA configuration updated and propagated successfully.');

    // Cleanup EventBus listener
    EventBus.off('CONFIG_UPDATED', handleConfigUpdated);

    console.log('\n=== ALL CONFIG BROADCASTER TEST CASES PASSED SUCCESSFULLY ===');
  } catch (err: any) {
    console.error('\n✗ TEST RUN ENCOUNTERED FAILURE:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    console.log('\nStep 4: Cleaning up and restoring original settings...');
    // Disconnect RealTimeSync session
    RealTimeSynchronizer.disconnect('session-test-config');

    // Restore original configs
    try {
      if (originalITNotifConfig) {
        await DatabaseController.executeUpdateNotificationConfig('IT', originalITNotifConfig.isToastEnabled, originalITNotifConfig.isBellEnabled);
      }
      if (originalITSLAConfig) {
        await DatabaseController.executeUpdateSLAConfig('IT', originalITSLAConfig.isEscalationEnabled, originalITSLAConfig.thresholdMinutes, originalITSLAConfig.escalationTargetRole);
      }
      console.log('✓ Configurations restored.');
    } catch (restoreErr) {
      console.error('Warning: Failed to restore configs:', restoreErr);
    }

    // Restore database role
    try {
      if (createdAdminRole && adminRole) {
        await prisma.role.delete({ where: { id: adminRole.id } });
        console.log('✓ Seeded IT_Admin role cleaned up.');
      }
    } catch (dbCleanErr) {
      console.error('Warning: Failed to delete test role:', dbCleanErr);
    }

    // Exit cleanly
    process.exit(0);
  }
}

testLiveConfigPropagation();
