const BASE_URL = '/api/v1';

/**
 * Shared headers for all API calls.
 * Authentication strategy:
 *  - Primary:  HttpOnly cookie `litc_session` (JWT) — sent automatically via credentials: 'include'.
 *  - Fallback:  localStorage.getItem('litc_token') — used when token was explicitly returned from /auth/login.
 * NEVER use hard-coded mock tokens in production or development.
 */
const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Check sessionStorage first, then fallback to localStorage
  const token = typeof window !== 'undefined' 
    ? (sessionStorage.getItem('litc_token') || localStorage.getItem('litc_token')) 
    : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
};

export const AdminAPI = {
  // ─── SOC & Enterprise Security ───────────────────────────────────────────
  getSOCTelemetry: () =>
    fetch(`${BASE_URL}/admin/soc/telemetry`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  getWAFNodes: () =>
    fetch(`${BASE_URL}/admin/soc/waf-nodes`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  updateWAFNode: (id: string, status: string) =>
    fetch(`${BASE_URL}/admin/soc/waf-nodes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status })
    }).then(handleResponse),

  getWAFRules: () =>
    fetch(`${BASE_URL}/admin/soc/waf-rules`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  createWAFRule: (data: { ruleType: string; target: string; action: string }) =>
    fetch(`${BASE_URL}/admin/soc/waf-rules`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteWAFRule: (id: string) =>
    fetch(`${BASE_URL}/admin/soc/waf-rules/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse),

  getSIEMLogs: (params?: { severity?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetch(`${BASE_URL}/admin/soc/siem-logs${qs}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },

  getAuditLogs: (params?: { entity?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.entity) q.set('entity', params.entity);
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetch(`${BASE_URL}/admin/soc/audit-logs${qs}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },

  getActiveSessions: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetch(`${BASE_URL}/admin/soc/sessions${qs}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse);
  },

  kickUserSession: (userId: number | string, reason?: string) =>
    fetch(`${BASE_URL}/admin/soc/sessions/${userId}/kick`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reason })
    }).then(handleResponse),

  unfreezeUserSession: (userId: number | string) =>
    fetch(`${BASE_URL}/admin/soc/sessions/${userId}/unfreeze`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse),

  terminateUserSession: (userId: number | string) =>
    fetch(`${BASE_URL}/admin/soc/sessions/${userId}/terminate-session`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse),

  // ─── Buildings & Locations ────────────────────────────────────────────────
  getBuildings: () =>
    fetch(`${BASE_URL}/org/buildings`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  saveBuildings: (buildings: any[]) =>
    fetch(`${BASE_URL}/org/buildings`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ buildings }) }).then(handleResponse),

  // ─── Institutional Structure ──────────────────────────────────────────────
  getInstitutionalTree: () =>
    fetch(`${BASE_URL}/org/tree`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  saveInstitutionalTree: (tree: any) =>
    fetch(`${BASE_URL}/org/tree`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ tree }) }).then(handleResponse),

  /** جلب عقد الشجرة المؤسسية (الإدارات، الأقسام، الفرق) — تُستخدم لتقييد الإضافات التشغيلية */
  getInstitutionalNodes: () =>
    fetch(`${BASE_URL}/org/institutional-nodes`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  checkDepartmentDependencies: (name: string) =>
    fetch(`${BASE_URL}/org/departments/dependency-check?name=${encodeURIComponent(name)}`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),
    
  smartDeleteDepartment: (payload: any) =>
    fetch(`${BASE_URL}/org/departments/smart-delete`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(payload) }).then(handleResponse),

  // ─── Operational Structure ────────────────────────────────────────────────
  getOperationalDepartments: () =>
    fetch(`${BASE_URL}/org/departments`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  saveDepartmentsSnapshot: (departments: any[]) =>
    fetch(`${BASE_URL}/org/departments/snapshot`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ departments }) }).then(handleResponse),

  createOperationalDepartment: (name: string, routingStrategy = 'POOL') =>
    fetch(`${BASE_URL}/org/departments`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ name, routingStrategy }) }).then(handleResponse),

  deleteOperationalDepartment: (id: string) =>
    fetch(`${BASE_URL}/org/departments/${id}`, { method: 'DELETE', headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  createDivision: (name: string, departmentId: number) =>
    fetch(`${BASE_URL}/org/divisions`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ name, departmentId }) }).then(handleResponse),

  createTeam: (name: string, departmentId: number) =>
    fetch(`${BASE_URL}/org/teams`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ name, departmentId }) }).then(handleResponse),

  // ─── Users & Assignments ──────────────────────────────────────────────────
  getUserPool: () =>
    fetch(`${BASE_URL}/org/users/pool`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  assignUser: (userId: number, departmentId?: number | null, teamId?: number | null, roleId?: number) =>
    fetch(`${BASE_URL}/org/users/assign`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ userId, departmentId, teamId, roleId }) }).then(handleResponse),

  unassignUser: (userId: number, fallbackRoleId = 2) =>
    fetch(`${BASE_URL}/org/users/${userId}/unassign`, { method: 'DELETE', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ employeeRoleId: fallbackRoleId }) }).then(handleResponse),

  // ─── UI Layout Engine ──────────────────────────────────────────────────────
  getLayouts: () =>
    fetch(`${BASE_URL}/layouts`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  createLayout: (data: any) =>
    fetch(`${BASE_URL}/layouts`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify(data) }).then(handleResponse),

  updateLayout: (id: string, data: any) =>
    fetch(`${BASE_URL}/layouts/${id}`, { method: 'PUT', headers: getHeaders(), credentials: 'include', body: JSON.stringify(data) }).then(handleResponse),

  assignLayoutToUser: (userId: number, interfaceId: string) =>
    fetch(`${BASE_URL}/org/layouts/assign`, { method: 'POST', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ userId, interfaceId }) }).then(handleResponse),

  // ─── Admin: Ticket Routing (CRUD) ─────────────────────────────────────────
  getRoutes: (departmentId?: number) =>
    fetch(`${BASE_URL}/routing/routes${departmentId ? `?departmentId=${departmentId}` : ''}`, {
      headers: getHeaders(), credentials: 'include'
    }).then(handleResponse),

  saveRoutesSnapshot: (routes: any[]) =>
    fetch(`${BASE_URL}/routing/routes`, {
      method: 'POST', headers: getHeaders(), credentials: 'include',
      body: JSON.stringify({ routes })
    }).then(handleResponse),

  createRoute: (route: any) =>
    fetch(`${BASE_URL}/routing/routes/single`, {
      method: 'POST', headers: getHeaders(), credentials: 'include',
      body: JSON.stringify(route)
    }).then(handleResponse),

  updateRoute: (id: string, route: any) =>
    fetch(`${BASE_URL}/routing/routes/${id}`, {
      method: 'PUT', headers: getHeaders(), credentials: 'include',
      body: JSON.stringify(route)
    }).then(handleResponse),

  deleteRoute: (id: string) =>
    fetch(`${BASE_URL}/routing/routes/${id}`, {
      method: 'DELETE', headers: getHeaders(), credentials: 'include'
    }).then(handleResponse),

  // ─── Admin: Dynamic Fields ────────────────────────────────────────────────
  getDynamicFields: () =>
    fetch(`${BASE_URL}/routing/dynamic-fields`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  saveDynamicFields: (fields: any[]) =>
    fetch(`${BASE_URL}/routing/dynamic-fields`, {
      method: 'POST', headers: getHeaders(), credentials: 'include',
      body: JSON.stringify({ fields })
    }).then(handleResponse),

  // ─── Admin: Request Management ────────────────────────────────────────────
  getAllRequests: (params?: { status?: string; routeId?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.routeId) query.set('routeId', params.routeId);
    if (params?.page) query.set('page', String(params.page));
    // ⚠️ Fix: BASE_URL is already '/api/v1'. Do NOT prefix with /v1 again.
    return fetch(`${BASE_URL}/functional/admin/requests?${query}`, {
      headers: getHeaders(), credentials: 'include'
    }).then(handleResponse);
  },

  updateRequestStatus: (id: number, status: string, resolutionNotes?: string) =>
    // ⚠️ Fix: BASE_URL is already '/api/v1'. Do NOT prefix with /v1 again.
    fetch(`${BASE_URL}/functional/admin/requests/${id}/status`, {
      method: 'PATCH', headers: getHeaders(), credentials: 'include',
      body: JSON.stringify({ status, resolutionNotes })
    }).then(handleResponse),

  // ─── Employee: Get Public Active Routes ───────────────────────────────────
  /** جلب المسارات النشطة فقط — متاحة لجميع الموظفين المسجلين */
  getPublicRoutes: () =>
    fetch(`${BASE_URL}/routing/routes/public`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // ─── Employee: Submit Ticket Request ─────────────────────────────────────
  /**
   * إرسال طلب جديد من الموظف عبر مسار محدد
   * يرسل إلى POST /api/v1/tickets (يُعالج بواسطة FunctionalController.createTicket)
   */
  submitTicketRequest: (data: {
    routeId: string;
    title: string;
    description?: string;
    taxonomyMain?: string;
    taxonomySub?: string;
    buildingId?: string;
    departmentId?: string | number;
    fields?: Record<string, string>;
  }) =>
    fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(handleResponse),

  // ─── Employee: My Requests ────────────────────────────────────────────────
  // ⚠️ Fix: BASE_URL is already '/api/v1'. Do NOT prefix with /v1 again.
  getMyRequests: () =>
    fetch(`${BASE_URL}/functional/requests`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  // ─── Auth Helpers ─────────────────────────────────────────────────────────
  /** POST /api/v1/auth/login — تسجيل الدخول وحفظ الـ token في localStorage */
  login: (email: string, password: string) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    }).then(async (res) => {
      const data = await handleResponse(res);
      // Store token for Bearer fallback (cookie is set automatically by server)
      if (data.token) localStorage.setItem('litc_token', data.token);
      return data;
    }),

  /** POST /api/v1/auth/logout — تسجيل الخروج وحذف الـ token المحلي */
  logout: () =>
    fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    }).then((res) => {
      localStorage.removeItem('litc_token');
      return handleResponse(res);
    }),

  // ─── Identity & Microsoft Entra ID Sync ──────────────────────────────────
  getIdentityConfig: () =>
    fetch(`${BASE_URL}/identity/config`, { headers: getHeaders(), credentials: 'include' }).then(handleResponse),

  saveIdentityConfig: (data: {
    tenantId: string;
    clientId: string;
    clientSecret?: string;
    redirectUri?: string;
    autoSyncEnabled?: boolean;
    syncIntervalMinutes?: number;
  }) =>
    fetch(`${BASE_URL}/identity/config`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(handleResponse),

  testIdentityConnection: (data?: {
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
  }) =>
    fetch(`${BASE_URL}/identity/test-connection`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data || {})
    }).then(handleResponse),

  syncEntraUsers: () =>
    fetch(`${BASE_URL}/identity/sync`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse),

  patchIdentityUser: (userId: number | string, data: {
    name?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    departmentId?: number | null;
    managerId?: number | null;
    isActive?: boolean;
    roleId?: number;
  }) =>
    fetch(`${BASE_URL}/identity/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(handleResponse),
};

