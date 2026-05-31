import { EventBus } from '../src/engine/events/EventBus';
import { RealTimeSynchronizer } from '../src/services/RealTimeSynchronizer';
import { WorkflowEngine } from '../src/engine/workflow/WorkflowEngine';

async function runRealTimeTest() {
  console.log('=== STARTING REAL-TIME EVENTBUS INTEGRATION TEST ===\n');

  let permissionsUpdatedFired = false;
  let ticketTransferredFired = false;
  let receivedPayload: any = null;

  // 1. تسجيل مستمعي الأحداث على الـ EventBus
  const handlePermissionsUpdated = (payload: any) => {
    console.log('✓ EventBus received: PERMISSIONS_UPDATED', payload);
    permissionsUpdatedFired = true;
  };

  const handleTicketTransferred = (payload: any) => {
    console.log('✓ EventBus received: TICKET_TRANSFERRED', payload);
    ticketTransferredFired = true;
    receivedPayload = payload;
  };

  EventBus.on('PERMISSIONS_UPDATED', handlePermissionsUpdated);
  EventBus.on('TICKET_TRANSFERRED', handleTicketTransferred);

  console.log('Step 1: Registered EventBus listeners for PERMISSIONS_UPDATED and TICKET_TRANSFERRED.');

  // 2. ربط جلسة مستخدم بقسم IT وصلاحيات معينة
  const sessionId = 'test-session-it';
  const userPermissions = ['dept_handler_IT'];
  const userDepartment = 'IT';
  
  RealTimeSynchronizer.connect(userPermissions, userDepartment, sessionId);
  console.log(`Step 2: Connected session "${sessionId}" (Department: ${userDepartment}, Permissions: ${userPermissions}) to RealTimeSynchronizer.`);

  // 3. اختبار بث حدث تحديث الصلاحيات PERMISSIONS_UPDATED
  console.log('\nTest A: Broadcasting PERMISSIONS_UPDATED...');
  RealTimeSynchronizer.broadcast('PERMISSIONS_UPDATED', { roleName: 'Employee' });
  
  if (permissionsUpdatedFired) {
    console.log('✓ Success: PERMISSIONS_UPDATED broadcast routed successfully.');
  } else {
    throw new Error('✗ Failure: PERMISSIONS_UPDATED broadcast was not received!');
  }

  // 4. اختبار بث تحويل تذكرة إلى قسم مخول (IT)
  console.log('\nTest B: Broadcasting TICKET_TRANSFERRED into authorized department (IT)...');
  const payloadAuthorized = { ticketId: 'TKT-TEST-999', department: 'IT' };
  RealTimeSynchronizer.broadcast('TICKET_TRANSFERRED', payloadAuthorized);

  if (ticketTransferredFired && receivedPayload?.ticketId === 'TKT-TEST-999') {
    console.log('✓ Success: TICKET_TRANSFERRED routed into authorized session.');
  } else {
    throw new Error('✗ Failure: TICKET_TRANSFERRED was blocked or not received!');
  }

  // إعادة تهيئة حالة الفحص للاختبار التالي
  ticketTransferredFired = false;
  receivedPayload = null;

  // 5. اختبار تصفية بث تحويل تذكرة إلى قسم غير مخول (HR) للمستمع الحالي
  console.log('\nTest C: Broadcasting TICKET_TRANSFERRED into unauthorized department (HR)...');
  const payloadUnauthorized = { ticketId: 'TKT-TEST-888', department: 'HR' };
  RealTimeSynchronizer.broadcast('TICKET_TRANSFERRED', payloadUnauthorized);

  if (!ticketTransferredFired) {
    console.log('✓ Success: TICKET_TRANSFERRED for unauthorized department (HR) was successfully filtered/blocked.');
  } else {
    throw new Error('✗ Failure: TICKET_TRANSFERRED for unauthorized department leaked to the session!');
  }

  // 6. الحماية ضد تسريب الذاكرة: إلغاء الاشتراك وإغلاق الجلسات
  console.log('\nStep 3: Disconnecting session and cleaning up EventBus listeners...');
  RealTimeSynchronizer.disconnect(sessionId);
  EventBus.off('PERMISSIONS_UPDATED', handlePermissionsUpdated);
  EventBus.off('TICKET_TRANSFERRED', handleTicketTransferred);

  // إطلاق أحداث للتأكد من عدم استدعاء المستمعين بعد إلغاء الاشتراك
  permissionsUpdatedFired = false;
  ticketTransferredFired = false;

  console.log('Test D: Verifying that firing events after off() does not trigger handlers...');
  EventBus.emit('PERMISSIONS_UPDATED', { roleName: 'Employee' });
  EventBus.emit('TICKET_TRANSFERRED', { ticketId: 'TKT-STALE', department: 'IT' });

  if (!permissionsUpdatedFired && !ticketTransferredFired) {
    console.log('✓ Success: No callbacks were fired. Cleanup protocol is fully secure.');
  } else {
    throw new Error('✗ Failure: EventBus callbacks fired after unregistering! Memory Leak hazard.');
  }

  console.log('\n=== ALL REAL-TIME EVENTBUS INTEGRATION TESTS PASSED! ===');
}

runRealTimeTest().catch((err) => {
  console.error('\n✗ REAL-TIME TEST RUN FAILED:', err);
  process.exit(1);
});
