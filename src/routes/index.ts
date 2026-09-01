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
router.get('/auth/setup-2fa', authMiddleware, (req, res, next) => authController.setup2FA(req, res, next));
router.post('/auth/enable-2fa', authMiddleware, (req, res, next) => authController.enable2FA(req, res, next));

// =========================================================================
// 0.5. Forti-SOC Security & Telemetry (Super Admin)
// =========================================================================
router.get('/admin/soc/telemetry', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.getSystemMetrics(req, res));
router.get('/admin/soc/waf-nodes', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.getWAFNodes(req, res));
router.put('/admin/soc/waf-nodes/:id', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.updateNodeStatus(req, res));
router.get('/admin/soc/waf-rules', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.getWAFRules(req, res));
router.post('/admin/soc/waf-rules', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.createWAFRule(req, res));
router.delete('/admin/soc/waf-rules/:id', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.deleteWAFRule(req, res));
router.get('/admin/soc/siem-logs', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.getSIEMLogs(req, res));
router.get('/admin/soc/sessions', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.getActiveSessions(req, res));
router.post('/admin/soc/sessions/:userId/kick', authMiddleware, requireRole([1]), (req, res, next) => SecurityController.kickUser(req, res));

// =========================================================================
// 1. Dynamic UI & Flow Engine (LEPC Phase 1)
// =========================================================================
router.post('/flows', authMiddleware, (req, res, next) => flowController.createFlow(req, res, next));
router.get('/flows', authMiddleware, (req, res, next) => flowController.getFlows(req, res, next));
router.get('/flows/:id', authMiddleware, (req, res, next) => flowController.getFlowById(req, res, next));
router.patch('/flows/:id/deactivate', authMiddleware, (req, res, next) => flowController.deactivateFlow(req, res, next));
router.put('/flows/schemas/:schemaId', authMiddleware, (req, res, next) => flowController.updateFormSchema(req, res, next));

router.post('/tickets/:id/activate-flow', authMiddleware, (req, res, next) => flowController.activateFlowForTicket(req, res, next));
router.post('/tickets/:id/advance', authMiddleware, (req, res, next) => flowController.advanceFlow(req, res, next));
router.post('/tickets/:id/reject-step', authMiddleware, (req, res, next) => flowController.rejectStep(req, res, next));
router.get('/tickets/:id/journey', authMiddleware, (req, res, next) => flowController.getTicketJourney(req, res, next));
router.post('/tickets/:id/form-data', authMiddleware, (req, res, next) => flowController.saveFormData(req, res, next));
router.get('/tickets/:id/form-data', authMiddleware, (req, res, next) => flowController.getFormData(req, res, next));

// =========================================================================
// 1.5. External Systems (UECP) 
// =========================================================================
router.get('/admin/uecp/systems', authMiddleware, (req, res, next) => uecpController.getSystems(req, res, next));
router.post('/admin/uecp/register', authMiddleware, (req, res, next) => uecpController.registerSystem(req, res, next));

// =========================================================================
// 2. Ticket Engine & Dynamic Execution
// =========================================================================
router.post('/tickets/:id/transition', authMiddleware, (req, res, next) => ticketController.transitionTicketState(req, res, next));

// =========================================================================
// 3. UECP Enterprise Gateway (v1)
// =========================================================================
router.post(
  '/api/v1/uecp/tickets',
  UECPMiddleware.authenticate,
  UECPMiddleware.validateHMAC,
  UECPMiddleware.checkIdempotency,
  (req, res, next) => uecpGatewayController.injectTicket(req, res, next)
);

