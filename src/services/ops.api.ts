/**
 * ops.api.ts
 * ==========
 * خدمة API لواجهة الكادر التشغيلي
 * تتواصل مع /api/v1/ops/*
 */

const BASE = '/api/v1/ops';

function getHeaders() {
  const token = localStorage.getItem('litc_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res: Response) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || json.error || 'خطأ في الطلب');
  return json;
}

export const OpsAPI = {
  // قائمة انتظاري الشخصية
  getMyQueue: (params: { cursor?: number; limit?: number; status?: string; priority?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.cursor) q.set('cursor', String(params.cursor));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.priority) q.set('priority', params.priority);
    return fetch(`${BASE}/queue?${q}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },

  // كل الطلبات (حسب نطاق الدور)
  getAllTickets: (params: { cursor?: number; limit?: number; status?: string; priority?: string; search?: string; unassigned?: boolean } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return fetch(`${BASE}/tickets?${q}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },

  // تفاصيل تذكرة
  getTicketDetails: (id: number) =>
    fetch(`${BASE}/tickets/${id}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // تنفيذ إجراء
  executeAction: (id: number, payload: {
    type: 'ACCEPT' | 'CLOSE' | 'REQUEST_CLOSURE' | 'APPROVE_CLOSURE' | 'REJECT_CLOSURE' | 'REASSIGN' | 'INTERNAL_TRANSFER' | 'ACCEPT_HANDOVER' | 'REJECT_HANDOVER' | 'ESCALATE' | 'REQUEST_INFO' | 'REOPEN';
    note?: string;
    resolutionNote?: string;
    targetDeptId?: number;
    techId?: number;
    transferTargetType?: 'COLLEAGUE' | 'DEPARTMENT';
    targetUserId?: number;
    mode?: 'DIRECT' | 'REQUIRE_ACCEPTANCE';
  }) =>
    fetch(`${BASE}/tickets/${id}/action`, {
      method: 'POST', headers: getHeaders(), credentials: 'include',
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // إضافة تعليق
  addComment: (id: number, bodyText: string, isInternal = false) =>
    fetch(`${BASE}/tickets/${id}/comment`, {
      method: 'POST', headers: getHeaders(), credentials: 'include',
      body: JSON.stringify({ bodyText, isInternal })
    }).then(handleResponse),

  // إحصائيات Dashboard
  getStats: () =>
    fetch(`${BASE}/stats`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // تقرير ملخص
  getSummaryReport: (params: { from?: string; to?: string; deptId?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return fetch(`${BASE}/reports/summary?${q}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },

  // تقرير بيانات النماذج
  getFormDataReport: (params: { flowId?: string; fieldKey?: string; from?: string; to?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return fetch(`${BASE}/reports/form-data?${q}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },

  // الإدارات المتاحة للتحويل
  getDepartments: () =>
    fetch(`${BASE}/departments`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // الكادر المتاح للتعيين
  getAgents: () =>
    fetch(`${BASE}/agents`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // الزملاء المتاحين للتحويل ضمن المسار نفسه
  getTicketFlowMembers: (ticketId: number) =>
    fetch(`${BASE}/tickets/${ticketId}/flow-members`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // المهام والتذاكر الداخلية الفرعية لتذكرة معينة
  getSubTickets: (ticketId: number) =>
    fetch(`${BASE}/tickets/${ticketId}/sub-tickets`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // فتح تذكرة داخلية فرعية جديدة
  createSubTicket: (ticketId: number, payload: {
    title: string;
    description: string;
    targetDeptId: number;
    targetDivisionId?: string;
    priority?: string;
  }) =>
    fetch(`${BASE}/tickets/${ticketId}/sub-tickets`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // كافة التذاكر والمهام الداخلية (تبويب مخصص في منصة العمل)
  getAllSubTickets: (params: { cursor?: number; limit?: number; status?: string; priority?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return fetch(`${BASE}/sub-tickets?${q}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },
};

