import { prisma } from './src/db/client';
import { DynamicUIService } from './src/services/DynamicUIService';

async function main() {
  console.log('=== STARTING DYNAMIC UI & CACHE VALIDATION TEST ===\n');
  const uiService = new DynamicUIService();

  // 1. تهيئة البيانات التجريبية (Setup UI Metadata)
  console.log('Step 1: Setting up mock UI metadata...');

  const theme = await prisma.uITheme.create({
    data: { themeName: 'Test Blue', primaryColor: '#0052cc', secondaryColor: '#e6f0ff' }
  });

  const template = await prisma.uITemplate.create({
    data: { name: 'Engineer Portal v43', themeId: theme.id }
  });

  const role = await prisma.role.create({
    data: { name: 'Test_Staff_Engineer', templateId: template.id, defaultCanViewInternal: true }
  });

  const widget1 = await prisma.widget.create({
    data: { name: 'Ticket Core Form', type: 'TECHNICAL' } // Matches TECHNICAL ticketType
  });

  const widget2 = await prisma.widget.create({
    data: { name: 'User Feedback Panel', type: 'GENERAL' } // Matches all ticketTypes
  });

  const widget3 = await prisma.widget.create({
    data: { name: 'Finance Ledger Panel', type: 'FINANCE' } // Should be filtered out for TECHNICAL
  });

  // Link widgets to template with order indices
  const tw1 = await prisma.templateWidget.create({
    data: { templateId: template.id, widgetId: widget1.id, orderIndex: 0 }
  });
  const tw2 = await prisma.templateWidget.create({
    data: { templateId: template.id, widgetId: widget2.id, orderIndex: 1 }
  });
  const tw3 = await prisma.templateWidget.create({
    data: { templateId: template.id, widgetId: widget3.id, orderIndex: 2 }
  });

  // Create Widget Fields
  const f1 = await prisma.widgetField.create({
    data: { widgetId: widget1.id, fieldName: 'shortDescription', fieldType: 'TEXT', orderIndex: 0 }
  });
  const f2 = await prisma.widgetField.create({
    data: { widgetId: widget1.id, fieldName: 'impactLevel', fieldType: 'SELECT', orderIndex: 1 }
  });

  // Create Action and Action Links
  const action = await prisma.action.create({
    data: { name: 'Save Ticket Draft', apiEndpoint: '/api/v1/tickets/draft' }
  });

  const widgetAction = await prisma.widgetAction.create({
    data: { widgetId: widget1.id, actionId: action.id, roleId: role.id, orderIndex: 0 }
  });

  // Create TicketState and State Transitions
  const stateResolved = await prisma.ticketState.create({
    data: { name: 'TEST_RESOLVED', label: 'Resolved' }
  });
  const stateClosed = await prisma.ticketState.create({
    data: { name: 'TEST_CLOSED', label: 'Closed' }
  });

  const transition = await prisma.ticketStateTransition.create({
    data: {
      fromStateId: stateResolved.id,
      toStateId: stateClosed.id,
      roleId: role.id,
      triggerEndpoint: null
    }
  });

  console.log('Mock UI metadata successfully created.\n');

  try {
    // 2. الاستعلام الأول (First Query - Cache Miss)
    console.log('Test 2: Retrieving UI config for the first time (Expect Database Source)...');
    const start1 = performance.now();
    const config1 = await uiService.getFormConfiguration(role.id, stateResolved.id, 'TECHNICAL');
    const end1 = performance.now();
    const time1 = end1 - start1;

    console.log(`Source: ${config1._metadata.source}`);
    console.log(`Time taken: ${time1.toFixed(2)} ms`);
    console.log(`Template resolved: "${config1.templateName}"`);
    console.log(`Theme: Primary="${config1.theme.primaryColor}"`);
    console.log(`Total Widgets returned: ${config1.widgets.length} (Expected: 2, actual: ${config1.widgets.length})`);

    // Verify widgets returned
    const widgetNames = config1.widgets.map((w: any) => w.name);
    console.log(`Resolved Widgets: [${widgetNames.join(', ')}]`);
    if (widgetNames.includes('Finance Ledger Panel')) {
      throw new Error('✗ FAILED: Finance widget should have been filtered out!');
    }
    console.log('✓ SUCCESS: UI Configuration resolved and filtered correctly.');

    // Verify dynamic actions injected
    const technicalWidget = config1.widgets.find((w: any) => w.type === 'TECHNICAL');
    const actionLabels = technicalWidget.actions.map((a: any) => a.label);
    console.log(`Injected actions in TECHNICAL widget: [${actionLabels.join(', ')}]`);
    if (actionLabels.includes('Save Ticket Draft') && actionLabels.includes('Move to Closed')) {
      console.log('✓ SUCCESS: Custom actions and State Transitions injected successfully.');
    } else {
      throw new Error('✗ FAILED: Expected custom actions and transitions to be injected.');
    }

    // 3. الاستعلام الثاني (Second Query - Cache Hit)
    console.log('\nTest 3: Querying the exact same configuration again (Expect Cache Source)...');
    const start2 = performance.now();
    const config2 = await uiService.getFormConfiguration(role.id, stateResolved.id, 'TECHNICAL');
    const end2 = performance.now();
    const time2 = end2 - start2;

    console.log(`Source: ${config2._metadata.source}`);
    console.log(`Time taken: ${time2.toFixed(4)} ms`);
    if (config2._metadata.source === 'cache') {
      console.log('✓ SUCCESS: Configuration retrieved directly from in-memory cache.');
    } else {
      throw new Error('✗ FAILED: Expected configuration to be returned from cache.');
    }

    // 4. اختبار إبطال الكاش عند التعديل (Test Cache Invalidation)
    console.log('\nTest 4: Simulating UI update and cache invalidation...');
    uiService.invalidateCache();

    console.log('Querying configuration after invalidation (Expect Database Source again)...');
    const start3 = performance.now();
    const config3 = await uiService.getFormConfiguration(role.id, stateResolved.id, 'TECHNICAL');
    const end3 = performance.now();
    const time3 = end3 - start3;

    console.log(`Source: ${config3._metadata.source}`);
    console.log(`Time taken: ${time3.toFixed(2)} ms`);
    if (config3._metadata.source === 'database') {
      console.log('✓ SUCCESS: Cache was successfully invalidated and rebuilt from database.');
    } else {
      throw new Error('✗ FAILED: Expected cache miss after invalidation.');
    }

  } finally {
    // 5. تنظيف قاعدة البيانات (Cleanup)
    console.log('\nStep 5: Cleaning up mock UI data...');
    await prisma.ticketStateTransition.delete({ where: { id: transition.id } });
    await prisma.ticketState.deleteMany({ where: { id: { in: [stateResolved.id, stateClosed.id] } } });
    await prisma.widgetAction.delete({ where: { id: widgetAction.id } });
    await prisma.action.delete({ where: { id: action.id } });
    await prisma.widgetField.deleteMany({ where: { id: { in: [f1.id, f2.id] } } });
    await prisma.templateWidget.deleteMany({ where: { id: { in: [tw1.id, tw2.id, tw3.id] } } });
    await prisma.widget.deleteMany({ where: { id: { in: [widget1.id, widget2.id, widget3.id] } } });
    await prisma.user.deleteMany({ where: { roleId: role.id } });
    await prisma.role.delete({ where: { id: role.id } });
    await prisma.uITemplate.delete({ where: { id: template.id } });
    await prisma.uITheme.delete({ where: { id: theme.id } });
    console.log('Cleanup completed. Database is pristine.');
  }

  console.log('\n=== ALL UI & CACHE TESTS PASSED SUCCESSFULLY! ===');
}

main()
  .catch((err) => {
    console.error('\n✗ TEST RUN FAILED WITH ERROR:', err);
    process.exit(1);
  });