router.get(
  '/api/v1/uecp/tickets',
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

router.get('/org/buildings', authMiddleware, requireRole([1]), (req, res) => OrganizationController.getBuildings(req, res));
router.post('/org/buildings', authMiddleware, requireRole([1]), validateRequest(saveBuildingsSchema), (req, res) => OrganizationController.saveBuildings(req, res));
router.get('/org/departments/legacy', authMiddleware, requireRole([1]), (req, res) => OrganizationController.getLegacyDepartments(req, res));
router.post('/org/departments/legacy', authMiddleware, requireRole([1]), validateRequest(saveLegacyDepartmentsSchema), (req, res) => OrganizationController.saveLegacyDepartments(req, res));

// =========================================================================
// 5. Institutional Org Tree
// =========================================================================
router.get('/org/tree', authMiddleware, requireRole([1]), (req, res) => OrganizationController.getOrgTree(req, res));
router.post('/org/tree', authMiddleware, requireRole([1]), validateRequest(saveOrgTreeSchema), (req, res) => OrganizationController.saveOrgTree(req, res));

// =========================================================================
// 6. Operational Structure - Departments, Teams, Users
// =========================================================================
router.get('/org/roles', authMiddleware, (req, res) => OrganizationController.getRoles(req, res));
router.get('/org/departments', authMiddleware, requireRole([1]), (req, res) => OrganizationController.getDepartments(req, res));
router.post('/org/departments', authMiddleware, requireRole([1]), validateRequest(departmentSchema), (req, res) => OrganizationController.createDepartment(req, res));
router.put('/org/departments/:id', authMiddleware, requireRole([1]), validateRequest(departmentSchema), (req, res) => OrganizationController.updateDepartment(req, res));
router.delete('/org/departments/:id', authMiddleware, requireRole([1]), (req, res) => OrganizationController.deleteDepartment(req, res));
router.post('/org/departments/snapshot', authMiddleware, requireRole([1]), validateRequest(departmentsSnapshotSchema), (req, res) => OrganizationController.saveDepartmentsSnapshot(req, res));
router.post('/org/teams', authMiddleware, requireRole([1]), validateRequest(teamSchema), (req, res) => OrganizationController.createTeam(req, res));
router.get('/org/users/pool', authMiddleware, (req, res) => OrganizationController.getUserPool(req, res));
router.post('/org/users/assign', authMiddleware, requireRole([1]), validateRequest(assignUserSchema), (req, res) => OrganizationController.assignUser(req, res));
router.delete('/org/users/:userId/unassign', authMiddleware, requireRole([1]), (req, res) => OrganizationController.unassignUser(req, res));
router.post('/org/layouts/assign', authMiddleware, requireRole([1]), validateRequest(assignLayoutSchema), (req, res) => OrganizationController.assignLayoutToUser(req, res));
router.get('/org/users/:userId/interface', authMiddleware, (req, res) => OrganizationController.getUserInterface(req, res));

// =========================================================================
// 7. UI Layout Engine - Interfaces
// =========================================================================
import { InterfaceController } from '../backend/controllers/InterfaceController';
const interfaceController = new InterfaceController();
router.get('/layouts', authMiddleware, requireRole([1]), (req, res, next) => interfaceController.getInterfaces(req, res, next));
router.post('/layouts', authMiddleware, requireRole([1]), (req, res, next) => interfaceController.createInterface(req, res, next));
router.put('/layouts/:id', authMiddleware, requireRole([1]), (req, res, next) => interfaceController.updateInterface(req, res, next));
router.delete('/layouts/:id', authMiddleware, requireRole([1]), (req, res, next) => interfaceController.deleteInterface(req, res, next));

// =========================================================================
// 8. Ticket Routing & Dynamic Fields
// =========================================================================
import { TicketRoutingController } from '../backend/controllers/TicketRoutingController';
import { routeSchema, saveRoutesSnapshotSchema, saveDynamicFieldsSchema } from '../backend/validators/RoutingValidators';

router.get('/routing/routes', authMiddleware, requireRole([1]), (req, res) => TicketRoutingController.getRoutes(req, res));
router.post('/routing/routes', authMiddleware, requireRole([1]), validateRequest(saveRoutesSnapshotSchema), (req, res) => TicketRoutingController.saveRoutes(req, res));
router.post('/routing/routes/single', authMiddleware, requireRole([1]), validateRequest(routeSchema), (req, res) => TicketRoutingController.createRoute(req, res));
router.put('/routing/routes/:id', authMiddleware, requireRole([1]), validateRequest(routeSchema), (req, res) => TicketRoutingController.updateRoute(req, res));
router.delete('/routing/routes/:id', authMiddleware, requireRole([1]), (req, res) => TicketRoutingController.deleteRoute(req, res));
router.get('/routing/dynamic-fields', authMiddleware, requireRole([1]), (req, res) => TicketRoutingController.getDynamicFields(req, res));
router.post('/routing/dynamic-fields', authMiddleware, requireRole([1]), validateRequest(saveDynamicFieldsSchema), (req, res) => TicketRoutingController.saveDynamicFields(req, res));

export default router;
