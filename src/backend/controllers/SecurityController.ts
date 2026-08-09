import { Request, Response } from 'express';
import os from 'os';
import pidusage from 'pidusage';
import { prisma } from '../../db/client';
import { redisManager } from '../infrastructure/RedisClient';
import { WAFMiddleware } from '../security/WAFMiddleware';

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
      res.status(500).json({ error: error.message });
    }
  }

  // 2. Load Balancer / WAF Nodes
  static async getWAFNodes(req: Request, res: Response) {
    try {
      const nodes = await prisma.wAFNode.findMany();
      res.json({ nodes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  }

  static async createWAFRule(req: Request, res: Response) {
    try {
      const { ruleType, target, action } = req.body;
      const rule = await prisma.wAFRule.create({
        data: { ruleType, target, action, isActive: true }
      });
      // Instant WAF Cache Invalidation (Pub/Sub + Local Fallback)
      redisManager.publish('WAF_REFRESH', 'NEW_RULE');
      WAFMiddleware.refreshRulesCache(); // Force local update immediately as fallback
      res.json({ rule });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteWAFRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.wAFRule.delete({ where: { id } });
      // Instant WAF Cache Invalidation
      redisManager.publish('WAF_REFRESH', 'DELETE_RULE');
      WAFMiddleware.refreshRulesCache(); // Force local update immediately as fallback
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  }

  // 4. Session Governance
  static async getActiveSessions(req: Request, res: Response) {
    try {
      // For real distributed session tracking, we would query a Redis store.
      // As a fallback, we return active users from DB (e.g. logged in last 24h)
      // We simulate by returning recently active users (assuming we have lastLogin).
      // Here we just return users who are NOT frozen and ARE active.
      const users = await prisma.user.findMany({
        where: { isActive: true, isFrozen: false },
        select: { id: true, fullName: true, email: true }
      });
      res.json({ users });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async kickUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      // Realistically, to kick a user in a stateless JWT environment without Redis,
      // we freeze them or update their security token version.
      await prisma.user.update({
        where: { id: parseInt(userId, 10) },
        data: { isFrozen: true }
      });
      res.json({ success: true, message: 'User frozen/kicked successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
