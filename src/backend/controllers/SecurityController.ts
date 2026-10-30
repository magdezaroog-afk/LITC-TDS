import { Request, Response } from 'express';
import os from 'os';
import pidusage from 'pidusage';
import { prisma } from '../../db/client';
import { redisManager } from '../infrastructure/RedisClient';
import { WAFMiddleware } from '../security/WAFMiddleware';
import { ImmutableLogService } from '../services/ImmutableLogService';
import { SIEMLogger } from '../security/SIEMLogger';

export class SecurityController {

  // 1. Hardware & Core Telemetry
  static async getSystemMetrics(req: Request, res: Response) {
    try {
      const stats = await pidusage(process.pid);
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      
      const dbStats = await prisma.user.count(); // Basic alive check
      
      res.json({
        cpu: Math.round(stats.cpu),
        memoryUsage: Math.round(stats.memory / 1024 / 1024),
        totalMemory: Math.round(totalMem / 1024 / 1024),
        systemLoad: os.loadavg()[0],
        dbAlive: dbStats >= 0,
        uptime: Math.round(process.uptime())
      });
    } catch (error: any) {
      console.error('[SOC Telemetry Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve hardware telemetry' });
    }
  }

  // 2. Load Balancer / WAF Nodes
  static async getWAFNodes(req: Request, res: Response) {
    try {
      const nodes = await prisma.wAFNode.findMany();
      res.json({ nodes });
    } catch (error: any) {
      console.error('[WAF Nodes Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve WAF nodes' });
    }
  }

  static async updateNodeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const node = await prisma.wAFNode.update({
        where: { id },
        data: { status }
      });
      res.json({ node });
    } catch (error: any) {
      console.error('[WAF Node Update Error]:', error);
      res.status(500).json({ error: 'Failed to update node status' });
    }
  }

  // 3. WAF Rules
  static async getWAFRules(req: Request, res: Response) {
    try {
      const rules = await prisma.wAFRule.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json({ rules });
    } catch (error: any) {
      console.error('[WAF Rules Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve WAF rules' });
    }
  }

  static async createWAFRule(req: Request, res: Response) {
    try {
      const { ruleType, target, action } = req.body;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;

      const rule = await prisma.wAFRule.create({
        data: { ruleType, target, action, isActive: true }
      });

      // Instant WAF Cache Invalidation (Pub/Sub + Local Fallback)
      redisManager.publish('WAF_REFRESH', 'NEW_RULE');
      WAFMiddleware.refreshRulesCache(); // Force local update immediately as fallback

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'WAF_RULE', 
        0, 
        'CREATE_WAF_RULE', 
        changedBy, 
        { ruleId: rule.id, ruleType, target, action }, 
        sourceIp
      );
      SIEMLogger.logEvent('WAF_RULE_CREATED', 'WARNING', sourceIp, { ruleType, target, action }, changedBy);

      res.json({ rule });
    } catch (error: any) {
      console.error('[Create WAF Rule Error]:', error);
      res.status(500).json({ error: 'Failed to create WAF rule' });
    }
  }

  static async deleteWAFRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;

      await prisma.wAFRule.delete({ where: { id } });

      // Instant WAF Cache Invalidation
      redisManager.publish('WAF_REFRESH', 'DELETE_RULE');
      WAFMiddleware.refreshRulesCache(); // Force local update immediately as fallback

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'WAF_RULE', 
        0, 
        'DELETE_WAF_RULE', 
        changedBy, 
        { deletedRuleId: id }, 
        sourceIp
      );
      SIEMLogger.logEvent('WAF_RULE_DELETED', 'INFO', sourceIp, { ruleId: id }, changedBy);

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Delete WAF Rule Error]:', error);
      res.status(500).json({ error: 'Failed to delete WAF rule' });
    }
  }

  // 3.5 SIEM Logs & Threat Telemetry
  static async getSIEMLogs(req: Request, res: Response) {
    try {
      const { severity, search, limit = 150 } = req.query;
      const take = Math.min(Math.max(1, Number(limit) || 150), 500);

      const where: any = {};
      if (severity && severity !== 'ALL') {
        where.severity = String(severity);
      }
      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim();
        where.OR = [
          { eventType: { contains: q } },
          { sourceIp: { contains: q } },
          { details: { contains: q } }
        ];
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [logs, total, criticalCount, warningCount, infoCount, todayCount] = await Promise.all([
        prisma.securityEventLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take
        }),
        prisma.securityEventLog.count(),
        prisma.securityEventLog.count({ where: { severity: 'CRITICAL' } }),
        prisma.securityEventLog.count({ where: { severity: 'WARNING' } }),
        prisma.securityEventLog.count({ where: { severity: 'INFO' } }),
        prisma.securityEventLog.count({ where: { createdAt: { gte: todayStart } } })
      ]);

      res.json({
        logs,
        stats: {
          total,
          criticalCount,
          warningCount,
          infoCount,
          todayCount
        }
      });
    } catch (error: any) {
      console.error('[SIEM Logs Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve SIEM logs' });
    }
  }

  // 3.6 Immutable Audit Trail Logs
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const { entity, search, limit = 150 } = req.query;
      const take = Math.min(Math.max(1, Number(limit) || 150), 500);

      const where: any = {};
      if (entity && entity !== 'ALL') {
        where.entity = String(entity);
      }
      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim();
        where.OR = [
          { action: { contains: q } },
          { entity: { contains: q } },
          { changes: { contains: q } },
          { ipAddress: { contains: q } }
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take
        }),
        prisma.auditLog.count()
      ]);

      // Resolve author names for changedBy users
      const authorIds = Array.from(new Set(logs.map(l => l.changedBy).filter(Boolean)));
      const authors = await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, fullName: true, username: true, email: true }
      });
      const authorMap = new Map(authors.map(a => [a.id, a]));

      const enrichedLogs = logs.map(l => ({
        ...l,
        author: authorMap.get(l.changedBy) || { id: l.changedBy, fullName: `مستخدم #${l.changedBy}` }
      }));

      res.json({
        logs: enrichedLogs,
        stats: {
          total
        }
      });
    } catch (error: any) {
      console.error('[Audit Logs Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve audit trail logs' });
    }
  }

  // 4. Session & Identity Governance (Zero-Trust)
  static async getActiveSessions(req: Request, res: Response) {
    try {
      const { status, search } = req.query;

      const where: any = {
        isDeleted: false
      };

      if (status === 'ACTIVE') {
        where.isActive = true;
        where.isFrozen = false;
      } else if (status === 'FROZEN') {
        where.isFrozen = true;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim();
        where.OR = [
          { fullName: { contains: q } },
          { email: { contains: q } },
          { username: { contains: q } }
        ];
      }

      const now = new Date();

      const [users, totalUsers, activeUsers, frozenUsers, mfaUsers, lockedOutUsers] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            jobTitle: true,
            isActive: true,
            isFrozen: true,
            mfaEnabled: true,
            presence: true,
            workStatus: true,
            failedAttempts: true,
            lockoutEnd: true,
            lastSyncedAt: true,
            createdAt: true,
            updatedAt: true,
            role: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            building: { select: { id: true, name: true } }
          },
          orderBy: [
            { isFrozen: 'desc' },
            { id: 'asc' }
          ]
        }),
        prisma.user.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { isDeleted: false, isActive: true, isFrozen: false } }),
        prisma.user.count({ where: { isDeleted: false, isFrozen: true } }),
        prisma.user.count({ where: { isDeleted: false, mfaEnabled: true } }),
        prisma.user.count({ where: { isDeleted: false, lockoutEnd: { gt: now } } })
      ]);

      // Enrich with last known IP & activity timestamp from AuditLog
      const userIds = users.map(u => u.id);
      const recentAudits = await prisma.auditLog.findMany({
        where: { changedBy: { in: userIds } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { changedBy: true, ipAddress: true, createdAt: true }
      });

      const lastActivityMap = new Map<number, { ip: string; timestamp: Date }>();
      for (const a of recentAudits) {
        if (!lastActivityMap.has(a.changedBy)) {
          lastActivityMap.set(a.changedBy, {
            ip: a.ipAddress || '::1',
            timestamp: a.createdAt
          });
        }
      }

      const enrichedUsers = users.map(u => ({
        ...u,
        lastIp: lastActivityMap.get(u.id)?.ip || '127.0.0.1',
        lastActiveAt: lastActivityMap.get(u.id)?.timestamp || u.lastSyncedAt || u.updatedAt
      }));

      res.json({
        users: enrichedUsers,
        stats: {
          totalUsers,
          activeUsers,
          frozenUsers,
          mfaUsers,
          lockedOutUsers
        }
      });
    } catch (error: any) {
      console.error('[Active Sessions Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve active sessions and identities' });
    }
  }

  // 4.1 Freeze & Kick User (Emergency Lockdown)
  static async kickUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { reason = 'إجراء أمني فوري من مركز العمليات' } = req.body;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;
      const numericUserId = parseInt(userId, 10);

      const targetUser = await prisma.user.findUnique({
        where: { id: numericUserId },
        select: { id: true, fullName: true, email: true }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      // Freeze user in DB
      await prisma.user.update({
        where: { id: numericUserId },
        data: { isFrozen: true }
      });

      // Instant Redis Broadcast & Token Revocation
      redisManager.publish('USER_FROZEN', JSON.stringify({ userId: numericUserId }));

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'USER', 
        numericUserId, 
        'USER_FROZEN_BY_SECURITY', 
        changedBy, 
        { 
          targetUserId: numericUserId, 
          targetUserName: targetUser.fullName, 
          targetUserEmail: targetUser.email,
          reason 
        }, 
        sourceIp
      );

      SIEMLogger.logEvent(
        'USER_FROZEN_BY_SECURITY', 
        'CRITICAL', 
        sourceIp, 
        { targetUserId: numericUserId, reason }, 
        changedBy
      );

      res.json({ success: true, message: `تم تجميد حساب [${targetUser.fullName}] وإبطال جلساته فوراً.` });
    } catch (error: any) {
      console.error('[Kick User Error]:', error);
      res.status(500).json({ error: 'Failed to freeze and kick session' });
    }
  }

  // 4.2 Unfreeze User (Restore Access)
  static async unfreezeUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;
      const numericUserId = parseInt(userId, 10);

      const targetUser = await prisma.user.findUnique({
        where: { id: numericUserId },
        select: { id: true, fullName: true, email: true }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      // Unfreeze in DB and reset lockout & failed attempts
      await prisma.user.update({
        where: { id: numericUserId },
        data: { 
          isFrozen: false,
          failedAttempts: 0,
          lockoutEnd: null 
        }
      });

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'USER', 
        numericUserId, 
        'USER_UNFROZEN_BY_SECURITY', 
        changedBy, 
        { 
          targetUserId: numericUserId, 
          targetUserName: targetUser.fullName 
        }, 
        sourceIp
      );

      SIEMLogger.logEvent(
        'USER_UNFROZEN_BY_SECURITY', 
        'INFO', 
        sourceIp, 
        { targetUserId: numericUserId }, 
        changedBy
      );

      res.json({ success: true, message: `تم إلغاء تجميد حساب [${targetUser.fullName}] واستعادة الصلاحيات بنجاح.` });
    } catch (error: any) {
      console.error('[Unfreeze User Error]:', error);
      res.status(500).json({ error: 'Failed to unfreeze user account' });
    }
  }

  // 4.3 Terminate Session Only (Force Re-login without permanent freeze)
  static async terminateSession(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;
      const numericUserId = parseInt(userId, 10);

      const targetUser = await prisma.user.findUnique({
        where: { id: numericUserId },
        select: { id: true, fullName: true, email: true }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      // Instant Broadcast to terminate current sessions
      redisManager.publish('SESSION_TERMINATED', JSON.stringify({ userId: numericUserId }));

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'USER', 
        numericUserId, 
        'SESSION_TERMINATED_BY_SECURITY', 
        changedBy, 
        { targetUserId: numericUserId }, 
        sourceIp
      );

      SIEMLogger.logEvent(
        'SESSION_TERMINATED_BY_SECURITY', 
        'WARNING', 
        sourceIp, 
        { targetUserId: numericUserId }, 
        changedBy
      );

      res.json({ success: true, message: `تم إنهاء الجلسة النشطة للمستخدم [${targetUser.fullName}] وإلزامه بإعادة تسجيل الدخول.` });
    } catch (error: any) {
      console.error('[Terminate Session Error]:', error);
      res.status(500).json({ error: 'Failed to terminate user session' });
    }
  }
}
