import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
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
router.get('/admin/soc/telemetry', authMiddleware, (req, res, next) => SecurityController.getSystemMetrics(req, res));
router.get('/admin/soc/waf-nodes', authMiddleware, (req, res, next) => SecurityController.getWAFNodes(req, res));
router.put('/admin/soc/waf-nodes/:id', authMiddleware, (req, res, next) => SecurityController.updateNodeStatus(req, res));
router.get('/admin/soc/waf-rules', authMiddleware, (req, res, next) => SecurityController.getWAFRules(req, res));
router.post('/admin/soc/waf-rules', authMiddleware, (req, res, next) => SecurityController.createWAFRule(req, res));
router.delete('/admin/soc/waf-rules/:id', authMiddleware, (req, res, next) => SecurityController.deleteWAFRule(req, res));
router.get('/admin/soc/siem-logs', authMiddleware, (req, res, next) => SecurityController.getSIEMLogs(req, res));
router.get('/admin/soc/sessions', authMiddleware, (req, res, next) => SecurityController.getActiveSessions(req, res));
router.post('/admin/soc/sessions/:userId/kick', authMiddleware, (req, res, next) => SecurityController.kickUser(req, res));



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

export default router;
