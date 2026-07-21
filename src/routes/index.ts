import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { TicketController } from '../controllers/TicketController';
import { UIController } from '../controllers/UIController';
import { SLAController } from '../controllers/SLAController';
import { DatabaseController } from '../backend/controllers/DatabaseController';
import { AnalyticsController } from '../backend/controllers/AnalyticsController';
import { UserController } from '../controllers/UserController';

const router = Router();

const ticketController = new TicketController();
const uiController = new UIController();
const slaController = new SLAController();

// =========================================================================
// 1. Dynamic UI Configurations (Protected by Auth)
// =========================================================================
router.get('/ui/config', authMiddleware, (req, res, next) => uiController.getFormConfig(req, res, next));

// =========================================================================
// 2. Ticket State transitions & RBAC Governance (Protected by Auth)
// =========================================================================
router.get('/tickets/:id/transitions', authMiddleware, (req, res, next) => ticketController.getAvailableTransitions(req, res, next));
router.post('/tickets/:id/transitions', authMiddleware, (req, res, next) => ticketController.executeTransition(req, res, next));
router.post('/tickets/:id/sub-tickets', authMiddleware, (req, res, next) => DatabaseController.createSubTicket(req, res, next));

// =========================================================================
// 3. SLA Recalculations & Background Monitor Triggers (Protected by Auth/System Key)
// =========================================================================
router.post('/sla/recalculate/:ticketId', authMiddleware, (req, res, next) => slaController.recalculateSla(req, res, next));
router.post('/sla/check-breaches', authMiddleware, (req, res, next) => slaController.triggerBreachCheck(req, res, next));

// =========================================================================
// 4. Central Database Direct Secured Operations
// =========================================================================
router.post('/db-tickets', authMiddleware, (req, res, next) => DatabaseController.createTicket(req, res, next));
router.post('/db-tickets/:id/transfer', authMiddleware, (req, res, next) => DatabaseController.transferTicket(req, res, next));
router.post('/db-tickets/:id/close', authMiddleware, (req, res, next) => DatabaseController.closeParentTicket(req, res, next));

// =========================================================================
// 5. Sovereign Security Permissions (IAM Route)
// =========================================================================
router.get('/auth/permissions/:roleName', authMiddleware, (req, res, next) => DatabaseController.getPermissions(req, res, next));
router.put('/admin/permissions', authMiddleware, (req, res, next) => DatabaseController.updatePermissions(req, res, next));
router.post('/admin/departments/fields', authMiddleware, (req, res, next) => DatabaseController.setDynamicFields(req, res, next));
router.get('/departments/fields/:departmentId', authMiddleware, (req, res, next) => DatabaseController.getDynamicFields(req, res, next));
router.get('/admin/audit-logs', authMiddleware, (req, res, next) => DatabaseController.getWorkflowAuditLogs(req, res, next));
router.get('/admin/sla-config/:serviceType', authMiddleware, (req, res, next) => DatabaseController.getSLAConfig(req, res, next));
router.put('/admin/sla-config', authMiddleware, (req, res, next) => DatabaseController.updateSLAConfig(req, res, next));
router.get('/admin/analytics/sla', authMiddleware, (req, res, next) => DatabaseController.getSLAAuditAnalytics(req, res, next));
router.get('/admin/notification-config/:serviceType', authMiddleware, (req, res, next) => DatabaseController.getNotificationConfig(req, res, next));
router.put('/admin/notification-config', authMiddleware, (req, res, next) => DatabaseController.updateNotificationConfig(req, res, next));

// =========================================================================
// 6. Sovereign Resiliency — System Health Check (IT_Admin only)
// =========================================================================
router.get('/admin/health', authMiddleware, (req, res, next) => DatabaseController.getSystemHealth(req, res, next));

import { NotificationEngine } from '../backend/services/NotificationEngine';

