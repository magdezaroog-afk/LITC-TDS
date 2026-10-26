import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { ImmutableLogService } from '../services/ImmutableLogService';
import { SIEMLogger } from '../security/SIEMLogger';

export class UserMatrixController {
  
  static async getOperationalUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        where: {
          isDeleted: false,
          role: {
            name: {
              not: 'SYSTEM_ADMIN'
            }
          }
        },
        include: {
          role: true,
          department: true,
          teams: {
            include: {
              team: true
            }
          }
        }
      });

      const mappedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName || u.username,
        email: u.email,
        phone: u.phone,
        role: u.role.name,
        departmentName: u.department?.name || 'غير محدد',
        subTeamName: u.teams.length > 0 ? u.teams[0].team.name : 'غير محدد',
        status: u.isFrozen ? 'FROZEN' : (u.isActive ? 'ACTIVE' : 'FROZEN')
      }));

      res.json(mappedUsers);
    } catch (error) {
      console.error('[UserMatrixController] getOperationalUsers Error:', error);
      res.status(500).json({ error: 'Failed to fetch operational users' });
    }
  }

  static async freezeUsers(req: Request, res: Response) {
    try {
      const { userIds, freeze } = req.body;
      if (!Array.isArray(userIds)) return res.status(400).json({ error: 'userIds array required' });

      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isFrozen: freeze }
      });

      // Immutable Audit Log & SIEM Telemetry
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;
      for (const uid of userIds) {
        await ImmutableLogService.appendLog(
          'USER', 
          uid, 
          freeze ? 'USER_FREEZE' : 'USER_UNFREEZE', 
          changedBy, 
          { freeze, targetUserId: uid }, 
          sourceIp
        );
        SIEMLogger.logEvent(
          freeze ? 'USER_FROZEN_BY_ADMIN' : 'USER_UNFROZEN_BY_ADMIN', 
          freeze ? 'WARNING' : 'INFO', 
          sourceIp, 
          { targetUserId: uid }, 
          changedBy
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[UserMatrixController] freezeUsers Error:', error);
      res.status(500).json({ error: 'Failed to freeze/unfreeze users' });
    }
  }

  static async transferUsers(req: Request, res: Response) {
    try {
      const { userIds, departmentId } = req.body;
      if (!Array.isArray(userIds) || !departmentId) {
        return res.status(400).json({ error: 'userIds and departmentId required' });
      }

      let targetDeptId: number;
      if (typeof departmentId === 'string') {
        const dept = await prisma.department.findUnique({ where: { name: departmentId } });
        if (!dept) return res.status(404).json({ error: 'Department not found' });
        targetDeptId = dept.id;
      } else {
        targetDeptId = departmentId;
      }

      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { departmentId: targetDeptId }
      });

      // Immutable Audit Log
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;
      for (const uid of userIds) {
        await ImmutableLogService.appendLog(
          'USER', 
          uid, 
          'DEPARTMENT_TRANSFER', 
          changedBy, 
          { targetDeptId }, 
          sourceIp
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[UserMatrixController] transferUsers Error:', error);
      res.status(500).json({ error: 'Failed to transfer users' });
    }
  }

  static async changeRole(req: Request, res: Response) {
    try {
      const { userId, newRole } = req.body;
      if (!userId || !newRole) {
        return res.status(400).json({ error: 'userId and newRole required' });
      }

      const role = await prisma.role.findUnique({ where: { name: newRole } });
      if (!role) return res.status(404).json({ error: 'Role not found' });

      await prisma.user.update({
        where: { id: userId },
        data: { roleId: role.id }
      });

      // Immutable Audit Log & SIEM Event
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;
      await ImmutableLogService.appendLog(
        'USER', 
        userId, 
        'ROLE_CHANGE', 
        changedBy, 
        { newRole, newRoleId: role.id }, 
        sourceIp
      );
      SIEMLogger.logEvent(
        'USER_ROLE_CHANGED', 
        'WARNING', 
        sourceIp, 
        { targetUserId: userId, newRole }, 
        changedBy
      );

      res.json({ success: true });
    } catch (error) {
      console.error('[UserMatrixController] changeRole Error:', error);
      res.status(500).json({ error: 'Failed to change role' });
    }
  }
}
