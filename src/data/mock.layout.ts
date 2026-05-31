/**
 * LITC-TS v43.0 - Mock Page Layout
 * بيانات اختبارية لضمان سلامة التكامل بين الـ API والـ Renderer.
 */

import { PageLayout } from '../types/component.types';

export const mockDashboardLayout: PageLayout = {
  pageName: 'MainDashboard',
  components: [
    {
      id: 'stat-001',
      type: 'StatsWidget', // المكون الجديد
      permissions: ['admin'],
      policy: 'global',
      props: { title: 'إجمالي المستخدمين', value: 1250 }
    },
    {
      id: 'btn-001',
      type: 'ActionButton', // المكون السابق
      permissions: ['admin'],
      policy: 'global',
      props: {
        label: 'تحديث البيانات',
        variant: 'secondary',
        onClick: () => console.log('Refreshing...')
      }
    }
  ]
};