// =========================================================================
// 8. Sovereign Circuit Breaker & Analytics
// =========================================================================
router.get('/analytics/cross-entity', authMiddleware, (req, res, next) => AnalyticsController.getCrossEntityAnalytics(req, res, next));
router.post('/analytics/universal-cube', authMiddleware, (req, res, next) => AnalyticsController.getUniversalAnalytics(req, res, next));

// =========================================================================
// 9. User Profile & Context Updates
// =========================================================================
router.put('/users/profile/building', authMiddleware, (req, res, next) => UserController.updateProfileBuilding(req, res, next));

// =========================================================================
// 10. Live Notifications (SSE)
// =========================================================================
router.get('/notifications/stream', authMiddleware, (req, res) => NotificationEngine.handleConnection(req, res));

// =========================================================================
// 7. Sovereign Circuit Breaker — State & Queue Monitor (IT_Admin only)
// =========================================================================
router.get('/admin/circuit-breaker', authMiddleware, (req, res, next) => DatabaseController.getCircuitBreakerStatus(req, res, next));

// =========================================================================
// 8. Sovereign Command Center — Manual Circuit Breaker Override (IT_Admin only)
// =========================================================================
router.post('/admin/circuit-breaker/override', authMiddleware, (req, res, next) => DatabaseController.circuitBreakerOverride(req, res, next));

// =========================================================================
// 9. Sovereign Crisis & Override Ledger — Live Silent Logs (IT_Admin only)
// =========================================================================
router.get('/admin/governance-ledger', authMiddleware, (req, res, next) => DatabaseController.getGovernanceAuditLogs(req, res, next));

// =========================================================================
// Dynamic System References & Decoupled Units (Admin Governance)
// =========================================================================
router.get('/admin/references', authMiddleware, (req, res, next) => DatabaseController.getSystemReferences(req, res, next));
router.post('/admin/references', authMiddleware, (req, res, next) => DatabaseController.createSystemReference(req, res, next));
router.delete('/admin/references/:id', authMiddleware, (req, res, next) => DatabaseController.deleteSystemReference(req, res, next));

// =========================================================================
// Operational Entities (Departments, Teams, Users)
// =========================================================================
import { OperationalAdminController } from '../backend/controllers/OperationalAdminController';
import { UECPValidatorService } from '../backend/services/UECPValidatorService';

router.get('/admin/operational/departments', authMiddleware, OperationalAdminController.getDepartments);
router.post('/admin/operational/departments', authMiddleware, OperationalAdminController.createDepartment);
router.post('/admin/operational/teams', authMiddleware, OperationalAdminController.createTeam);
router.get('/admin/operational/users', authMiddleware, OperationalAdminController.getUsers);
router.post('/admin/operational/users/assign', authMiddleware, OperationalAdminController.assignUserToTeam);
router.delete('/admin/operational/users/:userId/teams/:teamId', authMiddleware, OperationalAdminController.removeUserFromTeam);

// UI Config Routes
router.get('/admin/ui-config', authMiddleware, OperationalAdminController.getUIConfig);
router.post('/admin/ui-config', authMiddleware, OperationalAdminController.saveUIConfig);
router.post('/admin/operational/user-policy', authMiddleware, OperationalAdminController.updateUserPolicy);

// =========================================================================
// Admin Supreme Veto Hub
// =========================================================================
router.get('/admin/governance/policy/pending', authMiddleware, OperationalAdminController.getPendingPolicies);
router.post('/admin/governance/policy/approve', authMiddleware, OperationalAdminController.approvePolicy);
router.post('/admin/governance/policy/veto', authMiddleware, OperationalAdminController.vetoPolicy);



// =========================================================================
// Unified External Component Protocol (UECP)
// =========================================================================
router.post('/admin/uecp/register', authMiddleware, UECPValidatorService.registerExternalSystem);
router.get('/admin/uecp/systems', authMiddleware, UECPValidatorService.getAllSystems);

export default router;
