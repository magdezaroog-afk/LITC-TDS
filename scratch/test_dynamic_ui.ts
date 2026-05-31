/**
 * LITC-TS v43.5 - Dynamic UI Fields Integration & Security Test
 * التحقق من سلامة محرك الحقول الديناميكية، منع الـ Prototype Pollution، والبث عبر ناقل الأحداث.
 */

import { executeGetDynamicFields, executeSetDynamicFields } from '../src/backend/controllers/DatabaseController';
import { EventBus } from '../src/engine/events/EventBus';
import { RealTimeSynchronizer } from '../src/services/RealTimeSynchronizer';
import { FieldDefinition } from '../src/types/dynamicFields';

async function runDynamicUITests() {
  console.log('================================================================');
  console.log('=== STARTING LITC-TS v43.5 DYNAMIC UI FIELDS INTEGRATION TEST ===');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 4;

  // تهيئة جلسة محاكاة للبث اللحظي لتمرير التحقق الأمني وتوجيه الأحداث
  RealTimeSynchronizer.connect(['admin'], 'IT', 'test_session');

  // 1. الاختبار الأول: تخزين واسترجاع الحقول بنجاح
  console.log('--- Test 1: Setting and Getting Dynamic Fields ---');
  const mockFields: FieldDefinition[] = [
    {
      fieldId: 'f1',
      type: 'text',
      label: 'عنوان بروتوكول الإنترنت IP',
      required: true,
      placeholder: '192.168.1.1'
    },
    {
      fieldId: 'f2',
      type: 'dropdown',
      label: 'نوع الجهاز',
      required: false,
      options: ['خادم', 'طابعة', 'موزع شبكة']
    }
  ];

  try {
    await executeSetDynamicFields('IT', mockFields);
    const retrieved = await executeGetDynamicFields('IT');

    if (retrieved.length === 2 && retrieved[0].label === 'عنوان بروتوكول الإنترنت IP' && retrieved[1].type === 'dropdown') {
      console.log('✓ Test 1 PASSED: Dynamic fields successfully stored and retrieved.');
      passedTests++;
    } else {
      console.error('✗ Test 1 FAILED: Mismatch in retrieved dynamic fields structure.');
    }
  } catch (err) {
    console.error('✗ Test 1 FAILED with error:', err);
  }

  // 2. الاختبار الثاني: بث حدث CONFIG_UPDATED عند تعديل الحقول
  console.log('\n--- Test 2: EventBus Configuration Update Broadcasting ---');
  let eventCaptured = false;
  let capturedPayload: any = null;

  const handleConfigUpdated = (payload: any) => {
    eventCaptured = true;
    capturedPayload = payload;
  };

  EventBus.on('CONFIG_UPDATED', handleConfigUpdated);

  try {
    const newFields: FieldDefinition[] = [
      { fieldId: 'f3', type: 'number', label: 'رقم المنفذ Port', required: true }
    ];

    await executeSetDynamicFields('IT', newFields);

    if (eventCaptured && capturedPayload && capturedPayload.departmentId === 'IT') {
      console.log('✓ Test 2 PASSED: Event CONFIG_UPDATED successfully broadcasted via EventBus.');
      console.log('  Captured Payload:', JSON.stringify(capturedPayload));
      passedTests++;
    } else {
      console.error('✗ Test 2 FAILED: CONFIG_UPDATED event was not captured or payload is invalid.');
    }
  } catch (err) {
    console.error('✗ Test 2 FAILED with error:', err);
  } finally {
    EventBus.off('CONFIG_UPDATED', handleConfigUpdated);
  }

  // 3. الاختبار الثالث: تجميد الكائنات والحماية من الـ Prototype Pollution
  console.log('\n--- Test 3: Prototype Pollution and Data Immutability Check ---');
  try {
    const fields = await executeGetDynamicFields('IT');
    
    if (Object.isFrozen(fields) && Object.isFrozen(fields[0])) {
      console.log('✓ Test 3.1: Retrieved array and object elements are correctly frozen.');
      
      // محاولة تعديل الخاصية للتحقق من منع التغيير
      try {
        (fields as any)[0].label = 'HACKED_LABEL';
      } catch (err) {
        // تم التقاط خطأ تعديل الكائنات المجمدة (في وضع strict)
      }
      
      if (fields[0].label !== 'HACKED_LABEL') {
        console.log('✓ Test 3.2: Modification of frozen label was blocked successfully (value did not change).');
        passedTests++;
      } else {
        console.error('✗ Test 3 FAILED: Mutation allowed on frozen fields! Value changed.');
      }
    } else {
      console.error('✗ Test 3 FAILED: Retrieved fields are not frozen! Prototype Pollution vulnerability exists.');
    }
  } catch (err) {
    console.error('✗ Test 3 FAILED with unexpected error:', err);
  }

  // 4. الاختبار الرابع: جلب حقول قسم غير موجود
  console.log('\n--- Test 4: Default Behavior for Non-existent Department ---');
  try {
    const emptyFields = await executeGetDynamicFields('NonExistentDept');
    if (Array.isArray(emptyFields) && emptyFields.length === 0) {
      console.log('✓ Test 4 PASSED: Non-existent department returns empty frozen array.');
      passedTests++;
    } else {
      console.error('✗ Test 4 FAILED: Expected empty array, got:', emptyFields);
    }
  } catch (err) {
    console.error('✗ Test 4 FAILED with error:', err);
  }

  // تنظيف الجلسة النشطة
  RealTimeSynchronizer.disconnect('test_session');

  // -------------------------------------------------------------
  // طباعة التقرير النهائي للسلامة والتناسق
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('===                DYNAMIC UI TEST REPORT                    ===');
  console.log('================================================================');
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Tests Passed:     ${passedTests} / ${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n STATUS: [GREEN] DYNAMIC UI ENGINE RUNTIME CHECKS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.log('\n STATUS: [RED] INTEGRITY CHECKS FAILED.');
    process.exit(1);
  }
}

runDynamicUITests().catch((err) => {
  console.error('CRITICAL RUNNER ERROR:', err);
  process.exit(1);
});
