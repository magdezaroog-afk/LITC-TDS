import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import { InterfaceService } from '../services/InterfaceService';

export class OperationalAdminController {

  // ==========================================
  // Admin Supreme Veto Hub (Phase 3)
  // NOTE: policyAuditLog is not in schema — we use SystemSetting as a lightweight audit store
  // ==========================================
  static async getPendingPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      // Fetch pending policy change records stored as JSON in SystemSetting
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'policy_audit_log' }
      });
      const logs: any[] = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const pending = logs.filter((l: any) => l.status === 'PENDING_ADMIN_APPROVAL');
      res.json(pending);
    } catch (err) { next(err); }
  }

  static async approvePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.body;
      const setting = await prisma.systemSetting.findUnique({ where: { settingKey: 'policy_audit_log' } });
      const logs: any[] = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const updated = logs.map((l: any) => l.id === logId ? { ...l, status: 'APPROVED' } : l);
      await prisma.systemSetting.upsert({
        where: { settingKey: 'policy_audit_log' },
        create: { settingKey: 'policy_audit_log', settingValue: JSON.stringify(updated), description: 'Policy Audit Log' },
        update: { settingValue: JSON.stringify(updated) }
      });
      res.json({ success: true, log: updated.find((l: any) => l.id === logId) });
    } catch (err) { next(err); }
  }

  static async vetoPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.body;

      const setting = await prisma.systemSetting.findUnique({ where: { settingKey: 'policy_audit_log' } });
      const logs: any[] = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const log = logs.find((l: any) => l.id === logId);
      if (!log) return res.status(404).json({ error: 'Audit log not found' });

      // Mark as rejected
      const updatedLogs = logs.map((l: any) => l.id === logId ? { ...l, status: 'REJECTED_BY_ADMIN' } : l);
      await prisma.systemSetting.upsert({
        where: { settingKey: 'policy_audit_log' },
        create: { settingKey: 'policy_audit_log', settingValue: JSON.stringify(updatedLogs), description: 'Policy Audit Log' },
        update: { settingValue: JSON.stringify(updatedLogs) }
      });

      // Veto: Delete the overridden policy
      await prisma.userComponentPolicy.deleteMany({
        where: { userId: Number(log.targetUserId), componentKey: log.componentKey }
      });

      res.json({ success: true, message: 'Policy override vetoed and reset successfully.' });
    } catch (err) { next(err); }
  }

  // ==========================================
  // Departments
  // ==========================================
  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const depts = await prisma.department.findMany({
        where: { isDeleted: false },
        include: { teams: { where: { isDeleted: false } } }
      });
      res.json(depts);
    } catch (err) { next(err); }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const dept = await prisma.department.create({ data: { name } });
      
      // Auto-generate default UI interfaces for this department
      await InterfaceService.generateDefaultInterfacesForDepartment(dept.id, dept.name);
      
      res.status(201).json(dept);
    } catch (err) { next(err); }
  }

  // ==========================================
  // Teams
  // ==========================================
  static async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, departmentId } = req.body;
      const team = await prisma.team.create({ data: { name, departmentId: Number(departmentId) } });
      res.status(201).json(team);
    } catch (err) { next(err); }
  }

  // ==========================================
  // Users
  // ==========================================
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, username: true, fullName: true }
      });
      res.json(users);
    } catch (err) { next(err); }
  }

  static async assignUserToTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, teamId } = req.body;
      const userTeam = await prisma.userTeam.create({
        data: { userId: Number(userId), teamId: Number(teamId) }
      });
      res.status(201).json(userTeam);
    } catch (err) { next(err); }
  }

  static async removeUserFromTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, teamId } = req.params;
      await prisma.userTeam.deleteMany({
        where: { userId: Number(userId), teamId: Number(teamId) }
      });
      res.sendStatus(204);
    } catch (err) { next(err); }
  }

  // ==========================================
  // UI Layout Engine (System Settings)
  // ==========================================
  static async getUIConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'UI_LAYOUT_CONFIG' }
      });
      if (setting && setting.settingValue) {
        res.json(JSON.parse(setting.settingValue));
      } else {
        res.json({});
      }
    } catch (err) { next(err); }
  }

  static async saveUIConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { settingKey: 'UI_LAYOUT_CONFIG' },
        update: { settingValue: JSON.stringify(config) },
        create: { settingKey: 'UI_LAYOUT_CONFIG', settingValue: JSON.stringify(config) }
      });
      res.json(JSON.parse(setting.settingValue));
    } catch (err) { next(err); }
  }

  // ==========================================
  // Component Policies (Phase 2)
  // Uses policyData field (actual schema column name)
  // ==========================================
  static async saveUserPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { targetUserId, componentKey, policyData, changeSummary } = req.body;
      const actorId = (req as any).user?.id || 1;

      const policyString = JSON.stringify(policyData);

      // Upsert Policy
      const existingPolicy = await prisma.userComponentPolicy.findFirst({
        where: { userId: Number(targetUserId), componentKey }
      });

      if (existingPolicy) {
        await prisma.userComponentPolicy.update({
          where: { id: existingPolicy.id },
          data: { policyData: policyString, changeSummary }
        });
      } else {
        await prisma.userComponentPolicy.create({
          data: {
            userId: Number(targetUserId),
            componentKey,
            policyData: policyString,
            changeSummary
          }
        });
      }

      // Audit log via SystemSetting JSON store
      const auditSetting = await prisma.systemSetting.findUnique({ where: { settingKey: 'policy_audit_log' } });
      const auditLogs: any[] = auditSetting?.settingValue ? JSON.parse(auditSetting.settingValue) : [];
      auditLogs.push({
        id: `audit_${Date.now()}`,
        actorId,
        targetUserId: Number(targetUserId),
        componentKey,
        changeSummary,
        status: 'PENDING_ADMIN_APPROVAL',
        createdAt: new Date().toISOString()
      });
      await prisma.systemSetting.upsert({
        where: { settingKey: 'policy_audit_log' },
        create: { settingKey: 'policy_audit_log', settingValue: JSON.stringify(auditLogs), description: 'Policy Audit Log' },
        update: { settingValue: JSON.stringify(auditLogs) }
      });

      res.status(200).json({ success: true, message: 'Policy updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Keep old name for backward compat with routes
  static async updateUserPolicy(req: Request, res: Response, next: NextFunction) {
    return OperationalAdminController.saveUserPolicy(req, res, next);
  }
}
