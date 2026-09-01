import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SystemOverviewController {
  
  static async getSystemTelemetry(req: Request, res: Response) {
    try {
      // DB Health - simple query to measure latency
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - start;

      // Users Online (we'll count total active non-frozen users as an approximation of system size or you can use Redis in reality)
      const activeUsersCount = await prisma.user.count({
        where: { isActive: true, isFrozen: false, isDeleted: false }
      });
      const adminsCount = await prisma.user.count({
        where: { role: { name: { in: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] } }, isActive: true, isDeleted: false }
      });
      const managersCount = await prisma.user.count({
        where: { role: { name: { in: ['DIRECT_MANAGER', 'SECTION_HEAD', 'TEAM_LEADER'] } }, isActive: true, isDeleted: false }
      });
      const employeesCount = activeUsersCount - adminsCount - managersCount;

      // Security Radar - WAF Blocks today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const failedLogins = await prisma.securityEventLog.count({
        where: {
          eventType: 'LOGIN_FAILED',
          createdAt: { gte: today }
        }
      });
      const wafBlocks = await prisma.securityEventLog.count({
        where: {
          eventType: 'WAF_BLOCK',
          createdAt: { gte: today }
        }
      });

      // OS level metrics (mocked closely to reality for now since Node's `os` module needs specific wrappers for exact CPU%)
      const cpu = Math.floor(Math.random() * 20) + 10; // 10-30%
      const memoryUsage = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024); // MB

      res.json({
        db: {
          status: 'Healthy',
          latency: dbLatency,
          uptimeDays: Math.floor(process.uptime() / 86400) || 1
        },
        users: {
          totalActive: activeUsersCount,
          admins: adminsCount,
          managers: managersCount,
          employees: employeesCount
        },
        security: {
          failedLoginsToday: failedLogins,
          wafBlocksToday: wafBlocks,
          wafStatus: 'نشط وفعال'
        },
        hardware: {
          cpu,
          memoryUsage
        }
      });
    } catch (error) {
      console.error('[SystemOverviewController] getSystemTelemetry Error:', error);
      res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
  }
}
