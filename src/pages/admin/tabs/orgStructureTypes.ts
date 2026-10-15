export type OrgNode = {
  id: string;
  name: string;
  type: string;
  children: OrgNode[];
  shape?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export const initialOrgTree: OrgNode = {
  id: 'root-litc',
  name: 'مجلس الإدارة',
  type: 'إدارة عليا',
  children: [
    {
      id: 'node-board-office',
      name: 'مكتب مجلس الإدارة',
      type: 'مكتب',
      children: []
    },
    {
      id: 'node-internal-audit',
      name: 'مكتب المراجعة والرقابة الداخلية',
      type: 'مكتب',
      children: []
    },
    {
      id: 'node-general-management',
      name: 'الإدارة العامة والتنفيذية',
      type: 'إدارة عليا',
      children: [
        {
          id: 'node-it-dept',
          name: 'إدارة تقنية المعلومات',
          type: 'إدارة',
          children: [
            {
              id: 'node-it-support',
              name: 'قسم الدعم الفني والتشغيل',
              type: 'قسم',
              children: [
                { id: 'node-it-infra', name: 'فريق صيانة النظم والشبكات', type: 'فريق', children: [] }
              ]
            },
            {
              id: 'node-it-dev',
              name: 'قسم تطوير البرمجيات والأنظمة',
              type: 'قسم',
              children: [
                { id: 'node-it-digital', name: 'فريق التحول الرقمي', type: 'فريق', children: [] }
              ]
            }
          ]
        },
        {
          id: 'node-services-dept',
          name: 'إدارة الخدمات والمرافق العامة',
          type: 'إدارة',
          children: [
            {
              id: 'node-facility-maint',
              name: 'قسم الصيانة العامة والمرافق',
              type: 'قسم',
              children: []
            },
            {
              id: 'node-support-services',
              name: 'قسم الخدمات اللوجستية والمساندة',
              type: 'قسم',
              children: []
            }
          ]
        },
        {
          id: 'node-admin-finance-dept',
          name: 'إدارة الشؤون الإدارية والمالية',
          type: 'إدارة',
          children: [
            {
              id: 'node-hr-sec',
              name: 'قسم الموارد البشرية وشؤون الموظفين',
              type: 'قسم',
              children: []
            },
            {
              id: 'node-finance-sec',
              name: 'قسم الشؤون المالية والحسابات',
              type: 'قسم',
              children: []
            }
          ]
        },
        {
          id: 'node-commercial-dept',
          name: 'الادارة التجارية',
          type: 'إدارة',
          children: [
            {
              id: 'node-sales-sec',
              name: 'قسم المبيعات والتسويق',
              type: 'قسم',
              children: []
            },
            {
              id: 'node-customer-care-sec',
              name: 'قسم خدمة العملاء والمشتركين',
              type: 'قسم',
              children: []
            }
          ]
        }
      ]
    }
  ]
};
