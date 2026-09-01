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
  name: 'mock.board_of_directors',
  type: 'mock.top_management',
  children: [
    {
      id: 'n-2',
      name: 'mock.board_office',
      type: 'mock.office',
      children: []
    },
    {
      id: 'n-3',
      name: 'mock.internal_audit',
      type: 'mock.office',
      children: []
    },
    {
      id: 'n-4',
      name: 'mock.general_manager',
      type: 'mock.top_management',
      children: [
        { id: 'n-5', name: 'mock.hr_dept', type: 'mock.dept', children: [] },
        { id: 'n-6', name: 'mock.it_dept', type: 'mock.dept', children: [] }
      ]
    }
  ]
};
