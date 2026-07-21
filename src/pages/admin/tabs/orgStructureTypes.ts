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
  id: 'root-1',
  name: 'مجلس الإدارة',
  type: 'إدارة عليا',
  children: [
    {
      id: 'n-2',
      name: 'مكتب شؤون مجلس الإدارة',
      type: 'مكتب',
      children: []
    },
    {
      id: 'n-3',
      name: 'مكتب المراجعة الداخلية',
      type: 'مكتب',
      children: []
    },
    {
      id: 'n-4',
      name: 'المدير العام',
      type: 'إدارة عليا',
      children: [
        { id: 'n-5', name: 'إدارة الموارد البشرية', type: 'إدارة', children: [] },
        { id: 'n-6', name: 'إدارة تقنية المعلومات', type: 'إدارة', children: [] }
      ]
    }
  ]
};
