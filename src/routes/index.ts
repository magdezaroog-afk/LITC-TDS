import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requireRole } from '../middlewares/requireRole';
import { FlowController } from '../backend/controllers/FlowController';
import { UECPController } from '../backend/controllers/UECPController';
import { AuthController } from '../backend/controllers/AuthController';
import { SecurityController } from '../backend/controllers/SecurityController';
import { TicketController } from '../backend/controllers/TicketController';
import { UECPGatewayController } from '../backend/controllers/UECPGatewayController';
import { UECPMiddleware } from '../backend/security/UECPMiddleware';
import { AnalyticsController } from '../backend/controllers/AnalyticsController';
import { OperationalAdminController } from '../backend/controllers/OperationalAdminController';
import { getBranding, updateBranding } from '../backend/controllers/BrandingController';
const router = Router();
const flowController = new FlowController();
const uecpController = new UECPController();
const authController = new AuthController();
const ticketController = new TicketController();
const uecpGatewayController = new UECPGatewayController();
// =========================================================================
// 0. Auth & Session Management
// =========================================================================
router.post('/auth/login', (req, res, next) => authController.login(req, res, next));
router.post('/auth/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));
router.get('/auth/me', authMiddleware, (req, res, next) => authController.me(req, res, next));
router.get('/auth/setup-2fa', authMiddleware, (req, res, next) => authController.setup2FA(req, res, next));
router.post('/auth/enable-2fa', authMiddleware, (req, res, next) => authController.enable2FA(req, res, next));
router.post('/auth/impersonate', authMiddleware, requireRole([1, 22]), (req, res, next) => authController.impersonate(req, res, next));

// =========================================================================
// 0.5. Forti-SOC Security & Telemetry (Super Admin)
// =========================================================================
router.get('/admin/soc/telemetry', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.getSystemMetrics(req, res));
router.get('/admin/soc/waf-nodes', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.getWAFNodes(req, res));
router.put('/admin/soc/waf-nodes/:id', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.updateNodeStatus(req, res));
router.get('/admin/soc/waf-rules', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.getWAFRules(req, res));
router.post('/admin/soc/waf-rules', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.createWAFRule(req, res));
router.delete('/admin/soc/waf-rules/:id', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.deleteWAFRule(req, res));
router.get('/admin/soc/siem-logs', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.getSIEMLogs(req, res));
router.get('/admin/soc/sessions', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.getActiveSessions(req, res));
router.post('/admin/soc/sessions/:userId/kick', authMiddleware, requireRole([1, 22]), (req, res, next) => SecurityController.kickUser(req, res));

// =========================================================================
// 1. Dynamic UI & Flow Engine (LEPC Phase 1)
// =========================================================================
router.post('/flows', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.createFlow(req, res, next));
router.get('/flows', authMiddleware, (req, res, next) => flowController.getFlows(req, res, next));
router.get('/flows/:id', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.getFlowById(req, res, next));
router.patch('/flows/:id/deactivate', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.deactivateFlow(req, res, next));
router.put('/flows/schemas/:schemaId', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.updateFormSchema(req, res, next));

router.post('/tickets/:id/activate-flow', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.activateFlowForTicket(req, res, next));
router.post('/tickets/:id/advance', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.advanceFlow(req, res, next));
router.post('/tickets/:id/reject-step', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.rejectStep(req, res, next));
router.get('/tickets/:id/journey', authMiddleware, (req, res, next) => flowController.getTicketJourney(req, res, next));
router.post('/tickets/:id/form-data', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.saveFormData(req, res, next));
router.get('/tickets/:id/form-data', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => flowController.getFormData(req, res, next));

// =========================================================================
// 1.5. External Systems (UECP) 
// =========================================================================
router.get('/admin/uecp/systems', authMiddleware, (req, res, next) => uecpController.getSystems(req, res, next));
router.post('/admin/uecp/register', authMiddleware, (req, res, next) => uecpController.registerSystem(req, res, next));

// =========================================================================
// 2. Ticket Engine & Dynamic Execution
// =========================================================================
router.post('/tickets/:id/transition', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => ticketController.transitionTicketState(req, res, next));

// =========================================================================
// 3. UECP Enterprise Gateway (v1)
// =========================================================================
router.post(
  '/uecp/tickets',
  UECPMiddleware.authenticate,
  UECPMiddleware.validateHMAC,
  UECPMiddleware.checkIdempotency,
  (req, res, next) => uecpGatewayController.injectTicket(req, res, next)
);

router.get(
  '/uecp/tickets',
  UECPMiddleware.authenticate,
  (req, res, next) => uecpGatewayController.getTickets(req, res, next)
);

// =========================================================================
// 4. Buildings & Institutional Org Structure
// =========================================================================
import { OrganizationController } from '../backend/controllers/OrganizationController';
import { validateRequest } from '../backend/middlewares/validateRequest';
import { 
  saveBuildingsSchema, saveLegacyDepartmentsSchema, saveOrgTreeSchema, 
  departmentSchema, departmentsSnapshotSchema, teamSchema, 
  assignUserSchema, assignLayoutSchema 
} from '../backend/validators/OrgValidators';

router.get('/org/buildings', authMiddleware, (req, res) => OrganizationController.getBuildings(req, res));
router.post('/org/buildings', authMiddleware, requireRole([1, 22]), validateRequest(saveBuildingsSchema), (req, res) => OrganizationController.saveBuildings(req, res));
router.get('/org/departments/legacy', authMiddleware, requireRole([1, 22]), (req, res) => OrganizationController.getLegacyDepartments(req, res));
router.post('/org/departments/legacy', authMiddleware, requireRole([1, 22]), validateRequest(saveLegacyDepartmentsSchema), (req, res) => OrganizationController.saveLegacyDepartments(req, res));

// =========================================================================
// 5. Institutional Org Tree
// =========================================================================
router.get('/org/tree', authMiddleware, (req, res) => OrganizationController.getOrgTree(req, res));
router.post('/org/tree', authMiddleware, requireRole([1, 22]), validateRequest(saveOrgTreeSchema), (req, res) => OrganizationController.saveOrgTree(req, res));

// Smart Deletion Routes
router.get('/org/departments/dependency-check', authMiddleware, requireRole([1, 22]), (req, res) => OrganizationController.checkDepartmentDependencies(req, res));
router.post('/org/departments/smart-delete', authMiddleware, requireRole([1, 22]), (req, res) => OrganizationController.smartDeleteDepartment(req, res));

// =========================================================================
// 6. Operational Structure - Departments, Teams, Users
// =========================================================================
router.get('/org/roles', authMiddleware, (req, res) => OrganizationController.getRoles(req, res));
// جلب عقد الشجرة المؤسسية المتاحة للإضافة التشغيلية
router.get('/org/institutional-nodes', authMiddleware, (req, res) => OrganizationController.getInstitutionalNodes(req, res));
router.get('/org/departments', authMiddleware, requireRole([1, 22]), (req, res) => OrganizationController.getDepartments(req, res));
router.post('/org/departments', authMiddleware, requireRole([1, 22]), validateRequest(departmentSchema), (req, res) => OrganizationController.createDepartment(req, res));
// IMPORTANT: /snapshot must be before /:id to avoid Express matching 'snapshot' as an ID param
router.post('/org/departments/snapshot', authMiddleware, requireRole([1, 22]), validateRequest(departmentsSnapshotSchema), (req, res) => OrganizationController.saveDepartmentsSnapshot(req, res));
router.put('/org/departments/:id', authMiddleware, requireRole([1, 22]), validateRequest(departmentSchema), (req, res) => OrganizationController.updateDepartment(req, res));
router.delete('/org/departments/:id', authMiddleware, requireRole([1, 22]), (req, res) => OrganizationController.deleteDepartment(req, res));
router.post('/org/teams', authMiddleware, requireRole([1, 22]), validateRequest(teamSchema), (req, res) => OrganizationController.createTeam(req, res));
router.get('/org/users/pool', authMiddleware, (req, res) => OrganizationController.getUserPool(req, res));
router.post('/org/users/assign', authMiddleware, requireRole([1, 22]), validateRequest(assignUserSchema), (req, res) => OrganizationController.assignUser(req, res));
router.delete('/org/users/:userId/unassign', authMiddleware, requireRole([1, 22]), (req, res) => OrganizationController.unassignUser(req, res));
router.post('/org/layouts/assign', authMiddleware, requireRole([1, 22]), validateRequest(assignLayoutSchema), (req, res) => OrganizationController.assignLayoutToUser(req, res));
router.get('/org/users/:userId/interface', authMiddleware, (req, res) => OrganizationController.getUserInterface(req, res));

// =========================================================================
// 7. UI Layout Engine - Interfaces
// =========================================================================
import { InterfaceController } from '../backend/controllers/InterfaceController';
const interfaceController = new InterfaceController();
router.get('/layouts/list', authMiddleware, requireRole([1, 22]), (req, res, next) => interfaceController.getAllInterfaces(req, res, next));
router.get('/layouts', authMiddleware, requireRole([1, 22]), (req, res, next) => interfaceController.getInterfaces(req, res, next));
router.post('/layouts', authMiddleware, requireRole([1, 22]), (req, res, next) => interfaceController.createInterface(req, res, next));
router.put('/layouts/:id', authMiddleware, requireRole([1, 22]), (req, res, next) => interfaceController.updateInterface(req, res, next));
router.delete('/layouts/:id', authMiddleware, requireRole([1, 22]), (req, res, next) => interfaceController.deleteInterface(req, res, next));


// =========================================================================
// 8. Ticket Routing & Dynamic Fields
// =========================================================================
import { TicketRoutingController } from '../backend/controllers/TicketRoutingController';
import { saveRoutesSnapshotSchema, saveDynamicFieldsSchema } from '../backend/validators/RoutingValidators';

// Route retrieval: available to all authenticated employees so they see configured routes
router.get('/routing/routes', authMiddleware, (req, res) => TicketRoutingController.getRoutes(req, res));
router.post('/routing/routes', authMiddleware, requireRole([1, 22]), validateRequest(saveRoutesSnapshotSchema), (req, res) => TicketRoutingController.saveRoutes(req, res));
router.post('/routing/routes/single', authMiddleware, requireRole([1, 22]), (req, res) => TicketRoutingController.createRoute(req, res));
router.put('/routing/routes/:id', authMiddleware, requireRole([1, 22]), (req, res) => TicketRoutingController.updateRoute(req, res));
router.delete('/routing/routes/:id', authMiddleware, requireRole([1, 22]), (req, res) => TicketRoutingController.deleteRoute(req, res));

// PUBLIC for all authenticated employees: returns only active routes (no formConfig secrets)
router.get('/routing/routes/public', authMiddleware, (req, res) => TicketRoutingController.getPublicRoutes(req, res));

// Dynamic fields
router.get('/routing/dynamic-fields', authMiddleware, (req, res) => TicketRoutingController.getDynamicFields(req, res));
router.post('/routing/dynamic-fields', authMiddleware, requireRole([1, 22]), validateRequest(saveDynamicFieldsSchema), (req, res) => TicketRoutingController.saveDynamicFields(req, res));


// =========================================================================
// 9. Functional UI APIs
// =========================================================================
import { FunctionalController } from '../backend/controllers/FunctionalController';
const functionalController = new FunctionalController();

router.get('/v1/functional/me', authMiddleware, (req, res, next) => functionalController.getMe(req, res, next));

router.get('/v1/functional/posts', authMiddleware, (req, res, next) => functionalController.getPosts(req, res, next));
router.post('/v1/functional/posts', authMiddleware, (req, res, next) => functionalController.createPost(req, res, next));
router.post('/v1/functional/posts/:id/react', authMiddleware, (req, res, next) => functionalController.reactToPost(req, res, next));
router.post('/v1/functional/posts/:id/comment', authMiddleware, (req, res, next) => functionalController.commentOnPost(req, res, next));

router.get('/v1/functional/news', authMiddleware, (req, res, next) => functionalController.getNews(req, res, next));
router.post('/v1/functional/news', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => functionalController.createNews(req, res, next));

router.get('/v1/functional/reels', authMiddleware, (req, res, next) => functionalController.getReels(req, res, next));
router.post('/v1/functional/reels/:id/react', authMiddleware, (req, res, next) => functionalController.reactToReel(req, res, next));
router.post('/v1/functional/reels/:id/comment', authMiddleware, (req, res, next) => functionalController.commentOnReel(req, res, next));

router.get('/v1/functional/challenges', authMiddleware, (req, res, next) => functionalController.getChallenges(req, res, next));
router.post('/v1/functional/challenges', authMiddleware, requireRole([1, 2, 22]), (req, res, next) => functionalController.createChallenge(req, res, next));
router.post('/v1/functional/challenges/:id/join', authMiddleware, (req, res, next) => functionalController.joinChallenge(req, res, next));
router.post('/v1/functional/challenges/:id/complete', authMiddleware, (req, res, next) => functionalController.completeChallenge(req, res, next));

router.get('/v1/functional/requests', authMiddleware, (req, res, next) => functionalController.getMyRequests(req, res, next));
router.get('/v1/functional/my-requests', authMiddleware, (req, res, next) => functionalController.getMyRequests(req, res, next));
router.post('/v1/functional/requests', authMiddleware, (req, res, next) => functionalController.createTicket(req, res, next));
router.post('/v1/functional/requests/:id/rate-close', authMiddleware, (req, res, next) => functionalController.rateAndCloseRequest(req, res, next));

// Main ticket submission endpoint (used by InteractiveTicketCreatorForm)
router.post('/tickets', authMiddleware, (req, res, next) => functionalController.createTicket(req, res, next));

router.post('/v1/functional/coins/earn', authMiddleware, (req, res, next) => functionalController.earnCoins(req, res, next));

router.get('/v1/functional/perks', authMiddleware, (req, res, next) => functionalController.getAppPerks(req, res, next));
router.post('/v1/functional/perks/:id/unlock', authMiddleware, (req, res, next) => functionalController.unlockAppPerk(req, res, next));

// Admin Requests Management
router.get('/v1/functional/admin/requests', authMiddleware, requireRole([1, 22]), (req, res, next) => functionalController.getAllRequests(req, res, next));
router.patch('/v1/functional/admin/requests/:id/status', authMiddleware, requireRole([1, 22]), (req, res, next) => functionalController.updateRequestStatus(req, res, next));

// =========================================================================
// 9.5 Operational Queue — واجهة استقبال الطلبات للكادر التشغيلي
// =========================================================================
import { OperationalQueueController } from '../backend/controllers/OperationalQueueController';

// قائمة انتظاري الشخصية
router.get('/ops/queue', authMiddleware, (req, res) => OperationalQueueController.getMyQueue(req, res));

// كل الطلبات حسب نطاق الدور
router.get('/ops/tickets', authMiddleware, (req, res) => OperationalQueueController.getAllTickets(req, res));

// تفاصيل تذكرة
router.get('/ops/tickets/:id', authMiddleware, (req, res) => OperationalQueueController.getTicketDetails(req, res));

// تنفيذ إجراء (قبول، إغلاق، تحويل، تصعيد...)
router.post('/ops/tickets/:id/action', authMiddleware, (req, res) => OperationalQueueController.executeAction(req, res));

// إضافة تعليق (داخلي / خارجي)
router.post('/ops/tickets/:id/comment', authMiddleware, (req, res) => OperationalQueueController.addComment(req, res));

// إحصائيات Dashboard التشغيلي
router.get('/ops/stats', authMiddleware, (req, res) => OperationalQueueController.getDashboardStats(req, res));

// التقارير
router.get('/ops/reports/summary', authMiddleware, (req, res) => OperationalQueueController.getSummaryReport(req, res));
router.get('/ops/reports/form-data', authMiddleware, (req, res) => OperationalQueueController.getFormDataReport(req, res));

// الإدارات والكادر للتحويل والتعيين
router.get('/ops/departments', authMiddleware, (req, res) => OperationalQueueController.getAvailableDepartments(req, res));
router.get('/ops/agents', authMiddleware, (req, res) => OperationalQueueController.getAvailableAgents(req, res));
router.get('/ops/tickets/:id/sub-tickets', authMiddleware, (req, res) => OperationalQueueController.getSubTickets(req, res));
router.post('/ops/tickets/:id/sub-tickets', authMiddleware, (req, res) => OperationalQueueController.createSubTicket(req, res));
router.get('/ops/tickets/:id/flow-members', authMiddleware, (req, res) => OperationalQueueController.getTicketFlowMembers(req, res));
router.get('/ops/sub-tickets', authMiddleware, (req, res) => OperationalQueueController.getAllSubTickets(req, res));

// =========================================================================
// 9.6 Flow Reception Governance — حوكمة مسارات واستقبال الطلبات
// =========================================================================
import { FlowGovernanceController } from '../backend/controllers/FlowGovernanceController';

router.get('/flow-governance/candidate-managers', authMiddleware, (req, res) => FlowGovernanceController.getCandidateManagers(req, res));
router.get('/flow-governance/my-flows', authMiddleware, (req, res) => FlowGovernanceController.getMyFlows(req, res));
router.get('/flow-governance/:flowId/details', authMiddleware, (req, res) => FlowGovernanceController.getFlowDetails(req, res));
router.post('/flow-governance/:flowId/permissions', authMiddleware, (req, res) => FlowGovernanceController.updatePermissions(req, res));
router.post('/flow-governance/:flowId/rules', authMiddleware, (req, res) => FlowGovernanceController.saveRule(req, res));
router.patch('/flow-governance/:flowId/rules/:ruleId/toggle', authMiddleware, (req, res) => FlowGovernanceController.toggleRule(req, res));
router.delete('/flow-governance/:flowId/rules/:ruleId', authMiddleware, (req, res) => FlowGovernanceController.deleteRule(req, res));
router.post('/flow-governance/:flowId/priority-config', authMiddleware, (req, res) => FlowGovernanceController.savePriorityConfig(req, res));
router.post('/flow-governance/:flowId/closure-approvers', authMiddleware, (req, res) => FlowGovernanceController.saveClosureApprovers(req, res));
router.post('/flow-governance/:flowId/transfer-config', authMiddleware, (req, res) => FlowGovernanceController.saveTransferConfig(req, res));
router.post('/flow-governance/:flowId/sub-ticket-config', authMiddleware, (req, res) => FlowGovernanceController.saveSubTicketConfig(req, res));
router.patch('/flow-governance/tickets/:ticketId/calibrate-priority', authMiddleware, (req, res) => FlowGovernanceController.calibrateTicketPriority(req, res));

// =========================================================================
// 10. Analytics & Governance (Audit Fixes)
// =========================================================================
router.post('/analytics/universal-cube', authMiddleware, (req, res, next) => (AnalyticsController as any).getUniversalAnalytics(req, res, next));
router.post('/admin/operational/user-policy', authMiddleware, requireRole([1, 22]), (req, res, next) => OperationalAdminController.saveUserPolicy(req, res, next));
router.get('/admin/governance/policy/pending', authMiddleware, requireRole([1, 22]), (req, res, next) => OperationalAdminController.getPendingPolicies(req, res, next));
router.post('/admin/governance/policy/:id/approve', authMiddleware, requireRole([1, 22]), (req, res, next) => OperationalAdminController.approvePolicy(req, res, next));

// =========================================================================
// 10.1. Dynamic Form-Aware Analytics & Comparative Engine (LEPC Phase 4)
// =========================================================================
import { DynamicAnalyticsController } from '../backend/controllers/DynamicAnalyticsController';
import { AnalyticsPermissionController } from '../backend/controllers/AnalyticsPermissionController';

router.get('/analytics/department-schema', authMiddleware, (req, res, next) => DynamicAnalyticsController.getDepartmentFormSchema(req, res, next));
router.post('/analytics/department-data', authMiddleware, (req, res, next) => DynamicAnalyticsController.getDynamicAnalyticsData(req, res, next));
router.post('/analytics/compare', authMiddleware, (req, res, next) => DynamicAnalyticsController.getMultiDimensionalComparison(req, res, next));
router.get('/analytics/accessible-departments', authMiddleware, (req, res, next) => AnalyticsPermissionController.getUserAccessibleDepartments(req, res, next));

router.get('/admin/analytics/permissions', authMiddleware, requireRole([1, 22]), (req, res, next) => AnalyticsPermissionController.getPermissionsList(req, res, next));
router.post('/admin/analytics/permissions', authMiddleware, requireRole([1, 22]), (req, res, next) => AnalyticsPermissionController.grantAnalyticsAccess(req, res, next));
router.delete('/admin/analytics/permissions/:id', authMiddleware, requireRole([1, 22]), (req, res, next) => AnalyticsPermissionController.revokeAnalyticsAccess(req, res, next));

// =========================================================================
// 11. White-Label Branding & Company Identity
// =========================================================================
router.get('/branding', (req, res) => getBranding(req, res));
router.post('/branding', authMiddleware, requireRole([1, 22]), (req, res) => updateBranding(req, res));
router.put('/branding', authMiddleware, requireRole([1, 22]), (req, res) => updateBranding(req, res));

// Note: Notification SSE Stream is mounted directly in app.ts to bypass CSRF, so not added here.

export default router;
