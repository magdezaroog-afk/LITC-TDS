import { WorkflowEngine, Ticket } from './src/engine/workflow/WorkflowEngine';

async function testWorkflow() {
  console.log('=== STARTING WORKFLOW ENGINE INTEGRATION TEST ===\n');

  // 1. تهيئة التذاكر
  const parentId = 'TKT-PARENT';
  const childId = 'TKT-CHILD';

  const parentTicket: Ticket = {
    id: parentId,
    title: 'تذكرة رئيسية: تعطل خادم الشبكة',
    description: 'يوجد انقطاع كامل في الاتصال بالدور الرابع',
    status: 'in-progress',
    mainCategory: 'Networks',
    subCategory: 'Server Down',
    attachments: [],
    location: 'Building A - Floor 4',
    department: 'IT',
    creatorId: 'usr-normal',
    childTicketIds: [childId],
    workflowPath: [],
    version: 0
  };

  const childTicket: Ticket = {
    id: childId,
    title: 'تذكرة فرعية: تبديل منفذ المحول switch port',
    description: 'فحص التوصيلات الكهربائية للمحول الرئيسي بالدور الرابع',
    status: 'new',
    mainCategory: 'Hardware',
    subCategory: 'Cabling',
    attachments: [],
    location: 'Building A - Floor 4 Server Room',
    department: 'Maintenance',
    creatorId: 'usr-tech',
    parentTicketId: parentId,
    childTicketIds: [],
    workflowPath: [],
    version: 0
  };

  WorkflowEngine.clearDatabase();
  WorkflowEngine.saveTicket(parentTicket);
  WorkflowEngine.saveTicket(childTicket);

  console.log('✓ Tickets registered in Workflow DB.');

  // 2. محاولة إغلاق التذكرة الرئيسية والفرعية لم تنتهِ (يجب أن تفشل)
  try {
    console.log('\nTest A: Attempting to close parent ticket while child is active...');
    WorkflowEngine.closeTicket(parentId, 'usr-normal', 'editor');
    throw new Error('✗ FAILED: Parent ticket was closed while child was active!');
  } catch (err: any) {
    if (err.message.includes('WORKFLOW_VIOLATION')) {
      console.log('✓ SUCCESS: Blocked closing parent ticket due to active child ticket.');
    } else {
      throw err;
    }
  }

  // 3. تحويل التذكرة الفرعية بين الأقسام
  console.log('\nTest B: Transferring child ticket from Maintenance to IT with security permission check...');
  WorkflowEngine.transferDepartment(
    childId,
    'Maintenance',
    'IT',
    'usr-tech',
    ['dept_handler_Maintenance'],
    'يحتاج فريق IT لمعاينة المنفذ بأنفسهم'
  );
  
  const updatedChild = WorkflowEngine.getTicket(childId)!;
  console.log(`New Department: ${updatedChild.department}`);
  console.log(`Workflow Steps Logged: ${updatedChild.workflowPath.length}`);
  console.log(`Step reason: "${updatedChild.workflowPath[0].reason}"`);
  if (updatedChild.department === 'IT' && updatedChild.workflowPath.length === 1) {
    console.log('✓ SUCCESS: Ticket transferred and handoff audit log recorded.');
  } else {
    throw new Error('✗ FAILED: Department transfer did not record properly.');
  }

  // 4. إغلاق التذكرة الفرعية ثم إغلاق التذكرة الرئيسية
  console.log('\nTest C: Resolving and closing child ticket...');
  // محاكاة إغلاق التذكرة الفرعية
  updatedChild.status = 'closed';
  WorkflowEngine.saveTicket(updatedChild);
  
  console.log('Test D: Retrying to close parent ticket now that child is closed...');
  WorkflowEngine.closeTicket(parentId, 'usr-normal', 'editor');
  
  const updatedParent = WorkflowEngine.getTicket(parentId)!;
  if (updatedParent.status === 'closed') {
    console.log('✓ SUCCESS: Parent ticket successfully closed after child ticket completion.');
  } else {
    throw new Error('✗ FAILED: Parent ticket was not closed.');
  }

  console.log('\n=== ALL WORKFLOW ENGINE TESTS PASSED SUCCESSFULLY! ===');
}

testWorkflow().catch(err => {
  console.error('\n✗ TEST RUN FAILED:', err);
  process.exit(1);
});
