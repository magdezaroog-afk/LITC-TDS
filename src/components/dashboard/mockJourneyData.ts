export interface SubTicketRef {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
  assignee?: string;
  department?: string;
}

export interface JourneyNode {
  id: string;
  type: 'SUBMITTED' | 'ROUTED' | 'ASSIGNED' | 'SUB_TICKET_SPAWNED' | 'SUB_TICKET_RESOLVED' | 'RESOLVED' | 'EVALUATED' | 'REJECTED';
  title: string;
  department?: string;
  assignee?: string;
  timestamp?: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
  subTickets?: SubTicketRef[];
}

export const MOCK_JOURNEYS: Record<string, JourneyNode[]> = {
  'TCK-1004': [
    { id: 'n1', type: 'SUBMITTED', title: 'تم رفع الطلب بنجاح', timestamp: '2023-10-25 09:00', status: 'COMPLETED' },
    { id: 'n2', type: 'ROUTED', title: 'توجيه للقسم المختص', department: 'الدعم الفني / الشبكات', timestamp: '2023-10-25 09:05', status: 'ACTIVE' },
    { id: 'n3', type: 'ASSIGNED', title: 'استلام التذكرة من قبل مهندس', status: 'PENDING' },
    { id: 'n4', type: 'RESOLVED', title: 'إنجاز التذكرة', status: 'PENDING' },
    { id: 'n5', type: 'EVALUATED', title: 'تقييم الموظف', status: 'PENDING' },
  ],
  'TCK-1005': [
    { id: 'n1', type: 'SUBMITTED', title: 'تم رفع الطلب بنجاح', timestamp: '2023-10-25 11:30', status: 'COMPLETED' },
    { id: 'n2', type: 'ROUTED', title: 'توجيه لقسم الصيانة', department: 'الصيانة والمرافق', timestamp: '2023-10-25 11:35', status: 'ACTIVE' },
    { id: 'n3', type: 'ASSIGNED', title: 'استلام التذكرة', status: 'PENDING' },
    { id: 'n4', type: 'RESOLVED', title: 'إنجاز التذكرة', status: 'PENDING' },
  ],
  'TCK-1002': [
    { id: 'n1', type: 'SUBMITTED', title: 'تم رفع الطلب بنجاح', timestamp: '2023-10-24 14:00', status: 'COMPLETED' },
    { id: 'n2', type: 'ROUTED', title: 'توجيه لقسم الدعم الفني', department: 'الدعم الفني', timestamp: '2023-10-24 14:15', status: 'COMPLETED' },
    { id: 'n3', type: 'ASSIGNED', title: 'قيد المعالجة', assignee: 'م. أحمد خالد', timestamp: '2023-10-24 14:30', status: 'COMPLETED' },
    { id: 'n4', type: 'SUB_TICKET_SPAWNED', title: 'طلب دعم إضافي (تذاكر فرعية)', timestamp: '2023-10-25 10:00', status: 'ACTIVE', subTickets: [
      { id: 'SUB-101', title: 'صرف حبر للطابعة', status: 'OPEN', department: 'المخازن', assignee: 'علي سالم' }
    ] },
    { id: 'n5', type: 'RESOLVED', title: 'إنجاز التذكرة', status: 'PENDING' },
    { id: 'n6', type: 'EVALUATED', title: 'التقييم', status: 'PENDING' },
  ],
  'TCK-1006': [
    { id: 'n1', type: 'SUBMITTED', title: 'تم رفع الطلب بنجاح', timestamp: '2023-10-25 13:00', status: 'COMPLETED' },
    { id: 'n2', type: 'ROUTED', title: 'توجيه مبدئي', department: 'شؤون الموظفين', timestamp: '2023-10-25 13:10', status: 'COMPLETED' },
    { id: 'n3', type: 'ROUTED', title: 'تحويل داخلي', department: 'أمن المعلومات', timestamp: '2023-10-25 14:00', status: 'ACTIVE' },
    { id: 'n4', type: 'ASSIGNED', title: 'قيد المراجعة', status: 'PENDING' },
    { id: 'n5', type: 'RESOLVED', title: 'اعتماد الصلاحيات', status: 'PENDING' },
  ],
  'TCK-1007': [
    { id: 'n1', type: 'SUBMITTED', title: 'تم رفع الطلب الطارئ', timestamp: '2023-10-25 08:00', status: 'COMPLETED' },
    { id: 'n2', type: 'ROUTED', title: 'توجيه مباشر للشبكات', department: 'إدارة الشبكات', timestamp: '2023-10-25 08:02', status: 'COMPLETED' },
    { id: 'n3', type: 'ASSIGNED', title: 'جاري الإصلاح', assignee: 'فريق الطوارئ', timestamp: '2023-10-25 08:15', status: 'COMPLETED' },
    { id: 'n4', type: 'SUB_TICKET_SPAWNED', title: 'متوقفة على تذكرة فرعية', timestamp: '2023-10-25 09:30', status: 'ACTIVE', subTickets: [
      { id: 'SUB-205', title: 'تمديد كابل ألياف ضوئية من المزود', status: 'OPEN', department: 'الشركة المزودة' }
    ] },
    { id: 'n5', type: 'RESOLVED', title: 'عودة الخدمة', status: 'PENDING' },
  ],
};
