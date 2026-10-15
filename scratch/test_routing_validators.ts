import { routeSchema, saveRoutesSnapshotSchema, dynamicCustomFieldSchema } from './src/backend/validators/RoutingValidators';

console.log('Testing RoutingValidators...');

const sampleRoute = {
  id: 'route-test-1',
  name: 'طلب صيانة أجهزة',
  departmentId: 1,
  defaultPriority: 'HIGH',
  color: '#3B82F6',
  icon: 'Wrench',
  formConfig: {
    showDescription: true,
    mandatoryDescription: true,
    showAttachments: false,
    mandatoryAttachments: false,
    attachmentTypes: ['pdf'],
    maxAttachmentMB: 10
  },
  dynamicFields: [
    {
      id: 'field-1',
      name: 'نوع العطل',
      options: [
        { id: 'opt-1', label: 'شاشة مكسورة', isActive: true },
        { id: 'opt-2', label: 'لا يعمل الباور', isActive: true }
      ]
    }
  ]
};

try {
  routeSchema.parse(sampleRoute);
  console.log('✅ routeSchema validation PASSED!');
} catch (err) {
  console.error('❌ routeSchema validation FAILED:', err.errors);
  process.exit(1);
}

try {
  saveRoutesSnapshotSchema.parse({ routes: [sampleRoute] });
  console.log('✅ saveRoutesSnapshotSchema validation PASSED!');
} catch (err) {
  console.error('❌ saveRoutesSnapshotSchema validation FAILED:', err.errors);
  process.exit(1);
}

console.log('🎉 All validator tests passed perfectly!');
