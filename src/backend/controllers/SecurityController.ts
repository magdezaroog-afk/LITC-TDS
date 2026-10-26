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

  // 3.5 SIEM Logs
  static async getSIEMLogs(req: Request, res: Response) {
    try {
      const logs = await prisma.securityEventLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      res.json({ logs });
    } catch (error: any) {
      console.error('[SIEM Logs Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve SIEM logs' });
    }
  }

  // 4. Session Governance
  static async getActiveSessions(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true, isFrozen: false },
        select: { id: true, fullName: true, email: true }
      });
      res.json({ users });
    } catch (error: any) {
      console.error('[Active Sessions Error]:', error);
      res.status(500).json({ error: 'Failed to retrieve active sessions' });
    }
  }

  static async kickUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress;
      const numericUserId = parseInt(userId, 10);

      // Freeze user in DB
      await prisma.user.update({
        where: { id: numericUserId },
        data: { isFrozen: true }
      });

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'USER', 
        numericUserId, 
        'SESSION_KICK_AND_FREEZE', 
        changedBy, 
        { targetUserId: numericUserId, reason: 'Admin kick from SOC' }, 
        sourceIp
      );
      SIEMLogger.logEvent(
        'USER_KICKED_FROM_SOC', 
        'CRITICAL', 
        sourceIp, 
        { targetUserId: numericUserId }, 
        changedBy
      );

      res.json({ success: true, message: 'User frozen/kicked successfully.' });
    } catch (error: any) {
      console.error('[Kick User Error]:', error);
      res.status(500).json({ error: 'Failed to freeze and kick session' });
    }
  }
}
