const BASE_URL = '/api/v1';

// We need the token/auth. Since we are testing with full DB, 
// the user's browser should send HttpOnly cookies automatically with fetch.
// In case of need for manual override, we can set headers (e.g. x-user-id).
const getHeaders = () => ({
  'Content-Type': 'application/json',
});

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || res.statusText);
  }
  return res.json();
};

export const AdminAPI = {

  // --- Buildings & Locations ---
  getBuildings: () => 
    fetch(`${BASE_URL}/org/buildings`, { headers: getHeaders() }).then(handleResponse),
  
  saveBuildings: (buildings: any[]) => 
    fetch(`${BASE_URL}/org/buildings`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ buildings }) }).then(handleResponse),

  // --- Institutional Structure ---
  getInstitutionalTree: () => 
    fetch(`${BASE_URL}/org/tree`, { headers: getHeaders() }).then(handleResponse),
  
  saveInstitutionalTree: (tree: any) => 
    fetch(`${BASE_URL}/org/tree`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ tree }) }).then(handleResponse),

  // --- Operational Structure ---
  getOperationalDepartments: () => 
    fetch(`${BASE_URL}/org/departments`, { headers: getHeaders() }).then(handleResponse),
  
  saveDepartmentsSnapshot: (departments: any[]) => 
    fetch(`${BASE_URL}/org/departments/snapshot`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ departments }) }).then(handleResponse),

  createOperationalDepartment: (name: string, routingStrategy = 'POOL') => 
    fetch(`${BASE_URL}/org/departments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name, routingStrategy }) }).then(handleResponse),
  
  deleteOperationalDepartment: (id: string) => 
    fetch(`${BASE_URL}/org/departments/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  createDivision: (name: string, departmentId: number) => 
    fetch(`${BASE_URL}/org/divisions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name, departmentId }) }).then(handleResponse),

  createTeam: (name: string, departmentId: number) => 
    fetch(`${BASE_URL}/org/teams`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name, departmentId }) }).then(handleResponse),

  // --- Users & Assignments ---
  getUserPool: () => 
    fetch(`${BASE_URL}/org/users/pool`, { headers: getHeaders() }).then(handleResponse),

  assignUser: (userId: number, departmentId?: number | null, teamId?: number | null, roleId?: number) => 
    fetch(`${BASE_URL}/org/users/assign`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ userId, departmentId, teamId, roleId }) }).then(handleResponse),

  unassignUser: (userId: number, fallbackRoleId = 2) => 
    fetch(`${BASE_URL}/org/users/${userId}/unassign`, { method: 'DELETE', headers: getHeaders(), body: JSON.stringify({ employeeRoleId: fallbackRoleId }) }).then(handleResponse),

  // --- UI Layout Engine ---
  getLayouts: () => 
    fetch(`${BASE_URL}/layouts`, { headers: getHeaders() }).then(handleResponse),
  
  createLayout: (data: any) => 
    fetch(`${BASE_URL}/layouts`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

  updateLayout: (id: string, data: any) => 
    fetch(`${BASE_URL}/layouts/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  assignLayoutToUser: (userId: number, interfaceId: string) => 
    fetch(`${BASE_URL}/org/layouts/assign`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ userId, interfaceId }) }).then(handleResponse),

  // --- Ticket Routing ---
  getRoutes: (departmentId?: number) => 
    fetch(`${BASE_URL}/routing/routes${departmentId ? `?departmentId=${departmentId}` : ''}`, { headers: getHeaders() }).then(handleResponse),

  saveRoutesSnapshot: (routes: any[]) => 
    fetch(`${BASE_URL}/routing/routes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ routes }) }).then(handleResponse),

  createRoute: (route: any) => 
    fetch(`${BASE_URL}/routing/routes/single`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(route) }).then(handleResponse),

  updateRoute: (id: string, route: any) => 
    fetch(`${BASE_URL}/routing/routes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(route) }).then(handleResponse),
    
  deleteRoute: (id: string) => 
    fetch(`${BASE_URL}/routing/routes/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // --- Dynamic Fields ---
  getDynamicFields: () =>
    fetch(`${BASE_URL}/routing/dynamic-fields`, { headers: getHeaders() }).then(handleResponse),

  saveDynamicFields: (fields: any[]) =>
    fetch(`${BASE_URL}/routing/dynamic-fields`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ fields }) }).then(handleResponse),
};
