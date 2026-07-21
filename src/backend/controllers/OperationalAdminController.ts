import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

export class OperationalAdminController {

  // ==========================================
  // Admin Supreme Veto Hub (Phase 3)
  // ==========================================
  static async getPendingPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.policyAuditLog.findMany({
        where: { status: 'PENDING_ADMIN_APPROVAL' },
        orderBy: { createdAt: 'desc' }
      });
      res.json(logs);
    } catch (err) { next(err); }
  }

  static async approvePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.body;
      const log = await prisma.policyAuditLog.update({
        where: { id: Number(logId) },
        data: { status: 'APPROVED' }
      });
      res.json({ success: true, log });
    } catch (err) { next(err); }
  }

  static async vetoPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.body;
      
      const log = await prisma.policyAuditLog.findUnique({ where: { id: Number(logId) } });
      if (!log) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Update log status to rejected
        await tx.policyAuditLog.update({
          where: { id: Number(logId) },
          data: { status: 'REJECTED_BY_ADMIN' }
        });

        // 2. Veto: Delete the overridden policy so it falls back to defaults
        await tx.userComponentPolicy.deleteMany({
          where: { userId: log.targetUserId, componentKey: log.componentKey }
        });
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
  // ==========================================
  static async updateUserPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { targetUserId, componentKey, policyData, changeSummary } = req.body;
      const actorId = (req as any).user?.id || 1; // Fallback to 1 if not authenticated for testing
      
      const policyString = JSON.stringify(policyData);

      // Dual Write Transaction
      await prisma.$transaction(async (tx) => {
        // 1. Upsert Policy
        const existingPolicy = await tx.userComponentPolicy.findFirst({
          where: { userId: Number(targetUserId), componentKey }
        });

        if (existingPolicy) {
          await tx.userComponentPolicy.update({
            where: { id: existingPolicy.id },
            data: { policy: policyString, updatedById: actorId }
          });
        } else {
          await tx.userComponentPolicy.create({
            data: {
              userId: Number(targetUserId),
              componentKey,
              policy: policyString,
              updatedById: actorId
            }
          });
        }

        // 2. Audit Log
        await tx.policyAuditLog.create({
          data: {
            actorId,
            targetUserId: Number(targetUserId),
            componentKey,
            changeSummary,
            status: "PENDING_ADMIN_APPROVAL"
          }
        });
      });

      res.status(200).json({ success: true, message: "Policy updated successfully." });
    } catch (err) {
      next(err);
    }
  }
}
